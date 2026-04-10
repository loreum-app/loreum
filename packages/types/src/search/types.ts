export type SearchResultType = 'entity' | 'lore' | 'scene' | 'timeline';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  slug?: string;
  snippet: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface SearchFilterParams {
  q: string;
  types?: SearchResultType[];
  limit?: number;
}
