import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/** JWT 载荷类型 */
export interface JwtPayload {
  sub: number;
  email: string;
}

/**
 * Passport JWT 策略
 * 从 Authorization Bearer token 中提取并验证 JWT
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'default_secret'),
    });
  }

  /** 验证通过后将 payload 挂载到 request.user */
  validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email };
  }
}
