"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Input } from "@loreum/ui/input";
import { Label } from "@loreum/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@loreum/ui/card";
import { Settings, Save } from "lucide-react";

interface TimelineConfig {
  timelineMode: string;
  timelineStart: number | null;
  timelineEnd: number | null;
  timelineLabelPrefix: string | null;
  timelineLabelSuffix: string | null;
}

interface TimelineConfigPanelProps {
  projectSlug: string;
  onConfigSaved?: () => void;
}

export function TimelineConfigPanel({
  projectSlug,
  onConfigSaved,
}: TimelineConfigPanelProps) {
  const [config, setConfig] = useState<TimelineConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const [mode, setMode] = useState<"standard" | "custom">("standard");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");

  useEffect(() => {
    api<TimelineConfig>(`/projects/${projectSlug}/timeline-config`)
      .then((c) => {
        setConfig(c);
        setMode((c.timelineMode as "standard" | "custom") ?? "standard");
        setStart(c.timelineStart != null ? String(c.timelineStart) : "");
        setEnd(c.timelineEnd != null ? String(c.timelineEnd) : "");
        setPrefix(c.timelineLabelPrefix ?? "");
        setSuffix(c.timelineLabelSuffix ?? "");
      })
      .catch(() => setExpanded(true))
      .finally(() => setLoading(false));
  }, [projectSlug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await api<TimelineConfig>(
        `/projects/${projectSlug}/timeline-config`,
        {
          method: "PUT",
          body: JSON.stringify({
            timelineMode: mode,
            timelineStart: start ? parseFloat(start) : null,
            timelineEnd: end ? parseFloat(end) : null,
            ...(mode === "custom"
              ? {
                  timelineLabelPrefix: prefix || null,
                  timelineLabelSuffix: suffix || null,
                }
              : {
                  timelineLabelPrefix: null,
                  timelineLabelSuffix: null,
                }),
          }),
        },
      );
      setConfig(saved);
      setExpanded(false);
      onConfigSaved?.();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  const isConfigured =
    config?.timelineMode === "standard" ||
    (config?.timelineStart != null && config?.timelineEnd != null);

  if (!expanded && isConfigured) {
    return (
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {config?.timelineMode === "standard"
            ? `Standard calendar${config.timelineStart && config.timelineEnd ? ` (${config.timelineStart}–${config.timelineEnd})` : ""}`
            : `Custom: ${prefix}${config?.timelineStart}${suffix} – ${prefix}${config?.timelineEnd}${suffix}`}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-xs"
          onClick={() => setExpanded(true)}
        >
          <Settings className="mr-1 h-3 w-3" />
          Configure
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="py-3">
        <CardTitle className="text-sm">Timeline Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === "standard" ? "default" : "outline"}
            onClick={() => setMode("standard")}
          >
            Standard calendar
          </Button>
          <Button
            size="sm"
            variant={mode === "custom" ? "default" : "outline"}
            onClick={() => setMode("custom")}
          >
            Custom timeline
          </Button>
        </div>

        {mode === "standard" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Earliest year</Label>
                <Input
                  type="number"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  placeholder="e.g. 2040"
                  className="w-28 h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Latest year</Label>
                <Input
                  type="number"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  placeholder="e.g. 2100"
                  className="w-28 h-8 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Sets the date picker range and gantt chart bounds.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Start value</Label>
                <Input
                  type="number"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  placeholder="e.g. 35000"
                  className="w-28 h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End value</Label>
                <Input
                  type="number"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  placeholder="e.g. 36000"
                  className="w-28 h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Label prefix</Label>
                <Input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="Year "
                  className="w-24 h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Label suffix</Label>
                <Input
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder=" CE"
                  className="w-24 h-8 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Define a numeric range for your world&apos;s timeline. Events use
              date values within this range.
              {(prefix || suffix) && start
                ? ` Dates display as "${prefix}${start}${suffix}".`
                : ""}
            </p>
          </>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || (mode === "custom" && (!start || !end))}
          >
            <Save className="mr-1 h-3 w-3" />
            {saving ? "Saving..." : "Save"}
          </Button>
          {isConfigured && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
