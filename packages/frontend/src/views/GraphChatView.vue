<template>
  <div class="graph-chat">
    <div class="graph-chat-header">
      <button @click="$router.push('/')">← 返回</button>
      <h2>{{ graphTitle || '生成中...' }}</h2>
    </div>
    <div class="graph-chat-body">
      <div class="mindmap-panel">
        <!-- @antv/x6 MindMap will be rendered here in Phase 4 -->
        <div ref="mindmapContainer" class="mindmap-container">
          <p v-if="!graphData" class="placeholder">思维导图将在此处渲染</p>
        </div>
      </div>
      <div class="chat-panel">
        <!-- Chat panel will be implemented in Phase 5 -->
        <div class="chat-messages">
          <p class="placeholder">对话面板将在此处渲染</p>
        </div>
        <div class="chat-input-area">
          <input type="text" placeholder="输入问题..." disabled />
          <button disabled>发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const mindmapContainer = ref<HTMLElement>();
const graphTitle = ref('');
const graphData = ref(null);
</script>
