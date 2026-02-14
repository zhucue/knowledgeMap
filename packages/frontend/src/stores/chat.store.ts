import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '@/services/api.client';

/**
 * 聊天消息接口
 */
interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

/**
 * 聊天会话接口
 */
interface ChatSession {
  id: number;
  graphId?: number;
  title: string;
  status: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 聊天 Store
 * 管理对话会话、消息列表和流式输出状态
 */
export const useChatStore = defineStore('chat', () => {
  // 当前活跃的会话
  const currentSession = ref<ChatSession | null>(null);

  // 当前会话的消息列表
  const messages = ref<ChatMessage[]>([]);

  // 是否正在流式输出
  const isStreaming = ref(false);

  // 流式输出的内容（实时累积）
  const streamingContent = ref('');

  // 用户的所有会话列表
  const sessions = ref<ChatSession[]>([]);

  // 是否还有更多历史消息可加载
  const hasMoreMessages = ref(false);

  /**
   * 重置聊天状态
   * 清空当前会话和消息列表
   */
  function reset() {
    currentSession.value = null;
    messages.value = [];
    isStreaming.value = false;
    streamingContent.value = '';
    sessions.value = [];
    hasMoreMessages.value = false;
  }

  /**
   * 创建新会话或加载已有会话
   * @param graphId 关联的图谱ID（可选）
   */
  async function createOrLoadSession(graphId?: number) {
    try {
      // 创建新会话
      const session = await apiClient.post('/chat/sessions', { graphId });
      currentSession.value = session;
      messages.value = [];

      // 如果会话已有消息，加载消息历史
      if (session.messageCount > 0) {
        await loadMessages(session.id);
      }

      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * 加载会话的消息历史
   * @param sessionId 会话ID
   * @param page 页码（默认1）
   * @param pageSize 每页大小（默认20）
   */
  async function loadMessages(sessionId: number, page = 1, pageSize = 20) {
    try {
      const result = await apiClient.get(`/chat/sessions/${sessionId}/messages`, {
        params: { page, pageSize },
      });

      if (page === 1) {
        // 首次加载，替换消息列表
        messages.value = result.items;
      } else {
        // 加载更多，追加到列表开头
        messages.value = [...result.items, ...messages.value];
      }

      // 判断是否还有更多消息
      hasMoreMessages.value = result.page < result.totalPages;

      return result;
    } catch (error) {
      console.error('Failed to load messages:', error);
      throw error;
    }
  }

  /**
   * 发送消息（流式输出）
   * 使用 SSE 接收 LLM 的实时回复
   * @param sessionId 会话ID
   * @param content 消息内容
   * @param contextNodeId 关联的图谱节点ID（可选）
   * @param provider LLM 提供商（可选）
   */
  async function sendMessage(
    sessionId: number,
    content: string,
    contextNodeId?: number,
    provider?: string,
  ) {
    // 添加用户消息到列表
    const userMessage: ChatMessage = {
      id: Date.now(), // 临时ID
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    messages.value.push(userMessage);

    // 开始流式输出
    isStreaming.value = true;
    streamingContent.value = '';

    // 构建 SSE URL
    const params = new URLSearchParams({
      content,
      ...(contextNodeId && { contextNodeId: String(contextNodeId) }),
      ...(provider && { provider }),
    });
    const url = `/api/chat/sessions/${sessionId}/messages/stream?${params}`;
    const eventSource = new EventSource(url);

    return new Promise((resolve, reject) => {
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.done) {
            // 流式输出完成
            isStreaming.value = false;

            // 添加完整的助手消息到列表
            const assistantMessage: ChatMessage = {
              id: Date.now() + 1,
              role: 'assistant',
              content: streamingContent.value,
              createdAt: new Date().toISOString(),
            };
            messages.value.push(assistantMessage);

            // 清空流式内容
            streamingContent.value = '';

            eventSource.close();
            resolve(assistantMessage);
          } else if (data.error) {
            // 发生错误
            isStreaming.value = false;
            streamingContent.value = '';
            eventSource.close();
            reject(new Error(data.error));
          } else if (data.content) {
            // 累积流式内容
            streamingContent.value += data.content;
          }
        } catch (error) {
          console.error('Failed to parse SSE data:', error);
        }
      };

      eventSource.onerror = () => {
        isStreaming.value = false;
        streamingContent.value = '';
        eventSource.close();
        reject(new Error('SSE connection failed'));
      };
    });
  }

  /**
   * 获取用户的所有会话列表
   * @param page 页码（默认1）
   * @param pageSize 每页大小（默认20）
   */
  async function getSessions(page = 1, pageSize = 20) {
    try {
      const result = await apiClient.get('/chat/sessions', {
        params: { page, pageSize },
      });
      sessions.value = result.items;
      return result;
    } catch (error) {
      console.error('Failed to get sessions:', error);
      throw error;
    }
  }

  /**
   * 归档会话
   * @param sessionId 会话ID
   */
  async function archiveSession(sessionId: number) {
    try {
      await apiClient.patch(`/chat/sessions/${sessionId}`);
      // 从列表中移除已归档的会话
      sessions.value = sessions.value.filter((s) => s.id !== sessionId);
    } catch (error) {
      console.error('Failed to archive session:', error);
      throw error;
    }
  }

  return {
    currentSession,
    messages,
    isStreaming,
    streamingContent,
    sessions,
    hasMoreMessages,
    reset,
    createOrLoadSession,
    loadMessages,
    sendMessage,
    getSessions,
    archiveSession,
  };
});
