import type { EntityType } from "../entity-types";

export interface LoreArticle {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated when included
  entities?: LoreArticleEntityLink[];
  tags?: import("../tags").Tag[];
  loreArticleTags?: { tag: import("../tags").Tag }[];
}

export interface LoreArticleSummary {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  createdAt: string;
}

export interface LoreArticleEntityLink {
  entityId: string;
  entity?: {
    id: string;
    name: string;
    slug: string;
    type: EntityType;
  };
}
