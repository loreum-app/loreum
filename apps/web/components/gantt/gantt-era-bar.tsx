"use client";

import { useRef, useState } from "react";
import type { GanttEra, GridConfig } from "./gantt-types";
import { valueToCol, colToValue, ERA_ROW_HEIGHT } from "./gantt-utils";

interface GanttEraBarProps {
  era: GanttEra;
  grid: GridConfig;
  gridTemplate: string;
  snapEnabled: boolean;
  onEraDragEnd: (eraId: string, delta: number) => void;
}

export function GanttEraBar({
  era,
  grid,
  gridTemplate,
  snapEnabled,
  onEraDragEnd,
}: GanttEraBarProps) {
  const startCol = valueToCol(era.start, grid);
  const endCol = Math.max(startCol + 1, valueToCol(era.end, grid));

  const dragRef = useRef<{
    startX: number;
    origStartCol: number;
    cellWidth: number;
  } | null>(null);
  const [deltaCols, setDeltaCols] = useState(0);

  const displayStartCol = Math.max(1, startCol + deltaCols);
  const displayEndCol = Math.max(displayStartCol + 1, endCol + deltaCols);

  console.log(`TODO: enable snap toggle ${snapEnabled}`);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cellWidth = rect.width / (endCol - startCol);

    dragRef.current = {
      startX: e.clientX,
      origStartCol: startCol,
      cellWidth: Math.max(cellWidth, 1),
    };

    const handlePointerMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const deltaX = ev.clientX - dragRef.current.startX;
      setDeltaCols(Math.round(deltaX / dragRef.current.cellWidth));
    };

    const handlePointerUp = (ev: PointerEvent) => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      if (!dragRef.current) return;

      const deltaX = ev.clientX - dragRef.current.startX;
      const finalDeltaCols = Math.round(deltaX / dragRef.current.cellWidth);
      setDeltaCols(0);
      dragRef.current = null;

      if (Math.abs(deltaX) < 3) return;

      const valueDelta =
        colToValue(startCol + finalDeltaCols, grid) -
        colToValue(startCol, grid);
      onEraDragEnd(era.id, valueDelta);
    };

    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: gridTemplate, height: ERA_ROW_HEIGHT }}
    >
      <div
        className="flex items-center rounded px-2 text-[11px] font-bold truncate select-none my-0.5"
        style={{
          gridColumn: `${displayStartCol} / ${displayEndCol}`,
          backgroundColor: era.color + "30",
          borderLeft: `3px solid ${era.color}`,
          color: era.color,
          cursor: deltaCols !== 0 ? "grabbing" : "grab",
        }}
        onPointerDown={handlePointerDown}
      >
        <span className="truncate pointer-events-none">{era.name}</span>
      </div>
    </div>
  );
}
