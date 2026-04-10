export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'url'
  | 'entity_ref';

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  entityTypeSlug?: string;
  required?: boolean;
  description?: string;
}

export type EntityType = 'CHARACTER' | 'LOCATION' | 'ORGANIZATION' | 'ITEM';

export interface ItemType {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  fieldSchema: FieldDefinition[];
  createdAt: string;
  updatedAt: string;
}
