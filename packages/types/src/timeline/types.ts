import type { EntityType } from "../entity-types";

export type Significance = "minor" | "moderate" | "major" | "critical";

export interface TimelineEvent {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  date: string;
  dateValue?: number | null;
  endDate?: string | null;
  endDateValue?: number | null;
  sortOrder: number;
  periodStart: string | null;
  periodEnd: string | null;
  significance: Significance;
  eraId?: string | null;
  createdAt: string;
  // Populated when included
  era?: { id: string; name: string; slug: string; color: string | null } | null;
  entities: TimelineEventEntityLink[];
  tags?: import("../tags").Tag[];
  timelineEventTags?: { tag: import("../tags").Tag }[];
}

export interface TimelineEventEntityLink {
  entityId: string;
  role: string | null;
  entity: {
    id: string;
    name: string;
    slug: string;
    type: EntityType;
  };
}
