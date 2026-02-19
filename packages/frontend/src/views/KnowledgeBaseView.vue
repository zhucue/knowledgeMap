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
        <h1 class="text-2xl font-bold text-gray-900">知识库</h1>
      </div>

      <!-- 工具栏 -->
      <div class="flex flex-wrap gap-3 mb-6">
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索知识库..."
          class="flex-1 min-w-[200px] px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
        />
        <button
          class="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          @click="openCreateModal"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          新建知识库
        </button>
      </div>

      <!-- 加载中 -->
      <div v-if="kbStore.loading" class="text-center py-16 text-gray-500">
        <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        加载中...
      </div>

      <!-- 空状态 -->
      <div v-else-if="!filteredList.length" class="text-center py-16 text-gray-400">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <p class="text-lg mb-2">暂无知识库</p>
        <p class="text-sm">点击"新建知识库"开始创建</p>
      </div>

      <!-- 知识库卡片网格 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div
          v-for="kb in filteredList"
          :key="kb.id"
          class="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div class="flex items-start justify-between gap-3 mb-2">
            <h3 class="font-semibold text-gray-900 text-base line-clamp-1">{{ kb.name }}</h3>
            <span :class="visibilityBadgeClass(kb.visibility)" class="shrink-0 px-2 py-0.5 rounded text-xs font-medium">
              {{ visibilityLabel(kb.visibility) }}
            </span>
          </div>
          <p class="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">{{ kb.description || '暂无描述' }}</p>
          <div class="flex items-center text-xs text-gray-400 mb-4">
            <span>{{ kb.documentCount }} 篇文档</span>
            <span class="mx-2">·</span>
            <span>更新于 {{ formatDate(kb.updatedAt) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
              @click="$router.push(`/knowledge-base/${kb.id}`)"
            >
              查看详情
            </button>
            <button
              v-if="isOwner(kb)"
              class="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
              title="编辑"
              @click="openEditModal(kb)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              v-if="isOwner(kb)"
              class="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-red-500 hover:text-red-500 transition-colors"
              title="删除"
              @click="handleDelete(kb)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="kbStore.pagination.totalPages > 1" class="flex justify-center gap-2">
        <button
          :disabled="kbStore.pagination.page <= 1"
          class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:border-blue-500 hover:text-blue-500 transition-colors bg-white"
          @click="kbStore.fetchList(kbStore.pagination.page - 1)"
        >上一页</button>
        <span class="px-3 py-1.5 text-sm text-gray-600">
          {{ kbStore.pagination.page }} / {{ kbStore.pagination.totalPages }}
        </span>
        <button
          :disabled="kbStore.pagination.page >= kbStore.pagination.totalPages"
          class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:border-blue-500 hover:text-blue-500 transition-colors bg-white"
          @click="kbStore.fetchList(kbStore.pagination.page + 1)"
        >下一页</button>
      </div>

      <!-- 新建/编辑弹窗 -->
      <Teleport to="body">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30" @click="showModal = false" />
          <div class="relative bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingKb ? '编辑知识库' : '新建知识库' }}</h3>
            <div v-if="formError" class="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{{ formError }}</div>
            <form @submit.prevent="handleSubmit">
              <div class="mb-3">
                <label class="block text-sm text-gray-700 mb-1">名称 *</label>
                <input
                  v-model="form.name"
                  required
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                  placeholder="知识库名称"
                />
              </div>
              <div class="mb-3">
                <label class="block text-sm text-gray-700 mb-1">描述</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 resize-none"
                  placeholder="知识库描述（可选）"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm text-gray-700 mb-1">可见性</label>
                <select
                  v-model="form.visibility"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                >
                  <option value="private">私有 - 仅自己可见</option>
                  <option value="shared">协作 - 邀请的人可见</option>
                  <option value="public">公开 - 所有人可见</option>
                </select>
              </div>
              <div class="flex justify-end gap-2">
                <button type="button" class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors" @click="showModal = false">取消</button>
                <button type="submit" :disabled="submitting" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                  {{ submitting ? '提交中...' : (editingKb ? '保存' : '创建') }}
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useKnowledgeBaseStore, type KnowledgeBase } from '@/stores/knowledge-base.store';
import { useAuthStore } from '@/stores/auth.store';

const kbStore = useKnowledgeBaseStore();
const authStore = useAuthStore();

const keyword = ref('');
const showModal = ref(false);
const submitting = ref(false);
const formError = ref('');
const editingKb = ref<KnowledgeBase | null>(null);
const form = reactive({ name: '', description: '', visibility: 'private' });

/** 客户端过滤列表 */
const filteredList = computed(() => {
  if (!keyword.value.trim()) return kbStore.knowledgeBases;
  const kw = keyword.value.trim().toLowerCase();
  return kbStore.knowledgeBases.filter(
    (kb) => kb.name.toLowerCase().includes(kw) || kb.description?.toLowerCase().includes(kw),
  );
});

/** 判断当前用户是否为所有者 */
function isOwner(kb: KnowledgeBase) {
  return authStore.user?.id === kb.ownerId;
}

/** 可见性徽章样式 */
function visibilityBadgeClass(v: string) {
  const map: Record<string, string> = {
    private: 'bg-gray-100 text-gray-700',
    shared: 'bg-blue-100 text-blue-700',
    public: 'bg-green-100 text-green-700',
  };
  return map[v] || 'bg-gray-100 text-gray-700';
}

/** 可见性中文标签 */
function visibilityLabel(v: string) {
  const map: Record<string, string> = { private: '私有', shared: '协作', public: '公开' };
  return map[v] || v;
}

/** 格式化日期 */
function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

/** 打开新建弹窗 */
function openCreateModal() {
  editingKb.value = null;
  form.name = '';
  form.description = '';
  form.visibility = 'private';
  formError.value = '';
  showModal.value = true;
}

/** 打开编辑弹窗 */
function openEditModal(kb: KnowledgeBase) {
  editingKb.value = kb;
  form.name = kb.name;
  form.description = kb.description || '';
  form.visibility = kb.visibility;
  formError.value = '';
  showModal.value = true;
}

/** 提交新建/编辑 */
async function handleSubmit() {
  if (!form.name.trim()) {
    formError.value = '请输入知识库名称';
    return;
  }
  submitting.value = true;
  formError.value = '';
  try {
    if (editingKb.value) {
      await kbStore.update(editingKb.value.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        visibility: form.visibility,
      });
    } else {
      await kbStore.create({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        visibility: form.visibility,
      });
    }
    showModal.value = false;
  } catch (err: any) {
    formError.value = err.response?.data?.message || '操作失败，请重试';
  } finally {
    submitting.value = false;
  }
}

/** 删除知识库 */
async function handleDelete(kb: KnowledgeBase) {
  if (!confirm(`确定要删除知识库「${kb.name}」吗？此操作不可撤销。`)) return;
  try {
    await kbStore.remove(kb.id);
  } catch (err: any) {
    alert(err.response?.data?.message || '删除失败');
  }
}

onMounted(() => {
  kbStore.fetchList(1);
});
</script>
