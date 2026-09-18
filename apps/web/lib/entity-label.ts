const BUILT_IN_LABELS: Record<string, string> = {
  CHARACTER: "Character",
  LOCATION: "Location",
  ORGANIZATION: "Organization",
  ITEM: "Item",
};

interface TypeNamed {
  type: string;
  item?: { itemType?: { name: string } | null } | null;
}

/**
 * What kind of thing an entity is, as a person would say it: the custom item
 * type when there is one ("Weapons"), otherwise the built-in type
 * ("Character"). Bare "ITEM" tells a reader nothing when several entities
 * share a name.
 */
export function entityTypeLabel(entity: TypeNamed): string {
  return (
    entity.item?.itemType?.name ?? BUILT_IN_LABELS[entity.type] ?? entity.type
  );
}
