import { Module, forwardRef } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmController } from './llm.controller';
import { GraphGenerationWorkflow } from './langgraph/graph-generation.workflow';
import { GraphModule } from '../graph/graph.module';
import { TopicModule } from '../topic/topic.module';
import { ResourceModule } from '../resource/resource.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';

@Module({
  imports: [
    forwardRef(() => GraphModule),
    TopicModule,
    ResourceModule,
    KnowledgeBaseModule,
  ],
  controllers: [LlmController],
  providers: [LlmService, GraphGenerationWorkflow],
  exports: [LlmService, GraphGenerationWorkflow],
})
export class LlmModule {}
