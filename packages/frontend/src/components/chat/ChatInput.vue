<template>
  <div class="chat-input">
    <textarea
      ref="inputRef"
      v-model="inputText"
      :disabled="disabled"
      placeholder="输入问题... (Shift+Enter 换行，Enter 发送)"
      rows="1"
      @keydown="handleKeydown"
      @input="adjustHeight"
    ></textarea>
    <button
      class="send-btn"
      :disabled="disabled || !inputText.trim()"
      @click="handleSend"
    >
      <svg v-if="!disabled" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M2 10L18 2L10 18L8 11L2 10Z" fill="currentColor"/>
      </svg>
      <div v-else class="spinner-small"></div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';

interface Props {
  disabled?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  send: [content: string];
}>();

const inputRef = ref<HTMLTextAreaElement>();
const inputText = ref('');

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function handleSend() {
  const content = inputText.value.trim();
  if (!content) return;

  emit('send', content);
  inputText.value = '';
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.style.height = 'auto';
    }
  });
}

function adjustHeight() {
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.style.height = 'auto';
      inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 200) + 'px';
    }
  });
}
</script>

<style scoped>
.chat-input {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #E5E7EB;
  background: white;
}

textarea {
  flex: 1;
  min-height: 40px;
  max-height: 200px;
  padding: 10px 14px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

textarea:focus {
  border-color: #3B82F6;
}

textarea:disabled {
  background: #F9FAFB;
  color: #9CA3AF;
  cursor: not-allowed;
}

textarea::placeholder {
  color: #9CA3AF;
}

.send-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #3B82F6;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #2563EB;
  transform: translateY(-1px);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  background: #E5E7EB;
  color: #9CA3AF;
  cursor: not-allowed;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #E5E7EB;
  border-top-color: #9CA3AF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
