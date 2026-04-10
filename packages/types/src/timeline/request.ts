import { Significance } from './types';

export interface CreateTimelineEventRequest {
  name: string;
  description?: string;
  date: string;
  sortOrder: number;
  periodStart?: string;
  periodEnd?: string;
  significance?: Significance;
  entitySlugs?: string[];
  tags?: string[];
}

export interface UpdateTimelineEventRequest {
  name?: string;
  description?: string;
  date?: string;
  sortOrder?: number;
  periodStart?: string;
  periodEnd?: string;
  significance?: Significance;
  entitySlugs?: string[];
  tags?: string[];
}

export interface TimelineFilterParams {
  entity?: string;
  significance?: Significance;
  tag?: string;
  sort?: string;
}
