import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSessionEntity } from './entities/chat-session.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { LlmService } from '../llm/llm.service';
import { GraphService } from '../graph/graph.service';
import { LlmMessage } from '../llm/providers/llm-provider.interface';
import { RetrievalService, RetrievalResult } from '../knowledge-base/services/retrieval.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';

/**
 * 聊天服务
 * 处理会话创建、消息管理和聊天记录查询
 */
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSessionEntity)
    private readonly sessionRepo: Repository<ChatSessionEntity>,
    @InjectRepository(ChatMessageEntity)
    private readonly messageRepo: Repository<ChatMessageEntity>,
    private readonly llmService: LlmService,
    private readonly graphService: GraphService,
    private readonly retrievalService: RetrievalService,
    private readonly kbService: KnowledgeBaseService,
  ) {}

  async createSession(userId: number, graphId?: number) {
    const session = this.sessionRepo.create({
      userId,
      graphId: graphId || null,
      title: 'New Conversation',
    });
    return this.sessionRepo.save(session);
  }

  async getUserSessions(userId: number, page = 1, pageSize = 20) {
    const [items, total] = await this.sessionRepo.findAndCount({
      where: { userId },
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getMessages(sessionId: number, page = 1, pageSize = 20) {
    const [items, total] = await this.messageRepo.findAndCount({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: items.reverse(), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async addMessage(data: Partial<ChatMessageEntity>) {
    const message = this.messageRepo.create(data);
    const saved = await this.messageRepo.save(message);
    await this.sessionRepo.increment({ id: data.sessionId }, 'messageCount', 1);
    return saved;
  }

  async getRecentMessages(sessionId: number, limit = 20) {
    const messages = await this.messageRepo.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return messages.reverse();
  }

  async updateSessionTitle(sessionId: number, title: string) {
    await this.sessionRepo.update(sessionId, { title });
  }

  async archiveSession(sessionId: number) {
    await this.sessionRepo.update(sessionId, { status: 'archived' });
  }

  /**
   * 发送消息并获取 LLM 回复（带 RAG 检索）
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

    // 2. 获取会话所属用户
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    const userId = session?.userId;

    // 3. RAG 检索
    let references: RetrievalResult[] = [];
    if (userId) {
      const kbIds = await this.kbService.getAccessibleKbIds(userId);
      if (kbIds.length > 0) {
        references = await this.retrievalService.retrieve(content, kbIds, 5);
      }
    }

    // 4. 构建 LLM 消息上下文（含 RAG）
    const messages = await this.buildMessageContext(sessionId, contextNodeId, references);
    messages.push({ role: 'user', content });

    // 5. 调用 LLM 获取回复
    const result = await this.llmService.chatCompletion(messages, {}, provider);

    // 6. 保存助手回复（metadata 中附带 references）
    const assistantMessage = await this.addMessage({
      sessionId,
      role: 'assistant',
      content: result.content,
      metadata: {
        usage: result.usage,
        model: result.model,
        provider: result.provider,
        references: references.map((r) => ({ source: r.source, headingPath: r.headingPath })),
      },
    });

    // 7. 更新会话标题
    if (session && session.messageCount === 2 && session.title === 'New Conversation') {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await this.updateSessionTitle(sessionId, title);
    }

    return { userMessage, assistantMessage, references };
  }

  /**
   * 发送消息并流式返回 LLM 回复（带 RAG 检索）
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

    // 2. 获取会话所属用户并做 RAG 检索
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    const userId = session?.userId;
    let references: RetrievalResult[] = [];
    if (userId) {
      const kbIds = await this.kbService.getAccessibleKbIds(userId);
      if (kbIds.length > 0) {
        references = await this.retrievalService.retrieve(content, kbIds, 5);
      }
    }

    // 3. 构建 LLM 消息上下文（含 RAG）
    const messages = await this.buildMessageContext(sessionId, contextNodeId, references);
    messages.push({ role: 'user', content });

    // 4. 流式调用 LLM
    let fullContent = '';
    for await (const chunk of this.llmService.chatCompletionStream(messages, {}, provider)) {
      fullContent += chunk;
      yield chunk;
    }

    // 5. 保存完整的助手回复
    await this.addMessage({
      sessionId,
      role: 'assistant',
      content: fullContent,
      metadata: {
        references: references.map((r) => ({ source: r.source, headingPath: r.headingPath })),
      },
    });

    // 6. 更新会话标题
    if (session && session.messageCount === 2 && session.title === 'New Conversation') {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await this.updateSessionTitle(sessionId, title);
    }
  }

  /**
   * 构建 LLM 消息上下文（含 RAG 知识库内容）
   */
  private async buildMessageContext(
    sessionId: number,
    contextNodeId?: number,
    ragResults?: RetrievalResult[],
  ): Promise<LlmMessage[]> {
    const messages: LlmMessage[] = [];

    // 1. 系统提示（含 RAG 引用要求）
    let systemPrompt = '你是一个知识学习助手，帮助用户理解和学习各种知识主题。请用清晰、准确的语言回答问题。';
    if (ragResults?.length) {
      systemPrompt += '\n\n当你引用知识库中的内容时，请使用 [REF1]、[REF2] 等格式标注来源。';
    }
    messages.push({ role: 'system', content: systemPrompt });

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

    // 4. 注入 RAG 检索结果
    if (ragResults?.length) {
      const refs = ragResults
        .map((r, i) => `[REF${i + 1}] 来源: ${r.source}${r.headingPath ? ` > ${r.headingPath}` : ''}\n${r.content}`)
        .join('\n\n');
      messages.push({
        role: 'system',
        content: `以下是从知识库中检索到的相关参考资料：\n\n${refs}`,
      });
    }

    // 5. 加载最近的历史消息（最多 20 条）
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