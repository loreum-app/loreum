export interface CreateRelationshipRequest {
  sourceEntitySlug: string;
  targetEntitySlug: string;
  label: string;
  description?: string;
  metadata?: Record<string, any>;
  bidirectional?: boolean;
}

export interface RelationshipFilterParams {
  entity?: string;
  source?: string;
  target?: string;
}
