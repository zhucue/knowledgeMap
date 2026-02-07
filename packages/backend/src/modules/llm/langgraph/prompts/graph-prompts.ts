import { GenerationConfig, ParentNodeContext } from '../state';

// 构建输入分析提示词
export function analyzeInputPrompt(userInput: string): string {
  return `你是一个知识领域分析专家。请分析以下用户输入的知识主题，返回 JSON 格式结果。

用户输入: "${userInput}"

请返回严格 JSON 格式:
{
  "domain": "知识领域 (如: 计算机科学、数学、物理学等)",
  "scope": "主题范围描述 (一句话概括)",
  "difficulty": "难度级别 (beginner/intermediate/advanced)"
}

只返回 JSON，不要其他内容。`;
}

// 构建知识树生成提示词
export function generateTreePrompt(
  userInput: string,
  analysis: { domain: string; scope: string; difficulty: string },
  config: GenerationConfig,
  parentContext?: ParentNodeContext | null,
): string {
  if (parentContext) {
    return generateExpandPrompt(userInput, analysis, config, parentContext);
  }

  return `你是一个知识结构化专家。请为以下主题生成知识结构树。

主题: "${userInput}"
领域: ${analysis.domain}
范围: ${analysis.scope}
难度: ${analysis.difficulty}

要求:
- 根节点为主题本身
- 第一层: 3-${Math.min(6, config.maxChildrenPerNode)} 个核心分支
- 第二层: 每个分支下 2-${Math.min(5, config.maxChildrenPerNode)} 个子知识点
- 总节点数不超过 25 个
- 每个节点的 description 不超过 50 字
- isExpandable 表示该节点是否值得继续深入展开

请返回严格 JSON 格式:
{
  "key": "root",
  "label": "主题名称",
  "description": "主题简要描述",
  "type": "root",
  "isExpandable": true,
  "children": [
    {
      "key": "branch_1",
      "label": "分支名称",
      "description": "分支描述",
      "type": "branch",
      "isExpandable": true,
      "children": [
        {
          "key": "leaf_1_1",
          "label": "知识点名称",
          "description": "知识点描述",
          "type": "leaf",
          "isExpandable": true,
          "children": []
        }
      ]
    }
  ]
}

只返回 JSON，不要其他内容。`;
}

// 构建节点扩展示意图提示词
function generateExpandPrompt(
  userInput: string,
  analysis: { domain: string; scope: string; difficulty: string },
  config: GenerationConfig,
  parentContext: ParentNodeContext,
): string {
  const pathStr = parentContext.path.join(' → ');
  return `你是一个知识结构化专家。请为以下知识节点生成子知识结构。

原始主题: "${userInput}"
当前节点: "${parentContext.nodeLabel}"
节点描述: "${parentContext.nodeDescription}"
知识路径: ${pathStr}
领域: ${analysis.domain}

要求:
- 以 "${parentContext.nodeLabel}" 为根节点展开
- 第一层: 3-${Math.min(6, config.maxChildrenPerNode)} 个子分支
- 第二层: 每个分支下 2-${Math.min(5, config.maxChildrenPerNode)} 个子知识点
- 总节点数不超过 25 个
- 每个节点的 description 不超过 50 字
- isExpandable: 当前路径深度已达 ${parentContext.path.length} 层，最大 ${config.maxTotalDepth} 层

请返回严格 JSON 格式:
{
  "key": "expand_root",
  "label": "${parentContext.nodeLabel}",
  "description": "节点描述",
  "type": "branch",
  "isExpandable": true,
  "children": [...]
}

只返回 JSON，不要其他内容。`;
}

// 构建资源匹配提示词
export function matchResourcesPrompt(
  nodeLabel: string,
  nodeDescription: string,
  candidateResources: { id: number; title: string; description: string }[],
): string {
  const resourceList = candidateResources
    .map(
      (r) => `  - ID: ${r.id}, 标题: "${r.title}", 描述: "${r.description}"`,
    )
    .join('\n');

  return `你是一个教育资源匹配专家。请评估以下学习资源与知识点的相关度。

知识点: "${nodeLabel}"
描述: "${nodeDescription}"

候选资源:
${resourceList}

请为每个资源评估相关度 (0-1)，返回 JSON 格式:
{
  "matches": [
    { "resourceId": 1, "relevanceScore": 0.85 }
  ]
}

只返回相关度 >= 0.3 的资源，按相关度降序排列，最多返回 3 个。
只返回 JSON，不要其他内容。`;
}
