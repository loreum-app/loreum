import { CurrentUser, Session } from './types';

export interface CurrentUserResponse extends CurrentUser {}

export interface SessionsResponse {
  sessions: Session[];
}

export interface InvalidateSessionsResponse {
  invalidated: number;
}
