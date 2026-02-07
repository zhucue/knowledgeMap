import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { TopicEntity } from './entities/topic.entity';

/**
 * 话题服务
 * 处理话题的创建、搜索和热度统计
 */
@Injectable()
export class TopicService {
  /**
   * 构造函数
   * @param topicRepo 话题仓库
   */
  constructor(
    @InjectRepository(TopicEntity)
    private readonly topicRepo: Repository<TopicEntity>,
  ) {}

  /**
   * 查找或创建话题
   * 将话题名称规范化后查找，不存在则创建
   * @param name 话题名称
   * @param domain 所属领域（可选）
   * @returns 话题实体
   */
  async findOrCreate(name: string, domain?: string): Promise<TopicEntity> {
    const normalizedName = name.trim().toLowerCase().replace(/\s+/g, '');
    let topic = await this.topicRepo.findOne({ where: { normalizedName } });
    if (!topic) {
      topic = this.topicRepo.create({ name, normalizedName, domain });
      topic = await this.topicRepo.save(topic);
    }
    return topic;
  }

  /**
   * 增加话题搜索次数
   * @param id 话题ID
   */
  async incrementSearchCount(id: number) {
    await this.topicRepo.increment({ id }, 'searchCount', 1);
  }

  /**
   * 根据关键词搜索话题
   * @param keyword 搜索关键词
   * @returns 按搜索热度排序的话题列表（最多20条）
   */
  async search(keyword: string) {
    return this.topicRepo.find({
      where: { name: Like(`%${keyword}%`) },
      order: { searchCount: 'DESC' },
      take: 20,
    });
  }

  /**
   * 获取热门话题
   * @param limit 返回数量限制（默认10）
   * @returns 按搜索热度排序的热门话题列表
   */
  async getHot(limit = 10) {
    return this.topicRepo.find({
      order: { searchCount: 'DESC' },
      take: limit,
    });
  }
}
