import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicEntity } from './entities/topic.entity';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';

/**
 * 话题模块
 * 提供话题搜索、创建和热门话题查询功能
 */
@Module({
  imports: [TypeOrmModule.forFeature([TopicEntity])],
  controllers: [TopicController],
  providers: [TopicService],
  exports: [TopicService],
})
export class TopicModule {}
