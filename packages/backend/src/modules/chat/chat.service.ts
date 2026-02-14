import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSessionEntity } from './entities/chat-session.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { LlmService } from '../llm/llm.service';
import { GraphService } from '../graph/graph.service';
import { LlmMessage } from '../llm/providers/llm-provider.interface';

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
   * @param llmService LLM 服务
   * @param graphService 图谱服务
   */
  constructor(
    @InjectRepository(ChatSessionEntity)
    private readonly sessionRepo: Repository<ChatSessionEntity>,
    @InjectRepository(ChatMessageEntity)
    private readonly messageRepo: Repository<ChatMessageEntity>,
    private readonly llmService: LlmService,
    private readonly graphService: GraphService,
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

  /**
   * 发送消息并获取 LLM 回复
   * @param sessionId 会话ID
   * @param content 用户消息内容
   * @param contextNodeId 关联的图谱节点ID（可选）
   * @param provider LLM 提供商（可选）
   * @returns 用户消息和助手回复
   */
  async sendMessage(
    sessionId: number,
    content: string,
    contextNodeId?: number,
    provider?: string,
  ) {
    // 1. 保存用户消息
    const userMessage = await this.addMessage({
      sessionId,
      role: 'user',
      content,
      contextNodeId: contextNodeId || null,
    });

    // 2. 构建 LLM 消息上下文
    const messages = await this.buildMessageContext(sessionId, contextNodeId);
    messages.push({ role: 'user', content });

    // 3. 调用 LLM 获取回复
    const result = await this.llmService.chatCompletion(messages, {}, provider);

    // 4. 保存助手回复
    const assistantMessage = await this.addMessage({
      sessionId,
      role: 'assistant',
      content: result.content,
      metadata: { usage: result.usage, model: result.model, provider: result.provider },
    });

    // 5. 更新会话标题（如果是第一条消息）
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (session && session.messageCount === 2 && session.title === 'New Conversation') {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await this.updateSessionTitle(sessionId, title);
    }

    return { userMessage, assistantMessage };
  }

  /**
   * 发送消息并流式返回 LLM 回复
   * @param sessionId 会话ID
   * @param content 用户消息内容
   * @param contextNodeId 关联的图谱节点ID（可选）
   * @param provider LLM 提供商（可选）
   * @returns 流式文本生成器
   */
  async *sendMessageStream(
    sessionId: number,
    content: string,
    contextNodeId?: number,
    provider?: string,
  ): AsyncIterable<string> {
    // 1. 保存用户消息
    await this.addMessage({
      sessionId,
      role: 'user',
      content,
      contextNodeId: contextNodeId || null,
    });

    // 2. 构建 LLM 消息上下文
    const messages = await this.buildMessageContext(sessionId, contextNodeId);
    messages.push({ role: 'user', content });

    // 3. 流式调用 LLM
    let fullContent = '';
    for await (const chunk of this.llmService.chatCompletionStream(messages, {}, provider)) {
      fullContent += chunk;
      yield chunk;
    }

    // 4. 保存完整的助手回复
    await this.addMessage({
      sessionId,
      role: 'assistant',
      content: fullContent,
    });

    // 5. 更新会话标题（如果是第一条消息）
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (session && session.messageCount === 2 && session.title === 'New Conversation') {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await this.updateSessionTitle(sessionId, title);
    }
  }

  /**
   * 构建 LLM 消息上下文
   * 包含系统提示、图谱上下文和最近的历史消息
   * @param sessionId 会话ID
   * @param contextNodeId 关联的图谱节点ID（可选）
   * @returns LLM 消息数组
   */
  private async buildMessageContext(
    sessionId: number,
    contextNodeId?: number,
  ): Promise<LlmMessage[]> {
    const messages: LlmMessage[] = [];

    // 1. 系统提示
    messages.push({
      role: 'system',
      content: '你是一个知识学习助手，帮助用户理解和学习各种知识主题。请用清晰、准确的语言回答问题。',
    });

    // 2. 获取会话关联的图谱信息
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['graph', 'graph.topic'],
    });

    if (session?.graph) {
      messages.push({
        role: 'system',
        content: `当前讨论的主题是：${session.graph.title || session.graph.topic?.name}。${session.graph.summary || ''}`,
      });
    }

    // 3. 如果有节点上下文，注入节点信息
    if (contextNodeId) {
      try {
        const { node, path } = await this.graphService.getNodeWithPath(contextNodeId);
        messages.push({
          role: 'system',
          content: `用户正在询问关于"${node.label}"的问题。路径：${path.join(' > ')}。描述：${node.description || ''}`,
        });
      } catch {
        // 节点不存在，忽略
      }
    }

    // 4. 加载最近的历史消息（最多 20 条）
    const recentMessages = await this.getRecentMessages(sessionId, 20);
    for (const msg of recentMessages) {
      messages.push({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      });
    }

    return messages;
  }
}
