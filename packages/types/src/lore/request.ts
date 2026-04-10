export interface CreateLoreArticleRequest {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  entitySlugs?: string[];
}

export interface UpdateLoreArticleRequest {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  entitySlugs?: string[];
}

export interface LoreFilterParams {
  q?: string;
  category?: string;
  tag?: string;
  entity?: string;
}
