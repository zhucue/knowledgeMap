import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { KnowledgeGraphEntity } from '../../graph/entities/knowledge-graph.entity';
import { ChatMessageEntity } from './chat-message.entity';

@Entity('chat_sessions')
export class ChatSessionEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'graph_id' })
  graphId: number | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'enum', enum: ['active', 'archived'], default: 'active' })
  status: string;

  @Column({ type: 'int', unsigned: true, default: 0, name: 'message_count' })
  messageCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => KnowledgeGraphEntity, { nullable: true })
  @JoinColumn({ name: 'graph_id' })
  graph: KnowledgeGraphEntity | null;

  @OneToMany(() => ChatMessageEntity, (msg) => msg.session)
  messages: ChatMessageEntity[];
}
