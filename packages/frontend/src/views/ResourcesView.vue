<template>
  <div class="min-h-[calc(100vh-56px)] bg-gray-50 py-8 px-4">
    <div class="max-w-6xl mx-auto">
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
        <h1 class="text-2xl font-bold text-gray-900">知识资源库</h1>
      </div>

      <!-- 工具栏 -->
      <div class="flex flex-wrap gap-3 mb-6">
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索资源..."
          class="flex-1 min-w-[200px] px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
          @input="handleSearch"
        />
        <select
          v-model="selectedType"
          class="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
          @change="handleFilter"
        >
          <option value="">全部类型</option>
          <option value="article">文章</option>
          <option value="video">视频</option>
          <option value="tutorial">教程</option>
          <option value="book">书籍</option>
          <option value="document">文档</option>
        </select>
        <select
          v-model="selectedDomain"
          class="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
          @change="handleFilter"
        >
          <option value="">全部领域</option>
        </select>
        <button
          class="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          @click="showAddModal = true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          添加资源
        </button>
      </div>

      <!-- 加载中 -->
      <div v-if="resourceStore.loading" class="text-center py-16 text-gray-500">
        <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        加载中...
      </div>

      <!-- 空状态 -->
      <div v-else-if="!resourceStore.resources.length" class="text-center py-16 text-gray-400">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
        </svg>
        <p class="text-lg">暂无资源</p>
      </div>

      <!-- 资源卡片网格 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div
          v-for="resource in resourceStore.resources"
          :key="resource.id"
          class="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <h3 class="font-semibold text-gray-900 text-base line-clamp-1">{{ resource.title }}</h3>
            <span :class="typeBadgeClass(resource.resourceType)" class="shrink-0 px-2 py-0.5 rounded text-xs font-medium">
              {{ typeLabel(resource.resourceType) }}
            </span>
          </div>
          <p v-if="resource.description" class="text-sm text-gray-600 mb-3 line-clamp-2">{{ resource.description }}</p>
          <div class="flex items-center gap-3 mb-3">
            <div class="flex items-center gap-0.5" :title="`评分: ${resource.qualityScore}`">
              <svg
                v-for="i in 5" :key="i" class="w-4 h-4"
                :class="i <= Math.round(resource.qualityScore / 2) ? 'text-yellow-400' : 'text-gray-200'"
                fill="currentColor" viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <div v-if="resource.tags?.length" class="flex flex-wrap gap-1">
              <span v-for="tag in resource.tags.slice(0, 3)" :key="tag" class="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{{ tag }}</span>
            </div>
          </div>
          <button
            class="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            @click="resourceStore.browseResource(resource)"
          >
            打开资源
          </button>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="resourceStore.pagination.totalPages > 1" class="flex justify-center gap-2">
        <button
          :disabled="resourceStore.pagination.page <= 1"
          class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:border-blue-500 hover:text-blue-500 transition-colors bg-white"
          @click="resourceStore.fetchResources(resourceStore.pagination.page - 1)"
        >上一页</button>
        <span class="px-3 py-1.5 text-sm text-gray-600">
          {{ resourceStore.pagination.page }} / {{ resourceStore.pagination.totalPages }}
        </span>
        <button
          :disabled="resourceStore.pagination.page >= resourceStore.pagination.totalPages"
          class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:border-blue-500 hover:text-blue-500 transition-colors bg-white"
          @click="resourceStore.fetchResources(resourceStore.pagination.page + 1)"
        >下一页</button>
      </div>

      <!-- 添加资源弹窗 -->
      <Teleport to="body">
        <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30" @click="showAddModal = false" />
          <div class="relative bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">添加资源</h3>
            <div v-if="addError" class="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{{ addError }}</div>
            <form @submit.prevent="handleAddResource">
              <div class="mb-3">
                <label class="block text-sm text-gray-700 mb-1">标题 *</label>
                <input v-model="addForm.title" required class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500" placeholder="资源标题" />
              </div>
              <div class="mb-3">
                <label class="block text-sm text-gray-700 mb-1">链接 *</label>
                <input v-model="addForm.url" type="url" required class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500" placeholder="https://..." />
              </div>
              <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label class="block text-sm text-gray-700 mb-1">类型 *</label>
                  <select v-model="addForm.resourceType" required class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500">
                    <option value="">请选择</option>
                    <option value="article">文章</option>
                    <option value="video">视频</option>
                    <option value="tutorial">教程</option>
                    <option value="book">书籍</option>
                    <option value="document">文档</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm text-gray-700 mb-1">领域 *</label>
                  <input v-model="addForm.domain" required class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500" placeholder="如：前端开发" />
                </div>
              </div>
              <div class="mb-3">
                <label class="block text-sm text-gray-700 mb-1">标签（逗号分隔）</label>
                <input v-model="addForm.tagsStr" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500" placeholder="React, TypeScript, 教程" />
              </div>
              <div class="mb-4">
                <label class="block text-sm text-gray-700 mb-1">描述</label>
                <textarea v-model="addForm.description" rows="2" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 resize-none" placeholder="简要描述资源内容" />
              </div>
              <div class="flex justify-end gap-2">
                <button type="button" class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors" @click="showAddModal = false">取消</button>
                <button type="submit" :disabled="addSubmitting" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                  {{ addSubmitting ? '提交中...' : '添加' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useResourceStore } from '@/stores/resource.store';

const resourceStore = useResourceStore();
const keyword = ref('');
const selectedDomain = ref('');
const selectedType = ref('');
let searchTimer: ReturnType<typeof setTimeout> | null = null;

// 添加资源弹窗
const showAddModal = ref(false);
const addSubmitting = ref(false);
const addError = ref('');
const addForm = reactive({
  title: '',
  url: '',
  resourceType: '',
  domain: '',
  tagsStr: '',
  description: '',
});

/** 类型徽章样式 */
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

/** 类型中文标签 */
function typeLabel(type: string) {
  const map: Record<string, string> = {
    article: '文章', video: '视频', tutorial: '教程', book: '书籍', document: '文档',
  };
  return map[type] || type;
}

/** 搜索防抖 300ms */
function handleSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    if (keyword.value.trim()) {
      resourceStore.searchResources(keyword.value.trim());
    } else {
      resourceStore.fetchResources(1);
    }
  }, 300);
}

/** 筛选变更 */
function handleFilter() {
  resourceStore.setFilters({ domain: selectedDomain.value, type: selectedType.value });
  if (keyword.value.trim()) {
    resourceStore.searchResources(keyword.value.trim());
  } else {
    resourceStore.fetchResources(1);
  }
}

onMounted(() => {
  resourceStore.fetchResources(1);
});

/** 添加资源 */
async function handleAddResource() {
  addError.value = '';
  addSubmitting.value = true;
  try {
    const tags = addForm.tagsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    await resourceStore.createResource({
      title: addForm.title,
      url: addForm.url,
      resourceType: addForm.resourceType,
      domain: addForm.domain,
      tags,
      description: addForm.description || undefined,
    });
    showAddModal.value = false;
    // 重置表单
    addForm.title = '';
    addForm.url = '';
    addForm.resourceType = '';
    addForm.domain = '';
    addForm.tagsStr = '';
    addForm.description = '';
    // 刷新列表
    await resourceStore.fetchResources(1);
  } catch (error: any) {
    addError.value = error.response?.data?.message || error.message || '添加失败';
  } finally {
    addSubmitting.value = false;
  }
}
</script>