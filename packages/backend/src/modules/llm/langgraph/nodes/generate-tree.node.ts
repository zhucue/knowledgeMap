import { LlmService } from '../../llm.service';
import { GraphGenerationState, TreeNode } from '../state';
import { generateTreePrompt } from '../prompts/graph-prompts';

// 生成知识树节点：调用 LLM 生成树形结构
export async function generateTreeNode(
  state: GraphGenerationState,
  llmService: LlmService,
): Promise<Partial<GraphGenerationState>> {
  if (!state.analysis) {
    return { error: 'Analysis not available', currentStep: 'generateTree' };
  }

  const prompt = generateTreePrompt(
    state.userInput,
    state.analysis,
    state.config,
    state.parentNodeContext,
    state.validation?.issues,
  );

  const result = await llmService.chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, responseFormat: 'json', maxTokens: 4096 },
    state.provider,
  );

  try {
    const content = result.content.trim();
    const jsonStr = extractJson(content);
    const treeData: TreeNode = JSON.parse(jsonStr);
    return { treeData, currentStep: 'generateTree' };
  } catch {
    return {
      error: 'Failed to parse tree JSON from LLM response',
      currentStep: 'generateTree',
    };
  }
}

// 从 LLM 响应中提取 JSON 内容
function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1);
  }
  return text;
}
