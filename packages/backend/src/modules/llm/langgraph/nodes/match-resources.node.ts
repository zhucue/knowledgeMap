import { LlmService } from '../../llm.service';
import { ResourceService } from '../../../resource/resource.service';
import {
  GraphGenerationState,
  TreeNode,
  ResourceMatch,
} from '../state';
import { matchResourcesPrompt } from '../prompts/graph-prompts';

// 匹配资源节点：为每个知识点匹配相关学习资源
export async function matchResourcesNode(
  state: GraphGenerationState,
  llmService: LlmService,
  resourceService: ResourceService,
): Promise<Partial<GraphGenerationState>> {
  if (!state.treeData || !state.analysis) {
    return { resourceMatches: [], currentStep: 'matchResources' };
  }

  const allNodes = flattenTree(state.treeData);
  const domain = state.analysis.domain;
  const resourceMatches: ResourceMatch[] = [];

  for (const node of allNodes) {
    const tags = node.label.split(/[,，、\s]+/).filter(Boolean);
    const candidates = await resourceService.findByTags(tags, domain);

    if (candidates.length === 0) continue;

    const candidateList = candidates.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description || '',
    }));

    const prompt = matchResourcesPrompt(
      node.label,
      node.description,
      candidateList,
    );

    try {
      const result = await llmService.chatCompletion(
        [{ role: 'user', content: prompt }],
        { temperature: 0.2, responseFormat: 'json' },
        state.provider,
      );

      const parsed = JSON.parse(result.content);
      const matches = (parsed.matches || [])
        .filter((m: any) => m.relevanceScore >= 0.3)
        .slice(0, 3);

      if (matches.length > 0) {
        resourceMatches.push({ nodeKey: node.key, resources: matches });
      }
    } catch {
      // Skip this node if matching fails
    }
  }

  return { resourceMatches, currentStep: 'matchResources' };
}

// 将树形结构扁平化为节点列表
function flattenTree(node: TreeNode): TreeNode[] {
  const result: TreeNode[] = [node];
  for (const child of node.children) {
    result.push(...flattenTree(child));
  }
  return result;
}
