// ---- Data types ----

export interface GanttEvent {
  id: string;
  name: string;
  start: number; // unified numeric value (epoch ms for standard, raw value for custom)
  end: number;
  displayStart: string;
  displayEnd: string;
  significance: "minor" | "moderate" | "major" | "critical";
  eraId?: string;
  eraColor?: string;
}

export interface GanttEra {
  id: string;
  name: string;
  start: number;
  end: number;
  color: string;
}

// ---- Row layout ----

export interface GanttEraRow {
  type: "era";
  era: GanttEra;
}

export interface GanttEventRow {
  type: "event";
  event: GanttEvent;
}

export type GanttRow = GanttEraRow | GanttEventRow;

// ---- Timeline config ----

export interface TimelineRange {
  mode: "standard" | "custom";
  min: number;
  max: number;
  prefix?: string;
  suffix?: string;
}

// ---- Grid ----

export interface GridConfig {
  cellCount: number;
  cellValue: number; // how much timeline value each cell represents
  rangeStart: number; // value at cell 0 left edge (includes padding)
  rangeEnd: number; // value at last cell right edge (includes padding)
}

// ---- Zoom ----

export interface ZoomScale {
  unit: "century" | "decade" | "year" | "quarter" | "month" | "week" | "day";
  step: number;
}

export interface ZoomLevel {
  scales: ZoomScale[];
  customDivisor: number;
  cellMinWidth: number;
  durationUnit: "centuries" | "decades" | "years" | "months" | "weeks" | "days";
}

// ---- Header cells ----

export interface HeaderCell {
  startCol: number; // 1-based grid column start
  endCol: number; // 1-based grid column end
  label: string;
}

// ---- Drag state ----

export type DragMode = "move" | "resize-start" | "resize-end";

// ---- Callbacks ----

export interface GanttCallbacks {
  onEventClick?: (eventId: string) => void;
  onEventUpdated?: (eventId: string, patch: { start?: number; end?: number; name?: string }) => void;
  onEraUpdated?: (eraId: string, delta: number) => void;
}
