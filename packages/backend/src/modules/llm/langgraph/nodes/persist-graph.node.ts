import { GraphService } from '../../../graph/graph.service';
import { TopicService } from '../../../topic/topic.service';
import { ResourceService } from '../../../resource/resource.service';
import {
  GraphGenerationState,
  TreeNode,
  ResourceMatch,
} from '../state';

// 持久化图谱节点：保存知识树到数据库
export async function persistGraphNode(
  state: GraphGenerationState,
  graphService: GraphService,
  topicService: TopicService,
  resourceService: ResourceService,
): Promise<Partial<GraphGenerationState>> {
  if (!state.treeData || !state.analysis) {
    return { error: 'No tree data to persist', currentStep: 'persistGraph' };
  }

  let graphId = state.graphId;

  if (!graphId) {
    const topic = await topicService.findOrCreate(
      state.userInput,
      state.analysis.domain,
    );
    await topicService.incrementSearchCount(topic.id);

    const graph = await graphService.createGraph({
      topicId: topic.id,
      title: state.treeData.label,
      summary: state.analysis.scope,
      status: 'generating',
      llmProvider: state.provider || 'openai',
      llmModel: '',
      createdBy: state.userId,
    });
    graphId = graph.id;
  }

  const { nodeCount, maxDepth } = await saveTreeNodes(
    graphService,
    graphId,
    state.treeData,
    null,
    0,
    state.parentNodeContext?.nodeId || null,
  );

  // Save resource associations
  if (state.resourceMatches.length > 0) {
    await saveResourceAssociations(
      graphService,
      graphId,
      state.resourceMatches,
    );
  }

  await graphService.updateGraphStatus(graphId, 'completed', nodeCount, maxDepth);

  return { graphId, currentStep: 'persistGraph' };
}

// 保存树节点到数据库的返回结果类型
interface SaveResult {
  nodeCount: number;
  maxDepth: number;
  nodeIdMap: Map<string, number>;
}

// 递归保存树节点
async function saveTreeNodes(
  graphService: GraphService,
  graphId: number,
  node: TreeNode,
  parentId: number | null,
  depth: number,
  expandParentId: number | null,
): Promise<SaveResult> {
  const isExpandRoot = depth === 0 && expandParentId !== null;
  const actualParentId = isExpandRoot ? expandParentId : parentId;

  // Skip saving the expand root itself (it already exists)
  if (isExpandRoot) {
    let totalCount = 0;
    let maxChildDepth = depth;
    const nodeIdMap = new Map<string, number>();

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childResult = await saveTreeNodes(
        graphService, graphId, child, expandParentId, depth + 1, null,
      );
      totalCount += childResult.nodeCount;
      maxChildDepth = Math.max(maxChildDepth, childResult.maxDepth);
      childResult.nodeIdMap.forEach((v, k) => nodeIdMap.set(k, v));
    }
    return { nodeCount: totalCount, maxDepth: maxChildDepth, nodeIdMap };
  }

  const savedNodes = await graphService.saveNodes([{
    graphId,
    parentId: actualParentId,
    nodeKey: node.key,
    label: node.label,
    description: node.description,
    nodeType: node.type,
    depthLevel: depth,
    sortOrder: 0,
    isExpandable: node.isExpandable,
    isExpanded: node.children.length > 0,
  }]);

  const savedNode = savedNodes[0];
  const nodeIdMap = new Map<string, number>();
  nodeIdMap.set(node.key, savedNode.id);

  let totalCount = 1;
  let maxChildDepth = depth;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const childResult = await saveTreeNodes(
      graphService, graphId, child, savedNode.id, depth + 1, null,
    );
    totalCount += childResult.nodeCount;
    maxChildDepth = Math.max(maxChildDepth, childResult.maxDepth);
    childResult.nodeIdMap.forEach((v, k) => nodeIdMap.set(k, v));
  }

  return { nodeCount: totalCount, maxDepth: maxChildDepth, nodeIdMap };
}

// 保存资源关联关系
async function saveResourceAssociations(
  graphService: GraphService,
  graphId: number,
  resourceMatches: ResourceMatch[],
): Promise<void> {
  // Get all nodes for this graph to map nodeKey -> nodeId
  const graph = await graphService.findById(graphId);
  if (!graph) return;

  const nodeKeyToId = new Map<string, number>();
  for (const node of graph.nodes) {
    nodeKeyToId.set(node.nodeKey, node.id);
  }

  for (const match of resourceMatches) {
    const nodeId = nodeKeyToId.get(match.nodeKey);
    if (!nodeId) continue;

    for (let i = 0; i < match.resources.length; i++) {
      const r = match.resources[i];
      await graphService.saveNodeResource({
        nodeId,
        resourceId: r.resourceId,
        relevanceScore: r.relevanceScore,
        isPrimary: i === 0,
      });
    }
  }
}
