import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { UserService } from './modules/user/user.service';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalInterceptors(new TransformInterceptor());

  // 初始化默认账号
  try {
    const userService = app.get(UserService);
    const defaultEmail = 'admin@knowledge.com';
    const existing = await userService.findByEmail(defaultEmail);
    if (!existing) {
      const passwordHash = await bcrypt.hash('123456', 10);
      await userService.create({
        username: 'admin_default',
        email: defaultEmail,
        passwordHash,
      });
      console.log('默认账号已创建: admin@knowledge.com / 123456');
    }
  } catch (e) {
    console.log('默认账号已存在，跳过创建');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}
bootstrap();
