"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
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
import { ChevronDown, ChevronUp } from "lucide-react";

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
  /** Custom item type the new entity belongs to, when created from its page. */
  itemTypeId?: string;
  onCreated: (entity: Entity) => void;
}

export function CreateEntityDialog({
  open,
  onOpenChange,
  projectSlug,
  defaultType,
  itemTypeId,
  onCreated,
}: CreateEntityDialogProps) {
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [type, setType] = useState<EntityType>(defaultType ?? "CHARACTER");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [description, setDescription] = useState("");
  const [secrets, setSecrets] = useState("");
  const [notes, setNotes] = useState("");

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
    setDescription("");
    setSecrets("");
    setNotes("");
    setShowMore(false);
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
      description: description.trim() || undefined,
      secrets: secrets.trim() || undefined,
      notes: notes.trim() || undefined,
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
    } else if (type === "ITEM" && itemTypeId) {
      // Without this the item is created with no custom type, and the type's
      // page — which lists by type — can never show it.
      body.item = { itemTypeId };
    }

    try {
      const entity = await api<Entity>(`/projects/${projectSlug}/entities`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      resetFields();
      onCreated(entity);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to create entity",
      );
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

            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowMore((v) => !v)}
            >
              {showMore ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {showMore ? "Less" : "More details"}
            </button>

            {showMore && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="ent-desc">Description</Label>
                  <Textarea
                    id="ent-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed description..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ent-secrets">Secrets</Label>
                  <Textarea
                    id="ent-secrets"
                    value={secrets}
                    onChange={(e) => setSecrets(e.target.value)}
                    placeholder="Hidden information..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ent-notes">Notes</Label>
                  <Textarea
                    id="ent-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Personal notes..."
                    rows={2}
                  />
                </div>
              </div>
            )}

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
