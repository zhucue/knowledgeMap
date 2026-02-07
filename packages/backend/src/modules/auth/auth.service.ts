import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';

/**
 * 认证服务
 * 处理用户注册、登录和JWT令牌生成
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 用户注册
   * @param data 注册信息（用户名、邮箱、密码）
   * @returns 用户信息（不含密码）
   * @throws ConflictException 邮箱已被注册时抛出
   */
  async register(data: { username: string; email: string; password: string }) {
    const existing = await this.userService.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.userService.create({
      username: data.username,
      email: data.email,
      passwordHash,
    });
    return { id: user.id, username: user.username, email: user.email };
  }

  /**
   * 用户登录
   * @param data 登录信息（邮箱、密码）
   * @returns JWT令牌和用户信息
   * @throws UnauthorizedException 凭据无效时抛出
   */
  async login(data: { email: string; password: string }) {
    const user = await this.userService.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { accessToken: token, user: { id: user.id, username: user.username, email: user.email } };
  }
}
