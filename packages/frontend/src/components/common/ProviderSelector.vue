<template>
  <div class="provider-selector">
    <label class="selector-label">AI 模型</label>
    <div class="selector-wrapper">
      <select v-model="selectedProvider" class="provider-select" @change="handleChange">
        <option value="">自动选择</option>
        <option v-for="provider in availableProviders" :key="provider.name" :value="provider.name">
          {{ provider.label }} ({{ provider.model }})
        </option>
      </select>
      <button
        class="test-btn"
        :disabled="!selectedProvider || isTesting"
        @click="testConnection"
      >
        <svg v-if="!isTesting" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1V15M8 1L3 6M8 1L13 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else class="spinner" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="30" stroke-dashoffset="10"/>
        </svg>
        {{ isTesting ? '测试中...' : '测试连接' }}
      </button>
    </div>
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
import { ref, onMounted } from 'vue';
import apiClient from '@/services/api.client';

interface Provider {
  name: string;
  label: string;
  model: string;
}

interface Props {
  modelValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'test-success': [provider: string];
  'test-error': [provider: string, error: string];
}>();

const selectedProvider = ref(props.modelValue);
const availableProviders = ref<Provider[]>([]);
const isTesting = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

// 加载可用的 Provider 列表
async function loadProviders() {
  try {
    const providers = await apiClient.get('/llm/providers');
    availableProviders.value = providers.map((p: any) => ({
      name: p.name,
      label: getProviderLabel(p.name),
      model: p.model,
    }));
  } catch (error) {
    console.error('Failed to load providers:', error);
  }
}

// 获取 Provider 显示名称
function getProviderLabel(name: string): string {
  const labels: Record<string, string> = {
    openai: 'OpenAI',
    claude: 'Claude',
    tongyi: '通义千问',
    doubao: '豆包',
    deepseek: 'DeepSeek',
  };
  return labels[name] || name;
}

// 处理选择变化
function handleChange() {
  testResult.value = null;
  emit('update:modelValue', selectedProvider.value);
}

// 测试连接
async function testConnection() {
  if (!selectedProvider.value) return;

  isTesting.value = true;
  testResult.value = null;

  try {
    // 调用后端测试接口
    const response = await apiClient.post('/llm/test', {
      provider: selectedProvider.value,
    });

    if (response.success) {
      testResult.value = {
        success: true,
        message: '连接成功！',
      };
      emit('test-success', selectedProvider.value);
    } else {
      testResult.value = {
        success: false,
        message: response.error || '连接失败',
      };
      emit('test-error', selectedProvider.value, response.error);
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || '连接失败';
    testResult.value = {
      success: false,
      message: errorMsg,
    };
    emit('test-error', selectedProvider.value, errorMsg);
  } finally {
    isTesting.value = false;
  }
}

onMounted(() => {
  loadProviders();
});
</script>

<style scoped>
.provider-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selector-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.selector-wrapper {
  display: flex;
  gap: 8px;
}

.provider-select {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.provider-select:hover {
  border-color: #3B82F6;
}

.provider-select:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.test-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid #D1D5DB;
  background: white;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.test-btn:hover:not(:disabled) {
  background: #F9FAFB;
  border-color: #3B82F6;
  color: #3B82F6;
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  animation: slideIn 0.3s ease;
}

.test-result.success {
  background: #ECFDF5;
  color: #065F46;
  border: 1px solid #A7F3D0;
}

.test-result.error {
  background: #FEF2F2;
  color: #991B1B;
  border: 1px solid #FECACA;
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
