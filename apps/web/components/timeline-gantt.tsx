"use client";

import { useEffect, useState } from "react";
import { api as apiClient } from "@/lib/api";
import { GanttChart } from "./gantt/gantt-chart";
import type { GanttEvent, GanttEra, TimelineRange } from "./gantt/gantt-types";
import { formatDisplayDate } from "./gantt/gantt-utils";
import type { TimelineEvent } from "@loreum/types";

interface TimelineConfig {
  timelineMode: string;
  timelineStart: number | null;
  timelineEnd: number | null;
  timelineLabelPrefix: string | null;
  timelineLabelSuffix: string | null;
}

interface RawEra {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  startDate: number;
  endDate: number;
  sortOrder: number;
}

interface TimelineGanttProps {
  events: TimelineEvent[];
  projectSlug: string;
  onEventClick?: (event: TimelineEvent) => void;
  onEventUpdated?: (event: TimelineEvent) => void;
}

const DAY_MS = 86400000;

export function TimelineGantt({
  events,
  projectSlug,
  onEventClick,
  onEventUpdated,
}: TimelineGanttProps) {
  const [config, setConfig] = useState<TimelineConfig | null>(null);
  const [rawEras, setRawEras] = useState<RawEra[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch config and eras
  useEffect(() => {
    Promise.all([
      apiClient<TimelineConfig>(
        `/projects/${projectSlug}/timeline-config`,
      ).catch(
        () =>
          ({
            timelineMode: "standard",
            timelineStart: null,
            timelineEnd: null,
            timelineLabelPrefix: null,
            timelineLabelSuffix: null,
          }) as TimelineConfig,
      ),
      apiClient<RawEra[]>(`/projects/${projectSlug}/timeline/eras`).catch(
        () => [] as RawEra[],
      ),
    ]).then(([cfg, eras]) => {
      setConfig(cfg);
      setRawEras(eras);
      setLoading(false);
    });
  }, [projectSlug]);

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (
    config.timelineMode === "custom" &&
    (config.timelineStart == null || config.timelineEnd == null)
  ) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Set a start and end value in the timeline config above to use the
          gantt view.
        </p>
      </div>
    );
  }

  // Build the TimelineRange
  const range: TimelineRange = buildRange(config, events);
  const prefix = config.timelineLabelPrefix ?? "";
  const suffix = config.timelineLabelSuffix ?? "";

  // Normalize events
  const ganttEvents: GanttEvent[] = [];
  for (const event of events) {
    const normalized = normalizeEvent(event, config, range);
    if (normalized) ganttEvents.push(normalized);
  }

  // Normalize eras
  const ganttEras: GanttEra[] = rawEras.map((era) => ({
    id: era.id,
    name: era.name,
    start:
      config.timelineMode === "standard"
        ? new Date(`${era.startDate}-01-01`).getTime()
        : era.startDate,
    end:
      config.timelineMode === "standard"
        ? new Date(`${era.endDate}-01-01`).getTime()
        : era.endDate,
    color: era.color ?? "#888",
  }));

  if (ganttEvents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No events with valid dates for the gantt view.
        </p>
      </div>
    );
  }

  // Map event IDs back for callbacks
  const eventById = new Map(events.map((e) => [e.id, e]));

  const handleEventClick = (eventId: string) => {
    const raw = eventById.get(eventId);
    if (raw && onEventClick) onEventClick(raw);
  };

  const handleEventUpdated = (
    eventId: string,
    patch: { start?: number; end?: number; name?: string },
  ) => {
    const raw = eventById.get(eventId);
    if (!raw) return;

    const apiPatch: Record<string, unknown> = {};

    if (patch.name !== undefined) {
      apiPatch.name = patch.name;
    }

    if (patch.start !== undefined) {
      if (config.timelineMode === "standard") {
        apiPatch.date = new Date(patch.start).toISOString().split("T")[0];
      } else {
        apiPatch.dateValue = patch.start;
        apiPatch.date = `${prefix}${Math.round(patch.start)}${suffix}`;
      }
    }

    if (patch.end !== undefined) {
      if (config.timelineMode === "standard") {
        apiPatch.endDate = new Date(patch.end).toISOString().split("T")[0];
      } else {
        apiPatch.endDateValue = patch.end;
        apiPatch.endDate = `${prefix}${Math.round(patch.end)}${suffix}`;
      }
    }

    if (Object.keys(apiPatch).length === 0) return;

    apiClient<TimelineEvent>(`/projects/${projectSlug}/timeline/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify(apiPatch),
    }).then((updated) => {
      onEventUpdated?.(updated);
    });
  };

  const handleEraUpdated = (eraId: string, delta: number) => {
    // Move era itself
    const rawEra = rawEras.find((e) => e.id === eraId);
    if (!rawEra) return;

    const newStart =
      config.timelineMode === "standard"
        ? rawEra.startDate // eras use year numbers, not ms — need to convert
        : rawEra.startDate + delta;
    const newEnd =
      config.timelineMode === "standard"
        ? rawEra.endDate
        : rawEra.endDate + delta;

    apiClient(`/projects/${projectSlug}/timeline/eras/${eraId}`, {
      method: "PATCH",
      body: JSON.stringify({ startDate: newStart, endDate: newEnd }),
    });

    // Move all child events
    for (const event of events) {
      if (event.era?.id === eraId) {
        handleEventUpdated(event.id, {
          start:
            (config.timelineMode === "standard"
              ? new Date(event.date).getTime()
              : (event.dateValue ?? 0)) + delta,
          end:
            (config.timelineMode === "standard"
              ? event.endDate
                ? new Date(event.endDate).getTime()
                : new Date(event.date).getTime() + DAY_MS
              : (event.endDateValue ?? (event.dateValue ?? 0) + 1)) + delta,
        });
      }
    }
  };

  return (
    <GanttChart
      events={ganttEvents}
      eras={ganttEras}
      range={range}
      onEventClick={handleEventClick}
      onEventUpdated={handleEventUpdated}
      onEraUpdated={handleEraUpdated}
    />
  );
}

// ---- Helpers ----

function buildRange(
  config: TimelineConfig,
  events: TimelineEvent[],
): TimelineRange {
  if (config.timelineMode === "custom") {
    return {
      mode: "custom",
      min: config.timelineStart!,
      max: config.timelineEnd!,
      prefix: config.timelineLabelPrefix ?? undefined,
      suffix: config.timelineLabelSuffix ?? undefined,
    };
  }

  // Standard mode: compute range from events
  const dates: number[] = [];
  for (const e of events) {
    const d = new Date(e.date).getTime();
    if (!isNaN(d)) dates.push(d);
    if (e.endDate) {
      const ed = new Date(e.endDate).getTime();
      if (!isNaN(ed)) dates.push(ed);
    }
  }

  if (dates.length === 0) {
    const now = Date.now();
    return {
      mode: "standard",
      min: now - DAY_MS * 365,
      max: now + DAY_MS * 365,
    };
  }

  const min = Math.min(...dates);
  const max = Math.max(...dates);
  // Add some padding
  const span = max - min || DAY_MS * 30;
  return {
    mode: "standard",
    min: min - span * 0.1,
    max: max + span * 0.1,
  };
}

function normalizeEvent(
  event: TimelineEvent,
  config: TimelineConfig,
  range: TimelineRange,
): GanttEvent | null {
  let start: number;
  let end: number;

  if (config.timelineMode === "standard") {
    const startDate = new Date(event.date);
    if (isNaN(startDate.getTime())) return null;
    start = startDate.getTime();

    if (event.endDate) {
      const endDate = new Date(event.endDate);
      end = isNaN(endDate.getTime()) ? start + DAY_MS : endDate.getTime();
    } else {
      end = start + DAY_MS;
    }
  } else {
    if (event.dateValue == null) return null;
    start = event.dateValue;
    end = event.endDateValue ?? start + 1;
  }

  return {
    id: event.id,
    name: event.name,
    start,
    end,
    displayStart: formatDisplayDate(start, range),
    displayEnd: formatDisplayDate(end, range),
    significance:
      (event.significance as GanttEvent["significance"]) ?? "moderate",
    eraId: event.era?.id,
    eraColor: event.era?.color ?? undefined,
  };
}
