import { GraphGenerationState, RagChunk } from '../state';
import { RetrievalService } from '../../../knowledge-base/services/retrieval.service';
import { KnowledgeBaseService } from '../../../knowledge-base/knowledge-base.service';

/**
 * RAG 检索节点
 * 用 topic + domain 做检索，带用户权限过滤
 * 返回 top 10 相关 chunks 写入 state.ragContext
 */
export async function retrieveContextNode(
  state: GraphGenerationState,
  retrievalService: RetrievalService,
  kbService: KnowledgeBaseService,
): Promise<Partial<GraphGenerationState>> {
  if (!state.userId) {
    return { ragContext: [], currentStep: 'retrieveContext' };
  }

  try {
    // 获取用户可访问的知识库
    const kbIds = await kbService.getAccessibleKbIds(state.userId);
    if (kbIds.length === 0) {
      return { ragContext: [], currentStep: 'retrieveContext' };
    }

    // 构建检索 query：主题 + 领域
    const query = state.analysis
      ? `${state.userInput} ${state.analysis.domain} ${state.analysis.scope}`
      : state.userInput;

    const results = await retrievalService.retrieve(query, kbIds, 10);

    const ragContext: RagChunk[] = results.map((r) => ({
      content: r.content,
      source: r.source,
      headingPath: r.headingPath,
      score: r.score,
    }));

    return { ragContext, currentStep: 'retrieveContext' };
  } catch {
    // 检索失败不阻塞主流程
    return { ragContext: [], currentStep: 'retrieveContext' };
  }
}
