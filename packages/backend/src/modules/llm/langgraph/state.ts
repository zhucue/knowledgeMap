import { Annotation } from '@langchain/langgraph';

// 知识图谱树形节点结构
export interface TreeNode {
  key: string;
  label: string;
  description: string;
  type: 'root' | 'branch' | 'leaf';
  isExpandable: boolean;
  children: TreeNode[];
}

// 输入分析结果
export interface AnalysisResult {
  domain: string;
  scope: string;
  difficulty: string;
}

// 资源匹配结果
export interface ResourceMatch {
  nodeKey: string;
  resources: { resourceId: number; relevanceScore: number }[];
}

// 验证结果
export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

// 父节点上下文（用于扩展示意图）
export interface ParentNodeContext {
  nodeId: number;
  nodeLabel: string;
  nodeDescription: string;
  path: string[];
}

// 生成配置参数
export interface GenerationConfig {
  maxChildrenPerNode: number;
  generateDepth: number;
  maxTotalDepth: number;
}

// LangGraph 状态定义
export const GraphGenerationAnnotation = Annotation.Root({
  // 输入
  userInput: Annotation<string>,
  parentNodeContext: Annotation<ParentNodeContext | null>,
  config: Annotation<GenerationConfig>,
  graphId: Annotation<number | null>,
  userId: Annotation<number | null>,
  provider: Annotation<string | undefined>,

  // 阶段产物
  analysis: Annotation<AnalysisResult | null>,
  treeData: Annotation<TreeNode | null>,
  resourceMatches: Annotation<ResourceMatch[]>,
  validation: Annotation<ValidationResult | null>,

  // 控制
  retryCount: Annotation<number>,
  currentStep: Annotation<string>,
  error: Annotation<string | null>,
});

export type GraphGenerationState = typeof GraphGenerationAnnotation.State;

// 默认配置
export const DEFAULT_CONFIG: GenerationConfig = {
  maxChildrenPerNode: 8,
  generateDepth: 2,
  maxTotalDepth: 4,
};
