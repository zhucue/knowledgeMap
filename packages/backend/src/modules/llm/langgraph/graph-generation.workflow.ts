import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../llm.service';
import { GraphService } from '../../graph/graph.service';
import { TopicService } from '../../topic/topic.service';
import { ResourceService } from '../../resource/resource.service';
import {
  GraphGenerationState,
  DEFAULT_CONFIG,
  ParentNodeContext,
  GenerationConfig,
} from './state';
import { analyzeInputNode } from './nodes/analyze-input.node';
import { generateTreeNode } from './nodes/generate-tree.node';
import { matchResourcesNode } from './nodes/match-resources.node';
import { validateTreeNode } from './nodes/validate-tree.node';
import { persistGraphNode } from './nodes/persist-graph.node';

// 进度回调函数类型
export interface SSECallback {
  (event: {
    step: string;
    progress: number;
    message: string;
    data?: any;
  }): void;
}

// 知识图谱生成工作流服务
@Injectable()
export class GraphGenerationWorkflow {
  private readonly logger = new Logger(GraphGenerationWorkflow.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly graphService: GraphService,
    private readonly topicService: TopicService,
    private readonly resourceService: ResourceService,
  ) {}

  // 执行图谱生成工作流
  async run(
    userInput: string,
    options: {
      userId?: number;
      provider?: string;
      config?: Partial<GenerationConfig>;
      parentNodeContext?: ParentNodeContext;
      graphId?: number;
      onProgress?: SSECallback;
    } = {},
  ): Promise<{ graphId: number; state: GraphGenerationState }> {
    const config: GenerationConfig = {
      ...DEFAULT_CONFIG,
      ...options.config,
    };

    let state: GraphGenerationState = {
      userInput,
      parentNodeContext: options.parentNodeContext || null,
      config,
      graphId: options.graphId || null,
      userId: options.userId || null,
      provider: options.provider,
      analysis: null,
      treeData: null,
      resourceMatches: [],
      validation: null,
      retryCount: 0,
      currentStep: 'init',
      error: null,
    };

    const emit = options.onProgress || (() => {});

    try {
      // Step 1: 分析输入
      emit({ step: 'analyzeInput', progress: 15, message: '分析知识领域...' });
      const analyzeResult = await analyzeInputNode(state, this.llmService);
      state = { ...state, ...analyzeResult };
      this.logger.log(`Analysis: ${JSON.stringify(state.analysis)}`);

      // Step 2 & 3: 生成 + 验证（支持重试）
      let retries = 0;
      const maxRetries = 2;

      while (retries <= maxRetries) {
        // Step 2: 生成知识树
        emit({
          step: 'generateTree',
          progress: 30 + retries * 5,
          message: retries > 0 ? '重新生成知识结构...' : '生成知识结构...',
        });
        const treeResult = await generateTreeNode(state, this.llmService);
        state = { ...state, ...treeResult };

        if (state.error) {
          retries++;
          state.error = null;
          continue;
        }

        // Step 3: 验证
        emit({ step: 'validateTree', progress: 55, message: '校验图谱质量...' });
        const validateResult = validateTreeNode(state);
        state = { ...state, ...validateResult };

        if (state.validation?.isValid) break;

        this.logger.warn(
          `Validation failed (attempt ${retries + 1}): ${state.validation?.issues.join(', ')}`,
        );
        retries++;
        state.retryCount = retries;
      }

      if (!state.validation?.isValid) {
        this.logger.warn('Validation failed after retries, proceeding anyway');
      }

      // Step 4: 匹配资源
      emit({ step: 'matchResources', progress: 70, message: '匹配学习资源...' });
      const resourceResult = await matchResourcesNode(
        state, this.llmService, this.resourceService,
      );
      state = { ...state, ...resourceResult };

      // Step 5: 持久化保存
      emit({ step: 'persistGraph', progress: 90, message: '保存图谱...' });
      const persistResult = await persistGraphNode(
        state, this.graphService, this.topicService, this.resourceService,
      );
      state = { ...state, ...persistResult };

      emit({
        step: 'complete',
        progress: 100,
        message: '图谱生成完成',
        data: { graphId: state.graphId },
      });

      return { graphId: state.graphId!, state };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Workflow failed: ${errMsg}`);

      if (state.graphId) {
        await this.graphService.updateGraphStatus(state.graphId, 'failed');
      }

      emit({ step: 'error', progress: 0, message: `生成失败: ${errMsg}` });
      throw error;
    }
  }
}
