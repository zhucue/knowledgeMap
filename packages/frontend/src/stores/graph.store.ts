import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { GraphNodeData } from '@knowledge-map/shared';

export const useGraphStore = defineStore('graph', () => {
  // 当前知识图谱数据，包含ID、标题和树形节点数据
  const currentGraph = ref<{
    id: number;
    title: string;
    treeData: GraphNodeData[];
  } | null>(null);

  // 图谱生成状态：idle-空闲、generating-生成中、done-完成、error-错误
  const generationStatus = ref<'idle' | 'generating' | 'done' | 'error'>('idle');

  // 当前生成步骤的描述文本（用于显示进度信息）
  const currentStep = ref('');

  // 图谱生成进度百分比（0-100）
  const progress = ref(0);

  // 当前正在展开/展开的节点ID（用于高亮或加载状态）
  const expandingNodeId = ref<number | null>(null);

  // 重置图谱状态，用于切换图谱或清除当前数据
  function reset() {
    currentGraph.value = null;
    generationStatus.value = 'idle';
    currentStep.value = '';
    progress.value = 0;
    expandingNodeId.value = null;
  }

  return {
    currentGraph,
    generationStatus,
    currentStep,
    progress,
    expandingNodeId,
    reset,
  };
});
