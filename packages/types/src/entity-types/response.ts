import { ItemType } from './types';

export interface ItemTypeResponse extends ItemType {}

export interface ItemTypeListResponse {
  itemTypes: ItemType[];
}
