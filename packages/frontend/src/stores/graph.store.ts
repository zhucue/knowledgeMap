import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '@/services/api.client';

export const useGraphStore = defineStore('graph', () => {
  // 当前知识图谱数据
  const currentGraph = ref<any | null>(null);

  // 图谱生成状态
  const generationStatus = ref<'idle' | 'generating' | 'done' | 'error'>('idle');

  // 当前生成步骤
  const currentStep = ref('');

  // 图谱生成进度
  const progress = ref(0);

  // 当前正在展开的节点ID
  const expandingNodeId = ref<number | null>(null);

  // 错误信息
  const errorMessage = ref('');

  // 创建默认错误图谱
  function createErrorGraph(topic: string, error: string) {
    return {
      id: -1,
      title: topic,
      topic: topic,
      nodeCount: 1,
      nodeTree: [{
        id: -1,
        label: '生成失败',
        description: error || '图谱生成过程中发生错误，请稍后重试',
        nodeType: 'root',
        isExpandable: false,
        isExpanded: false,
        children: [],
        resources: [],
      }],
    };
  }

  // 重置图谱状态
  function reset() {
    currentGraph.value = null;
    generationStatus.value = 'idle';
    currentStep.value = '';
    progress.value = 0;
    expandingNodeId.value = null;
    errorMessage.value = '';
  }

  // 生成图谱（SSE 流式）
  async function generateGraph(topic: string, provider?: string) {
    generationStatus.value = 'generating';
    progress.value = 0;
    currentStep.value = '开始生成...';
    errorMessage.value = '';

    const url = `/api/graph/generate/stream?topic=${encodeURIComponent(topic)}${provider ? `&provider=${provider}` : ''}`;
    const eventSource = new EventSource(url);

    return new Promise((resolve, reject) => {
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.step === 'complete') {
            currentGraph.value = data.data.graph;
            generationStatus.value = 'done';
            progress.value = 100;
            currentStep.value = '生成完成';
            eventSource.close();
            resolve(data.data.graph);
          } else if (data.step === 'error') {
            generationStatus.value = 'error';
            currentStep.value = data.message;
            errorMessage.value = data.message || '生成失败';
            // 创建错误图谱
            currentGraph.value = createErrorGraph(topic, data.message);
            eventSource.close();
            reject(new Error(data.message));
          } else {
            progress.value = data.progress || 0;
            currentStep.value = data.message || '';
          }
        } catch (error) {
          console.error('Failed to parse SSE data:', error);
        }
      };

      eventSource.onerror = () => {
        generationStatus.value = 'error';
        const errMsg = '连接失败，请检查网络或稍后重试';
        currentStep.value = errMsg;
        errorMessage.value = errMsg;
        // 创建错误图谱
        currentGraph.value = createErrorGraph(topic, errMsg);
        eventSource.close();
        reject(new Error(errMsg));
      };
    });
  }

  // 加载已有图谱
  async function loadGraph(graphId: number) {
    try {
      const graph = await apiClient.get(`/graph/${graphId}`);
      currentGraph.value = graph;
      generationStatus.value = 'done';
      return graph;
    } catch (error) {
      console.error('Failed to load graph:', error);
      throw error;
    }
  }

  // 展开节点
  async function expandNode(graphId: number, nodeId: number, depth = 2) {
    expandingNodeId.value = nodeId;
    try {
      const result = await apiClient.post(`/graph/${graphId}/expand/${nodeId}`, { depth });

      // 更新当前图谱数据
      if (currentGraph.value) {
        // 重新加载完整图谱以获取更新后的树结构
        await loadGraph(graphId);
      }

      return result;
    } catch (error) {
      console.error('Failed to expand node:', error);
      throw error;
    } finally {
      expandingNodeId.value = null;
    }
  }

  // 获取用户图谱历史
  async function getHistory(page = 1, pageSize = 20) {
    try {
      // TODO: 从 JWT 获取 userId
      const result = await apiClient.get('/graph/history', {
        params: { userId: 1, page, pageSize },
      });
      return result;
    } catch (error) {
      console.error('Failed to get history:', error);
      throw error;
    }
  }

  return {
    currentGraph,
    generationStatus,
    currentStep,
    progress,
    expandingNodeId,
    errorMessage,
    reset,
    generateGraph,
    loadGraph,
    expandNode,
    getHistory,
    createErrorGraph,
  };
});
