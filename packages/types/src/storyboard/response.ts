import { Plotline, PlotPoint, Work, Chapter, Scene } from './types';

export interface PlotlineResponse extends Plotline {}
export interface PlotlineListResponse {
  plotlines: Plotline[];
}

export interface PlotPointResponse extends PlotPoint {}
export interface PlotPointListResponse {
  plotPoints: PlotPoint[];
}

export interface WorkResponse extends Work {}
export interface WorkListResponse {
  works: Work[];
}

export interface ChapterResponse extends Chapter {}
export interface ChapterListResponse {
  chapters: Chapter[];
}

export interface SceneResponse extends Scene {}
export interface SceneListResponse {
  scenes: Scene[];
}

export interface StoryboardOverviewResponse {
  plotlines: Plotline[];
  works: Work[];
}
