"use client";

import { useRef, useEffect } from "react";
import type { GanttRow, GridConfig, HeaderCell } from "./gantt-types";
import { GanttTimeAxis } from "./gantt-time-axis";
import { GanttBar } from "./gantt-bar";
import { GanttEraBar } from "./gantt-era-bar";

interface GanttCanvasProps {
  rows: GanttRow[];
  grid: GridConfig;
  gridTemplate: string;
  headerRows: HeaderCell[][];
  snapEnabled: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEventDragEnd: (eventId: string, newStart: number, newEnd: number) => void;
  onEraDragEnd: (eraId: string, delta: number) => void;
  scrollTop: number;
  onScroll: (scrollTop: number) => void;
}

export function GanttCanvas({
  rows,
  grid,
  gridTemplate,
  headerRows,
  snapEnabled,
  selectedId,
  onSelect,
  onEventDragEnd,
  onEraDragEnd,
  scrollTop,
  onScroll,
}: GanttCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    if (scrollRef.current && !isSyncing.current) {
      isSyncing.current = true;
      scrollRef.current.scrollTop = scrollTop;
      requestAnimationFrame(() => { isSyncing.current = false; });
    }
  }, [scrollTop]);

  const handleScroll = () => {
    if (isSyncing.current) return;
    if (scrollRef.current) onScroll(scrollRef.current.scrollTop);
  };

  return (
    <div className="h-full overflow-auto" ref={scrollRef} onScroll={handleScroll}>
      <div>
        {/* Sticky header */}
        <GanttTimeAxis headerRows={headerRows} gridTemplate={gridTemplate} />

        {/* Rows */}
        {rows.map((row) => {
          if (row.type === "era") {
            return (
              <GanttEraBar
                key={`era-${row.era.id}`}
                era={row.era}
                grid={grid}
                gridTemplate={gridTemplate}
                snapEnabled={snapEnabled}
                onEraDragEnd={onEraDragEnd}
              />
            );
          }

          return (
            <GanttBar
              key={`event-${row.event.id}`}
              event={row.event}
              grid={grid}
              gridTemplate={gridTemplate}
              snapEnabled={snapEnabled}
              isSelected={selectedId === row.event.id}
              onSelect={onSelect}
              onDragEnd={onEventDragEnd}
            />
          );
        })}
      </div>
    </div>
  );
}
