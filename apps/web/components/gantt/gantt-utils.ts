import type {
  GanttEvent,
  GanttEra,
  GanttRow,
  GridConfig,
  ZoomLevel,
  ZoomScale,
  HeaderCell,
  TimelineRange,
} from "./gantt-types";

// ============================================================================
// Constants
// ============================================================================

export const ROW_HEIGHT = 36;
export const ERA_ROW_HEIGHT = 32;
export const SCALE_ROW_HEIGHT = 28;

export const SIGNIFICANCE_COLORS: Record<string, string> = {
  minor: "#64748b",
  moderate: "#3b82f6",
  major: "#f59e0b",
  critical: "#ef4444",
};

// ============================================================================
// Zoom levels
// ============================================================================

export const ZOOM_LEVELS: ZoomLevel[] = [
  // 0: centuries
  {
    scales: [{ unit: "century", step: 1 }],
    customDivisor: 10,
    cellMinWidth: 60,
    durationUnit: "centuries",
  },
  // 1: half-centuries
  {
    scales: [{ unit: "year", step: 50 }],
    customDivisor: 20,
    cellMinWidth: 50,
    durationUnit: "centuries",
  },
  // 2: decades
  {
    scales: [{ unit: "decade", step: 1 }],
    customDivisor: 50,
    cellMinWidth: 45,
    durationUnit: "decades",
  },
  // 3: 5-year blocks
  {
    scales: [{ unit: "year", step: 5 }],
    customDivisor: 100,
    cellMinWidth: 40,
    durationUnit: "years",
  },
  // 4: years
  {
    scales: [{ unit: "year", step: 1 }],
    customDivisor: 200,
    cellMinWidth: 40,
    durationUnit: "years",
  },
  // 5: year > quarters
  {
    scales: [
      { unit: "year", step: 1 },
      { unit: "quarter", step: 1 },
    ],
    customDivisor: 500,
    cellMinWidth: 60,
    durationUnit: "months",
  },
  // 6: quarter > months
  {
    scales: [
      { unit: "quarter", step: 1 },
      { unit: "month", step: 1 },
    ],
    customDivisor: 1000,
    cellMinWidth: 50,
    durationUnit: "months",
  },
  // 7: month > weeks
  {
    scales: [
      { unit: "month", step: 1 },
      { unit: "week", step: 1 },
    ],
    customDivisor: 2000,
    cellMinWidth: 45,
    durationUnit: "weeks",
  },
  // 8: month > days
  {
    scales: [
      { unit: "month", step: 1 },
      { unit: "day", step: 1 },
    ],
    customDivisor: 5000,
    cellMinWidth: 28,
    durationUnit: "days",
  },
];

// ============================================================================
// Grid config — the core of the new approach
// ============================================================================

/**
 * Computes the grid: how many cells, what value range each cell covers.
 * The grid is the single source of truth for positioning.
 */
export function computeGrid(
  zoomIndex: number,
  range: TimelineRange,
): GridConfig {
  const level = ZOOM_LEVELS[zoomIndex]!;

  if (range.mode === "custom") {
    const span = range.max - range.min;
    const padding = span * 0.05;
    const rangeStart = range.min - padding;
    const rangeEnd = range.max + padding;
    const cellCount = level.customDivisor;
    return {
      cellCount,
      cellValue: (rangeEnd - rangeStart) / cellCount,
      rangeStart,
      rangeEnd,
    };
  }

  // Standard mode: align grid to calendar boundaries so cells map to exact units.
  const finest = level.scales[level.scales.length - 1]!;
  const flooredStart = floorToUnit(
    new Date(range.min),
    finest.unit,
    finest.step,
  );
  // Step back one unit for padding
  const paddedStart = new Date(flooredStart);
  advanceByUnitMutate(paddedStart, finest.unit, finest.step, -1);

  const ceiledEnd = floorToUnit(new Date(range.max), finest.unit, finest.step);
  // Step forward two units for padding
  const paddedEnd = new Date(ceiledEnd);
  advanceByUnitMutate(paddedEnd, finest.unit, finest.step, 2);

  const rangeStart = paddedStart.getTime();
  const rangeEnd = paddedEnd.getTime();

  // Count cells by iterating calendar units (accounts for variable-length months etc.)
  let cellCount = 0;
  const cursor = new Date(rangeStart);
  while (cursor.getTime() < rangeEnd) {
    cellCount++;
    advanceByUnitMutate(cursor, finest.unit, finest.step, 1);
  }
  cellCount = Math.max(1, cellCount);

  return {
    cellCount,
    cellValue: (rangeEnd - rangeStart) / cellCount,
    rangeStart,
    rangeEnd,
  };
}

/**
 * Returns the CSS grid-template-columns value.
 * If cellCount * cellMinWidth > containerWidth, use fixed widths (scroll).
 * Otherwise use 1fr (stretch to fill).
 */
