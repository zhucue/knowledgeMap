import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 认证守卫
 * 使用 @UseGuards(JwtAuthGuard) 保护需要登录的接口
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
