<template>
  <Teleport to="body">
    <!-- 遮罩 -->
    <Transition name="overlay">
      <div
        v-if="visible"
        class="drawer-overlay"
        @click="$emit('close')"
      />
    </Transition>

    <!-- 抽屉 -->
    <Transition name="drawer">
      <div v-if="visible" class="drawer-panel">
        <!-- 头部 -->
        <div class="drawer-header">
          <div class="flex-1 min-w-0">
            <span
              v-if="node?.nodeType"
              class="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2"
              :class="nodeTypeBadge(node.nodeType)"
            >{{ nodeTypeLabel(node.nodeType) }}</span>
            <h3 class="text-lg font-semibold text-gray-900 truncate">{{ node?.label }}</h3>
          </div>
          <button class="drawer-close" @click="$emit('close')">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- 内容 -->
        <div class="drawer-body">
          <!-- 描述 -->
          <div v-if="node?.description" class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-2">描述</h4>
            <p class="text-sm text-gray-600 leading-relaxed">{{ node.description }}</p>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-2 mb-6">
            <button
              v-if="node?.isExpandable && !node?.isExpanded"
              class="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
              @click="$emit('expand', node)"
            >展开此节点</button>
            <button
              class="flex-1 py-2 border border-blue-500 text-blue-500 hover:bg-blue-50 text-sm font-medium rounded-lg transition-colors"
              @click="$emit('ask', node)"
            >追问此节点</button>
          </div>

          <!-- 关联资源 -->
          <div v-if="resources.length">
            <h4 class="text-sm font-medium text-gray-700 mb-3">关联资源</h4>
            <div class="space-y-3">
              <div
                v-for="res in resources" :key="res.id"
                class="p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div class="flex items-center justify-between mb-1.5">
                  <a
                    :href="res.url" target="_blank" rel="noopener"
                    class="text-sm font-medium text-blue-600 hover:text-blue-700 truncate"
                  >{{ res.title }}</a>
                  <span :class="typeBadgeClass(res.resourceType)" class="shrink-0 px-1.5 py-0.5 rounded text-xs">
                    {{ typeLabel(res.resourceType) }}
                  </span>
                </div>
                <div v-if="res.relevanceScore" class="flex items-center gap-2">
                  <span class="text-xs text-gray-500">相关度</span>
                  <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-blue-500 rounded-full"
                      :style="{ width: `${(res.relevanceScore / 10) * 100}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="!loadingResources" class="text-center py-8 text-gray-400 text-sm">
            暂无关联资源
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import apiClient from '@/services/api.client';

const props = defineProps<{
  visible: boolean;
  node: any;
}>();

defineEmits<{
  close: [];
  expand: [node: any];
  ask: [node: any];
}>();

const resources = ref<any[]>([]);
const loadingResources = ref(false);

watch(() => [props.visible, props.node?.id], async () => {
  if (props.visible && props.node?.id && props.node.id > 0) {
    loadingResources.value = true;
    try {
      const result = await apiClient.get(`/resources/node/${props.node.id}`);
      resources.value = result as any;
    } catch { resources.value = []; }
    finally { loadingResources.value = false; }
  } else {
    resources.value = [];
  }
});

function nodeTypeBadge(type: string) {
  const map: Record<string, string> = {
    root: 'bg-blue-100 text-blue-700',
    branch: 'bg-purple-100 text-purple-700',
    leaf: 'bg-green-100 text-green-700',
  };
  return map[type] || 'bg-gray-100 text-gray-700';
}

function nodeTypeLabel(type: string) {
  const map: Record<string, string> = { root: '根节点', branch: '分支', leaf: '叶节点' };
  return map[type] || type;
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
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 40;
}

.drawer-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 380px;
  max-width: 100vw;
  background: white;
  z-index: 50;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid #E5E7EB;
}

.drawer-close {
  padding: 4px;
  color: #9CA3AF;
  cursor: pointer;
  border: none;
  background: none;
  border-radius: 6px;
  transition: all 0.2s;
}

.drawer-close:hover {
  color: #374151;
  background: #F3F4F6;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 动画 */
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

.drawer-enter-active, .drawer-leave-active { transition: transform 0.3s ease; }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }

@media (max-width: 768px) {
  .drawer-panel { width: 100vw; }
}
</style>