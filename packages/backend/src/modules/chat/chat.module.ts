import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSessionEntity } from './entities/chat-session.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LlmModule } from '../llm/llm.module';
import { GraphModule } from '../graph/graph.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';

/**
 * 聊天模块
 * 提供会话管理和消息收发功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSessionEntity, ChatMessageEntity]),
    LlmModule,
    GraphModule,
    KnowledgeBaseModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
