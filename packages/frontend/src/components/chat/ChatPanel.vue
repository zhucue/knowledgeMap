<template>
  <div class="chat-panel">
    <div class="chat-header">
      <h3>对话</h3>
      <button v-if="sessionId" class="new-chat-btn" @click="emit('new-chat')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        新对话
      </button>
    </div>

    <div ref="messagesRef" class="chat-messages">
      <div v-if="messages.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 27.2 4.8 30.2 6.2 32.8L4 44L15.2 41.8C17.8 43.2 20.8 44 24 44Z" stroke="#D1D5DB" stroke-width="2"/>
        </svg>
        <p>开始对话，探索知识</p>
      </div>

      <MessageBubble
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
      />

      <MessageBubble
        v-if="isStreaming"
        :message="{ role: 'assistant', content: streamingContent }"
        :is-streaming="true"
      />
    </div>

    <ChatInput
      :disabled="isStreaming"
      @send="handleSend"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import MessageBubble from './MessageBubble.vue';
import ChatInput from './ChatInput.vue';

interface Message {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
}

interface Props {
  sessionId?: number | null;
  messages: Message[];
  isStreaming?: boolean;
  streamingContent?: string;
}

const props = withDefaults(defineProps<Props>(), {
  sessionId: null,
  isStreaming: false,
  streamingContent: '',
});

const emit = defineEmits<{
  send: [content: string];
  'new-chat': [];
}>();

const messagesRef = ref<HTMLElement>();

// 自动滚动到底部
watch(() => [props.messages.length, props.streamingContent], () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
});

function handleSend(content: string) {
  emit('send', content);
}
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #E5E7EB;
}

.chat-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.new-chat-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #E5E7EB;
  background: white;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.new-chat-btn:hover {
  background: #F9FAFB;
  border-color: #3B82F6;
  color: #3B82F6;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9CA3AF;
}

.empty-state svg {
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}
</style>
