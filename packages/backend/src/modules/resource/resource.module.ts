import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourceEntity } from './entities/resource.entity';
import { NodeResourceEntity } from './entities/node-resource.entity';
import { ResourceBrowseHistoryEntity } from './entities/resource-browse-history.entity';
import { ResourceController } from './resource.controller';
import { ResourceService } from './resource.service';

/**
 * 资源模块
 * 提供资源查询、搜索、浏览历史记录功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ResourceEntity, NodeResourceEntity, ResourceBrowseHistoryEntity]),
  ],
  controllers: [ResourceController],
  providers: [ResourceService],
  exports: [ResourceService],
})
export class ResourceModule {}
