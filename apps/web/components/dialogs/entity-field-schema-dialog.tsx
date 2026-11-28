"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Input } from "@loreum/ui/input";
import { Label } from "@loreum/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@loreum/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes / No" },
  { value: "select", label: "Select" },
  { value: "multi_select", label: "Multi-select" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
] as const;

interface FieldDefinition {
  key: string;
  label: string;
  type: string;
  options?: string[];
  required?: boolean;
  description?: string;
}

interface EntityFieldSchemaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  entityType: "CHARACTER" | "LOCATION" | "ORGANIZATION";
  entityTypeLabel: string;
}

function slugifyKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function EntityFieldSchemaDialog({
  open,
  onOpenChange,
  projectSlug,
  entityType,
  entityTypeLabel,
}: EntityFieldSchemaDialogProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    api<FieldDefinition[]>(
      `/projects/${projectSlug}/entity-schemas/${entityType}`,
    )
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setFields(arr);
      })
      .catch(() => setFields([]))
      .finally(() => setLoading(false));
  }, [open, projectSlug, entityType]);

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { key: "", label: "", type: "text", required: false },
    ]);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateField = (index: number, patch: Partial<FieldDefinition>) => {
    setFields((prev) =>
      prev.map((f, i) => {
        if (i !== index) return f;
        const updated = { ...f, ...patch };
        // Auto-generate key from label when the key is empty or was auto-generated
        if (
          patch.label !== undefined &&
          (!f.key || f.key === slugifyKey(f.label))
        ) {
          updated.key = slugifyKey(patch.label);
        }
        return updated;
      }),
    );
  };

  const handleSave = async () => {
    // Validate that every field has a key and label
    const invalid = fields.some((f) => !f.key.trim() || !f.label.trim());
    if (invalid) {
      setError("Every field must have a key and label.");
      return;
    }
    // Check for duplicate keys
    const keys = fields.map((f) => f.key.trim());
    if (new Set(keys).size !== keys.length) {
      setError("Field keys must be unique.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api(`/projects/${projectSlug}/entity-schemas/${entityType}`, {
        method: "PUT",
        body: JSON.stringify({
          fieldSchema: fields.map((f) => ({
            key: f.key.trim(),
            label: f.label.trim(),
            type: f.type,
            ...(f.options && f.options.length > 0
              ? { options: f.options }
              : {}),
            ...(f.required ? { required: true } : {}),
            ...(f.description ? { description: f.description.trim() } : {}),
          })),
        }),
      });
      onOpenChange(false);
    } catch {
      setError("Failed to save field schema.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom fields for {entityTypeLabel}</DialogTitle>
          <DialogDescription>
            Define custom fields that appear on every{" "}
            {entityTypeLabel.toLowerCase()} in this project. Changes apply to
            all existing and new {entityTypeLabel.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-4 mt-4">
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No custom fields defined yet. Add one below.
              </p>
            )}

            {fields.map((field, index) => (
              <FieldRow
                key={index}
                field={field}
                onChange={(patch) => updateField(index, patch)}
                onRemove={() => removeField(index)}
              />
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addField}
              className="w-full"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add field
            </Button>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({
  field,
  onChange,
  onRemove,
}: {
  field: FieldDefinition;
  onChange: (patch: Partial<FieldDefinition>) => void;
  onRemove: () => void;
}) {
  const showOptions = field.type === "select" || field.type === "multi_select";

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-start gap-2">
        <GripVertical className="mt-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="grid flex-1 grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Label</Label>
            <Input
              value={field.label}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder="e.g. Strength"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Key</Label>
            <Input
              value={field.key}
              onChange={(e) => onChange({ key: e.target.value })}
              placeholder="e.g. strength"
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select
              value={field.type}
              onValueChange={(v) => v && onChange({ type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="mt-5 h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {showOptions && (
        <div className="ml-6 space-y-1">
          <Label className="text-xs">Options (comma-separated)</Label>
          <Input
            value={(field.options ?? []).join(", ")}
            onChange={(e) =>
              onChange({
                options: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="e.g. Option A, Option B, Option C"
          />
        </div>
      )}
    </div>
  );
}
