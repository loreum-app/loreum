"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@loreum/ui/dialog";
import { Input } from "@loreum/ui/input";
import { Label } from "@loreum/ui/label";

interface EntityType {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  fieldSchema: unknown[];
  _count: { entities: number };
}

interface CreateEntityTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  onCreated: (entityType: EntityType) => void;
}

export function CreateEntityTypeDialog({
  open,
  onOpenChange,
  projectSlug,
  onCreated,
}: CreateEntityTypeDialogProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const entityType = await api<EntityType>(
        `/projects/${projectSlug}/entity-types`,
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            icon: icon.trim() || undefined,
            color: color || undefined,
          }),
        },
      );
      setName("");
      setIcon("");
      setColor("#3b82f6");
      onCreated(entityType);
    } catch {
      setError("Failed to create entity type");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New entity type</DialogTitle>
            <DialogDescription>
              Define a type of entity in your world (e.g. Character, Location,
              Item)
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="et-name">Name</Label>
              <Input
                id="et-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Character"
                autoFocus
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="et-icon">Icon name</Label>
                <Input
                  id="et-icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="user"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="et-color">Color</Label>
                <Input
                  id="et-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-16 cursor-pointer p-1"
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
