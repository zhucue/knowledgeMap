import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IVectorStoreProvider,
  VectorData,
  VectorSearchResult,
} from '../providers/vector-store-provider.interface';
import { MilvusLiteProvider } from '../providers/milvus-lite.provider';

/**
 * 向量存储服务
 * 管理 provider 实例，Milvus 不可用时优雅降级
 */
@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private provider: IVectorStoreProvider | null = null;
  private readonly address: string;
  private ready = false;

  constructor(private readonly configService: ConfigService) {
    this.address = this.configService.get('MILVUS_ADDRESS', 'localhost:19530');
  }

  async onModuleInit() {
    try {
      // 从配置读取 embedding 维度，默认 1024（匹配 BAAI/bge-m3）
      const embeddingDim = this.configService.get<number>('EMBEDDING_DIM', 1024);
      const milvus = new MilvusLiteProvider(this.address, embeddingDim);
      await milvus.initCollection();
      this.provider = milvus;
      this.ready = true;
      this.logger.log('向量存储初始化完成');
    } catch (error) {
      this.logger.warn(`向量存储不可用，RAG 功能将被禁用: ${(error as Error).message}`);
    }
  }

  /** 向量存储是否可用 */
  isReady(): boolean {
    return this.ready && !!this.provider;
  }

  async upsert(data: VectorData[]): Promise<void> {
    if (!this.ready || !this.provider) return;
    return this.provider.upsert(data);
  }

  async search(
    embedding: number[],
    options: { kbIds: number[]; topK?: number },
  ): Promise<VectorSearchResult[]> {
    if (!this.ready || !this.provider) return [];
    return this.provider.search(embedding, options);
  }

  async deleteByDocumentId(documentId: number): Promise<void> {
    if (!this.ready || !this.provider) return;
    return this.provider.deleteByDocumentId(documentId);
  }

  async deleteByKbId(kbId: number): Promise<void> {
    if (!this.ready || !this.provider) return;
    return this.provider.deleteByKbId(kbId);
  }
}
