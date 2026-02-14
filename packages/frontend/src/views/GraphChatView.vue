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

      <div class="chat-section">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useGraphStore } from '@/stores/graph.store';
import { useChatStore } from '@/stores/chat.store';
import MindMapContainer from '@/components/mindmap/MindMapContainer.vue';
import ChatPanel from '@/components/chat/ChatPanel.vue';
import Toast from '@/components/common/Toast.vue';

const route = useRoute();
const graphStore = useGraphStore();
const chatStore = useChatStore();

const showErrorToast = ref(false);
const showChatUnavailableToast = ref(false);

const graphTitle = computed(() => graphStore.currentGraph?.title || '');
const treeData = computed(() => graphStore.currentGraph?.nodeTree?.[0] || null);

onMounted(async () => {
  const topic = route.query.topic as string;
  const graphId = route.query.graphId as string;

  try {
    if (graphId) {
      // 加载已有图谱
      await graphStore.loadGraph(parseInt(graphId, 10));
    } else if (topic) {
      // 生成新图谱
      await graphStore.generateGraph(topic);
    }

    // 创建或加载对话会话
    if (graphStore.currentGraph && graphStore.currentGraph.id > 0) {
      await chatStore.createOrLoadSession(graphStore.currentGraph.id);
    }
  } catch (error) {
    // 显示错误通知
    showErrorToast.value = true;
    console.error('Failed to generate or load graph:', error);
  }
});

function handleNodeClick(node: any) {
  console.log('Node clicked:', node);
  // 可以在这里显示节点详情
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
    await chatStore.sendMessage(chatStore.currentSession.id, content);
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
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 0;
  overflow: hidden;
}

.mindmap-section {
  position: relative;
  overflow: hidden;
}

.chat-section {
  border-left: 1px solid #E5E7EB;
  background: white;
}

@media (max-width: 1024px) {
  .view-body {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 400px;
  }

  .chat-section {
    border-left: none;
    border-top: 1px solid #E5E7EB;
  }
}
</style>
