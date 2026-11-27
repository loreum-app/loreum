"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@loreum/ui/card";
import { History, Undo2 } from "lucide-react";

interface LedgerEntry {
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

interface HistoryResponse {
  entries: LedgerEntry[];
  total: number;
}

const operationStyles: Record<string, string> = {
  CREATE:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  UNDO: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

function actorDisplay(entry: LedgerEntry): string {
  if (entry.actorLabel) return entry.actorLabel;
  if (entry.actorType === "user") return "You";
  if (entry.actorType === "api_key") return "API key";
  if (entry.actorType === "oauth_connection") return "MCP client";
  return entry.actorType;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 10;

interface HistorySectionProps {
  projectSlug: string;
  targetModel: string;
  targetId: string;
}

export function HistorySection({
  projectSlug,
  targetModel,
  targetId,
}: HistorySectionProps) {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [undoing, setUndoing] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let stale = false;
    setLoading(true);
    const qs = new URLSearchParams({
      targetModel,
      targetId,
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });

    api<HistoryResponse>(`/projects/${projectSlug}/history?${qs}`)
      .then((res) => {
        if (!stale) setData(res);
      })
      .catch(() => {
        if (!stale) setData({ entries: [], total: 0 });
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });

    return () => {
      stale = true;
    };
  }, [projectSlug, targetModel, targetId, page, refreshKey]);

  const handleUndo = async (entryId: string) => {
    setUndoing(entryId);
    try {
      await api(`/projects/${projectSlug}/history/${entryId}/undo`, {
        method: "POST",
      });
      setRefreshKey((k) => k + 1);
    } catch {
      // silent — entry stays unchanged
    } finally {
      setUndoing(null);
    }
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  if (loading && !data) return null;
  if (!data || data.total === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Change History
          </CardTitle>
          <Link
            href={`/projects/${projectSlug}/history?targetModel=${targetModel}`}
            className="text-xs text-muted-foreground hover:underline"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.entries.map((entry) => {
          const isUndone = !!entry.undoneByEntryId;
          const canUndo = !isUndone && entry.operation !== "UNDO";

          return (
            <div
              key={entry.id}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs ${
                isUndone ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    operationStyles[entry.operation] ?? ""
                  }`}
                >
                  {entry.operation}
                </span>
                <span className="text-muted-foreground truncate">
                  {formatDate(entry.createdAt)} &middot; {actorDisplay(entry)}
                </span>
                {isUndone && (
                  <span className="text-muted-foreground">(undone)</span>
                )}
              </div>
              {canUndo && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleUndo(entry.id)}
                  disabled={undoing === entry.id}
                >
                  <Undo2 className="mr-1 h-3 w-3" />
                  {undoing === entry.id ? "..." : "Undo"}
                </Button>
              )}
            </div>
          );
        })}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {data.total} {data.total === 1 ? "entry" : "entries"}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
              >
                Prev
              </Button>
              <span className="text-xs text-muted-foreground">
                {page + 1}/{totalPages}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => setPage((p) => p + 1)}
                disabled={page + 1 >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
