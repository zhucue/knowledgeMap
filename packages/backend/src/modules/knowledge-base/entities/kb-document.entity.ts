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
import { KnowledgeBaseEntity } from './knowledge-base.entity';
import { KbChunkEntity } from './kb-chunk.entity';

@Entity('kb_documents')
export class KbDocumentEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'kb_id' })
  kbId: number;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'enum', enum: ['pdf', 'docx', 'md', 'txt'], name: 'file_type' })
  fileType: string;

  @Column({ type: 'varchar', length: 1000, name: 'file_path' })
  filePath: string;

  @Column({ type: 'bigint', unsigned: true, default: 0, name: 'file_size' })
  fileSize: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status: string;

  @Column({ type: 'int', unsigned: true, default: 0, name: 'token_count' })
  tokenCount: number;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => KnowledgeBaseEntity, (kb) => kb.documents)
  @JoinColumn({ name: 'kb_id' })
  knowledgeBase: KnowledgeBaseEntity;

  @OneToMany(() => KbChunkEntity, (chunk) => chunk.document)
  chunks: KbChunkEntity[];
}