export function gridTemplateColumns(
  grid: GridConfig,
  zoomIndex: number,
  containerWidth: number,
): string {
  const level = ZOOM_LEVELS[zoomIndex]!;
  const totalMinWidth = grid.cellCount * level.cellMinWidth;

  if (totalMinWidth > containerWidth) {
    return `repeat(${grid.cellCount}, ${level.cellMinWidth}px)`;
  }
  return `repeat(${grid.cellCount}, 1fr)`;
}

// ============================================================================
// Value → grid column (1-based)
// ============================================================================

/** Maps a timeline value to a 1-based grid column index. */
export function valueToCol(value: number, grid: GridConfig): number {
  const col = Math.round((value - grid.rangeStart) / grid.cellValue) + 1;
  return Math.max(1, Math.min(col, grid.cellCount + 1));
}

/** Maps a 1-based grid column index back to a timeline value. */
export function colToValue(col: number, grid: GridConfig): number {
  return grid.rangeStart + (col - 1) * grid.cellValue;
}

// ============================================================================
// Auto-fit zoom
// ============================================================================

export function computeFitLevel(
  events: GanttEvent[],
  eras: GanttEra[],
  containerWidth: number,
  range: TimelineRange,
): number {
  if (events.length === 0 && eras.length === 0) return 4;

  for (let i = ZOOM_LEVELS.length - 1; i >= 0; i--) {
    const grid = computeGrid(i, range);
    const totalWidth = grid.cellCount * ZOOM_LEVELS[i]!.cellMinWidth;
    if (totalWidth <= containerWidth) return i;
  }
  return 0;
}

// ============================================================================
// Header generation (returns grid column spans)
// ============================================================================

export function generateHeaders(
  zoomIndex: number,
  grid: GridConfig,
  range: TimelineRange,
): HeaderCell[][] {
  if (range.mode === "custom") {
    return generateCustomHeaders(zoomIndex, grid, range);
  }
  return generateStandardHeaders(zoomIndex, grid);
}

function generateCustomHeaders(
  zoomIndex: number,
  grid: GridConfig,
  range: TimelineRange,
): HeaderCell[][] {
  const level = ZOOM_LEVELS[zoomIndex]!;
  const prefix = range.prefix ?? "";
  const suffix = range.suffix ?? "";

  // Bottom tier: one cell per grid column
  const bottomCells: HeaderCell[] = [];
  for (let i = 0; i < grid.cellCount; i++) {
    const value = grid.rangeStart + (i + 0.5) * grid.cellValue;
    bottomCells.push({
      startCol: i + 1,
      endCol: i + 2,
      label: `${prefix}${Math.round(value)}${suffix}`,
    });
  }

  if (level.scales.length >= 2) {
    const groupSize = Math.max(
      1,
      Math.floor(grid.cellCount / Math.max(1, Math.floor(grid.cellCount / 10))),
    );
    const topCells: HeaderCell[] = [];
    for (let i = 0; i < grid.cellCount; i += groupSize) {
      const end = Math.min(i + groupSize, grid.cellCount);
      const midValue = grid.rangeStart + (i + (end - i) / 2) * grid.cellValue;
      topCells.push({
        startCol: i + 1,
        endCol: end + 1,
        label: `${prefix}${Math.round(midValue)}${suffix}`,
      });
    }
    return [topCells, bottomCells];
  }

  return [bottomCells];
}

function generateStandardHeaders(
  zoomIndex: number,
  grid: GridConfig,
): HeaderCell[][] {
  const level = ZOOM_LEVELS[zoomIndex]!;
  const finest = level.scales[level.scales.length - 1]!;

  // Build a lookup: for each finest-unit boundary, what column is it?
  // This is exact — no ms division drift.
  const boundaryToCol = new Map<number, number>();
  const cursor = new Date(grid.rangeStart);
  for (let col = 1; col <= grid.cellCount + 1; col++) {
    boundaryToCol.set(cursor.getTime(), col);
    if (col <= grid.cellCount) {
      advanceByUnitMutate(cursor, finest.unit, finest.step, 1);
    }
  }

  // For each scale row, find where each scale-unit boundary falls in the grid
  const findCol = (ms: number): number => {
    // Exact match first
    const exact = boundaryToCol.get(ms);
    if (exact !== undefined) return exact;
    // Nearest boundary (shouldn't happen often)
    let best = 1;
    let bestDist = Infinity;
    for (const [bMs, col] of boundaryToCol) {
      const dist = Math.abs(bMs - ms);
      if (dist < bestDist) {
        bestDist = dist;
        best = col;
      }
    }
    return best;
  };

  const result: HeaderCell[][] = [];
  for (const scale of level.scales) {
    const cells: HeaderCell[] = [];
    let scaleCursor = floorToUnit(
      new Date(grid.rangeStart),
      scale.unit,
      scale.step,
    );

    while (scaleCursor.getTime() < grid.rangeEnd) {
      const next = advanceByUnit(scaleCursor, scale.unit, scale.step);
      const startCol = findCol(scaleCursor.getTime());
      const endCol = findCol(next.getTime());

      if (endCol > startCol) {
        cells.push({
          startCol,
          endCol,
          label: formatScaleLabel(scaleCursor, scale.unit),
        });
      }

      scaleCursor = next;
    }

    result.push(cells);
  }

  return result;
}

