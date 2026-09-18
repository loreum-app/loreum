"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import { CreateEntityDialog } from "@/components/dialogs/create-entity-dialog";
import { Plus, Box } from "lucide-react";
import type { Entity } from "@loreum/types";

interface ItemType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

/**
 * Reserved slug for items that belong to no custom type. Without a page of
 * their own such items appear in no list at all, since every other item list is
 * scoped to a type.
 */
const UNTYPED_SLUG = "items";

const UNTYPED_TYPE: ItemType = {
  id: "",
  name: "Untyped items",
  slug: UNTYPED_SLUG,
  description: "Items that do not belong to any custom type",
};

export default function CustomTypePage() {
  const params = useParams<{ slug: string; typeSlug: string }>();
  const router = useRouter();
  const untyped = params.typeSlug === UNTYPED_SLUG;
  const [itemType, setItemType] = useState<ItemType | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const entitiesUrl = `/projects/${params.slug}/entities?type=ITEM&itemType=${
      untyped ? "none" : encodeURIComponent(params.typeSlug)
    }`;

    Promise.all([
      untyped
        ? Promise.resolve<ItemType[]>([])
        : api<ItemType[]>(`/projects/${params.slug}/entity-types`),
      api<Entity[]>(entitiesUrl),
    ])
      .then(([types, items]) => {
        if (untyped) {
          setItemType(UNTYPED_TYPE);
          setEntities(items);
          return;
        }
        const match = types.find((t) => t.slug === params.typeSlug);
        if (!match) {
          router.replace(`/projects/${params.slug}`);
          return;
        }
        setItemType(match);
        setEntities(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug, params.typeSlug, router, untyped]);

  const handleCreated = (entity: Entity) => {
    setEntities((prev) =>
      [...prev, entity].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!itemType) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Type not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1>{itemType.name}</h1>
          <p className="text-sm text-muted-foreground">
            {itemType.description || `${itemType.name} in your world`}
          </p>
        </div>
        {!untyped && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New {itemType.name.toLowerCase().replace(/s$/, "")}
          </Button>
        )}
      </div>

      {entities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Box className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">
            {untyped
              ? "Nothing untyped"
              : `No ${itemType.name.toLowerCase()} yet`}
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            {untyped
              ? "Every item in this world belongs to a type."
              : "Create your first one"}
          </p>
          {!untyped && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              New {itemType.name.toLowerCase().replace(/s$/, "")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entities.map((entity) => (
            <Link
              key={entity.id}
              href={`/projects/${params.slug}/entities/${params.typeSlug}/${entity.slug}`}
            >
              <Card className="transition-colors hover:border-foreground/20">
                <CardHeader>
                  <CardTitle className="text-base">{entity.name}</CardTitle>
                  {entity.summary && (
                    <CardDescription>{entity.summary}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateEntityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectSlug={params.slug}
        defaultType="ITEM"
        itemTypeId={itemType.id}
        onCreated={handleCreated}
      />
    </div>
  );
}
