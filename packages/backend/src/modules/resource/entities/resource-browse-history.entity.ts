import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ResourceEntity } from './resource.entity';

@Entity('resource_browse_history')
export class ResourceBrowseHistoryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'resource_id' })
  resourceId: number;

  @ManyToOne(() => ResourceEntity)
  @JoinColumn({ name: 'resource_id' })
  resource: ResourceEntity;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'graph_node_id' })
  graphNodeId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
