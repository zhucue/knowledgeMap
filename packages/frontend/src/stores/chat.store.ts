import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ChatMessage, SessionSummary } from '@knowledge-map/shared';

export const useChatStore = defineStore('chat', () => {
  // 当前会话信息，包含ID、关联的图谱ID和标题
  const currentSession = ref<{ id: number; graphId: number | null; title: string } | null>(null);

  // 当前会话的聊天消息列表
  const messages = ref<ChatMessage[]>([]);

  // 是否正在流式接收AI回复（用于显示加载/打字动画）
  const isStreaming = ref(false);

  // 流式传输中的临时内容（用于实时显示AI正在生成的内容）
  const streamingContent = ref('');

  // 用户所有会话的摘要列表（用于侧边栏展示）
  const sessions = ref<SessionSummary[]>([]);

  // 是否还有更多历史消息可加载（用于分页）
  const hasMoreMessages = ref(false);

  // 重置聊天状态，用于切换会话或退出时清理数据
  function reset() {
    currentSession.value = null;
    messages.value = [];
    isStreaming.value = false;
    streamingContent.value = '';
  }

  return {
    currentSession,
    messages,
    isStreaming,
    streamingContent,
    sessions,
    hasMoreMessages,
    reset,
  };
});
