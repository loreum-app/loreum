import { FieldDefinition } from "./types";

export interface CreateItemTypeRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  fieldSchema?: FieldDefinition[];
}

export interface UpdateItemTypeRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  fieldSchema?: FieldDefinition[];
}
