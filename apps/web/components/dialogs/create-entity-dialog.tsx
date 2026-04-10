"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Entity, CreateEntityRequest } from "@loreum/types";
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
import { Textarea } from "@loreum/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";

type EntityType = "CHARACTER" | "LOCATION" | "ORGANIZATION" | "ITEM";

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: "CHARACTER", label: "Character" },
  { value: "LOCATION", label: "Location" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "ITEM", label: "Item" },
];

const STATUS_OPTIONS = [
  "alive",
  "deceased",
  "unknown",
  "dormant",
  "distributed",
];
const SPECIES_OPTIONS = ["human", "synth", "ai", "hybrid"];
const ROLE_OPTIONS = [
  "protagonist",
  "antagonist",
  "deuteragonist",
  "supporting",
  "minor",
];
const CONDITION_OPTIONS = [
  "ruins",
  "partially_restored",
  "functional",
  "fortified",
  "overgrown",
  "contested",
];
const ORG_STATUS_OPTIONS = ["active", "dissolved", "underground", "emerging"];

interface CreateEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  defaultType?: EntityType;
  onCreated: (entity: Entity) => void;
}

export function CreateEntityDialog({
  open,
  onOpenChange,
  projectSlug,
  defaultType,
  onCreated,
}: CreateEntityDialogProps) {
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [type, setType] = useState<EntityType>(defaultType ?? "CHARACTER");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Character fields
  const [charStatus, setCharStatus] = useState("");
  const [charSpecies, setCharSpecies] = useState("");
  const [charAge, setCharAge] = useState("");
  const [charRole, setCharRole] = useState("");

  // Location fields
  const [locRegion, setLocRegion] = useState("");
  const [locCondition, setLocCondition] = useState("");

  // Organization fields
  const [orgStatus, setOrgStatus] = useState("");
  const [orgTerritory, setOrgTerritory] = useState("");
  const [orgIdeology, setOrgIdeology] = useState("");

  const resetFields = () => {
    setName("");
    setSummary("");
    setCharStatus("");
    setCharSpecies("");
    setCharAge("");
    setCharRole("");
    setLocRegion("");
    setLocCondition("");
    setOrgStatus("");
    setOrgTerritory("");
    setOrgIdeology("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    const body: CreateEntityRequest = {
      type,
      name: name.trim(),
      summary: summary.trim() || undefined,
    };

    if (type === "CHARACTER") {
      body.character = {
        status: charStatus || undefined,
        species: charSpecies || undefined,
        age: charAge.trim() || undefined,
        role: charRole || undefined,
      };
    } else if (type === "LOCATION") {
      body.location = {
        region: locRegion.trim() || undefined,
        condition: locCondition || undefined,
      };
    } else if (type === "ORGANIZATION") {
      body.organization = {
        status: orgStatus || undefined,
        territory: orgTerritory.trim() || undefined,
        ideology: orgIdeology.trim() || undefined,
      };
    }

    try {
      const entity = await api<Entity>(`/projects/${projectSlug}/entities`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      resetFields();
      onCreated(entity);
    } catch {
      setError("Failed to create entity");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetFields();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              New{" "}
              {defaultType
                ? (ENTITY_TYPES.find(
                    (t) => t.value === defaultType,
                  )?.label?.toLowerCase() ?? "entity")
                : "entity"}
            </DialogTitle>
            <DialogDescription>Add to your world</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {!defaultType && (
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as EntityType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((et) => (
                      <SelectItem key={et.value} value={et.value}>
                        {et.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ent-name">Name</Label>
              <Input
                id="ent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ent-summary">Summary</Label>
              <Textarea
                id="ent-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="A brief summary..."
                rows={2}
              />
            </div>

            {/* Character-specific fields */}
            {type === "CHARACTER" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={charStatus}
                    onValueChange={(v) => v && setCharStatus(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Species</Label>
                  <Select
                    value={charSpecies}
                    onValueChange={(v) => v && setCharSpecies(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Species" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIES_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Age</Label>
                  <Input
                    value={charAge}
                    onChange={(e) => setCharAge(e.target.value)}
                    placeholder="Age"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Select
                    value={charRole}
                    onValueChange={(v) => v && setCharRole(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Location-specific fields */}
            {type === "LOCATION" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Region</Label>
                  <Input
                    value={locRegion}
                    onChange={(e) => setLocRegion(e.target.value)}
                    placeholder="e.g. Pacific Northwest"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Condition</Label>
                  <Select
                    value={locCondition}
                    onValueChange={(v) => v && setLocCondition(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Organization-specific fields */}
            {type === "ORGANIZATION" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Select
                      value={orgStatus}
                      onValueChange={(v) => v && setOrgStatus(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORG_STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Territory</Label>
                    <Input
                      value={orgTerritory}
                      onChange={(e) => setOrgTerritory(e.target.value)}
                      placeholder="Territory"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Ideology</Label>
                  <Textarea
                    value={orgIdeology}
                    onChange={(e) => setOrgIdeology(e.target.value)}
                    placeholder="Core ideology..."
                    rows={2}
                  />
                </div>
              </div>
            )}

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
