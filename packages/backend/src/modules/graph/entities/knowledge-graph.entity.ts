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
import { TopicEntity } from '../../topic/entities/topic.entity';
import { GraphNodeEntity } from './graph-node.entity';

@Entity('knowledge_graphs')
export class KnowledgeGraphEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'topic_id' })
  topicId: number;

  @Column({ type: 'int', unsigned: true, default: 1 })
  version: number;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'enum', enum: ['generating', 'completed', 'failed'], default: 'generating' })
  status: string;

  @Column({ type: 'varchar', length: 50, name: 'llm_provider' })
  llmProvider: string;

  @Column({ type: 'varchar', length: 100, name: 'llm_model' })
  llmModel: string;

  @Column({ type: 'int', unsigned: true, default: 0, name: 'node_count' })
  nodeCount: number;

  @Column({ type: 'tinyint', unsigned: true, default: 0, name: 'max_depth' })
  maxDepth: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'created_by' })
  createdBy: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => TopicEntity)
  @JoinColumn({ name: 'topic_id' })
  topic: TopicEntity;

  @OneToMany(() => GraphNodeEntity, (node) => node.graph)
  nodes: GraphNodeEntity[];
}
