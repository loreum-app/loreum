"use client";

import { useRef, useState } from "react";
import type { GanttEvent, GridConfig, DragMode } from "./gantt-types";
import { getBarColor, valueToCol, colToValue, ROW_HEIGHT } from "./gantt-utils";

interface GanttBarProps {
  event: GanttEvent;
  grid: GridConfig;
  gridTemplate: string;
  snapEnabled: boolean;
  isSelected: boolean;
  onSelect: (eventId: string) => void;
  onDragEnd: (eventId: string, newStart: number, newEnd: number) => void;
}

const EDGE_WIDTH = 8;

export function GanttBar({
  event,
  grid,
  gridTemplate,
  snapEnabled,
  isSelected,
  onSelect,
  onDragEnd,
}: GanttBarProps) {
  const startCol = valueToCol(event.start, grid);
  const endCol = valueToCol(event.end, grid);
  const color = getBarColor(event);

  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    origStartCol: number;
    origEndCol: number;
    cellWidth: number;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ mode: DragMode; deltaCols: number } | null>(null);

  // Apply drag offset
  let displayStartCol = startCol;
  let displayEndCol = Math.max(endCol, startCol + 1);

  if (dragOffset) {
    switch (dragOffset.mode) {
      case "move":
        displayStartCol += dragOffset.deltaCols;
        displayEndCol += dragOffset.deltaCols;
        break;
      case "resize-start":
        displayStartCol += dragOffset.deltaCols;
        if (displayStartCol >= displayEndCol) displayStartCol = displayEndCol - 1;
        break;
      case "resize-end":
        displayEndCol += dragOffset.deltaCols;
        if (displayEndCol <= displayStartCol) displayEndCol = displayStartCol + 1;
        break;
    }
  }

  // Clamp to grid bounds
  displayStartCol = Math.max(1, Math.min(displayStartCol, grid.cellCount));
  displayEndCol = Math.max(displayStartCol + 1, Math.min(displayEndCol, grid.cellCount + 1));

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const cellWidth = rect.width / (endCol - startCol);

    let mode: DragMode = "move";
    if (localX <= EDGE_WIDTH) mode = "resize-start";
    else if (localX >= rect.width - EDGE_WIDTH) mode = "resize-end";

    dragRef.current = {
      mode,
      startX: e.clientX,
      origStartCol: startCol,
      origEndCol: endCol,
      cellWidth: Math.max(cellWidth, 1),
    };

    const handlePointerMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const deltaX = ev.clientX - dragRef.current.startX;
      const deltaCols = snapEnabled
        ? Math.round(deltaX / dragRef.current.cellWidth)
        : Math.round(deltaX / dragRef.current.cellWidth);
      setDragOffset({ mode: dragRef.current.mode, deltaCols });
    };

    const handlePointerUp = (ev: PointerEvent) => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      if (!dragRef.current) return;

      const deltaX = ev.clientX - dragRef.current.startX;
      setDragOffset(null);

      if (Math.abs(deltaX) < 3) {
        onSelect(event.id);
        dragRef.current = null;
        return;
      }

      const deltaCols = Math.round(deltaX / dragRef.current.cellWidth);
      let newStartCol = dragRef.current.origStartCol;
      let newEndCol = dragRef.current.origEndCol;

      switch (dragRef.current.mode) {
        case "move":
          newStartCol += deltaCols;
          newEndCol += deltaCols;
          break;
        case "resize-start":
          newStartCol += deltaCols;
          if (newStartCol >= newEndCol) newStartCol = newEndCol - 1;
          break;
        case "resize-end":
          newEndCol += deltaCols;
          if (newEndCol <= newStartCol) newEndCol = newStartCol + 1;
          break;
      }

      newStartCol = Math.max(1, Math.min(newStartCol, grid.cellCount));
      newEndCol = Math.max(newStartCol + 1, Math.min(newEndCol, grid.cellCount + 1));

      dragRef.current = null;
      onDragEnd(event.id, colToValue(newStartCol, grid), colToValue(newEndCol, grid));
    };

    document.body.style.cursor = mode === "move" ? "grabbing" : "ew-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: gridTemplate, height: ROW_HEIGHT }}>
      <div
        className={`flex items-center rounded px-1.5 text-[11px] text-white font-medium truncate select-none my-1 ${
          isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
        }`}
        style={{
          gridColumn: `${displayStartCol} / ${displayEndCol}`,
          backgroundColor: color,
          cursor: dragOffset ? (dragOffset.mode === "move" ? "grabbing" : "ew-resize") : "grab",
        }}
        onPointerDown={handlePointerDown}
      >
        {/* Left resize handle */}
        <div className="absolute left-0 top-0 bottom-0 cursor-ew-resize" style={{ width: EDGE_WIDTH }} />
        <span className="truncate pointer-events-none">{event.name}</span>
        {/* Right resize handle */}
        <div className="absolute right-0 top-0 bottom-0 cursor-ew-resize" style={{ width: EDGE_WIDTH }} />
      </div>
    </div>
  );
}
