import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { KbChunkEntity } from '../entities/kb-chunk.entity';
import { KbDocumentEntity } from '../entities/kb-document.entity';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';

/** RAG 检索结果 */
export interface RetrievalResult {
  content: string;
  source: string;
  headingPath: string;
  score: number;
  documentId: number;
  chunkId: number;
}

/**
 * RAG 检索服务
 * 向量检索优先，Milvus 不可用时降级为 MySQL 关键词匹配
 */
@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  constructor(
    @InjectRepository(KbChunkEntity)
    private readonly chunkRepo: Repository<KbChunkEntity>,
    @InjectRepository(KbDocumentEntity)
    private readonly documentRepo: Repository<KbDocumentEntity>,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  /**
   * 检索与 query 相关的知识库内容
   * @param query 查询文本
   * @param kbIds 可访问的知识库 ID 列表
   * @param topK 返回结果数量
   */
  async retrieve(
    query: string,
    kbIds: number[],
    topK = 5,
  ): Promise<RetrievalResult[]> {
    if (kbIds.length === 0) return [];

    // 向量存储可用时使用语义检索，否则降级为关键词匹配
    if (this.vectorStoreService.isReady()) {
      return this.vectorRetrieve(query, kbIds, topK);
    }
    this.logger.warn('向量存储不可用，降级为关键词检索');
    return this.keywordRetrieve(query, kbIds, topK);
  }

  /** 向量语义检索 */
  private async vectorRetrieve(
    query: string,
    kbIds: number[],
    topK: number,
  ): Promise<RetrievalResult[]> {
    try {
      const queryEmbedding = await this.embeddingService.embed(query);
      const vectorResults = await this.vectorStoreService.search(queryEmbedding, { kbIds, topK });
      if (vectorResults.length === 0) return [];

      const documentIds = [...new Set(vectorResults.map((r) => r.documentId))];
      const documents = await this.documentRepo.find({
        where: { id: In(documentIds) },
        select: ['id', 'title'],
      });
      const docMap = new Map(documents.map((d) => [d.id, d.title]));

      const chunkIds = vectorResults.map((r) => r.chunkId);
      const chunks = await this.chunkRepo.find({
        where: { id: In(chunkIds) },
        select: ['id', 'headingPath'],
      });
      const chunkMap = new Map(chunks.map((c) => [c.id, c.headingPath || '']));

      return vectorResults.map((r) => ({
        content: r.content,
        source: docMap.get(r.documentId) || '未知文档',
        headingPath: chunkMap.get(r.chunkId) || '',
        score: r.score,
        documentId: r.documentId,
        chunkId: r.chunkId,
      }));
    } catch (error) {
      this.logger.error('向量检索失败', error);
      return [];
    }
  }

  /** MySQL 关键词匹配降级检索 */
  private async keywordRetrieve(
    query: string,
    kbIds: number[],
    topK: number,
  ): Promise<RetrievalResult[]> {
    try {
      // 提取关键词（按空格分词，过滤过短的词）
      const keywords = query.split(/\s+/).filter((w) => w.length >= 2);
      if (keywords.length === 0) {
        keywords.push(query);
      }

      // 获取这些知识库下已完成处理的文档 ID
      const docs = await this.documentRepo.find({
        where: { kbId: In(kbIds), status: 'completed' },
        select: ['id', 'title'],
      });
      if (docs.length === 0) return [];

      const docIds = docs.map((d) => Number(d.id));
      const docMap = new Map(docs.map((d) => [Number(d.id), d.title]));

      // 使用原生 SQL 查询以避免 QueryBuilder 编码问题
      const likeClauses = keywords.map((_, i) => `content LIKE ?`);
      const likeParams = keywords.map((kw) => `%${kw}%`);
      const placeholders = docIds.map(() => '?').join(',');

      const sql = `SELECT id, document_id, content, heading_path FROM kb_chunks WHERE document_id IN (${placeholders}) AND (${likeClauses.join(' OR ')}) LIMIT ?`;
      const params = [...docIds, ...likeParams, topK];

      const chunks: any[] = await this.chunkRepo.query(sql, params);

      return chunks.map((chunk) => {
        const matchCount = keywords.filter((kw) =>
          chunk.content.toLowerCase().includes(kw.toLowerCase()),
        ).length;
        const score = matchCount / keywords.length;

        return {
          content: chunk.content,
          source: docMap.get(Number(chunk.document_id)) || '未知文档',
          headingPath: chunk.heading_path || '',
          score: Math.round(score * 100) / 100,
          documentId: Number(chunk.document_id),
          chunkId: Number(chunk.id),
        };
      }).sort((a, b) => b.score - a.score);
    } catch (error) {
      this.logger.error('关键词检索失败', error);
      return [];
    }
  }
}
