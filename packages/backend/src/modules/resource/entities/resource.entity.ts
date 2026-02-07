import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('resources')
export class ResourceEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'varchar', length: 1000 })
  url: string;

  @Column({
    type: 'enum',
    enum: ['article', 'video', 'document', 'tutorial', 'book'],
    name: 'resource_type',
  })
  resourceType: string;

  @Column({ type: 'varchar', length: 100 })
  domain: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ['system', 'user_upload'], default: 'system' })
  source: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'uploaded_by' })
  uploadedBy: number | null;

  @Column({ type: 'float', default: 5, name: 'quality_score' })
  qualityScore: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
