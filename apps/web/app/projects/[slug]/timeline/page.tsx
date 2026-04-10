"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { TimelineEvent } from "@loreum/types";
import { Button } from "@loreum/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import { CreateTimelineEventDialog } from "@/components/dialogs/create-timeline-event-dialog";
import { EditTimelineEventSheet } from "@/components/edit-timeline-event-sheet";
import { TimelineGantt } from "@/components/timeline-gantt";
import { TimelineConfigPanel } from "@/components/timeline-config-panel";
import { Plus, Clock, List, BarChart3 } from "lucide-react";

const significanceColors: Record<string, string> = {
  minor: "bg-slate-400",
  moderate: "bg-blue-500",
  major: "bg-amber-500",
  critical: "bg-red-500",
};

export default function TimelinePage() {
  const params = useParams<{ slug: string }>();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [view, setView] = useState<"gantt" | "list">("list");
  const [ganttKey, setGanttKey] = useState(0);

  useEffect(() => {
    api<TimelineEvent[]>(`/projects/${params.slug}/timeline`)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handleCreated = (event: TimelineEvent) => {
    setEvents((prev) =>
      [...prev, event].sort((a, b) => a.date.localeCompare(b.date)),
    );
    setDialogOpen(false);
  };

  const handleUpdated = (updated: TimelineEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)),
    );
  };

  const handleDeleted = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1>Timeline</h1>
          <p className="text-sm text-muted-foreground">
            Events and history of your world
          </p>
        </div>
        <div className="flex gap-2">
          {events.length > 0 && (
            <div className="flex rounded-md border">
              <Button
                size="sm"
                variant={view === "gantt" ? "default" : "ghost"}
                className="rounded-r-none"
                onClick={() => setView("gantt")}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={view === "list" ? "default" : "ghost"}
                className="rounded-l-none"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New event
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Clock className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">No timeline events yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Add events to build your world&apos;s history
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New event
          </Button>
        </div>
      ) : view === "gantt" ? (
        <div>
          <TimelineConfigPanel
            projectSlug={params.slug}
            onConfigSaved={() => setGanttKey((k) => k + 1)}
          />

          <TimelineGantt
            key={ganttKey}
            events={events}
            projectSlug={params.slug}
            onEventClick={(event) => setEditingEvent(event)}
            onEventUpdated={handleUpdated}
          />
        </div>
      ) : (
        <div className="relative space-y-4 border-l-2 border-border pl-6">
          {events.map((event) => (
            <div key={event.id} className="relative">
              <div
                className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ${significanceColors[event.significance] ?? "bg-blue-500"}`}
              />
              <Card
                className="cursor-pointer transition-colors hover:border-foreground/20"
                onClick={() => setEditingEvent(event)}
              >
                <CardHeader className="py-4">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{event.name}</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {event.date}
                    </span>
                  </div>
                  {event.description && (
                    <CardDescription className="line-clamp-2">
                      {event.description}
                    </CardDescription>
                  )}
                  {(event.entities.length > 0 ||
                    (event.timelineEventTags &&
                      event.timelineEventTags.length > 0)) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {event.entities.map((link) => (
                        <span
                          key={link.entity.id}
                          className="rounded bg-muted px-1.5 py-0.5 text-xs"
                        >
                          {link.entity.name}
                        </span>
                      ))}
                      {event.timelineEventTags?.map((link) => (
                        <span
                          key={link.tag.id}
                          className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs"
                        >
                          {link.tag.color && (
                            <div
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: link.tag.color }}
                            />
                          )}
                          {link.tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>
              </Card>
            </div>
          ))}
        </div>
      )}

      <CreateTimelineEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectSlug={params.slug}
        onCreated={handleCreated}
      />

      <EditTimelineEventSheet
        open={!!editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(null)}
        projectSlug={params.slug}
        event={editingEvent}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
