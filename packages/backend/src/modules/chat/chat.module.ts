import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSessionEntity } from './entities/chat-session.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

/**
 * 聊天模块
 * 提供会话管理和消息收发功能
 */
@Module({
  imports: [TypeOrmModule.forFeature([ChatSessionEntity, ChatMessageEntity])],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
