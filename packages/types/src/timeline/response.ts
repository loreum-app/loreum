import { TimelineEvent } from './types';

export interface TimelineEventResponse extends TimelineEvent {}

export interface TimelineEventListResponse {
  events: TimelineEvent[];
}
