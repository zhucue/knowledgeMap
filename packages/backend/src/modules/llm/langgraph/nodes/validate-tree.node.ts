import { GraphGenerationState, TreeNode, ValidationResult } from '../state';

// 验证知识树节点：检查节点数量、深度和结构合规性
export function validateTreeNode(
  state: GraphGenerationState,
): Partial<GraphGenerationState> {
  if (!state.treeData) {
    return {
      validation: { isValid: false, issues: ['No tree data generated'] },
      currentStep: 'validateTree',
    };
  }

  const issues: string[] = [];
  const { nodeCount, maxDepth } = countTree(state.treeData);

  if (nodeCount > 50) {
    issues.push(`Node count ${nodeCount} exceeds limit of 50`);
  }
  if (nodeCount < 3) {
    issues.push(`Node count ${nodeCount} is too small (min 3)`);
  }
  if (maxDepth > state.config.generateDepth + 1) {
    issues.push(
      `Tree depth ${maxDepth} exceeds generate depth ${state.config.generateDepth}`,
    );
  }

  validateChildren(state.treeData, state.config.maxChildrenPerNode, issues);

  if (!state.treeData.label || state.treeData.label.trim() === '') {
    issues.push('Root node has no label');
  }

  const validation: ValidationResult = {
    isValid: issues.length === 0,
    issues,
  };

  return { validation, currentStep: 'validateTree' };
}

// 统计树的节点数量和最大深度
function countTree(node: TreeNode): { nodeCount: number; maxDepth: number } {
  let count = 1;
  let depth = 1;
  for (const child of node.children) {
    const sub = countTree(child);
    count += sub.nodeCount;
    depth = Math.max(depth, sub.maxDepth + 1);
  }
  return { nodeCount: count, maxDepth: depth };
}

// 递归验证子节点数量
function validateChildren(
  node: TreeNode,
  maxChildren: number,
  issues: string[],
): void {
  if (node.children.length > maxChildren) {
    issues.push(
      `Node "${node.label}" has ${node.children.length} children (max ${maxChildren})`,
    );
  }
  for (const child of node.children) {
    if (!child.label || child.label.trim() === '') {
      issues.push(`Child node with key "${child.key}" has no label`);
    }
    validateChildren(child, maxChildren, issues);
  }
}
