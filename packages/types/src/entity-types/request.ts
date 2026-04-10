import { FieldDefinition } from './types';

export interface CreateItemTypeRequest {
  name: string;
  icon?: string;
  color?: string;
  fieldSchema?: FieldDefinition[];
}

export interface UpdateItemTypeRequest {
  name?: string;
  icon?: string;
  color?: string;
  fieldSchema?: FieldDefinition[];
}
