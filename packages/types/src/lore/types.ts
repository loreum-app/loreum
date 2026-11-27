import type { EntityType } from "../entity-types";

export interface LoreArticleRef {
  id: string;
  title: string;
  slug: string;
}

export interface LoreArticle {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  parentArticleId: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated when included
  parentArticle?: LoreArticleRef | null;
  childArticles?: LoreArticleRef[];
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
  parentArticle?: LoreArticleRef | null;
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
