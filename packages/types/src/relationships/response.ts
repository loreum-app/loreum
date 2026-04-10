import { Relationship } from './types';

export interface RelationshipResponse extends Relationship {}

export interface RelationshipListResponse {
  relationships: Relationship[];
}
