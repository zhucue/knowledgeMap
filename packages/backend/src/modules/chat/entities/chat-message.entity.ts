import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ChatSessionEntity } from './chat-session.entity';

@Entity('chat_messages')
@Index('idx_session_created', ['sessionId', 'createdAt'])
export class ChatMessageEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'session_id' })
  sessionId: number;

  @Column({ type: 'enum', enum: ['user', 'assistant', 'system'] })
  role: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'context_node_id' })
  contextNodeId: number | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ChatSessionEntity, (session) => session.messages)
  @JoinColumn({ name: 'session_id' })
  session: ChatSessionEntity;
}
