import { WorkStatus } from './types';

export interface CreatePlotlineRequest {
  name: string;
  description?: string;
  thematicStatement?: string;
  parentPlotlineSlug?: string;
}

export interface UpdatePlotlineRequest {
  name?: string;
  description?: string;
  thematicStatement?: string;
  sortOrder?: number;
}

export interface CreatePlotPointRequest {
  title: string;
  description?: string;
  label?: string;
  sequenceNumber: number;
  sceneId?: string;
  timelineEventId?: string;
  entitySlug?: string;
}

export interface UpdatePlotPointRequest {
  title?: string;
  description?: string;
  label?: string;
  sequenceNumber?: number;
  sceneId?: string | null;
  timelineEventId?: string | null;
  entitySlug?: string | null;
}

export interface CreateWorkRequest {
  title: string;
  chronologicalOrder: number;
  releaseOrder: number;
  synopsis?: string;
  status?: WorkStatus;
}

export interface UpdateWorkRequest {
  title?: string;
  chronologicalOrder?: number;
  releaseOrder?: number;
  synopsis?: string;
  status?: WorkStatus;
}

export interface CreateChapterRequest {
  title: string;
  sequenceNumber: number;
  notes?: string;
}

export interface UpdateChapterRequest {
  title?: string;
  sequenceNumber?: number;
  notes?: string;
}

export interface CreateSceneRequest {
  title?: string;
  sequenceNumber: number;
  chapterId: string;
  description?: string;
  plotlineSlug?: string;
  povCharacterSlug?: string;
  locationSlug?: string;
  timelineEventId?: string;
}

export interface UpdateSceneRequest {
  title?: string;
  sequenceNumber?: number;
  description?: string;
  plotlineSlug?: string | null;
  povCharacterSlug?: string;
  locationSlug?: string;
  timelineEventId?: string | null;
}
