<template>
  <div class="message-row" :class="message.role">
    <!-- AI 消息：全宽布局 -->
    <template v-if="message.role === 'assistant'">
      <div class="ai-header">
        <div class="ai-icon">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM10 6C11.1 6 12 6.9 12 8C12 9.1 11.1 10 10 10C8.9 10 8 9.1 8 8C8 6.9 8.9 6 10 6ZM10 16C8 16 6.34 14.92 5.5 13.3C5.52 11.65 8.5 10.75 10 10.75C11.49 10.75 14.48 11.65 14.5 13.3C13.66 14.92 12 16 10 16Z" fill="currentColor"/>
          </svg>
        </div>
        <span class="ai-name">AI 助手</span>
      </div>
      <div class="ai-content markdown-body" v-html="renderedHtml"></div>
      <!-- 流式输出：三点跳动动画 -->
      <div v-if="isStreaming" class="streaming-dots">
        <span></span><span></span><span></span>
      </div>
    </template>

    <!-- 用户消息：右对齐蓝色气泡 -->
    <template v-else-if="message.role === 'user'">
      <div class="user-bubble">{{ message.content }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMarkdown } from '@/composables/useMarkdown';

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

const contentRef = computed(() => props.message.content);
const { renderedHtml } = useMarkdown(contentRef);
</script>

<style scoped>
.message-row {
  width: 100%;
}

/* --- AI 消息 --- */
.message-row.assistant {
  padding: 4px 0;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.ai-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #6b7280;
}

.ai-name {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

/* AI 内容区使用全局 .markdown-body 样式（非 scoped） */
.ai-content {
  padding-left: 36px; /* 与头像名称对齐 */
}

/* --- 用户消息 --- */
.message-row.user {
  display: flex;
  justify-content: flex-end;
}

.user-bubble {
  max-width: 80%;
  padding: 10px 16px;
  background: #3b82f6;
  color: white;
  border-radius: 18px 18px 4px 18px;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
}
</style>
