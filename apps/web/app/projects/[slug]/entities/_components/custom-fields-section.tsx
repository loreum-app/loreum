"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@loreum/ui/input";
import { Textarea } from "@loreum/ui/textarea";
import { Label } from "@loreum/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@loreum/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";

interface FieldDefinition {
  key: string;
  label: string;
  type: string;
  options?: string[];
  required?: boolean;
  description?: string;
}

interface CustomFieldsSectionProps {
  projectSlug: string;
  entityType: "CHARACTER" | "LOCATION" | "ORGANIZATION";
  customFields: Record<string, unknown>;
  editing: boolean;
  editCustomFields: Record<string, string>;
  onEditCustomFieldsChange: (fields: Record<string, string>) => void;
}

/** Sentinel value for boolean "false" in Select — Select needs a non-empty string. */
const BOOL_FALSE = "__false__";

export function CustomFieldsSection({
  projectSlug,
  entityType,
  customFields,
  editing,
  editCustomFields,
  onEditCustomFieldsChange,
}: CustomFieldsSectionProps) {
  const [schema, setSchema] = useState<FieldDefinition[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api<FieldDefinition[]>(
      `/projects/${projectSlug}/entity-schemas/${entityType}`,
    )
      .then((data) => setSchema(Array.isArray(data) ? data : []))
      .catch(() => setSchema([]))
      .finally(() => setLoaded(true));
  }, [projectSlug, entityType]);

  if (!loaded || schema.length === 0) return null;

  const updateField = (key: string, value: string) => {
    onEditCustomFieldsChange({ ...editCustomFields, [key]: value });
  };

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {schema.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={editCustomFields[field.key] ?? ""}
                onChange={(v) => updateField(field.key, v)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Read mode: show values for fields that have data
  const fieldsWithValues = schema.filter((f) => {
    const val = customFields[f.key];
    return val !== undefined && val !== null && val !== "";
  });

  if (fieldsWithValues.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Custom Fields</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {fieldsWithValues.map((field) => (
            <div key={field.key}>
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd className="font-medium">
                <FieldDisplay field={field} value={customFields[field.key]} />
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition;
  value: string;
  onChange: (v: string) => void;
}) {
  switch (field.type) {
    case "textarea":
      return (
        <div className="col-span-1 sm:col-span-2 space-y-1">
          <Label>{field.label}</Label>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder={field.description}
          />
        </div>
      );
    case "number":
      return (
        <div className="space-y-1">
          <Label>{field.label}</Label>
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.description}
          />
        </div>
      );
    case "boolean":
      return (
        <div className="space-y-1">
          <Label>{field.label}</Label>
          <Select
            value={
              value === "true" ? "true" : value === "false" ? BOOL_FALSE : ""
            }
            onValueChange={(v) =>
              onChange(v === BOOL_FALSE ? "false" : v === "true" ? "true" : "")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value={BOOL_FALSE}>No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    case "select":
      return (
        <div className="space-y-1">
          <Label>{field.label}</Label>
          <Select value={value} onValueChange={(v) => v && onChange(v)}>
            <SelectTrigger>
              <SelectValue placeholder={field.description || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case "multi_select":
      return (
        <div className="space-y-1">
          <Label>{field.label}</Label>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Comma-separated: ${(field.options ?? []).join(", ")}`}
          />
        </div>
      );
    case "date":
      return (
        <div className="space-y-1">
          <Label>{field.label}</Label>
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case "url":
      return (
        <div className="space-y-1">
          <Label>{field.label}</Label>
          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.description || "https://..."}
          />
        </div>
      );
    default:
      return (
        <div className="space-y-1">
          <Label>{field.label}</Label>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.description}
          />
        </div>
      );
  }
}

function FieldDisplay({
  field,
  value,
}: {
  field: FieldDefinition;
  value: unknown;
}) {
  if (value === null || value === undefined) return null;

  switch (field.type) {
    case "boolean":
      return <>{String(value) === "true" ? "Yes" : "No"}</>;
    case "url":
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-blue-600 dark:text-blue-400"
        >
          {String(value)}
        </a>
      );
    case "multi_select":
      return <>{String(value)}</>;
    default:
      return <>{String(value)}</>;
  }
}
