import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { KnowledgeBaseEntity } from './entities/knowledge-base.entity';
import { KbCollaboratorEntity } from './entities/kb-collaborator.entity';
import { KbDocumentEntity } from './entities/kb-document.entity';
import { KbChunkEntity } from './entities/kb-chunk.entity';
import { DocumentParserService } from './services/document-parser.service';
import { ChunkingService } from './services/chunking.service';
import { EmbeddingService } from './services/embedding.service';
import { VectorStoreService } from './services/vector-store.service';
import { VectorData } from './providers/vector-store-provider.interface';
import { UserService } from '../user/user.service';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    @InjectRepository(KnowledgeBaseEntity)
    private readonly kbRepo: Repository<KnowledgeBaseEntity>,
    @InjectRepository(KbCollaboratorEntity)
    private readonly collabRepo: Repository<KbCollaboratorEntity>,
    @InjectRepository(KbDocumentEntity)
    private readonly documentRepo: Repository<KbDocumentEntity>,
    @InjectRepository(KbChunkEntity)
    private readonly chunkRepo: Repository<KbChunkEntity>,
    private readonly parserService: DocumentParserService,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly userService: UserService,
  ) {}

  // ========== 知识库 CRUD ==========

  async create(userId: number, data: { name: string; description?: string; visibility?: string }) {
    const kb = this.kbRepo.create({
      ownerId: userId,
      name: data.name,
      description: data.description || null,
      visibility: data.visibility || 'private',
    });
    return this.kbRepo.save(kb);
  }

  async findById(id: number) {
    const kb = await this.kbRepo.findOne({
      where: { id },
      relations: ['collaborators', 'collaborators.user'],
    });
    if (!kb) throw new NotFoundException('知识库不存在');
    return kb;
  }

  async update(id: number, userId: number, data: Partial<{ name: string; description: string; visibility: string }>) {
    await this.checkAccess(id, userId, 'edit');
    await this.kbRepo.update(id, data);
    return this.findById(id);
  }

  async remove(id: number, userId: number) {
    const kb = await this.findById(id);
    if (kb.ownerId !== userId) throw new ForbiddenException('只有所有者可以删除知识库');
    // 清理向量数据
    await this.vectorStoreService.deleteByKbId(id);
    await this.kbRepo.remove(kb);
  }

  /** 获取用户可见的知识库列表（我的 + 协作 + 公开） */
  async listForUser(userId: number, page = 1, pageSize = 20) {
    const qb = this.kbRepo.createQueryBuilder('kb')
      .leftJoin('kb_collaborators', 'c', 'c.kb_id = kb.id AND c.user_id = :userId', { userId })
      .where('kb.ownerId = :userId', { userId })
      .orWhere('c.user_id = :userId', { userId })
      .orWhere('kb.visibility = :pub', { pub: 'public' })
      .orderBy('kb.updatedAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  // ========== 协作者管理 ==========

  async addCollaborator(kbId: number, userId: number, email: string, role = 'viewer') {
    await this.checkAccess(kbId, userId, 'edit');
    // 通过邮箱查找目标用户
    const targetUser = await this.userService.findByEmail(email);
    if (!targetUser) throw new BadRequestException('该邮箱用户不存在');
    if (Number(targetUser.id) === Number(userId)) {
      throw new BadRequestException('不能添加自己为协作者');
    }
    // 检查是否已是协作者
    const existing = await this.collabRepo.findOne({ where: { kbId, userId: targetUser.id } });
    if (existing) throw new BadRequestException('该用户已是协作者');
    const collab = this.collabRepo.create({ kbId, userId: targetUser.id, role });
    return this.collabRepo.save(collab);
  }

  async removeCollaborator(kbId: number, userId: number, targetUserId: number) {
    await this.checkAccess(kbId, userId, 'edit');
    await this.collabRepo.delete({ kbId, userId: targetUserId });
  }

  // ========== 文档管理 ==========

  async listDocuments(kbId: number, userId: number) {
    await this.checkAccess(kbId, userId, 'view');
    return this.documentRepo.find({ where: { kbId }, order: { createdAt: 'DESC' } });
  }

  /** 上传文档并触发解析流水线 */
  async uploadDocument(kbId: number, userId: number, file: { path: string; originalname: string; size: number; mimetype: string }) {
    await this.checkAccess(kbId, userId, 'edit');

    const fileType = this.detectFileType(file.originalname);
    const doc = this.documentRepo.create({
      kbId,
      title: file.originalname,
      fileType,
      filePath: file.path,
      fileSize: file.size,
      status: 'pending',
    });
    const saved = await this.documentRepo.save(doc);

    // 异步处理文档（不阻塞请求）
    this.processDocument(saved.id).catch((err) =>
      this.logger.error(`文档处理失败 [${saved.id}]: ${err.message}`),
    );

    return saved;
  }

  async removeDocument(kbId: number, docId: number, userId: number) {
    await this.checkAccess(kbId, userId, 'edit');
    // 清理向量
    await this.vectorStoreService.deleteByDocumentId(docId);
    // 先删除关联的 chunks，再删除文档本身
    await this.chunkRepo.delete({ documentId: docId });
    await this.documentRepo.delete(docId);
    // 更新文档计数
    await this.updateDocumentCount(kbId);
  }

  // ========== 权限校验 ==========

  async checkAccess(kbId: number, userId: number, action: 'view' | 'edit') {
    const kb = await this.kbRepo.findOne({ where: { id: kbId } });
    if (!kb) throw new NotFoundException('知识库不存在');

    // owner 拥有所有权限
    if (kb.ownerId === userId) return;

    // public 知识库所有人可查看
    if (action === 'view' && kb.visibility === 'public') return;

    // 检查协作者权限
    const collab = await this.collabRepo.findOne({ where: { kbId, userId } });
    if (!collab) throw new ForbiddenException('无权访问此知识库');
    if (action === 'edit' && collab.role === 'viewer') {
      throw new ForbiddenException('无编辑权限');
    }
  }

  /** 获取用户可访问的所有知识库 ID */
  async getAccessibleKbIds(userId: number): Promise<number[]> {
    const owned = await this.kbRepo.find({ where: { ownerId: userId }, select: ['id'] });
    const collabs = await this.collabRepo.find({ where: { userId }, select: ['kbId'] });
    const publicKbs = await this.kbRepo.find({ where: { visibility: 'public' }, select: ['id'] });

    const idSet = new Set<number>();
    owned.forEach((kb) => idSet.add(kb.id));
    collabs.forEach((c) => idSet.add(c.kbId));
    publicKbs.forEach((kb) => idSet.add(kb.id));
    return [...idSet];
  }

  // ========== 文档处理流水线 ==========

  private async processDocument(docId: number) {
    await this.documentRepo.update(docId, { status: 'processing' });

    try {
      const doc = await this.documentRepo.findOneOrFail({ where: { id: docId } });

      // 1. 解析文档
      this.logger.log(`解析文档 [${docId}]: ${doc.title}`);
      const parsed = await this.parserService.parse(doc.filePath, doc.fileType);

      // 2. 分块
      this.logger.log(`分块文档 [${docId}]`);
      const chunkResults = this.chunkingService.chunk(parsed.content);

      // 3. 保存 chunks 到 MySQL
      const chunkEntities = chunkResults.map((c) =>
        this.chunkRepo.create({
          documentId: docId,
          chunkIndex: c.chunkIndex,
          content: c.content,
          headingPath: c.headingPath || null,
          tokenCount: c.tokenCount,
        }),
      );
      const savedChunks = await this.chunkRepo.save(chunkEntities);

      // 4. 生成 embedding
      this.logger.log(`生成 embedding [${docId}]: ${savedChunks.length} 个分块`);
      const texts = savedChunks.map((c) => c.content);
      const embeddings = await this.embeddingService.embedBatch(texts);

      // 5. 写入向量库
      const vectorData: VectorData[] = savedChunks.map((chunk, i) => ({
        chunkId: chunk.id,
        documentId: docId,
        kbId: doc.kbId,
        content: chunk.content,
        embedding: embeddings[i],
      }));
      await this.vectorStoreService.upsert(vectorData);

      // 6. 更新文档状态
      const totalTokens = chunkResults.reduce((sum, c) => sum + c.tokenCount, 0);
      await this.documentRepo.update(docId, {
        status: 'completed',
        tokenCount: totalTokens,
      });
      await this.updateDocumentCount(doc.kbId);

      this.logger.log(`文档处理完成 [${docId}]: ${savedChunks.length} 个分块, ${totalTokens} tokens`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`文档处理失败 [${docId}]: ${errMsg}`);
      await this.documentRepo.update(docId, { status: 'failed', errorMessage: errMsg });
    }
  }

  private async updateDocumentCount(kbId: number) {
    const count = await this.documentRepo.count({ where: { kbId } });
    await this.kbRepo.update(kbId, { documentCount: count });
  }

  private detectFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const supported = ['pdf', 'docx', 'md', 'txt'];
    if (!ext || !supported.includes(ext)) {
      throw new Error(`不支持的文件类型: ${ext}`);
    }
    return ext;
  }

  /**
   * 重建向量索引
   * 为所有已完成文档的 chunk 重新生成 embedding 并写入向量库
   */
  async reindexAllChunks(): Promise<{ totalChunks: number; processed: number }> {
    const docs = await this.documentRepo.find({ where: { status: 'completed' } });
    if (docs.length === 0) return { totalChunks: 0, processed: 0 };

    let processed = 0;
    const batchSize = 20;

    for (const doc of docs) {
      const chunks = await this.chunkRepo.find({
        where: { documentId: doc.id },
        order: { chunkIndex: 'ASC' },
      });
      if (chunks.length === 0) continue;

      // 分批生成 embedding 并写入向量库
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const texts = batch.map((c) => c.content);
        const embeddings = await this.embeddingService.embedBatch(texts);

        const vectorData: VectorData[] = batch.map((chunk, idx) => ({
          chunkId: chunk.id,
          documentId: doc.id,
          kbId: doc.kbId,
          content: chunk.content,
          embedding: embeddings[idx],
        }));
        await this.vectorStoreService.upsert(vectorData);
        processed += batch.length;
      }

      this.logger.log(`重建索引: 文档 [${doc.id}] ${doc.title} - ${chunks.length} 个分块`);
    }

    return { totalChunks: processed, processed };
  }
}