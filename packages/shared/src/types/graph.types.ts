import { NodeType } from '../constants';

export interface TreeNodeData {
  key: string;
  label: string;
  description: string;
  type: NodeType;
  isExpandable: boolean;
  children: TreeNodeData[];
}

export interface GraphNodeData {
  id: number;
  graphId: number;
  parentId: number | null;
  nodeKey: string;
  label: string;
  description: string;
  nodeType: NodeType;
  depthLevel: number;
  sortOrder: number;
  isExpandable: boolean;
  isExpanded: boolean;
  metadata: Record<string, unknown> | null;
  resources?: ResourceBrief[];
}

export interface ResourceBrief {
  id: number;
  title: string;
  url: string;
  resourceType: string;
  relevanceScore: number;
}

export interface GraphData {
  id: number;
  topicId: number;
  title: string;
  summary: string | null;
  status: string;
  nodeCount: number;
  maxDepth: number;
  nodes: GraphNodeData[];
}

export interface GraphSummary {
  id: number;
  title: string;
  topicName: string;
  status: string;
  nodeCount: number;
  createdAt: string;
}

export interface ExpandResult {
  parentNodeId: number;
  newNodes: GraphNodeData[];
}
