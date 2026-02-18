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
import { ref, onMounted, onUnmounted, watch, reactive } from 'vue';
import { Graph } from '@antv/x6';
import { Graph as LayoutGraph } from '@antv/graphlib';
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

// 折叠状态管理：记录每个节点的展开状态
const expandedMap = reactive<Record<string, boolean>>({});

// 获取节点深度
function getNodeDepth(root: TreeNode, targetId: number, depth = 0): number {
  if (root.id === targetId) return depth;
  if (root.children) {
    for (const child of root.children) {
      const d = getNodeDepth(child, targetId, depth + 1);
      if (d >= 0) return d;
    }
  }
  return -1;
}

// 初始化折叠状态：深度 <= 1 展开，其余折叠
function initExpandedState(node: TreeNode, depth = 0) {
  const key = String(node.id);
  if (!(key in expandedMap)) {
    expandedMap[key] = depth <= 1;
  }
  if (node.children) {
    node.children.forEach(child => initExpandedState(child, depth + 1));
  }
}

// 统计未展开的子节点数量
function countCollapsedChildren(node: TreeNode): number {
  if (!node.children || node.children.length === 0) return 0;
  return node.children.length;
}

// 初始化 X6 画布
onMounted(() => {
  if (!containerRef.value) return;

  graph.value = new Graph({
    container: containerRef.value,
    autoResize: true,
    panning: {
      enabled: true,
    },
    mousewheel: {
      enabled: true,
      minScale: 0.2,
      maxScale: 3,
    },
    background: {
      color: '#F0F4F8',
    },
    grid: {
      visible: false,
    },
  });

  // 监听节点点击事件
  graph.value.on('node:click', ({ node }) => {
    const data = node.getData();
    if (!data) return;

    // 点击折叠按钮区域：切换展开/收起
    const key = String(data.id);
    if (data.hasCollapsedChildren || expandedMap[key]) {
      expandedMap[key] = !expandedMap[key];
      if (props.treeData) {
        renderTree(props.treeData);
      }
      return;
    }

    emit('nodeClick', data);
  });

  // 监听节点双击事件（向后端请求展开）
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
    initExpandedState(newData);
    renderTree(newData);
  }
}, { deep: true });

// 渲染树形结构
async function renderTree(root: TreeNode) {
  if (!graph.value) return;

  graph.value.clearCells();

  const graphData = convertTreeToGraph(root);

  const layoutGraph = new LayoutGraph({
    nodes: graphData.nodes.map(n => ({
      id: n.id,
      data: { ...n.data, width: n.data.width, height: n.data.height },
    })),
    edges: graphData.edges.map((e, i) => ({
      id: `edge-${i}`,
      source: e.source,
      target: e.target,
      data: {},
    })),
  });

  // LR 布局，更像思维导图
  const layout = new DagreLayout({
    type: 'dagre',
    rankdir: 'LR',
    nodesep: 40,
    ranksep: 60,
  });

  const layoutResult = await layout.execute(layoutGraph);

  const nodes: any[] = [];
  const edges: any[] = [];

  layoutResult.nodes?.forEach((layoutNode: any) => {
    const originalNode = graphData.nodes.find((n: any) => n.id === layoutNode.id);
    if (originalNode) {
      nodes.push(createNode({
        ...originalNode.data,
        x: layoutNode.data.x,
        y: layoutNode.data.y,
      }));
    }
  });

  graphData.edges.forEach((edge: any) => {
    edges.push(createEdge(edge.source, edge.target, edge.depth));
  });

  graph.value.addNodes(nodes);
  graph.value.addEdges(edges);

  setTimeout(() => handleZoomFit(), 100);
}

