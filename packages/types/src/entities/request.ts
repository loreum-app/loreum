import type { EntityType } from '../entity-types';

export interface CharacterFields {
  status?: string;
  species?: string;
  age?: string;
  role?: string;
}

export interface LocationFields {
  region?: string;
  condition?: string;
  mapId?: string;
}

export interface OrganizationFields {
  ideology?: string;
  territory?: string;
  status?: string;
  parentOrgId?: string;
}

export interface ItemFields {
  itemTypeId?: string;
  fields?: Record<string, unknown>;
}

export interface CreateEntityRequest {
  type: EntityType;
  name: string;
  summary?: string;
  description?: string;
  backstory?: string;
  secrets?: string;
  notes?: string;
  imageUrl?: string;
  tags?: string[];
  character?: CharacterFields;
  location?: LocationFields;
  organization?: OrganizationFields;
  item?: ItemFields;
}

export interface UpdateEntityRequest {
  name?: string;
  summary?: string;
  description?: string;
  backstory?: string;
  secrets?: string;
  notes?: string;
  imageUrl?: string;
  tags?: string[];
  character?: CharacterFields;
  location?: LocationFields;
  organization?: OrganizationFields;
  item?: ItemFields;
}

export interface EntityFilterParams {
  type?: EntityType;
  q?: string;
  tag?: string;
  include?: ('relationships' | 'tags')[];
  page?: number;
  limit?: number;
}
