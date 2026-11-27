"use client";

import { Button } from "@loreum/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@loreum/ui/dialog";
import { Undo2 } from "lucide-react";

export interface LedgerEntry {
  id: string;
  createdAt: string;
  operation: "CREATE" | "UPDATE" | "DELETE" | "UNDO";
  targetModel: string;
  targetId: string;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  undoneByEntryId: string | null;
  undoOfEntryId: string | null;
  actorType: string;
  actorId: string;
  actorLabel: string | null;
}

const SKIP_FIELDS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "projectId",
  "chapterId",
  "workId",
  "plotlineId",
  "locationId",
  "timelineEventId",
]);

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "(empty)";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

function fieldLabel(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function ChangedFieldsTable({
  before,
  after,
}: {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}) {
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed: { key: string; oldVal: unknown; newVal: unknown }[] = [];

  for (const key of allKeys) {
    if (SKIP_FIELDS.has(key)) continue;
    const oldVal = before[key];
    const newVal = after[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changed.push({ key, oldVal, newVal });
    }
  }

  if (changed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No visible field changes.</p>
    );
  }

  return (
    <div className="space-y-2">
      {changed.map(({ key, oldVal, newVal }) => (
        <div key={key} className="rounded border text-xs">
          <div className="border-b bg-muted/50 px-2 py-1 font-medium">
            {fieldLabel(key)}
          </div>
          <div className="grid grid-cols-2 divide-x">
            <div className="bg-red-50 px-2 py-1.5 dark:bg-red-950/30">
              <span className="text-muted-foreground">Current: </span>
              <span className="break-all">{formatValue(newVal)}</span>
            </div>
            <div className="bg-green-50 px-2 py-1.5 dark:bg-green-950/30">
              <span className="text-muted-foreground">Revert to: </span>
              <span className="break-all">{formatValue(oldVal)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DataSummary({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([k]) => !SKIP_FIELDS.has(k));
  if (entries.length === 0) return null;

  return (
    <div className="rounded border text-xs">
      <table className="w-full">
        <tbody>
          {entries.map(([key, val]) => (
            <tr key={key} className="border-b last:border-b-0">
              <td className="bg-muted/50 px-2 py-1 font-medium align-top w-1/3">
                {fieldLabel(key)}
              </td>
              <td className="px-2 py-1 break-all">{formatValue(val)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface UndoPreviewDialogProps {
  entry: LedgerEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  confirming: boolean;
}

export function UndoPreviewDialog({
  entry,
  open,
  onOpenChange,
  onConfirm,
  confirming,
}: UndoPreviewDialogProps) {
  if (!entry) return null;

  const name =
    (entry.afterData as Record<string, unknown> | null)?.name ??
    (entry.afterData as Record<string, unknown> | null)?.title ??
    (entry.beforeData as Record<string, unknown> | null)?.name ??
    (entry.beforeData as Record<string, unknown> | null)?.title ??
    entry.targetId.slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Undo {entry.operation.toLowerCase()}</DialogTitle>
          <DialogDescription>
            {entry.operation === "CREATE" && (
              <>
                Undoing this will <strong>delete</strong> the{" "}
                {entry.targetModel.toLowerCase()} &ldquo;{String(name)}&rdquo;.
              </>
            )}
            {entry.operation === "UPDATE" && (
              <>
                Undoing this will <strong>revert</strong> the{" "}
                {entry.targetModel.toLowerCase()} &ldquo;{String(name)}&rdquo;
                to its previous state.
              </>
            )}
            {entry.operation === "DELETE" && (
              <>
                Undoing this will <strong>restore</strong> the deleted{" "}
                {entry.targetModel.toLowerCase()} &ldquo;{String(name)}&rdquo;.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {entry.operation === "UPDATE" &&
            entry.beforeData &&
            entry.afterData && (
              <ChangedFieldsTable
                before={entry.beforeData}
                after={entry.afterData}
              />
            )}
          {entry.operation === "CREATE" && entry.afterData && (
            <DataSummary data={entry.afterData} />
          )}
          {entry.operation === "DELETE" && entry.beforeData && (
            <DataSummary data={entry.beforeData} />
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={confirming}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={confirming}>
            <Undo2 className="mr-1 h-4 w-4" />
            {confirming ? "Undoing..." : "Confirm undo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
