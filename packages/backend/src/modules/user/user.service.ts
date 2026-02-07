import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

/**
 * 用户服务
 * 处理用户数据的增删改查操作
 */
@Injectable()
export class UserService {
  /**
   * 构造函数
   * @param userRepo 用户仓库
   */
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * 根据邮箱查找用户
   * @param email 用户邮箱
   * @returns 用户实体或null
   */
  async findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }

  /**
   * 根据ID查找用户
   * @param id 用户ID
   * @returns 用户实体或null
   */
  async findById(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  /**
   * 创建新用户
   * @param data 用户信息（用户名、邮箱、密码哈希）
   * @returns 创建的用户实体
   */
  async create(data: { username: string; email: string; passwordHash: string }) {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }
}
