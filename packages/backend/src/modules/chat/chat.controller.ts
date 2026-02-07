import { Controller, Post, Get, Patch, Param, Body, Query } from '@nestjs/common';
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
   * 归档会话
   * @param id 会话ID
   * @returns 归档结果
   */
  @Patch(':id')
  archiveSession(@Param('id') id: string) {
    return this.chatService.archiveSession(parseInt(id, 10));
  }
}
