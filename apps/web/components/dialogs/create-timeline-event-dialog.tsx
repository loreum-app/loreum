"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@loreum/ui/textarea";
import { DatePicker } from "@loreum/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";
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
  timelineLabelPrefix: string | null;
  timelineLabelSuffix: string | null;
}

interface CreateTimelineEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  onCreated: (event: TimelineEvent) => void;
}

export function CreateTimelineEventDialog({
  open,
  onOpenChange,
  projectSlug,
  onCreated,
}: CreateTimelineEventDialogProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [endDateValue, setEndDateValue] = useState("");
  const [description, setDescription] = useState("");
  const [significance, setSignificance] = useState("moderate");
  const [eraSlug, setEraSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [eras, setEras] = useState<Era[]>([]);
  const [config, setConfig] = useState<TimelineConfig | null>(null);

  useEffect(() => {
    if (open) {
      Promise.all([
        api<Era[]>(`/projects/${projectSlug}/timeline/eras`),
        api<TimelineConfig>(`/projects/${projectSlug}/timeline-config`),
      ])
        .then(([e, c]) => {
          setEras(e);
          setConfig(c);
        })
        .catch(() => {});
    }
  }, [open, projectSlug]);

  // Auto-fill date label from dateValue + config
  const formatDateLabel = (val: string) => {
    if (!val || !config) return "";
    const prefix = config.timelineLabelPrefix ?? "";
    const suffix = config.timelineLabelSuffix ?? "";
    return `${prefix}${val}${suffix}`.trim();
  };

  const handleDateValueChange = (val: string) => {
    setDateValue(val);
    if (val && !date) {
      setDate(formatDateLabel(val));
    }
  };

  // Auto-select era based on dateValue
  useEffect(() => {
    if (!dateValue || eraSlug) return;
    const num = parseFloat(dateValue);
    if (isNaN(num)) return;
    const matchingEra = eras.find(
      (e) => num >= e.startDate && num <= e.endDate,
    );
    if (matchingEra) setEraSlug(matchingEra.slug);
  }, [dateValue, eras, eraSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date.trim()) return;

    setSubmitting(true);
    setError(null);

    const numericDate = dateValue ? parseFloat(dateValue) : undefined;
    const numericEndDate = endDateValue ? parseFloat(endDateValue) : undefined;

    // Validate range if config exists
    if (
      numericDate !== undefined &&
      config?.timelineStart != null &&
      config?.timelineEnd != null
    ) {
      if (
        numericDate < config.timelineStart ||
        numericDate > config.timelineEnd
      ) {
        setError(
          `Date value must be between ${config.timelineStart} and ${config.timelineEnd}`,
        );
        setSubmitting(false);
        return;
      }
    }

    try {
      const event = await api<TimelineEvent>(
        `/projects/${projectSlug}/timeline`,
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            date: date.trim(),
            dateValue: numericDate,
            endDate: endDate.trim() || undefined,
            endDateValue: numericEndDate,
            description: description.trim() || undefined,
            significance,
            sortOrder: 0,
            eraSlug: eraSlug || undefined,
          }),
        },
      );
      setName("");
      setDate("");
      setEndDate("");
      setDateValue("");
      setEndDateValue("");
      setDescription("");
      setSignificance("moderate");
      setEraSlug("");
      onCreated(event);
    } catch {
      setError("Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  const isStandard = config?.timelineMode === "standard";
  const isCustom = config?.timelineMode === "custom";
  const hasCustomRange =
    isCustom && config?.timelineStart != null && config?.timelineEnd != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New timeline event</DialogTitle>
            <DialogDescription>
              Add an event to your world&apos;s history
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="te-name">Name</Label>
              <Input
                id="te-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Battle of Helm's Deep"
                autoFocus
              />
            </div>

            <div className="flex gap-4">
              {isStandard ? (
                <>
                  <div className="flex-1 space-y-2">
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
                        config?.timelineEnd != null
                          ? config.timelineEnd
                          : undefined
                      }
                    />
                  </div>
                  <div className="flex-1 space-y-2">
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
                        config?.timelineEnd != null
                          ? config.timelineEnd
                          : undefined
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  {hasCustomRange && (
                    <>
                      <div className="w-28 space-y-2">
                        <Label htmlFor="te-datevalue">Start value</Label>
                        <Input
                          id="te-datevalue"
                          type="number"
                          value={dateValue}
                          onChange={(e) =>
                            handleDateValueChange(e.target.value)
                          }
                          placeholder={`${config!.timelineStart}`}
                        />
                      </div>
                      <div className="w-28 space-y-2">
                        <Label htmlFor="te-enddatevalue">End value</Label>
                        <Input
                          id="te-enddatevalue"
                          type="number"
                          value={endDateValue}
                          onChange={(e) => setEndDateValue(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="te-date">Date label</Label>
                    <Input
                      id="te-date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder={
                        hasCustomRange
                          ? formatDateLabel("35421") || "e.g. Year 35421"
                          : "Any format"
                      }
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
                  <SelectTrigger className="w-32">
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
                          {era.name} ({era.startDate}–{era.endDate})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="te-desc">Description</Label>
              <Textarea
                id="te-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened..."
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              disabled={submitting || !name.trim() || !date.trim()}
            >
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
