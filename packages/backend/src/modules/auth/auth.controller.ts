import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RegisterSchema, LoginSchema, RegisterInput, LoginInput } from '@knowledge-map/shared';

/**
 * 认证控制器
 * 处理用户注册和登录请求
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户注册
   * @param body 注册信息（用户名、邮箱、密码）
   */
  @Post('register')
  register(@Body(new ZodValidationPipe(RegisterSchema)) body: RegisterInput) {
    return this.authService.register(body);
  }

  /**
   * 用户登录
   * @param body 登录信息（邮箱、密码）
   * @returns JWT令牌和用户信息
   */
  @Post('login')
  login(@Body(new ZodValidationPipe(LoginSchema)) body: LoginInput) {
    return this.authService.login(body);
  }
}
