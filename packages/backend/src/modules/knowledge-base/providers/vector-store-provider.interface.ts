/** 向量检索结果 */
export interface VectorSearchResult {
  chunkId: number;
  documentId: number;
  kbId: number;
  content: string;
  score: number;
}

/** 向量数据（用于 upsert） */
export interface VectorData {
  chunkId: number;
  documentId: number;
  kbId: number;
  content: string;
  embedding: number[];
}

/**
 * 向量存储 Provider 接口
 * 可插拔设计，支持 Milvus Lite / Milvus Standalone 等实现
 */
export interface IVectorStoreProvider {
  /** 初始化 collection（建表 + 索引） */
  initCollection(): Promise<void>;

  /** 批量写入向量 */
  upsert(data: VectorData[]): Promise<void>;

  /** 向量检索 */
  search(
    embedding: number[],
    options: {
      kbIds: number[];
      topK?: number;
    },
  ): Promise<VectorSearchResult[]>;

  /** 按文档ID删除向量 */
  deleteByDocumentId(documentId: number): Promise<void>;

  /** 按知识库ID删除向量 */
  deleteByKbId(kbId: number): Promise<void>;
}
