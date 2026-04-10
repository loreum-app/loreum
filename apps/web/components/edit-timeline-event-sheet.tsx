"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Input } from "@loreum/ui/input";
import { Label } from "@loreum/ui/label";
import { Textarea } from "@loreum/ui/textarea";
import { DatePicker } from "@loreum/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@loreum/ui/sheet";
import { Trash2 } from "lucide-react";
import type { TimelineEvent } from "@loreum/types";

interface Era {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  startDate: number;
  endDate: number;
}

interface TimelineConfig {
  timelineMode: string;
  timelineStart: number | null;
  timelineEnd: number | null;
}

interface EditTimelineEventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  event: TimelineEvent | null;
  onUpdated: (event: TimelineEvent) => void;
  onDeleted: (id: string) => void;
}

export function EditTimelineEventSheet({
  open,
  onOpenChange,
  projectSlug,
  event,
  onUpdated,
  onDeleted,
}: EditTimelineEventSheetProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [endDateValue, setEndDateValue] = useState("");
  const [description, setDescription] = useState("");
  const [significance, setSignificance] = useState("moderate");
  const [eraSlug, setEraSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [eras, setEras] = useState<Era[]>([]);
  const [config, setConfig] = useState<TimelineConfig | null>(null);

  useEffect(() => {
    if (event) {
      setName(event.name);
      setDate(event.date);
      setEndDate(event.endDate ?? "");
      setDateValue(event.dateValue != null ? String(event.dateValue) : "");
      setEndDateValue(
        event.endDateValue != null ? String(event.endDateValue) : "",
      );
      setDescription(event.description ?? "");
      setSignificance(event.significance);
      setEraSlug(event.era?.slug ?? "");
    }
  }, [event]);

  useEffect(() => {
    if (open) {
      api<Era[]>(`/projects/${projectSlug}/timeline/eras`)
        .then(setEras)
        .catch(() => setEras([]));
      api<TimelineConfig>(`/projects/${projectSlug}/timeline-config`)
        .then(setConfig)
        .catch(() => {});
    }
  }, [open, projectSlug]);

  if (!event) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const numericDate = dateValue ? parseFloat(dateValue) : undefined;
      const numericEndDate = endDateValue
        ? parseFloat(endDateValue)
        : undefined;
      const updated = await api<TimelineEvent>(
        `/projects/${projectSlug}/timeline/${event.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: name.trim(),
            date: date.trim(),
            dateValue: numericDate,
            endDate: endDate.trim() || null,
            endDateValue: numericEndDate,
            description: description.trim() || null,
            significance,
            eraSlug: eraSlug || undefined,
          }),
        },
      );
      onUpdated(updated);
      onOpenChange(false);
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this timeline event?")) return;
    setDeleting(true);
    try {
      await api(`/projects/${projectSlug}/timeline/${event.id}`, {
        method: "DELETE",
      });
      onDeleted(event.id);
      onOpenChange(false);
    } catch {
      setError("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Timeline Event</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="edit-te-name">Name</Label>
            <Input
              id="edit-te-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {config?.timelineMode === "standard" ? (
            <>
              <div className="space-y-2">
                <Label>Start date</Label>
                <DatePicker
                  value={date ? new Date(date) : undefined}
                  onChange={(d) =>
                    setDate(d ? d.toISOString().slice(0, 10) : "")
                  }
                  className="w-full"
                  minYear={
                    config?.timelineStart != null
                      ? config.timelineStart
                      : undefined
                  }
                  maxYear={
                    config?.timelineEnd != null ? config.timelineEnd : undefined
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  End date{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <DatePicker
                  value={endDate ? new Date(endDate) : undefined}
                  onChange={(d) =>
                    setEndDate(d ? d.toISOString().slice(0, 10) : "")
                  }
                  className="w-full"
                  placeholder="Single point"
                  minYear={
                    config?.timelineStart != null
                      ? config.timelineStart
                      : undefined
                  }
                  maxYear={
                    config?.timelineEnd != null ? config.timelineEnd : undefined
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-te-datevalue">Start value</Label>
                <Input
                  id="edit-te-datevalue"
                  type="number"
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                  placeholder="35421"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-te-enddatevalue">End value</Label>
                <Input
                  id="edit-te-enddatevalue"
                  type="number"
                  value={endDateValue}
                  onChange={(e) => setEndDateValue(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-te-date">Date label</Label>
                <Input
                  id="edit-te-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Significance</Label>
            <Select
              value={significance}
              onValueChange={(v) => v && setSignificance(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {eras.length > 0 && (
            <div className="space-y-2">
              <Label>Era</Label>
              <Select
                value={eraSlug}
                onValueChange={(v) => setEraSlug(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select era (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {eras.map((era) => (
                    <SelectItem key={era.slug} value={era.slug}>
                      <div className="flex items-center gap-2">
                        {era.color && (
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: era.color }}
                          />
                        )}
                        {era.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-te-desc">Description</Label>
            <Textarea
              id="edit-te-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter className="mt-6 flex justify-between px-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
