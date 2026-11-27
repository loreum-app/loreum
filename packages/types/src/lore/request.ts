export interface CreateLoreArticleRequest {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  entitySlugs?: string[];
  parentArticleSlug?: string | null;
}

export interface UpdateLoreArticleRequest {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  entitySlugs?: string[];
  parentArticleSlug?: string | null;
}

export interface LoreFilterParams {
  q?: string;
  category?: string;
  tag?: string;
  entity?: string;
}
