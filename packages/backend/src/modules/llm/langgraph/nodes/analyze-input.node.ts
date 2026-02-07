import { LlmService } from '../../llm.service';
import { GraphGenerationState } from '../state';
import { analyzeInputPrompt } from '../prompts/graph-prompts';

// 分析输入节点：识别知识领域、范围和难度
export async function analyzeInputNode(
  state: GraphGenerationState,
  llmService: LlmService,
): Promise<Partial<GraphGenerationState>> {
  const prompt = analyzeInputPrompt(state.userInput);

  const result = await llmService.chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.3, responseFormat: 'json' },
    state.provider,
  );

  try {
    const analysis = JSON.parse(result.content);
    return {
      analysis: {
        domain: analysis.domain || '通用',
        scope: analysis.scope || state.userInput,
        difficulty: analysis.difficulty || 'intermediate',
      },
      currentStep: 'analyzeInput',
    };
  } catch {
    return {
      analysis: {
        domain: '通用',
        scope: state.userInput,
        difficulty: 'intermediate',
      },
      currentStep: 'analyzeInput',
    };
  }
}
