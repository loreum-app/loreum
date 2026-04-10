import type { EntityType } from '../entity-types';

export interface Character {
  status: string | null;
  species: string | null;
  age: string | null;
  role: string | null;
}

export interface Location {
  region: string | null;
  condition: string | null;
  mapId: string | null;
}

export interface Organization {
  ideology: string | null;
  territory: string | null;
  status: string | null;
  parentOrgId: string | null;
}

export interface Item {
  itemType: { id: string; name: string; slug: string } | null;
  fields: Record<string, unknown>;
}

export interface Entity {
  id: string;
  projectId: string;
  type: EntityType;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  backstory: string | null;
  secrets: string | null;
  notes: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  character?: Character | null;
  location?: Location | null;
  organization?: Organization | null;
  item?: Item | null;
}

export interface EntityHub extends Entity {
  relationships: import('../relationships').Relationship[];
  incomingRelationships: import('../relationships').Relationship[];
  scenes: import('../storyboard').SceneSummary[];
  loreArticles: import('../lore').LoreArticleSummary[];
  timelineEvents: import('../timeline').TimelineEvent[];
  tags: import('../tags').Tag[];
}
