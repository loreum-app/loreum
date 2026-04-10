import { Notification } from './types';
import { PaginatedResponse } from '../api';

export interface NotificationListResponse extends PaginatedResponse<Notification> {}

export interface UnreadCountResponse {
  count: number;
}
