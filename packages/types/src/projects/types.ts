export type ProjectVisibility = "PRIVATE" | "PUBLIC" | "UNLISTED";

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: ProjectVisibility;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}
