<template>
  <div class="mindmap-container">
    <MindMapToolbar
      v-if="graph"
      :graph="graph"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @zoom-fit="handleZoomFit"
      @center="handleCenter"
    />
    <div ref="containerRef" class="mindmap-canvas"></div>
    <GenerationProgress v-if="isGenerating" :progress="progress" :message="progressMessage" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Graph } from '@antv/x6';
import { DagreLayout } from '@antv/layout';
import MindMapToolbar from './MindMapToolbar.vue';
import GenerationProgress from './GenerationProgress.vue';

interface TreeNode {
  id: number;
  label: string;
  description?: string;
  nodeType: string;
  isExpandable: boolean;
  isExpanded: boolean;
  children?: TreeNode[];
  resources?: any[];
}

interface Props {
  treeData?: TreeNode | null;
  isGenerating?: boolean;
  progress?: number;
  progressMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  treeData: null,
  isGenerating: false,
  progress: 0,
  progressMessage: '',
});

const emit = defineEmits<{
  nodeClick: [node: TreeNode];
  nodeExpand: [node: TreeNode];
}>();

const containerRef = ref<HTMLElement>();
const graph = ref<Graph>();

// 初始化 X6 画布
onMounted(() => {
  if (!containerRef.value) return;

  graph.value = new Graph({
    container: containerRef.value,
    autoResize: true,
    panning: {
      enabled: true,
      modifiers: 'shift',
    },
    mousewheel: {
      enabled: true,
      modifiers: 'ctrl',
      minScale: 0.2,
      maxScale: 3,
    },
    background: {
      color: '#F9FAFB',
    },
    grid: {
      visible: false,
    },
  });

  // 监听节点点击事件
  graph.value.on('node:click', ({ node }) => {
    const data = node.getData();
    if (data) {
      emit('nodeClick', data);
    }
  });

  // 监听节点双击事件（展开）
  graph.value.on('node:dblclick', ({ node }) => {
    const data = node.getData();
    if (data && data.isExpandable && !data.isExpanded) {
      emit('nodeExpand', data);
    }
  });
});

// 监听树数据变化
watch(() => props.treeData, (newData) => {
  if (newData && graph.value) {
    renderTree(newData);
  }
}, { deep: true });

// 渲染树形结构
async function renderTree(root: TreeNode) {
  if (!graph.value) return;

  // 清空画布
  graph.value.clearCells();

  // 转换树形数据为图数据（节点和边）
  const graphData = convertTreeToGraph(root);

  // 使用 Dagre 布局算法（适合层次结构）
  const layout = new DagreLayout({
    type: 'dagre',
    rankdir: 'TB', // 从上到下
    nodesep: 60,   // 节点水平间距
    ranksep: 80,   // 层级垂直间距
  });

  // 执行布局计算
  const layoutResult = await layout.execute(graphData);

  // 创建节点和边
  const nodes: any[] = [];
  const edges: any[] = [];

  // 应用布局位置到节点
  layoutResult.nodes?.forEach((layoutNode: any) => {
    const originalNode = graphData.nodes.find((n: any) => n.id === layoutNode.id);
    if (originalNode) {
      nodes.push(createNode({
        ...originalNode.data,
        x: layoutNode.x,
        y: layoutNode.y,
      }));
    }
  });

  // 创建边
  graphData.edges.forEach((edge: any) => {
    edges.push(createEdge(edge.source, edge.target));
  });

  graph.value.addNodes(nodes);
  graph.value.addEdges(edges);

  // 自动居中
  setTimeout(() => handleZoomFit(), 100);
}

// 将树形结构转换为图数据格式
function convertTreeToGraph(root: TreeNode) {
  const nodes: any[] = [];
  const edges: any[] = [];

  function traverse(node: TreeNode, parent?: TreeNode) {
    // 添加节点
    nodes.push({
      id: String(node.id),
      data: {
        id: node.id,
        label: node.label,
        description: node.description,
        nodeType: node.nodeType,
        isExpandable: node.isExpandable,
        isExpanded: node.isExpanded,
        resources: node.resources,
      },
    });

    // 添加边（如果有父节点）
    if (parent) {
      edges.push({
        source: String(parent.id),
        target: String(node.id),
      });
    }

    // 递归处理子节点
    if (node.children) {
      node.children.forEach(child => traverse(child, node));
    }
  }

  traverse(root);

  return { nodes, edges };
}

// 创建节点
function createNode(data: any) {
  const colors = {
    root: '#3B82F6',
    branch: '#8B5CF6',
    leaf: '#10B981',
  };

  return {
    id: String(data.id),
    x: data.x,
    y: data.y,
    width: 200,
    height: 60,
    shape: 'rect',
    data: data,
    attrs: {
      body: {
        fill: '#FFFFFF',
        stroke: colors[data.nodeType as keyof typeof colors] || '#3B82F6',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      },
      label: {
        text: data.label,
        fill: '#1F2937',
        fontSize: 14,
        fontWeight: 500,
        textWrap: {
          width: 180,
          height: 40,
          ellipsis: true,
        },
      },
    },
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        tagName: 'text',
        selector: 'label',
      },
      {
        tagName: 'text',
        selector: 'expand-btn',
      },
    ],
  };
}

// 创建边
function createEdge(source: string, target: string) {
  return {
    source: String(source),
    target: String(target),
    attrs: {
      line: {
        stroke: '#D1D5DB',
        strokeWidth: 2,
        targetMarker: null,
      },
    },
    connector: {
      name: 'rounded',
    },
  };
}

// 工具栏操作
function handleZoomIn() {
  graph.value?.zoom(0.1);
}

function handleZoomOut() {
  graph.value?.zoom(-0.1);
}

function handleZoomFit() {
  graph.value?.zoomToFit({ padding: 20, maxScale: 1 });
}

function handleCenter() {
  graph.value?.centerContent();
}

onUnmounted(() => {
  graph.value?.dispose();
});
</script>

<style scoped>
.mindmap-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #F9FAFB;
}

.mindmap-canvas {
  width: 100%;
  height: 100%;
}
</style>
