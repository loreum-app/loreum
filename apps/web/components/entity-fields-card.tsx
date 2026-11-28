"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@loreum/ui/card";
import { Input } from "@loreum/ui/input";
import { Label } from "@loreum/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";

interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** Apply CSS capitalize to the displayed value. */
  capitalize?: boolean;
}

interface EntityFieldsCardProps {
  title: string;
  fields: FieldConfig[];
  values: Record<string, string | null | undefined>;
  editing: boolean;
  onChange?: (key: string, value: string) => void;
}

export type { FieldConfig };

export function EntityFieldsCard({
  title,
  fields,
  values,
  editing,
  onChange,
}: EntityFieldsCardProps) {
  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label>{field.label}</Label>
                {field.type === "select" && field.options ? (
                  <Select
                    value={values[field.key] ?? ""}
                    onValueChange={(v) => v && onChange?.(field.key, v)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          field.placeholder ??
                          `Select ${field.label.toLowerCase()}`
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={values[field.key] ?? ""}
                    onChange={(e) => onChange?.(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // View mode: only render fields that have a value
  const populatedFields = fields.filter((f) => values[f.key]);
  if (populatedFields.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {populatedFields.map((field) => {
            const raw = values[field.key] ?? "";
            // For select fields, use the option label if available
            const displayValue =
              field.type === "select" && field.options
                ? (field.options.find((o) => o.value === raw)?.label ?? raw)
                : raw;
            return (
              <div key={field.key}>
                <dt className="text-muted-foreground">{field.label}</dt>
                <dd
                  className={`font-medium${field.capitalize ? " capitalize" : ""}`}
                >
                  {displayValue}
                </dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
