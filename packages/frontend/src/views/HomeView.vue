<template>
  <div class="min-h-[calc(100vh-56px)] bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-2xl w-full text-center">
      <!-- 头部 -->
      <header class="mb-12">
        <h1 class="text-5xl font-bold text-gray-900 mb-3">Knowledge Map</h1>
        <p class="text-lg text-gray-600">输入知识主题，生成思维导图，高效学习</p>
      </header>

      <!-- 搜索区域 -->
      <div class="mb-12">
        <div class="flex gap-3 max-w-xl mx-auto">
          <input
            v-model="searchTopic"
            type="text"
            placeholder="输入知识主题，如：数据结构与算法"
            class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            @keyup.enter="handleGenerate"
          />
          <SplitButton
            :disabled="!searchTopic.trim()"
            @click="handleGenerate"
          >
            <template #icon>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3V15M3 9H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </template>
            生成图谱
            <template #menu>
              <ProviderMenu
                v-model="selectedProvider"
                :providers="availableProviders"
                :is-testing="isTesting"
                :test-result="testResult"
                @test="testConnection"
              />
            </template>
          </SplitButton>
        </div>
      </div>

      <!-- 热门主题 -->
      <div v-if="hotTopics.length" class="mb-8">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">热门主题</h3>
        <div class="flex flex-wrap gap-2 justify-center">
          <span
            v-for="topic in hotTopics"
            :key="topic.id"
            class="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-colors duration-200"
            @click="searchTopic = topic.name; handleGenerate()"
          >
            {{ topic.name }}
          </span>
        </div>
      </div>

      <!-- 功能介绍 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <div class="p-6 bg-white rounded-xl shadow-sm">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h4 class="font-semibold text-gray-900 mb-2">智能生成</h4>
          <p class="text-sm text-gray-600">AI 自动生成树形思维导图，清晰展示知识结构</p>
        </div>

        <div class="p-6 bg-white rounded-xl shadow-sm">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h4 class="font-semibold text-gray-900 mb-2">智能对话</h4>
          <p class="text-sm text-gray-600">在图谱基础上追问细节，深入理解知识点</p>
        </div>

        <div class="p-6 bg-white rounded-xl shadow-sm">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h4 class="font-semibold text-gray-900 mb-2">资源推荐</h4>
          <p class="text-sm text-gray-600">每个节点关联优质学习资源，高效学习</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api.client';
import SplitButton from '@/components/common/SplitButton.vue';
import ProviderMenu from '@/components/common/ProviderMenu.vue';

interface Provider {
  name: string;
  label: string;
  model: string;
}

const router = useRouter();
const searchTopic = ref('');
const selectedProvider = ref('');
const availableProviders = ref<Provider[]>([]);
const hotTopics = ref<{ id: number; name: string }[]>([]);
const isTesting = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

/**
 * 加载可用的 Provider 列表
 */
async function loadProviders() {
  try {
    const providers = await apiClient.get('/llm/providers');
    availableProviders.value = providers.map((p: any) => ({
      name: p.name,
      label: getProviderLabel(p.name),
      model: p.model,
    }));

    // 默认选择第一个可用的 Provider
    if (!selectedProvider.value && availableProviders.value.length > 0) {
      selectedProvider.value = availableProviders.value[0].name;
    }
  } catch (error) {
    console.error('Failed to load providers:', error);
  }
}

/**
 * 获取 Provider 显示名称
 */
function getProviderLabel(name: string): string {
  const labels: Record<string, string> = {
    openai: 'OpenAI',
    claude: 'Claude',
    tongyi: '通义千问',
    doubao: '豆包',
  };
  return labels[name] || name;
}

/**
 * 测试 Provider 连接
 */
async function testConnection() {
  if (!selectedProvider.value) return;

  isTesting.value = true;
  testResult.value = null;

  try {
    const response = await apiClient.post('/llm/test', {
      provider: selectedProvider.value,
    });

    if (response.success) {
      testResult.value = {
        success: true,
        message: '连接成功！',
      };
    } else {
      testResult.value = {
        success: false,
        message: response.error || '连接失败',
      };
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || '连接失败';
    testResult.value = {
      success: false,
      message: errorMsg,
    };
  } finally {
    isTesting.value = false;
  }
}

/**
 * 处理生成图谱
 * 跳转到图谱对话页面
 */
function handleGenerate() {
  if (!searchTopic.value.trim()) return;

  const query: any = { topic: searchTopic.value.trim() };
  if (selectedProvider.value) {
    query.provider = selectedProvider.value;
  }

  router.push({ name: 'graph-chat', query });
}

/**
 * 加载热门主题
 */
async function loadHotTopics() {
  try {
    const result = await apiClient.get('/topics/hot', { params: { limit: 8 } });
    hotTopics.value = result;
  } catch (error) {
    console.error('Failed to load hot topics:', error);
  }
}

onMounted(async () => {
  await loadProviders();
  await loadHotTopics();
});
</script>
