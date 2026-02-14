import { Controller, Post, Get, Patch, Param, Body, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateSessionSchema, CreateSessionInput } from '@knowledge-map/shared';

/**
 * 聊天控制器
 * 处理会话创建、消息查询和会话归档请求
 */
@Controller('chat/sessions')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * 创建新会话
   * @param body 会话创建信息（可选关联图谱ID）
   * @returns 创建的会话实体
   */
  @Post()
  createSession(@Body(new ZodValidationPipe(CreateSessionSchema)) body: CreateSessionInput) {
    // TODO: get userId from JWT
    return this.chatService.createSession(1, body.graphId);
  }

  /**
   * 获取用户的会话列表
   * @param page 页码（可选，默认1）
   * @param pageSize 每页大小（可选，默认20）
   * @returns 分页的会话列表
   */
  @Get()
  getSessions(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    // TODO: get userId from JWT
    return this.chatService.getUserSessions(
      1,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  /**
   * 获取会话的消息记录
   * @param id 会话ID
   * @param page 页码（可选，默认1）
   * @param pageSize 每页大小（可选，默认20）
   * @returns 分页的消息列表
   */
  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.chatService.getMessages(
      parseInt(id, 10),
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  /**
   * 发送消息（非流式）
   * @param id 会话ID
   * @param body 消息内容和可选的节点上下文
   * @returns 用户消息和助手回复
   */
  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body() body: { content: string; contextNodeId?: number; provider?: string },
  ) {
    return this.chatService.sendMessage(
      parseInt(id, 10),
      body.content,
      body.contextNodeId,
      body.provider,
    );
  }

  /**
   * 发送消息（SSE 流式）
   * @param id 会话ID
   * @param content 消息内容
   * @param contextNodeId 可选的节点上下文ID
   * @param provider 可选的 LLM 提供商
   * @param res Express Response 对象
   */
  @Get(':id/messages/stream')
  async sendMessageStream(
    @Param('id') id: string,
    @Query('content') content: string,
    @Query('contextNodeId') contextNodeId?: string,
    @Query('provider') provider?: string,
    @Res() res?: Response,
  ) {
    if (!res) return;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const stream = this.chatService.sendMessageStream(
        parseInt(id, 10),
        content,
        contextNodeId ? parseInt(contextNodeId, 10) : undefined,
        provider,
      );

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\\n\\n`);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\\n\\n`);
      res.end();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      res.write(`data: ${JSON.stringify({ error: msg })}\\n\\n`);
      res.end();
    }
  }

  /**
   * 归档会话
   * @param id 会话ID
   * @returns 归档结果
   */
  @Patch(':id')
  archiveSession(@Param('id') id: string) {
    return this.chatService.archiveSession(parseInt(id, 10));
  }
}
