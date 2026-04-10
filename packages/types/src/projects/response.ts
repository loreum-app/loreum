import { Project } from './types';

export interface ProjectResponse extends Project {}

export interface ProjectListResponse {
  projects: Project[];
}
