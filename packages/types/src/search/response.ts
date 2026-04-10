import { SearchResult, SearchResultType } from './types';

export interface SearchResponse {
  query: string;
  results: Record<SearchResultType, SearchResult[]>;
  total: number;
}
