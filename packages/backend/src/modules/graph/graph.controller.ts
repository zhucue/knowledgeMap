import { Controller, Get, Param, Query } from '@nestjs/common';
import { GraphService } from './graph.service';

/**
 * 图谱控制器
 * 处理知识图谱查询和历史记录请求
 */
@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  /**
   * 根据ID获取图谱详情
   * @param id 图谱ID
   * @returns 包含节点和关联资源的完整图谱数据
   */
  @Get(':id')
  getGraph(@Param('id') id: string) {
    return this.graphService.findById(parseInt(id, 10));
  }

  /**
   * 获取用户的图谱历史记录
   * @param userId 用户ID
   * @param page 页码（可选，默认1）
   * @param pageSize 每页大小（可选，默认20）
   * @returns 分页的图谱历史列表
   */
  @Get('history')
  getHistory(
    @Query('userId') userId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.graphService.findByUserId(
      parseInt(userId, 10),
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }
}
