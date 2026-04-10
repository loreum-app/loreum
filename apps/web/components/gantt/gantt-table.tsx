"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@loreum/ui/input";
import type { GanttRow, GridConfig } from "./gantt-types";
import {
  ROW_HEIGHT,
  ERA_ROW_HEIGHT,
  SCALE_ROW_HEIGHT,
  formatDuration,
  valueToCol,
} from "./gantt-utils";

interface GanttTableProps {
  rows: GanttRow[];
  headerRows: number;
  grid: GridConfig;
  zoomIndex: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNameChange: (eventId: string, name: string) => void;
  scrollTop: number;
  onScroll: (scrollTop: number) => void;
}

export function GanttTable({
  rows,
  headerRows,
  grid,
  zoomIndex,
  selectedId,
  onSelect,
  onNameChange,
  scrollTop,
  onScroll,
}: GanttTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    if (scrollRef.current && !isSyncing.current) {
      isSyncing.current = true;
      scrollRef.current.scrollTop = scrollTop;
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    }
  }, [scrollTop]);

  const handleScroll = () => {
    if (isSyncing.current) return;
    if (scrollRef.current) onScroll(scrollRef.current.scrollTop);
  };

  const startEditing = (eventId: string, currentName: string) => {
    setEditingId(eventId);
    setEditValue(currentName);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim())
      onNameChange(editingId, editValue.trim());
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full border-r border-border">
      <div
        className="sticky top-0 z-10 bg-card border-b border-border grid grid-cols-[1fr_80px] gap-0"
        style={{ height: headerRows * SCALE_ROW_HEIGHT }}
      >
        <div className="flex items-end px-2 pb-1 text-[10px] font-medium text-muted-foreground">
          Event
        </div>
        <div className="flex items-end px-2 pb-1 text-[10px] font-medium text-muted-foreground">
          Duration
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        onScroll={handleScroll}
      >
        {rows.map((row) => {
          if (row.type === "era") {
            return (
              <div
                key={`era-${row.era.id}`}
                className="flex items-center px-2 font-bold text-xs truncate"
                style={{
                  height: ERA_ROW_HEIGHT,
                  borderLeft: `3px solid ${row.era.color}`,
                  color: row.era.color,
                }}
              >
                {row.era.name}
              </div>
            );
          }

          const { event } = row;
          const isSelected = selectedId === event.id;
          const isEditing = editingId === event.id;

          return (
            <div
              key={`event-${event.id}`}
              className={`grid grid-cols-[1fr_80px] gap-0 items-center cursor-pointer hover:bg-muted/50 ${isSelected ? "bg-accent" : ""}`}
              style={{ height: ROW_HEIGHT }}
              onClick={() => onSelect(event.id)}
            >
              <div className="px-2 truncate">
                {isEditing ? (
                  <Input
                    className="h-6 text-xs py-0 px-1"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <span
                    className="text-xs truncate block"
                    onDoubleClick={() => startEditing(event.id, event.name)}
                  >
                    {event.name}
                  </span>
                )}
              </div>
              <div className="px-2 text-[10px] text-muted-foreground truncate">
                {formatDuration(
                  valueToCol(event.start, grid),
                  valueToCol(event.end, grid),
                  zoomIndex,
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
