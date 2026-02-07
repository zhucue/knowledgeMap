import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeGraphEntity } from './entities/knowledge-graph.entity';
import { GraphNodeEntity } from './entities/graph-node.entity';
import { NodeResourceEntity } from '../resource/entities/node-resource.entity';

/**
 * 图谱服务
 * 处理知识图谱的增删改查和节点操作
 */
@Injectable()
export class GraphService {
  /**
   * 构造函数
   * @param graphRepo 知识图谱仓库
   * @param nodeRepo 图谱节点仓库
   */
  constructor(
    @InjectRepository(KnowledgeGraphEntity)
    private readonly graphRepo: Repository<KnowledgeGraphEntity>,
    @InjectRepository(GraphNodeEntity)
    private readonly nodeRepo: Repository<GraphNodeEntity>,
    @InjectRepository(NodeResourceEntity)
    private readonly nodeResourceRepo: Repository<NodeResourceEntity>,
  ) {}

  /**
   * 根据ID查找图谱
   * @param id 图谱ID
   * @returns 包含话题和节点关联数据的图谱实体
   */
  async findById(id: number) {
    return this.graphRepo.findOne({
      where: { id },
      relations: ['topic', 'nodes', 'nodes.nodeResources', 'nodes.nodeResources.resource'],
    });
  }

  /**
   * 查询用户的图谱历史
   * @param userId 用户ID
   * @param page 页码（默认1）
   * @param pageSize 每页大小（默认20）
   * @returns 分页的图谱列表
   */
  async findByUserId(userId: number, page = 1, pageSize = 20) {
    const [items, total] = await this.graphRepo.findAndCount({
      where: { createdBy: userId },
      relations: ['topic'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * 创建新图谱
   * @param data 图谱数据（部分字段）
   * @returns 创建的图谱实体
   */
  async createGraph(data: Partial<KnowledgeGraphEntity>) {
    const graph = this.graphRepo.create(data);
    return this.graphRepo.save(graph);
  }

  /**
   * 更新图谱状态信息
   * @param id 图谱ID
   * @param status 生成状态
   * @param nodeCount 节点数量（可选）
   * @param maxDepth 最大深度（可选）
   */
  async updateGraphStatus(id: number, status: string, nodeCount?: number, maxDepth?: number) {
    const update: any = { status };
    if (nodeCount !== undefined) update.nodeCount = nodeCount;
    if (maxDepth !== undefined) update.maxDepth = maxDepth;
    await this.graphRepo.update(id, update);
  }

  /**
   * 批量保存图谱节点
   * @param nodes 节点数据数组
   * @returns 保存的节点实体数组
   */
  async saveNodes(nodes: Partial<GraphNodeEntity>[]) {
    const entities = this.nodeRepo.create(nodes);
    return this.nodeRepo.save(entities);
  }

  /**
   * 获取节点及其完整路径
   * 从指定节点向上遍历到根节点，构建完整路径
   * @param nodeId 节点ID
   * @returns 节点实体和路径标签数组
   * @throws Error 节点不存在时抛出
   */
  async getNodeWithPath(nodeId: number): Promise<{ node: GraphNodeEntity; path: string[] }> {
    const node = await this.nodeRepo.findOne({ where: { id: nodeId } });
    if (!node) throw new Error('Node not found');

    const path: string[] = [node.label];
    let current: GraphNodeEntity | null = node;
    while (current.parentId) {
      current = await this.nodeRepo.findOne({ where: { id: current.parentId } });
      if (current) path.unshift(current.label);
      else break;
    }
    return { node, path };
  }

  async saveNodeResource(data: Partial<NodeResourceEntity>) {
    const entity = this.nodeResourceRepo.create(data);
    return this.nodeResourceRepo.save(entity);
  }

  async findNodesByGraphId(graphId: number) {
    return this.nodeRepo.find({
      where: { graphId },
      order: { depthLevel: 'ASC', sortOrder: 'ASC' },
    });
  }
}
