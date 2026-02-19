import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { KbCollaboratorEntity } from './kb-collaborator.entity';
import { KbDocumentEntity } from './kb-document.entity';

@Entity('knowledge_bases')
export class KnowledgeBaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'owner_id' })
  ownerId: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ['private', 'shared', 'public'], default: 'private' })
  visibility: string;

  @Column({ type: 'int', unsigned: true, default: 0, name: 'document_count' })
  documentCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'owner_id' })
  owner: UserEntity;

  @OneToMany(() => KbCollaboratorEntity, (c) => c.knowledgeBase)
  collaborators: KbCollaboratorEntity[];

  @OneToMany(() => KbDocumentEntity, (d) => d.knowledgeBase)
  documents: KbDocumentEntity[];
}
