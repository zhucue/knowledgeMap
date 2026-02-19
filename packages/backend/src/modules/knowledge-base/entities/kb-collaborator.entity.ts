import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { KnowledgeBaseEntity } from './knowledge-base.entity';
import { UserEntity } from '../../user/entities/user.entity';

@Entity('kb_collaborators')
export class KbCollaboratorEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'kb_id' })
  kbId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  @Column({ type: 'enum', enum: ['viewer', 'editor'], default: 'viewer' })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => KnowledgeBaseEntity, (kb) => kb.collaborators)
  @JoinColumn({ name: 'kb_id' })
  knowledgeBase: KnowledgeBaseEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
