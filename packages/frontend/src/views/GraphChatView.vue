<template>
  <div class="graph-chat-view">
    <!-- 错误通知 -->
    <Toast
      :show="showErrorToast"
      type="error"
      title="图谱生成失败"
      :message="graphStore.errorMessage"
      :duration="5000"
      @close="showErrorToast = false"
    />

    <!-- 聊天不可用提示 -->
    <Toast
      :show="showChatUnavailableToast"
      type="warning"
      title="对话功能不可用"
      message="图谱生成失败，无法使用对话功能。请返回重新生成图谱。"
      :duration="4000"
      @close="showChatUnavailableToast = false"
    />

    <div class="view-header">
      <button class="back-btn" @click="$router.push('/')">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        返回
      </button>
      <h1 class="view-title">{{ graphTitle || '生成中...' }}</h1>
      <div class="header-actions">
        <span v-if="graphStore.currentGraph" class="node-count">
          {{ graphStore.currentGraph.nodeCount || 0 }} 个节点
        </span>
      </div>
    </div>

    <div class="view-body">
      <div class="mindmap-section">
        <MindMapContainer
          :tree-data="treeData"
          :is-generating="graphStore.generationStatus === 'generating'"
          :progress="graphStore.progress"
          :progress-message="graphStore.currentStep"
          @node-click="handleNodeClick"
          @node-expand="handleNodeExpand"
        />
      </div>

      <!-- 可拖动分割手柄 -->
      <div
        class="resize-handle"
        @mousedown="startResize"
      >
        <div class="resize-handle-line"></div>
      </div>

      <div class="chat-section" :style="{ width: chatWidth + 'px' }">
        <ChatPanel
          :session-id="chatStore.currentSession?.id"
          :messages="chatStore.messages"
          :is-streaming="chatStore.isStreaming"
          :streaming-content="chatStore.streamingContent"
          @send="handleSendMessage"
          @new-chat="handleNewChat"
        />
      </div>
    </div>

    <!-- 节点详情抽屉 -->
    <NodeDetailDrawer
      :visible="showNodeDrawer"
      :node="selectedNode"
      @close="showNodeDrawer = false"
      @expand="handleDrawerExpand"
      @ask="handleDrawerAsk"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useGraphStore } from '@/stores/graph.store';
import { useChatStore } from '@/stores/chat.store';
import MindMapContainer from '@/components/mindmap/MindMapContainer.vue';
import ChatPanel from '@/components/chat/ChatPanel.vue';
import Toast from '@/components/common/Toast.vue';
import NodeDetailDrawer from '@/components/mindmap/NodeDetailDrawer.vue';

const route = useRoute();
const graphStore = useGraphStore();
const chatStore = useChatStore();

const showErrorToast = ref(false);
const showChatUnavailableToast = ref(false);
const showNodeDrawer = ref(false);
const selectedNode = ref<any>(null);

const graphTitle = computed(() => graphStore.currentGraph?.title || '');
const treeData = computed(() => graphStore.currentGraph?.nodeTree?.[0] || null);

// 侧边栏拖动调整宽度
const chatWidth = ref(400);
const MIN_CHAT_WIDTH = 280;
const MAX_CHAT_WIDTH = 700;
let isResizing = false;

function startResize(e: MouseEvent) {
  e.preventDefault();
  isResizing = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
}

function onResize(e: MouseEvent) {
  if (!isResizing) return;
  // 侧边栏在右侧，宽度 = 视口右边界 - 鼠标位置
  const newWidth = window.innerWidth - e.clientX;
  chatWidth.value = Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, newWidth));
}

function stopResize() {
  isResizing = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
}

onUnmounted(() => {
  // 清理可能残留的事件监听
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
});

onMounted(async () => {
  const topic = route.query.topic as string;
  const graphId = route.query.graphId as string;
  const provider = route.query.provider as string;

  try {
    if (graphId) {
      // 加载已有图谱
      await graphStore.loadGraph(parseInt(graphId, 10));
    } else if (topic) {
      // 生成新图谱，传递 provider 参数
      await graphStore.generateGraph(topic, provider);
    }

    // 创建或加载对话会话
    const gid = Number(graphStore.currentGraph?.id);
    if (gid > 0) {
      await chatStore.createOrLoadSession(gid);
    }
  } catch (error) {
    // 显示错误通知
    showErrorToast.value = true;
    console.error('Failed to generate or load graph:', error);
  }
});

function handleNodeClick(node: any) {
  selectedNode.value = node;
  showNodeDrawer.value = true;
}

async function handleDrawerExpand(node: any) {
  if (!graphStore.currentGraph) return;
  showNodeDrawer.value = false;
  await graphStore.expandNode(graphStore.currentGraph.id, node.id);
}

function handleDrawerAsk(node: any) {
  showNodeDrawer.value = false;
  // 通过 ChatPanel 发送追问消息
  handleSendMessage(`请详细解释「${node.label}」这个知识点`);
}

async function handleNodeExpand(node: any) {
  if (!graphStore.currentGraph) return;
  await graphStore.expandNode(graphStore.currentGraph.id, node.id);
}

async function handleSendMessage(content: string) {
  // 检查是否有有效的会话
  if (!chatStore.currentSession) {
    // 如果没有会话，尝试创建一个（仅当有有效图谱时）
    if (graphStore.currentGraph && graphStore.currentGraph.id > 0) {
      try {
        await chatStore.createOrLoadSession(graphStore.currentGraph.id);
      } catch (error) {
        console.error('Failed to create chat session:', error);
        showErrorToast.value = true;
        return;
      }
    } else {
      // 没有有效图谱，显示提示
      showChatUnavailableToast.value = true;
      return;
    }
  }

  // 发送消息
  try {
    await chatStore.sendMessage(chatStore.currentSession!.id, content);
  } catch (error) {
    console.error('Failed to send message:', error);
    showErrorToast.value = true;
  }
}

async function handleNewChat() {
  if (!graphStore.currentGraph) return;
  await chatStore.createOrLoadSession(graphStore.currentGraph.id);
}
</script>

<style scoped>
.graph-chat-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F9FAFB;
}

.view-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #E5E7EB;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #E5E7EB;
  background: white;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #F9FAFB;
  border-color: #3B82F6;
  color: #3B82F6;
}

.view-title {
  flex: 1;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-count {
  font-size: 13px;
  color: #6B7280;
  padding: 4px 12px;
  background: #F3F4F6;
  border-radius: 6px;
}

.view-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.mindmap-section {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-width: 0;
}

.resize-handle {
  flex-shrink: 0;
  width: 6px;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  position: relative;
  z-index: 10;
  transition: background 0.15s;
}

.resize-handle:hover,
.resize-handle:active {
  background: #E5E7EB;
}

.resize-handle-line {
  width: 2px;
  height: 32px;
  border-radius: 1px;
  background: #D1D5DB;
  transition: background 0.15s;
}

.resize-handle:hover .resize-handle-line,
.resize-handle:active .resize-handle-line {
  background: #3B82F6;
}

.chat-section {
  flex-shrink: 0;
  background: white;
  overflow: hidden;
}

@media (max-width: 1024px) {
  .view-body {
    flex-direction: column;
  }

  .resize-handle {
    display: none;
  }

  .chat-section {
    width: 100% !important;
    height: 400px;
    border-top: 1px solid #E5E7EB;
  }
}
</style>
