"use client";

import type { HeaderCell } from "./gantt-types";
import { SCALE_ROW_HEIGHT } from "./gantt-utils";

interface GanttTimeAxisProps {
  headerRows: HeaderCell[][];
  gridTemplate: string;
}

export function GanttTimeAxis({ headerRows, gridTemplate }: GanttTimeAxisProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-card">
      {headerRows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid"
          style={{ gridTemplateColumns: gridTemplate, height: SCALE_ROW_HEIGHT }}
        >
          {row.map((cell, cellIndex) => (
            <div
              key={cellIndex}
              className="flex items-center border-r border-border/50 overflow-hidden px-1.5"
              style={{ gridColumn: `${cell.startCol} / ${cell.endCol}` }}
            >
              <span className="text-[10px] text-muted-foreground truncate select-none">
                {cell.label}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
