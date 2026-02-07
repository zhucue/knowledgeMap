import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GraphNodeEntity } from '../../graph/entities/graph-node.entity';
import { ResourceEntity } from './resource.entity';

@Entity('node_resources')
export class NodeResourceEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'node_id' })
  nodeId: number;

  @Column({ type: 'bigint', unsigned: true, name: 'resource_id' })
  resourceId: number;

  @Column({ type: 'float', default: 0, name: 'relevance_score' })
  relevanceScore: number;

  @Column({ type: 'boolean', default: false, name: 'is_primary' })
  isPrimary: boolean;

  @ManyToOne(() => GraphNodeEntity, (node) => node.nodeResources)
  @JoinColumn({ name: 'node_id' })
  node: GraphNodeEntity;

  @ManyToOne(() => ResourceEntity)
  @JoinColumn({ name: 'resource_id' })
  resource: ResourceEntity;
}
