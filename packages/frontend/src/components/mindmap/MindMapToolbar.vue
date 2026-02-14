<template>
  <div class="mindmap-toolbar">
    <button class="toolbar-btn" @click="emit('zoom-in')" title="放大">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
    <button class="toolbar-btn" @click="emit('zoom-out')" title="缩小">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
    <button class="toolbar-btn" @click="emit('zoom-fit')" title="适应画布">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" rx="2"/>
      </svg>
    </button>
    <button class="toolbar-btn" @click="emit('center')" title="居中">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2" fill="currentColor"/>
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" fill="none"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Graph } from '@antv/x6';

interface Props {
  graph: Graph;
}

defineProps<Props>();

const emit = defineEmits<{
  'zoom-in': [];
  'zoom-out': [];
  'zoom-fit': [];
  'center': [];
}>();
</script>

<style scoped>
.mindmap-toolbar {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  background: white;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #6B7280;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #F3F4F6;
  color: #3B82F6;
}

.toolbar-btn:active {
  transform: scale(0.95);
}
</style>
