import { Controller, Get, Post, Body } from '@nestjs/common';
import { LlmService } from './llm.service';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  /**
   * 获取可用的 LLM Provider 列表
   */
  @Get('providers')
  getProviders() {
    return this.llmService.getAvailableProviders();
  }

  /**
   * 测试 LLM Provider 连接
   */
  @Post('test')
  async testProvider(@Body() body: { provider: string }) {
    try {
      const provider = this.llmService.getProvider(body.provider);

      // 发送一个简单的测试请求
      const result = await this.llmService.chatCompletion(
        [{ role: 'user', content: '你好，请回复"测试成功"' }],
        { temperature: 0.1, maxTokens: 50 },
        body.provider,
      );

      return {
        success: true,
        provider: body.provider,
        model: result.model,
        message: '连接成功',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        provider: body.provider,
        error: errorMsg,
      };
    }
  }
}
