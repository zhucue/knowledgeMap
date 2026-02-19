import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 当前用户参数装饰器
 * 从 request 中提取经 JWT 验证后的用户信息
 * @example @CurrentUser() user: { userId: number; email: string }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
