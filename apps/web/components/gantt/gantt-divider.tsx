"use client";

import { useRef } from "react";

interface GanttDividerProps {
  onDrag: (deltaX: number) => void;
}

export function GanttDivider({ onDrag }: GanttDividerProps) {
  const startXRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;

    const handlePointerMove = (ev: PointerEvent) => {
      const delta = ev.clientX - startXRef.current;
      startXRef.current = ev.clientX;
      onDrag(delta);
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div
      className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-primary/30 transition-colors"
      onPointerDown={handlePointerDown}
    />
  );
}
