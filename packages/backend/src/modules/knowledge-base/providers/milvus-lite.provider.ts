import { Logger } from '@nestjs/common';
import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';
import {
  IVectorStoreProvider,
  VectorData,
  VectorSearchResult,
} from './vector-store-provider.interface';

const COLLECTION_NAME = 'kb_embeddings';

/**
 * Milvus 向量存储实现
 * 支持 Milvus Standalone / Cluster
 */
export class MilvusLiteProvider implements IVectorStoreProvider {
  private readonly logger = new Logger(MilvusLiteProvider.name);
  private client!: MilvusClient;

  constructor(
    private readonly address: string,
    private readonly embeddingDim: number = 1024,
  ) {}

  async initCollection(): Promise<void> {
    // 捕获 MilvusClient 构造函数触发的异步 gRPC 错误
    const errorHandler = (err: any) => {
      // 静默处理 Milvus 连接错误，由上层 catch 处理
    };
    process.on('unhandledRejection', errorHandler);

    try {
      this.client = new MilvusClient({
        address: this.address,
        timeout: 5000,
      });

      const hasCollection = await this.client.hasCollection({
        collection_name: COLLECTION_NAME,
      });

      if (hasCollection.value) {
        this.logger.log(`Collection "${COLLECTION_NAME}" 已存在`);
        await this.client.loadCollection({ collection_name: COLLECTION_NAME });
        return;
      }

      this.logger.log(`创建 collection "${COLLECTION_NAME}"...`);
      await this.client.createCollection({
        collection_name: COLLECTION_NAME,
        fields: [
          { name: 'id', data_type: DataType.Int64, is_primary_key: true, autoID: true },
          { name: 'chunk_id', data_type: DataType.Int64 },
          { name: 'document_id', data_type: DataType.Int64 },
          { name: 'kb_id', data_type: DataType.Int64 },
          { name: 'content', data_type: DataType.VarChar, max_length: 65535 },
          { name: 'embedding', data_type: DataType.FloatVector, dim: this.embeddingDim },
        ],
      });

      // 创建向量索引
      await this.client.createIndex({
        collection_name: COLLECTION_NAME,
        field_name: 'embedding',
        index_type: 'IVF_FLAT',
        metric_type: 'COSINE',
        params: { nlist: 128 },
      });

      // 加载 collection 到内存
      await this.client.loadCollection({ collection_name: COLLECTION_NAME });
      this.logger.log(`Collection "${COLLECTION_NAME}" 创建并加载完成`);
    } finally {
      // 移除临时错误处理器
      setTimeout(() => process.removeListener('unhandledRejection', errorHandler), 3000);
    }
  }

  async upsert(data: VectorData[]): Promise<void> {
    if (data.length === 0) return;

    await this.client.insert({
      collection_name: COLLECTION_NAME,
      data: data.map((d) => ({
        chunk_id: d.chunkId,
        document_id: d.documentId,
        kb_id: d.kbId,
        content: d.content.slice(0, 65535),
        embedding: d.embedding,
      })),
    });
  }

  async search(
    embedding: number[],
    options: { kbIds: number[]; topK?: number },
  ): Promise<VectorSearchResult[]> {
    const topK = options.topK || 5;
    const filter = options.kbIds.length > 0
      ? `kb_id in [${options.kbIds.join(',')}]`
      : undefined;

    const results = await this.client.search({
      collection_name: COLLECTION_NAME,
      data: [embedding],
      anns_field: 'embedding',
      limit: topK,
      output_fields: ['chunk_id', 'document_id', 'kb_id', 'content'],
      params: { nprobe: 10 },
      filter,
    });

    return (results.results || []).map((r: any) => ({
      chunkId: Number(r.chunk_id),
      documentId: Number(r.document_id),
      kbId: Number(r.kb_id),
      content: r.content,
      score: r.score,
    }));
  }

  async deleteByDocumentId(documentId: number): Promise<void> {
    await this.client.delete({
      collection_name: COLLECTION_NAME,
      filter: `document_id == ${documentId}`,
    });
  }

  async deleteByKbId(kbId: number): Promise<void> {
    await this.client.delete({
      collection_name: COLLECTION_NAME,
      filter: `kb_id == ${kbId}`,
    });
  }
}
