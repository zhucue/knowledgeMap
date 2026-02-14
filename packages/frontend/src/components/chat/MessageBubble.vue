<template>
  <div class="message-bubble" :class="message.role">
    <div v-if="message.role === 'assistant'" class="avatar">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM10 6C11.1 6 12 6.9 12 8C12 9.1 11.1 10 10 10C8.9 10 8 9.1 8 8C8 6.9 8.9 6 10 6ZM10 16C8 16 6.34 14.92 5.5 13.3C5.52 11.65 8.5 10.75 10 10.75C11.49 10.75 14.48 11.65 14.5 13.3C13.66 14.92 12 16 10 16Z" fill="currentColor"/>
      </svg>
    </div>

    <div class="message-content">
      <div class="message-text" v-html="formattedContent"></div>
      <div v-if="isStreaming" class="streaming-cursor"></div>
    </div>

    <div v-if="message.role === 'user'" class="avatar user-avatar">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" fill="currentColor"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Props {
  message: Message;
  isStreaming?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false,
});

// 简单的 Markdown 渲染（可以后续使用 marked 库增强）
const formattedContent = computed(() => {
  let content = props.message.content;

  // 代码块
  content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // 行内代码
  content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 粗体
  content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 换行
  content = content.replace(/\n/g, '<br>');

  return content;
});
</script>

<style scoped>
.message-bubble {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.message-bubble.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-bubble.assistant {
  align-self: flex-start;
}

.avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F3F4F6;
  color: #6B7280;
}

.user-avatar {
  background: #3B82F6;
  color: white;
}

.message-content {
  flex: 1;
  padding: 12px 16px;
  border-radius: 12px;
  position: relative;
}

.message-bubble.user .message-content {
  background: #3B82F6;
  color: white;
}

.message-bubble.assistant .message-content {
  background: #F3F4F6;
  color: #1F2937;
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
}

.message-text :deep(pre) {
  background: rgba(0, 0, 0, 0.05);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-text :deep(pre code) {
  background: none;
  padding: 0;
}

.streaming-cursor {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: #3B82F6;
  margin-left: 2px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
</style>
