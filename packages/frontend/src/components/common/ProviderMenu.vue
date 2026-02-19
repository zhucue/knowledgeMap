<template>
  <div class="provider-menu">
    <div class="menu-header">选择 AI 模型</div>

    <button
      v-for="provider in providers"
      :key="provider.name"
      class="menu-item"
      :class="{ active: modelValue === provider.name }"
      @click="selectProvider(provider.name)"
    >
      <div class="provider-info">
        <span class="provider-name">{{ provider.label }}</span>
        <span class="provider-model">{{ provider.model }}</span>
      </div>
      <svg v-if="modelValue === provider.name" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8L7 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="menu-divider"></div>

    <button
      class="menu-item test-button"
      :disabled="!modelValue || isTesting"
      @click="handleTest"
    >
      <svg v-if="!isTesting" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2V14M8 2L4 6M8 2L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg v-else class="spinner" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="30" stroke-dashoffset="10"/>
      </svg>
      {{ isTesting ? '测试中...' : '测试连接' }}
    </button>

    <div v-if="testResult" :class="['test-result', testResult.success ? 'success' : 'error']">
      <svg v-if="testResult.success" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 7L6 11L12 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>{{ testResult.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Provider {
  name: string;
  label: string;
  model: string;
}

interface Props {
  providers: Provider[];
  modelValue: string;
  isTesting?: boolean;
  testResult?: { success: boolean; message: string } | null;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  test: [];
}>();

function selectProvider(name: string) {
  emit('update:modelValue', name);
}

function handleTest() {
  emit('test');
}
</script>

<style scoped>
.provider-menu {
  min-width: 280px;
}

.menu-header {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #6B7280;
  background: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: white;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover:not(:disabled) {
  background: #F9FAFB;
}

.menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item.active {
  background: #EFF6FF;
}

.provider-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.provider-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.menu-item.active .provider-name {
  color: #3B82F6;
}

.provider-model {
  font-size: 12px;
  color: #6B7280;
}

.menu-divider {
  height: 1px;
  background: #E5E7EB;
  margin: 4px 0;
}

.test-button {
  gap: 8px;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.test-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 12px;
  animation: slideIn 0.3s ease;
}

.test-result.success {
  background: #ECFDF5;
  color: #065F46;
}

.test-result.error {
  background: #FEF2F2;
  color: #991B1B;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
