import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { KnowledgeGraphEntity } from './knowledge-graph.entity';
import { NodeResourceEntity } from '../../resource/entities/node-resource.entity';

@Entity('graph_nodes')
export class GraphNodeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true, name: 'graph_id' })
  graphId: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true, name: 'parent_id' })
  parentId: number | null;

  @Column({ type: 'varchar', length: 100, name: 'node_key' })
  nodeKey: string;

  @Column({ type: 'varchar', length: 200 })
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ['root', 'branch', 'leaf'], default: 'leaf', name: 'node_type' })
  nodeType: string;

  @Column({ type: 'tinyint', unsigned: true, default: 0, name: 'depth_level' })
  depthLevel: number;

  @Column({ type: 'int', unsigned: true, default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'boolean', default: false, name: 'is_expandable' })
  isExpandable: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_expanded' })
  isExpanded: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => KnowledgeGraphEntity, (graph) => graph.nodes)
  @JoinColumn({ name: 'graph_id' })
  graph: KnowledgeGraphEntity;

  @ManyToOne(() => GraphNodeEntity, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: GraphNodeEntity | null;

  @OneToMany(() => GraphNodeEntity, (node) => node.parent)
  children: GraphNodeEntity[];

  @OneToMany(() => NodeResourceEntity, (nr) => nr.node)
  nodeResources: NodeResourceEntity[];
}
