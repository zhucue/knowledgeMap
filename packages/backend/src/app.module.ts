import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { TopicModule } from './modules/topic/topic.module';
import { GraphModule } from './modules/graph/graph.module';
import { ChatModule } from './modules/chat/chat.module';
import { ResourceModule } from './modules/resource/resource.module';
import { LlmModule } from './modules/llm/llm.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_DATABASE', 'knowledge_map'),
        charset: 'utf8mb4',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    UserModule,
    TopicModule,
    GraphModule,
    ChatModule,
    ResourceModule,
    LlmModule,
    KnowledgeBaseModule,
  ],
})
export class AppModule {}
