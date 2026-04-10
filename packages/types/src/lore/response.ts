import { LoreArticle } from './types';

export interface LoreArticleResponse extends LoreArticle {}

export interface LoreArticleListResponse {
  articles: LoreArticle[];
}
