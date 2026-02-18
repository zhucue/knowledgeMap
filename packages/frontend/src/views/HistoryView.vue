<template>
  <div class="min-h-[calc(100vh-56px)] bg-gray-50 py-8 px-4">
    <div class="max-w-5xl mx-auto">
      <!-- 页头 -->
      <div class="flex items-center gap-4 mb-6">
        <button
          class="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-blue-500 hover:text-blue-500 transition-colors bg-white"
          @click="$router.push('/')"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          返回
        </button>
        <h1 class="text-2xl font-bold text-gray-900">历史记录</h1>
      </div>

      <!-- Tab 栏 -->
      <div class="flex gap-6 border-b border-gray-200 mb-6">
        <button
          v-for="tab in tabs" :key="tab.key"
          class="pb-3 text-sm font-medium transition-colors relative"
          :class="activeTab === tab.key ? 'text-blue-500' : 'text-gray-500 hover:text-gray-700'"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
          <span
            v-if="activeTab === tab.key"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
          />
        </button>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="text-center py-16 text-gray-500">
        <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        加载中...
      </div>

      <template v-else>
        <!-- 图谱历史 -->
        <template v-if="activeTab === 'graph'">
          <div v-if="!graphList.length" class="text-center py-16 text-gray-400">暂无图谱记录</div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div
              v-for="item in graphList" :key="item.id"
              class="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer"
              @click="$router.push({ name: 'graph-chat', query: { graphId: item.id } })"
            >
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold text-gray-900 line-clamp-1">{{ item.title || item.topic }}</h3>
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="item.status === 'completed' ? 'bg-green-100 text-green-700' : item.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'"
                >{{ statusLabel(item.status) }}</span>
              </div>
              <div class="flex items-center gap-4 text-xs text-gray-500">
                <span>{{ item.nodeCount || 0 }} 个节点</span>
                <span>{{ formatTime(item.createdAt) }}</span>
              </div>
            </div>
          </div>
          <Pagination :page="graphPage" :total-pages="graphTotalPages" @change="loadGraphHistory" />
        </template>

        <!-- 对话历史 -->
        <template v-if="activeTab === 'chat'">
          <div v-if="!chatList.length" class="text-center py-16 text-gray-400">暂无对话记录</div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div
              v-for="item in chatList" :key="item.id"
              class="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer"
              @click="item.graphId && $router.push({ name: 'graph-chat', query: { graphId: item.graphId } })"
            >
              <h3 class="font-semibold text-gray-900 mb-2 line-clamp-1">{{ item.title || '未命名会话' }}</h3>
              <div class="flex items-center gap-4 text-xs text-gray-500">
                <span>{{ item.messageCount || 0 }} 条消息</span>
                <span>{{ formatTime(item.updatedAt) }}</span>
              </div>
            </div>
          </div>
          <Pagination :page="chatPage" :total-pages="chatTotalPages" @change="loadChatHistory" />
        </template>

        <!-- 浏览记录 -->
        <template v-if="activeTab === 'resource'">
          <div v-if="!browseList.length" class="text-center py-16 text-gray-400">暂无浏览记录</div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div
              v-for="item in browseList" :key="item.id"
              class="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer"
              @click="openResource(item.resourceUrl)"
            >
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold text-gray-900 line-clamp-1">{{ item.resourceTitle || '未知资源' }}</h3>
                <span :class="typeBadgeClass(item.resourceType)" class="shrink-0 px-2 py-0.5 rounded text-xs font-medium">
                  {{ typeLabel(item.resourceType) }}
                </span>
              </div>
              <div class="text-xs text-gray-500">{{ formatTime(item.createdAt) }}</div>
            </div>
          </div>
          <Pagination :page="browsePage" :total-pages="browseTotalPages" @change="loadBrowseHistory" />
        </template>
      </template>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, defineComponent, h } from 'vue';
import { useGraphStore } from '@/stores/graph.store';
import { useChatStore } from '@/stores/chat.store';
import { useResourceStore } from '@/stores/resource.store';

