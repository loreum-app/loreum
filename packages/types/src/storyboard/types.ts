export type WorkStatus = 'concept' | 'outlining' | 'drafting' | 'revision' | 'complete';

export interface Plotline {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  description: string | null;
  thematicStatement: string | null;
  parentPlotlineId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  childPlotlines?: Plotline[];
  plotPoints?: PlotPoint[];
  scenes?: SceneSummary[];
}

export interface PlotPoint {
  id: string;
  plotlineId: string;
  sequenceNumber: number;
  title: string;
  description: string | null;
  label: string | null;
  sceneId: string | null;
  timelineEventId: string | null;
  entityId: string | null;
  createdAt: string;
  updatedAt: string;
  scene?: { id: string; title: string | null } | null;
  timelineEvent?: { id: string; name: string; date: string } | null;
  entity?: { id: string; name: string; slug: string } | null;
}

export interface Work {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  chronologicalOrder: number;
  releaseOrder: number;
  synopsis: string | null;
  status: WorkStatus;
  createdAt: string;
  updatedAt: string;
  chapters?: Chapter[];
}

export interface WorkSummary {
  id: string;
  title: string;
  slug: string;
  status: WorkStatus;
  releaseOrder: number;
  chronologicalOrder: number;
}

export interface PlotlineSummary {
  id: string;
  name: string;
  slug: string;
}

export interface Chapter {
  id: string;
  workId: string;
  title: string;
  sequenceNumber: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  scenes?: SceneSummary[];
}

export interface SceneCharacterRef {
  entityId: string;
  role: string | null;
  isPov: boolean;
  entity: { id: string; name: string; slug: string };
}

export interface Scene {
  id: string;
  chapterId: string;
  title: string | null;
  sequenceNumber: number;
  description: string | null;
  plotlineId: string | null;
  locationId: string | null;
  timelineEventId: string | null;
  createdAt: string;
  updatedAt: string;
  plotline?: PlotlineSummary | null;
  characters?: SceneCharacterRef[];
  location?: { id: string; name: string; slug: string } | null;
}

export interface SceneSummary {
  id: string;
  title: string | null;
  sequenceNumber: number;
  description: string | null;
  characters?: SceneCharacterRef[];
  location?: { id: string; name: string; slug: string } | null;
}
