import type { ProjectVisibility } from "./types";

export interface CreateProjectRequest {
  name: string;
  description?: string;
  visibility?: ProjectVisibility;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  visibility?: ProjectVisibility;
}
