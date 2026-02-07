import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { ResourceEntity } from './entities/resource.entity';
import { NodeResourceEntity } from './entities/node-resource.entity';
import { ResourceBrowseHistoryEntity } from './entities/resource-browse-history.entity';

/**
 * 资源服务
 * 处理资源的查询、搜索、浏览历史记录
 */
@Injectable()
export class ResourceService {
  /**
   * 构造函数
   * @param resourceRepo 资源仓库
   * @param nodeResourceRepo 节点-资源关联仓库
   * @param browseHistoryRepo 浏览历史仓库
   */
  constructor(
    @InjectRepository(ResourceEntity)
    private readonly resourceRepo: Repository<ResourceEntity>,
    @InjectRepository(NodeResourceEntity)
    private readonly nodeResourceRepo: Repository<NodeResourceEntity>,
    @InjectRepository(ResourceBrowseHistoryEntity)
    private readonly browseHistoryRepo: Repository<ResourceBrowseHistoryEntity>,
  ) {}

  /**
   * 获取资源列表（分页）
   * @param page 页码（默认1）
   * @param pageSize 每页大小（默认20）
   * @param domain 领域筛选（可选）
   * @param resourceType 资源类型筛选（可选）
   * @returns 分页的资源列表（按质量评分排序）
   */
  async findAll(page = 1, pageSize = 20, domain?: string, resourceType?: string) {
    const where: any = {};
    if (domain) where.domain = domain;
    if (resourceType) where.resourceType = resourceType;

    const [items, total] = await this.resourceRepo.findAndCount({
      where,
      order: { qualityScore: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * 根据关键词搜索资源
   * @param keyword 搜索关键词
   * @param domain 领域筛选（可选）
   * @returns 匹配的资源列表（最多20条）
   */
  async search(keyword: string, domain?: string) {
    const qb = this.resourceRepo.createQueryBuilder('r');
    qb.where('r.title LIKE :kw OR r.description LIKE :kw', { kw: `%${keyword}%` });
    if (domain) qb.andWhere('r.domain = :domain', { domain });
    qb.orderBy('r.quality_score', 'DESC').take(20);
    return qb.getMany();
  }

  /**
   * 根据标签查找资源
   * 使用 JSON_CONTAINS 查询标签匹配
   * @param tags 标签数组
   * @param domain 所属领域
   * @returns 匹配的资源列表（最多10条）
   */
  async findByTags(tags: string[], domain: string) {
    const qb = this.resourceRepo.createQueryBuilder('r');
    qb.where('r.domain = :domain', { domain });
    if (tags.length > 0) {
      const conditions = tags.map((_, i) => `JSON_CONTAINS(r.tags, :tag${i})`);
      tags.forEach((tag, i) => qb.setParameter(`tag${i}`, JSON.stringify(tag)));
      qb.andWhere(`(${conditions.join(' OR ')})`);
    }
    qb.orderBy('r.quality_score', 'DESC').take(10);
    return qb.getMany();
  }

  /**
   * 创建新资源
   * @param data 资源数据
   * @returns 创建的资源实体
   */
  async create(data: Partial<ResourceEntity>) {
    const resource = this.resourceRepo.create(data);
    return this.resourceRepo.save(resource);
  }

  /**
   * 获取节点关联的资源
   * @param nodeId 节点ID
   * @returns 该节点关联的资源列表（含相关度分数和是否主要资源标记）
   */
  async getByNodeId(nodeId: number) {
    const nodeResources = await this.nodeResourceRepo.find({
      where: { nodeId },
      relations: ['resource'],
      order: { relevanceScore: 'DESC' },
    });
    return nodeResources.map((nr) => ({
      ...nr.resource,
      relevanceScore: nr.relevanceScore,
      isPrimary: nr.isPrimary,
    }));
  }

  /**
   * 记录资源浏览历史
   * @param userId 用户ID
   * @param resourceId 资源ID
   * @param graphNodeId 图谱节点ID（可选）
   * @returns 浏览记录实体
   */
  async recordBrowse(userId: number, resourceId: number, graphNodeId?: number) {
    const record = this.browseHistoryRepo.create({
      userId,
      resourceId,
      graphNodeId: graphNodeId || null,
    });
    return this.browseHistoryRepo.save(record);
  }

  /**
   * 获取用户的浏览历史
   * @param userId 用户ID
   * @param page 页码（默认1）
   * @param pageSize 每页大小（默认20）
   * @returns 分页的浏览历史列表
   */
  async getBrowseHistory(userId: number, page = 1, pageSize = 20) {
    const [items, total] = await this.browseHistoryRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}
