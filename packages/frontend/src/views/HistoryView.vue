<template>
  <div class="history-view">
    <h2>历史记录</h2>
    <div class="history-tabs">
      <button :class="{ active: activeTab === 'chat' }" @click="activeTab = 'chat'">对话历史</button>
      <button :class="{ active: activeTab === 'graph' }" @click="activeTab = 'graph'">图谱历史</button>
      <button :class="{ active: activeTab === 'resource' }" @click="activeTab = 'resource'">浏览记录</button>
    </div>
    <div class="history-content">
      <p class="placeholder">历史记录将在 Phase 6 实现</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const activeTab = ref<'chat' | 'graph' | 'resource'>('chat');
</script>