// ============================================================================
// Calendar helpers
// ============================================================================

// function scaleUnitToMs(unit: ZoomScale["unit"], step: number): number {
//   const DAY = 86400000;
//   switch (unit) {
//     case "day": return DAY * step;
//     case "week": return DAY * 7 * step;
//     case "month": return DAY * 30.44 * step;
//     case "quarter": return DAY * 91.31 * step;
//     case "year": return DAY * 365.25 * step;
//     case "decade": return DAY * 365.25 * 10 * step;
//     case "century": return DAY * 365.25 * 100 * step;
//   }
// }

function floorToUnit(date: Date, unit: ZoomScale["unit"], step: number): Date {
  const d = new Date(date);
  switch (unit) {
    case "century":
      return new Date(Math.floor(d.getFullYear() / 100) * 100, 0, 1);
    case "decade":
      return new Date(Math.floor(d.getFullYear() / 10) * 10, 0, 1);
    case "year":
      return new Date(Math.floor(d.getFullYear() / step) * step, 0, 1);
    case "quarter":
      return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
    case "month":
      return new Date(d.getFullYear(), d.getMonth(), 1);
    case "week": {
      const day = d.getDay();
      return new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate() - day + (day === 0 ? -6 : 1),
      );
    }
    case "day":
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
}

function advanceByUnit(
  date: Date,
  unit: ZoomScale["unit"],
  step: number,
): Date {
  const d = new Date(date);
  advanceByUnitMutate(d, unit, step, 1);
  return d;
}

/** Mutates the date in place. `times` can be negative to go backwards. */
function advanceByUnitMutate(
  date: Date,
  unit: ZoomScale["unit"],
  step: number,
  times: number,
): void {
  const n = step * times;
  switch (unit) {
    case "century":
      date.setFullYear(date.getFullYear() + 100 * n);
      break;
    case "decade":
      date.setFullYear(date.getFullYear() + 10 * n);
      break;
    case "year":
      date.setFullYear(date.getFullYear() + n);
      break;
    case "quarter":
      date.setMonth(date.getMonth() + 3 * n);
      break;
    case "month":
      date.setMonth(date.getMonth() + n);
      break;
    case "week":
      date.setDate(date.getDate() + 7 * n);
      break;
    case "day":
      date.setDate(date.getDate() + n);
      break;
  }
}

function formatScaleLabel(date: Date, unit: ZoomScale["unit"]): string {
  switch (unit) {
    case "century":
      return `${date.getFullYear()}s`;
    case "decade":
      return `${date.getFullYear()}s`;
    case "year":
      return `${date.getFullYear()}`;
    case "quarter":
      return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    case "month":
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    case "week":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "day":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
  }
}

// ============================================================================
// Duration formatting
// ============================================================================

export function formatDuration(
  startCol: number,
  endCol: number,
  zoomIndex: number,
): string {
  const span = endCol - startCol;
  if (span <= 0) return "—";

  const unit = ZOOM_LEVELS[zoomIndex]!.durationUnit;
  const singular = unit.replace(/s$/, "");
  if (span === 1) return `1 ${singular}`;
  return `${span} ${unit}`;
}

// ============================================================================
// Row layout (era grouping)
// ============================================================================

export function buildRows(events: GanttEvent[], eras: GanttEra[]): GanttRow[] {
  const rows: GanttRow[] = [];
  const sortedEras = [...eras].sort((a, b) => a.start - b.start);
  const eraEvents = new Map<string, GanttEvent[]>();
  const ungrouped: GanttEvent[] = [];

  for (const event of events) {
    if (event.eraId) {
      const list = eraEvents.get(event.eraId) ?? [];
      list.push(event);
      eraEvents.set(event.eraId, list);
    } else {
      ungrouped.push(event);
    }
  }

  for (const era of sortedEras) {
    rows.push({ type: "era", era });
    const children = (eraEvents.get(era.id) ?? []).sort(
      (a, b) => a.start - b.start,
    );
    for (const event of children) {
      rows.push({ type: "event", event });
    }
  }

  for (const event of ungrouped.sort((a, b) => a.start - b.start)) {
    rows.push({ type: "event", event });
  }

  return rows;
}

// ============================================================================
// Bar color
// ============================================================================

export function getBarColor(event: GanttEvent): string {
  return event.eraColor ?? SIGNIFICANCE_COLORS[event.significance] ?? "#3b82f6";
}

// ============================================================================
// Display date formatting
// ============================================================================

export function formatDisplayDate(value: number, range: TimelineRange): string {
  if (range.mode === "custom") {
    const prefix = range.prefix ?? "";
    const suffix = range.suffix ?? "";
    return `${prefix}${Math.round(value)}${suffix}`;
  }
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