// 将树形结构转换为图数据格式（只遍历展开的节点）
function convertTreeToGraph(root: TreeNode, depth = 0) {
  const nodes: any[] = [];
  const edges: any[] = [];

  function traverse(node: TreeNode, parent: TreeNode | null, depth: number) {
    const key = String(node.id);
    const isExpanded = expandedMap[key] !== false; // 默认展开
    const hasChildren = node.children && node.children.length > 0;
    const hasCollapsedChildren = hasChildren && !isExpanded;
    const collapsedCount = hasCollapsedChildren ? countCollapsedChildren(node) : 0;

    // 根据层级设置节点尺寸
    const sizeConfig = getNodeSize(node.nodeType, depth);

    nodes.push({
      id: key,
      data: {
        id: node.id,
        label: node.label,
        description: node.description,
        nodeType: node.nodeType,
        isExpandable: node.isExpandable,
        isExpanded: node.isExpanded,
        resources: node.resources,
        depth,
        hasCollapsedChildren,
        collapsedCount,
        ...sizeConfig,
      },
    });

    if (parent) {
      edges.push({
        source: String(parent.id),
        target: key,
        depth: depth - 1,
      });
    }

    // 只遍历展开的子节点
    if (hasChildren && isExpanded) {
      node.children!.forEach(child => traverse(child, node, depth + 1));
    }
  }

  traverse(root, null, 0);
  return { nodes, edges };
}

// 根据节点类型和深度获取尺寸
function getNodeSize(nodeType: string, depth: number) {
  if (nodeType === 'root' || depth === 0) {
    return { width: 220, height: 70 };
  }
  if (depth === 1) {
    return { width: 200, height: 60 };
  }
  if (depth === 2) {
    return { width: 180, height: 52 };
  }
  return { width: 160, height: 46 };
}

// 层级颜色配置
const levelColors = {
  root: { bg: 'linear-gradient(135deg, #1E3A5F, #2563EB)', border: '#1E3A5F', text: '#FFFFFF', fontSize: 16 },
  depth1: { bg: 'linear-gradient(135deg, #6D28D9, #8B5CF6)', border: '#6D28D9', text: '#FFFFFF', fontSize: 14 },
  depth2: { bg: 'linear-gradient(135deg, #059669, #10B981)', border: '#059669', text: '#FFFFFF', fontSize: 13 },
  depth3: { bg: 'linear-gradient(135deg, #0891B2, #22D3EE)', border: '#0891B2', text: '#FFFFFF', fontSize: 12 },
};

function getColorConfig(nodeType: string, depth: number) {
  if (nodeType === 'root' || depth === 0) return levelColors.root;
  if (depth === 1) return levelColors.depth1;
  if (depth === 2) return levelColors.depth2;
  return levelColors.depth3;
}

// 创建节点
function createNode(data: any) {
  const color = getColorConfig(data.nodeType, data.depth);
  const size = getNodeSize(data.nodeType, data.depth);

  // 构建标签文本
  let labelText = data.label;
  if (data.hasCollapsedChildren && data.collapsedCount > 0) {
    labelText += ` (+${data.collapsedCount})`;
  }

  // X6 不支持 CSS 渐变，使用纯色替代
  const bgColors: Record<string, string> = {
    root: '#1E40AF',
    depth1: '#7C3AED',
    depth2: '#059669',
    depth3: '#0891B2',
  };
  const colorKey = data.nodeType === 'root' || data.depth === 0 ? 'root' : `depth${data.depth}`;

  return {
    id: String(data.id),
    x: data.x,
    y: data.y,
    width: size.width,
    height: size.height,
    shape: 'rect',
    data: data,
    attrs: {
      body: {
        fill: bgColors[colorKey] || bgColors.depth3,
        stroke: color.border,
        strokeWidth: 0,
        rx: 12,
        ry: 12,
        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))',
      },
      label: {
        text: labelText,
        fill: color.text,
        fontSize: color.fontSize,
        fontWeight: data.depth === 0 ? 700 : 500,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textWrap: {
          width: size.width - 24,
          height: size.height - 16,
          ellipsis: true,
        },
      },
    },
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'text', selector: 'label' },
    ],
  };
}

// 创建边（颜色跟随父节点层级）
function createEdge(source: string, target: string, depth: number) {
  const edgeColors = ['#1E40AF', '#7C3AED', '#059669', '#0891B2'];
  const strokeColor = edgeColors[Math.min(depth, edgeColors.length - 1)];

  return {
    source: String(source),
    target: String(target),
    attrs: {
      line: {
        stroke: strokeColor,
        strokeWidth: 2,
        strokeOpacity: 0.6,
        targetMarker: null,
      },
    },
    connector: {
      name: 'smooth',
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
  graph.value?.zoomToFit({ padding: 40, maxScale: 1 });
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
  background: linear-gradient(135deg, #F0F4F8 0%, #E2E8F0 100%);
  border-radius: 12px;
  overflow: hidden;
}

.mindmap-canvas {
  width: 100%;
  height: 100%;
}
</style>
