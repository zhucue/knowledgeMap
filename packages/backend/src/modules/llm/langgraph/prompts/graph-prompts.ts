import { GenerationConfig, ParentNodeContext, RagChunk } from '../state';

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
  previousIssues?: string[],
  ragContext?: RagChunk[],
): string {
  if (parentContext) {
    return generateExpandPrompt(userInput, analysis, config, parentContext, previousIssues, ragContext);
  }

  let prompt = `你是一个知识结构化专家。请为以下主题生成知识结构树。

主题: "${userInput}"
领域: ${analysis.domain}
范围: ${analysis.scope}
难度: ${analysis.difficulty}

要求:
- 根节点为主题本身
- 第一层: 3-${Math.min(6, config.maxChildrenPerNode)} 个核心分支（type 为 "branch"）
- 第二层: 每个分支下 2-${Math.min(5, config.maxChildrenPerNode)} 个子知识点（type 为 "branch"）
- 第三层: 每个子知识点下 1-3 个具体要点（type 为 "leaf"）
- 总节点数不超过 40 个
- 每个节点的 description 需包含具体知识要点，不超过 100 字
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
      "description": "分支描述，包含该分支的核心概念和要点",
      "type": "branch",
      "isExpandable": true,
      "children": [
        {
          "key": "branch_1_1",
          "label": "子知识点名称",
          "description": "子知识点描述，包含具体知识要点",
          "type": "branch",
          "isExpandable": true,
          "children": [
            {
              "key": "leaf_1_1_1",
              "label": "具体要点名称",
              "description": "具体要点的详细说明，包含定义、原理或应用场景",
              "type": "leaf",
              "isExpandable": false,
              "children": []
            }
          ]
        }
      ]
    }
  ]
}

只返回 JSON，不要其他内容。`;

  // 注入 RAG 知识库参考资料
  if (ragContext?.length) {
    const refs = ragContext
      .map((r, i) => `[REF${i + 1}] 来源: ${r.source}${r.headingPath ? ` > ${r.headingPath}` : ''}\n${r.content}`)
      .join('\n\n');
    prompt += `\n\n以下是知识库中的参考资料，请参考这些内容来丰富节点描述，确保知识点准确：\n${refs}`;
  }

  if (previousIssues?.length) {
    prompt += `\n\n上一次生成存在以下问题，请修正：\n${previousIssues.map((i) => `- ${i}`).join('\n')}`;
  }

  return prompt;
}

// 构建节点扩展示意图提示词
function generateExpandPrompt(
  userInput: string,
  analysis: { domain: string; scope: string; difficulty: string },
  config: GenerationConfig,
  parentContext: ParentNodeContext,
  previousIssues?: string[],
  ragContext?: RagChunk[],
): string {
  const pathStr = parentContext.path.join(' → ');
  let prompt = `你是一个知识结构化专家。请为以下知识节点生成子知识结构。

原始主题: "${userInput}"
当前节点: "${parentContext.nodeLabel}"
节点描述: "${parentContext.nodeDescription}"
知识路径: ${pathStr}
领域: ${analysis.domain}

要求:
- 以 "${parentContext.nodeLabel}" 为根节点展开
- 第一层: 3-${Math.min(6, config.maxChildrenPerNode)} 个子分支
- 第二层: 每个分支下 2-${Math.min(5, config.maxChildrenPerNode)} 个子知识点
- 总节点数不超过 40 个
- 每个节点的 description 需包含具体知识要点，不超过 100 字

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

  // 注入 RAG 知识库参考资料
  if (ragContext?.length) {
    const refs = ragContext
      .map((r, i) => `[REF${i + 1}] 来源: ${r.source}${r.headingPath ? ` > ${r.headingPath}` : ''}\n${r.content}`)
      .join('\n\n');
    prompt += `\n\n以下是知识库中的参考资料，请参考这些内容来丰富节点描述：\n${refs}`;
  }

  if (previousIssues?.length) {
    prompt += `\n\n上一次生成存在以下问题，请修正：\n${previousIssues.map((i) => `- ${i}`).join('\n')}`;
  }

  return prompt;
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
