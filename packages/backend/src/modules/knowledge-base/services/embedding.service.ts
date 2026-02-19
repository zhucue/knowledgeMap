import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/**
 * Embedding 向量化服务
 * 复用 OpenAI SDK 兼容接口，支持多 provider
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private client: OpenAI;
  private model: string;

  constructor(private readonly configService: ConfigService) {
    // 优先使用专用 embedding 配置，否则复用 OpenAI 配置
    const apiKey = this.configService.get('EMBEDDING_API_KEY')
      || this.configService.get('LLM_OPENAI_API_KEY');
    const baseURL = this.configService.get('EMBEDDING_BASE_URL')
      || this.configService.get('LLM_OPENAI_BASE_URL', 'https://api.openai.com/v1');
    this.model = this.configService.get('EMBEDDING_MODEL', 'text-embedding-3-small');

    this.client = new OpenAI({ apiKey, baseURL });
  }

  /**
   * 批量生成 embedding 向量
   * @param texts 文本数组
   * @returns 向量数组（与输入顺序一致）
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    const batchSize = 20;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.client.embeddings.create({
        model: this.model,
        input: batch,
      });
      for (const item of response.data) {
        results.push(item.embedding);
      }
    }

    return results;
  }

  /**
   * 单条文本生成 embedding
   */
  async embed(text: string): Promise<number[]> {
    const [result] = await this.embedBatch([text]);
    return result;
  }
}
