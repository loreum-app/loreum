import type { EntityType } from '../entity-types';

export interface GraphNode {
  id: string;
  name: string;
  slug: string;
  type: EntityType;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  bidirectional: boolean;
}

export interface GraphFilterParams {
  center?: string;
  depth?: number;
}
