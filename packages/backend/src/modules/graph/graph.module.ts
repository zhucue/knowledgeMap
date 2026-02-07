import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeGraphEntity } from './entities/knowledge-graph.entity';
import { GraphNodeEntity } from './entities/graph-node.entity';
import { NodeResourceEntity } from '../resource/entities/node-resource.entity';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';
import { TopicModule } from '../topic/topic.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KnowledgeGraphEntity,
      GraphNodeEntity,
      NodeResourceEntity,
    ]),
    TopicModule,
    forwardRef(() => LlmModule),
  ],
  controllers: [GraphController],
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}
