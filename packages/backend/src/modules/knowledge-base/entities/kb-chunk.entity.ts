import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { KbDocumentEntity } from './kb-document.entity';

@Entity('kb_chunks')
export class KbChunkEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'document_id' })
  documentId: number;

  @Column({ type: 'int', unsigned: true, name: 'chunk_index' })
  chunkIndex: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'heading_path' })
  headingPath: string | null;

  @Column({ type: 'int', unsigned: true, default: 0, name: 'token_count' })
  tokenCount: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => KbDocumentEntity, (doc) => doc.chunks)
  @JoinColumn({ name: 'document_id' })
  document: KbDocumentEntity;
}
