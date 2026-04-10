export interface Relationship {
  id: string;
  projectId: string;
  sourceEntityId: string;
  targetEntityId: string;
  label: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  bidirectional: boolean;
  createdAt: string;
  sourceEntity: {
    id: string;
    name: string;
    slug: string;
    type: string;
  };
  targetEntity: {
    id: string;
    name: string;
    slug: string;
    type: string;
  };
}
