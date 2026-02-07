import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeGraphEntity } from './entities/knowledge-graph.entity';
import { GraphNodeEntity } from './entities/graph-node.entity';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';
import { TopicModule } from '../topic/topic.module';

/**
 * 图谱模块
 * 提供知识图谱的创建、查询和节点管理功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([KnowledgeGraphEntity, GraphNodeEntity]),
    TopicModule,
  ],
  controllers: [GraphController],
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}