const graphStore = useGraphStore();
const chatStore = useChatStore();
const resourceStore = useResourceStore();

const tabs = [
  { key: 'graph', label: '图谱历史' },
  { key: 'chat', label: '对话历史' },
  { key: 'resource', label: '浏览记录' },
] as const;

type TabKey = typeof tabs[number]['key'];
const activeTab = ref<TabKey>('graph');
const loading = ref(false);

// 图谱历史
const graphList = ref<any[]>([]);
const graphPage = ref(1);
const graphTotalPages = ref(0);

// 对话历史
const chatList = ref<any[]>([]);
const chatPage = ref(1);
const chatTotalPages = ref(0);

// 浏览记录
const browseList = ref<any[]>([]);
const browsePage = ref(1);
const browseTotalPages = ref(0);

/** 分页组件 */
const Pagination = defineComponent({
  props: { page: Number, totalPages: Number },
  emits: ['change'],
  setup(props, { emit }) {
    return () => {
      if (!props.totalPages || props.totalPages <= 1) return null;
      return h('div', { class: 'flex justify-center gap-2' }, [
        h('button', {
          disabled: (props.page || 1) <= 1,
          class: 'px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:border-blue-500 hover:text-blue-500 transition-colors bg-white',
          onClick: () => emit('change', (props.page || 1) - 1),
        }, '上一页'),
        h('span', { class: 'px-3 py-1.5 text-sm text-gray-600' }, `${props.page} / ${props.totalPages}`),
        h('button', {
          disabled: (props.page || 1) >= (props.totalPages || 1),
          class: 'px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:border-blue-500 hover:text-blue-500 transition-colors bg-white',
          onClick: () => emit('change', (props.page || 1) + 1),
        }, '下一页'),
      ]);
    };
  },
});

function switchTab(key: TabKey) {
  activeTab.value = key;
  if (key === 'graph' && !graphList.value.length) loadGraphHistory(1);
  if (key === 'chat' && !chatList.value.length) loadChatHistory(1);
  if (key === 'resource' && !browseList.value.length) loadBrowseHistory(1);
}

async function loadGraphHistory(page = 1) {
  loading.value = true;
  try {
    const result = await graphStore.getHistory(page, 20);
    graphList.value = (result as any).items || [];
    graphPage.value = (result as any).page || 1;
    graphTotalPages.value = (result as any).totalPages || 0;
  } catch { graphList.value = []; }
  finally { loading.value = false; }
}

async function loadChatHistory(page = 1) {
  loading.value = true;
  try {
    const result = await chatStore.getSessions(page, 20);
    chatList.value = (result as any).items || chatStore.sessions;
    chatPage.value = (result as any).page || 1;
    chatTotalPages.value = (result as any).totalPages || 0;
  } catch { chatList.value = []; }
  finally { loading.value = false; }
}

async function loadBrowseHistory(page = 1) {
  loading.value = true;
  try {
    await resourceStore.fetchBrowseHistory(page);
    browseList.value = resourceStore.browseHistory;
    browsePage.value = resourceStore.historyPagination.page;
    browseTotalPages.value = resourceStore.historyPagination.totalPages;
  } catch { browseList.value = []; }
  finally { loading.value = false; }
}

function statusLabel(status: string) {
  const map: Record<string, string> = { completed: '已完成', failed: '失败', generating: '生成中' };
  return map[status] || status;
}

function typeBadgeClass(type: string) {
  const map: Record<string, string> = {
    article: 'bg-blue-100 text-blue-700',
    video: 'bg-purple-100 text-purple-700',
    tutorial: 'bg-green-100 text-green-700',
    book: 'bg-amber-100 text-amber-700',
    document: 'bg-gray-100 text-gray-700',
  };
  return map[type] || 'bg-gray-100 text-gray-700';
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    article: '文章', video: '视频', tutorial: '教程', book: '书籍', document: '文档',
  };
  return map[type] || type;
}

function openResource(url: string) {
  if (url) window.open(url, '_blank');
}

function formatTime(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

onMounted(() => {
  loadGraphHistory(1);
});
</script>