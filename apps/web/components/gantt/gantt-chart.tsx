"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@loreum/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Magnet,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type {
  GanttEvent,
  GanttEra,
  GanttRow,
  GridConfig,
  HeaderCell,
  TimelineRange,
} from "./gantt-types";
import {
  ZOOM_LEVELS,
  buildRows,
  computeFitLevel,
  computeGrid,
  gridTemplateColumns,
  generateHeaders,
} from "./gantt-utils";
import { GanttDivider } from "./gantt-divider";
import { GanttTable } from "./gantt-table";
import { GanttCanvas } from "./gantt-canvas";

interface GanttChartProps {
  events: GanttEvent[];
  eras: GanttEra[];
  range: TimelineRange;
  onEventClick?: (eventId: string) => void;
  onEventUpdated?: (
    eventId: string,
    patch: { start?: number; end?: number; name?: string },
  ) => void;
  onEraUpdated?: (eraId: string, delta: number) => void;
}

const MIN_TABLE_WIDTH = 0;
const MAX_TABLE_WIDTH = 500;

export function GanttChart({
  events,
  eras,
  range,
  onEventClick,
  onEventUpdated,
  onEraUpdated,
}: GanttChartProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [tableWidth, setTableWidth] = useState(0);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);

  // Measure the outer wrapper — sized by page layout, never by canvas content
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const measure = () => setMeasuredWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Derived data
  const rows: GanttRow[] = buildRows(events, eras);
  const canvasWidth = measuredWidth - (tableExpanded ? tableWidth : 0);
  const fitLevel = computeFitLevel(events, eras, canvasWidth, range);
  const currentZoom = zoomLevel ?? fitLevel;
  const grid: GridConfig = computeGrid(currentZoom, range);
  const gridTemplate = gridTemplateColumns(grid, currentZoom, canvasWidth);
  const headerRows: HeaderCell[][] = generateHeaders(currentZoom, grid, range);

  // Handlers
  const handleZoomIn = () =>
    setZoomLevel(Math.min((zoomLevel ?? fitLevel) + 1, ZOOM_LEVELS.length - 1));
  const handleZoomOut = () =>
    setZoomLevel(Math.max((zoomLevel ?? fitLevel) - 1, 0));
  const handleFit = () => setZoomLevel(fitLevel);

  const handleSelect = (eventId: string) => {
    setSelectedId(eventId);
    onEventClick?.(eventId);
  };

  const handleEventDragEnd = (
    eventId: string,
    newStart: number,
    newEnd: number,
  ) => {
    onEventUpdated?.(eventId, { start: newStart, end: newEnd });
  };

  const handleEraDragEnd = (eraId: string, delta: number) => {
    onEraUpdated?.(eraId, delta);
  };

  const handleNameChange = (eventId: string, name: string) => {
    onEventUpdated?.(eventId, { name });
  };

  const handleDividerDrag = (deltaX: number) => {
    setTableWidth((w) =>
      Math.max(MIN_TABLE_WIDTH, Math.min(MAX_TABLE_WIDTH, w + deltaX)),
    );
  };

  const toggleTable = () => {
    if (tableExpanded) {
      setTableExpanded(false);
    } else {
      setTableExpanded(true);
      if (tableWidth < 300) setTableWidth(360);
    }
  };

  if (events.length === 0 && eras.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No events for the gantt view.
        </p>
      </div>
    );
  }

  return (
    <div ref={outerRef}>
      {/* Toolbar */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={tableExpanded ? "default" : "ghost"}
            onClick={toggleTable}
            title={tableExpanded ? "Collapse table" : "Expand table"}
          >
            {tableExpanded ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant={snapEnabled ? "default" : "ghost"}
            onClick={() => setSnapEnabled(!snapEnabled)}
            title={snapEnabled ? "Snap enabled" : "Snap disabled"}
          >
            <Magnet className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleZoomOut}
            disabled={currentZoom === 0}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleFit}
            title="Fit to data"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleZoomIn}
            disabled={currentZoom === ZOOM_LEVELS.length - 1}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main gantt area */}
      <div
        className="flex rounded-lg border bg-card overflow-hidden"
        style={{ height: 550, width: measuredWidth || "100%" }}
      >
        {tableExpanded && (
          <>
            <div style={{ width: tableWidth, minWidth: tableWidth }}>
              <GanttTable
                rows={rows}
                headerRows={headerRows.length}
                grid={grid}
                zoomIndex={currentZoom}
                selectedId={selectedId}
                onSelect={handleSelect}
                onNameChange={handleNameChange}
                scrollTop={scrollTop}
                onScroll={setScrollTop}
              />
            </div>
            <GanttDivider onDrag={handleDividerDrag} />
          </>
        )}

        <GanttCanvas
          rows={rows}
          grid={grid}
          gridTemplate={gridTemplate}
          headerRows={headerRows}
          snapEnabled={snapEnabled}
          selectedId={selectedId}
          onSelect={handleSelect}
          onEventDragEnd={handleEventDragEnd}
          onEraDragEnd={handleEraDragEnd}
          scrollTop={scrollTop}
          onScroll={setScrollTop}
        />
      </div>
    </div>
  );
}
