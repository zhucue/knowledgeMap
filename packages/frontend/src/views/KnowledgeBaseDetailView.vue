<template>
  <div class="min-h-[calc(100vh-56px)] bg-gray-50 py-8 px-4">
    <div class="max-w-6xl mx-auto">
      <!-- 加载中 -->
      <div v-if="kbStore.detailLoading" class="text-center py-16 text-gray-500">
        <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        加载中...
      </div>

      <template v-else-if="kb">
        <!-- 页头 -->
        <div class="flex items-center gap-4 mb-6">
          <button
            class="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-blue-500 hover:text-blue-500 transition-colors bg-white"
            @click="$router.push('/knowledge-base')"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            返回
          </button>
          <h1 class="text-2xl font-bold text-gray-900">{{ kb.name }}</h1>
          <span :class="visibilityBadgeClass(kb.visibility)" class="px-2 py-0.5 rounded text-xs font-medium">
            {{ visibilityLabel(kb.visibility) }}
          </span>
          <button
            v-if="isOwner"
            class="ml-auto px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors bg-white"
            @click="openEditModal"
          >
            编辑
          </button>
        </div>

        <!-- 信息卡片 -->
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
          <p class="text-sm text-gray-600 mb-3">{{ kb.description || '暂无描述' }}</p>
          <div class="flex items-center gap-6 text-xs text-gray-400">
            <span>{{ kb.documentCount }} 篇文档</span>
            <span>创建于 {{ formatDate(kb.createdAt) }}</span>
            <span>更新于 {{ formatDate(kb.updatedAt) }}</span>
          </div>
        </div>

        <!-- Tab 栏 -->
        <div class="flex border-b border-gray-200 mb-6">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="[
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px]',
              activeTab === tab.key
                ? 'text-blue-500 border-blue-500'
                : 'text-gray-500 border-transparent hover:text-gray-700',
            ]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab 1: 文档管理 -->
        <div v-if="activeTab === 'documents'">
          <!-- 拖拽上传区 -->
          <div
            v-if="isOwner"
            class="border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-colors cursor-pointer"
            :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="fileInputRef?.click()"
          >
            <svg class="w-10 h-10 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <p class="text-sm text-gray-600 mb-1">拖拽文件到此处，或点击选择文件</p>
            <p class="text-xs text-gray-400">支持 PDF、DOCX、MD、TXT，单文件最大 50MB</p>
            <input
              ref="fileInputRef"
              type="file"
              class="hidden"
              accept=".pdf,.docx,.md,.txt"
              @change="handleFileSelect"
            />
          </div>

          <!-- 上传中提示 -->
          <div v-if="uploading" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-600 flex items-center gap-2">
            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            正在上传文件...
          </div>

          <!-- 文档加载中 -->
          <div v-if="kbStore.documentsLoading && !kbStore.documents.length" class="text-center py-12 text-gray-500">
            <svg class="animate-spin h-6 w-6 mx-auto mb-2 text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            加载文档列表...
          </div>

          <!-- 文档为空 -->
          <div v-else-if="!kbStore.documents.length" class="text-center py-12 text-gray-400">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p>暂无文档，请上传文件</p>
          </div>

          <!-- 文档列表 -->
          <div v-else class="space-y-2">
            <div
              v-for="doc in kbStore.documents"
              :key="doc.id"
              class="flex items-center gap-4 bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100"
            >
              <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ doc.title }}</p>
                <p class="text-xs text-gray-400">{{ formatFileSize(doc.fileSize) }}</p>
              </div>
              <span :class="fileTypeBadgeClass(doc.fileType)" class="px-2 py-0.5 rounded text-xs font-medium uppercase">
                {{ doc.fileType }}
              </span>
              <span
                :class="statusBadgeClass(doc.status)"
                class="px-2 py-0.5 rounded text-xs font-medium"
                :title="doc.status === 'failed' ? doc.errorMessage || '' : ''"
              >
                {{ statusLabel(doc) }}
              </span>
              <button
                v-if="isOwner"
                class="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                title="删除文档"
                @click="handleDeleteDoc(doc)"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Tab 2: 协作者 -->
        <div v-if="activeTab === 'collaborators'">
          <!-- 添加协作者按钮 -->
          <div v-if="isOwner" class="mb-4">
            <button
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
              @click="showCollabModal = true"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              添加协作者
            </button>
          </div>

          <!-- 协作者为空 -->
          <div v-if="!kb.collaborators?.length" class="text-center py-12 text-gray-400">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <p>暂无协作者</p>
          </div>

          <!-- 协作者列表 -->
          <div v-else class="space-y-2">
            <div
              v-for="collab in kb.collaborators"
              :key="collab.id"
              class="flex items-center gap-4 bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100"
            >
              <!-- 头像 -->
              <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium shrink-0">
                {{ (collab.user?.username || 'U')[0].toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">{{ collab.user?.username || `用户 ${collab.userId}` }}</p>
                <p class="text-xs text-gray-400">{{ collab.user?.email || '' }}</p>
              </div>
              <span :class="roleBadgeClass(collab.role)" class="px-2 py-0.5 rounded text-xs font-medium">
                {{ roleLabel(collab.role) }}
              </span>
              <button
                v-if="isOwner"
                class="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                title="移除协作者"
                @click="handleRemoveCollab(collab)"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 12L12 4M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Tab 3: 检索测试 -->
        <div v-if="activeTab === 'retrieval'">
          <div class="flex gap-3 mb-6">
            <input
              v-model="retrievalQuery"
              type="text"
              placeholder="输入问题测试检索..."
              class="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              @keyup.enter="handleRetrieve"
            />
            <input
              v-model.number="retrievalTopK"
              type="number"
              min="1"
              max="20"
              class="w-20 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              title="返回结果数量"
            />
            <button
              :disabled="kbStore.retrievalLoading || !retrievalQuery.trim()"
              class="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              @click="handleRetrieve"
            >
              {{ kbStore.retrievalLoading ? '检索中...' : '检索' }}
            </button>
          </div>

          <!-- 检索结果为空 -->
          <div v-if="!kbStore.retrievalResults.length && !kbStore.retrievalLoading" class="text-center py-12 text-gray-400">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p>输入问题开始检索</p>
          </div>

          <!-- 检索加载中 -->
          <div v-if="kbStore.retrievalLoading" class="text-center py-8 text-gray-500">
            <svg class="animate-spin h-6 w-6 mx-auto mb-2 text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            检索中...
          </div>

          <!-- 检索结果列表 -->
          <div v-else-if="kbStore.retrievalResults.length" class="space-y-3">
            <div
              v-for="(result, idx) in kbStore.retrievalResults"
              :key="idx"
              class="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <!-- 相关度条 -->
              <div class="flex items-center gap-3 mb-2">
                <span class="text-xs text-gray-500 shrink-0">相关度</span>
                <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="result.score >= 0.7 ? 'bg-green-500' : result.score >= 0.4 ? 'bg-yellow-500' : 'bg-red-400'"
                    :style="{ width: `${Math.round(result.score * 100)}%` }"
                  />
                </div>
                <span class="text-xs font-medium text-gray-700 shrink-0">{{ result.score.toFixed(2) }}</span>
              </div>
              <!-- 来源 -->
              <p class="text-xs text-gray-400 mb-2">
                来源: {{ result.source }}{{ result.headingPath ? ` > ${result.headingPath}` : '' }}
              </p>
              <!-- 内容 -->
              <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ result.content }}</p>
            </div>
          </div>
        </div>
      </template>

      <!-- 知识库不存在 -->
      <div v-else class="text-center py-16 text-gray-400">
        <p class="text-lg">知识库不存在或无权访问</p>
        <button
          class="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          @click="$router.push('/knowledge-base')"
        >
          返回列表
        </button>
      </div>

      <!-- 编辑知识库弹窗 -->
      <Teleport to="body">
        <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30" @click="showEditModal = false" />
          <div class="relative bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">编辑知识库</h3>
            <div v-if="editError" class="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{{ editError }}</div>
            <form @submit.prevent="handleEditSubmit">
              <div class="mb-3">
                <label class="block text-sm text-gray-700 mb-1">名称 *</label>
                <input v-model="editForm.name" required class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500" />
              </div>
              <div class="mb-3">
                <label class="block text-sm text-gray-700 mb-1">描述</label>
                <textarea v-model="editForm.description" rows="3" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 resize-none" />
              </div>
              <div class="mb-4">
                <label class="block text-sm text-gray-700 mb-1">可见性</label>
                <select v-model="editForm.visibility" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500">
                  <option value="private">私有</option>
                  <option value="shared">协作</option>
                  <option value="public">公开</option>
                </select>
              </div>
              <div class="flex justify-end gap-2">
                <button type="button" class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors" @click="showEditModal = false">取消</button>
                <button type="submit" :disabled="editSubmitting" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                  {{ editSubmitting ? '保存中...' : '保存' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Teleport>

      <!-- 添加协作者弹窗 -->
      <Teleport to="body">
        <div v-if="showCollabModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30" @click="showCollabModal = false" />
          <div class="relative bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">添加协作者</h3>
            <div v-if="collabError" class="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{{ collabError }}</div>
            <form @submit.prevent="handleAddCollab">
              <div class="mb-3">
                <label class="block text-sm text-gray-700 mb-1">邮箱 *</label>
                <input
                  v-model="collabForm.email"
                  type="email"
                  required
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                  placeholder="输入协作者邮箱"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm text-gray-700 mb-1">角色</label>
                <select v-model="collabForm.role" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500">
                  <option value="viewer">查看者</option>
                  <option value="editor">编辑者</option>
                </select>
              </div>
              <div class="flex justify-end gap-2">
                <button type="button" class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors" @click="showCollabModal = false">取消</button>
                <button type="submit" :disabled="collabSubmitting" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                  {{ collabSubmitting ? '添加中...' : '添加' }}
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
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useKnowledgeBaseStore, type KbDocument } from '@/stores/knowledge-base.store';
import { useAuthStore } from '@/stores/auth.store';

const route = useRoute();
const kbStore = useKnowledgeBaseStore();
const authStore = useAuthStore();

const kbId = computed(() => Number(route.params.id));
const kb = computed(() => kbStore.currentKb);
const isOwner = computed(() => authStore.user?.id === kb.value?.ownerId);

// Tab 状态
const tabs = [
  { key: 'documents', label: '文档管理' },
  { key: 'collaborators', label: '协作者' },
  { key: 'retrieval', label: '检索测试' },
] as const;
type TabKey = typeof tabs[number]['key'];
const activeTab = ref<TabKey>('documents');

// 文件上传
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const uploading = ref(false);

// 编辑弹窗
const showEditModal = ref(false);
const editSubmitting = ref(false);
const editError = ref('');
const editForm = reactive({ name: '', description: '', visibility: 'private' });

// 协作者弹窗
const showCollabModal = ref(false);
const collabSubmitting = ref(false);
const collabError = ref('');
const collabForm = reactive({ email: '', role: 'viewer' });

// 检索
const retrievalQuery = ref('');
const retrievalTopK = ref(5);

// 文档状态轮询
let pollTimer: ReturnType<typeof setInterval> | null = null;

/** 是否有正在处理中的文档 */
const hasProcessingDocs = computed(() =>
  kbStore.documents.some((d) => d.status === 'pending' || d.status === 'processing'),
);

/** 当有处理中文档时启动轮询，全部完成后停止 */
watch(hasProcessingDocs, (val) => {
  if (val && !pollTimer) {
    pollTimer = setInterval(() => {
      kbStore.fetchDocuments(kbId.value);
    }, 5000);
  } else if (!val && pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});

// --- 工具函数 ---

function visibilityBadgeClass(v: string) {
  const map: Record<string, string> = {
    private: 'bg-gray-100 text-gray-700',
    shared: 'bg-blue-100 text-blue-700',
    public: 'bg-green-100 text-green-700',
  };
  return map[v] || 'bg-gray-100 text-gray-700';
}

function visibilityLabel(v: string) {
  const map: Record<string, string> = { private: '私有', shared: '协作', public: '公开' };
  return map[v] || v;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function fileTypeBadgeClass(type: string) {
  const map: Record<string, string> = {
    pdf: 'bg-red-100 text-red-700',
    docx: 'bg-blue-100 text-blue-700',
    md: 'bg-purple-100 text-purple-700',
    txt: 'bg-gray-100 text-gray-700',
  };
  return map[type] || 'bg-gray-100 text-gray-700';
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700 animate-pulse',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

function statusLabel(doc: KbDocument) {
  const map: Record<string, string> = {
    pending: '等待处理',
    processing: '处理中',
    failed: '失败',
  };
  if (doc.status === 'completed') {
    return `已完成 (${doc.tokenCount} tokens)`;
  }
  return map[doc.status] || doc.status;
}

function roleBadgeClass(role: string) {
  return role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
}

function roleLabel(role: string) {
  return role === 'editor' ? '编辑者' : '查看者';
}

// --- 文件上传操作 ---

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files?.length) uploadFile(files[0]);
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files?.length) {
    uploadFile(input.files[0]);
    input.value = ''; // 重置，允许重复上传同名文件
  }
}

async function uploadFile(file: File) {
  uploading.value = true;
  try {
    await kbStore.uploadDocument(kbId.value, file);
  } catch (err: any) {
    alert(err.response?.data?.message || '上传失败');
  } finally {
    uploading.value = false;
  }
}

async function handleDeleteDoc(doc: KbDocument) {
  if (!confirm(`确定要删除文档「${doc.title}」吗？`)) return;
  try {
    await kbStore.removeDocument(kbId.value, doc.id);
  } catch (err: any) {
    alert(err.response?.data?.message || '删除失败');
  }
}

// --- 编辑知识库 ---

function openEditModal() {
  if (!kb.value) return;
  editForm.name = kb.value.name;
  editForm.description = kb.value.description || '';
  editForm.visibility = kb.value.visibility;
  editError.value = '';
  showEditModal.value = true;
}

async function handleEditSubmit() {
  if (!editForm.name.trim()) {
    editError.value = '请输入知识库名称';
    return;
  }
  editSubmitting.value = true;
  editError.value = '';
  try {
    await kbStore.update(kbId.value, {
      name: editForm.name.trim(),
      description: editForm.description.trim() || undefined,
      visibility: editForm.visibility,
    });
    showEditModal.value = false;
  } catch (err: any) {
    editError.value = err.response?.data?.message || '保存失败';
  } finally {
    editSubmitting.value = false;
  }
}

// --- 协作者操作 ---

async function handleAddCollab() {
  if (!collabForm.email.trim()) {
    collabError.value = '请输入邮箱地址';
    return;
  }
  collabSubmitting.value = true;
  collabError.value = '';
  try {
    await kbStore.addCollaborator(kbId.value, collabForm.email.trim(), collabForm.role);
    showCollabModal.value = false;
    collabForm.email = '';
    collabForm.role = 'viewer';
  } catch (err: any) {
    collabError.value = err.response?.data?.message || '添加失败';
  } finally {
    collabSubmitting.value = false;
  }
}

async function handleRemoveCollab(collab: { userId: number; user?: { username: string } }) {
  const name = collab.user?.username || `用户 ${collab.userId}`;
  if (!confirm(`确定要移除协作者「${name}」吗？`)) return;
  try {
    await kbStore.removeCollaborator(kbId.value, collab.userId);
  } catch (err: any) {
    alert(err.response?.data?.message || '移除失败');
  }
}

// --- 检索操作 ---

async function handleRetrieve() {
  if (!retrievalQuery.value.trim()) return;
  await kbStore.retrieve(retrievalQuery.value.trim(), retrievalTopK.value);
}

// --- 生命周期 ---

onMounted(async () => {
  await kbStore.fetchDetail(kbId.value);
  await kbStore.fetchDocuments(kbId.value);
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>
