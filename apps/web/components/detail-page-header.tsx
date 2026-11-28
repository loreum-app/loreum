"use client";

import { type ReactNode } from "react";
import { Button } from "@loreum/ui/button";
import { Input } from "@loreum/ui/input";
import { Pencil, Save, X, Trash2 } from "lucide-react";

interface DetailPageHeaderProps {
  name: string;
  editName?: string;
  onEditNameChange?: (name: string) => void;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  error?: string | null;
  /** Content rendered between the name and the error message (e.g. tags). */
  children?: ReactNode;
}

export function DetailPageHeader({
  name,
  editName,
  onEditNameChange,
  editing,
  saving,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  error,
  children,
}: DetailPageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button size="sm" variant="ghost" onClick={onCancel}>
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button size="sm" onClick={onSave} disabled={saving}>
                <Save className="mr-1 h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={onDelete}>
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        <Input
          value={editName ?? name}
          onChange={(e) => onEditNameChange?.(e.target.value)}
          className="text-3xl"
        />
      ) : (
        <h1>{name}</h1>
      )}
      {children}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
