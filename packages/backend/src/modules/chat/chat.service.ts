import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSessionEntity } from './entities/chat-session.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';

/**
 * 聊天服务
 * 处理会话创建、消息管理和聊天记录查询
 */
@Injectable()
export class ChatService {
  /**
   * 构造函数
   * @param sessionRepo 会话仓库
   * @param messageRepo 消息仓库
   */
  constructor(
    @InjectRepository(ChatSessionEntity)
    private readonly sessionRepo: Repository<ChatSessionEntity>,
    @InjectRepository(ChatMessageEntity)
    private readonly messageRepo: Repository<ChatMessageEntity>,
  ) {}

  /**
   * 创建新会话
   * @param userId 用户ID
   * @param graphId 关联的图谱ID（可选）
   * @returns 创建的会话实体
   */
  async createSession(userId: number, graphId?: number) {
    const session = this.sessionRepo.create({
      userId,
      graphId: graphId || null,
      title: 'New Conversation',
    });
    return this.sessionRepo.save(session);
  }

  /**
   * 获取用户的会话列表
   * @param userId 用户ID
   * @param page 页码（默认1）
   * @param pageSize 每页大小（默认20）
   * @returns 分页的会话列表
   */
  async getUserSessions(userId: number, page = 1, pageSize = 20) {
    const [items, total] = await this.sessionRepo.findAndCount({
      where: { userId },
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * 获取会话的消息记录
   * @param sessionId 会话ID
   * @param page 页码（默认1）
   * @param pageSize 每页大小（默认20）
   * @returns 分页的消息列表（按时间正序排列）
   */
  async getMessages(sessionId: number, page = 1, pageSize = 20) {
    const [items, total] = await this.messageRepo.findAndCount({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: items.reverse(), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * 添加消息到会话
   * 同时更新会话的消息计数
   * @param data 消息数据
   * @returns 保存的消息实体
   */
  async addMessage(data: Partial<ChatMessageEntity>) {
    const message = this.messageRepo.create(data);
    const saved = await this.messageRepo.save(message);
    await this.sessionRepo.increment({ id: data.sessionId }, 'messageCount', 1);
    return saved;
  }

  /**
   * 获取最近的N条消息
   * @param sessionId 会话ID
   * @param limit 消息数量限制（默认20）
   * @returns 消息列表（按时间正序排列）
   */
  async getRecentMessages(sessionId: number, limit = 20) {
    const messages = await this.messageRepo.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return messages.reverse();
  }

  /**
   * 更新会话标题
   * @param sessionId 会话ID
   * @param title 新标题
   */
  async updateSessionTitle(sessionId: number, title: string) {
    await this.sessionRepo.update(sessionId, { title });
  }

  /**
   * 归档会话
   * 将会话状态标记为 archived
   * @param sessionId 会话ID
   */
  async archiveSession(sessionId: number) {
    await this.sessionRepo.update(sessionId, { status: 'archived' });
  }
}
