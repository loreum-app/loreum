"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loreum/ui/card";
import { History, ChevronLeft, ChevronRight, Undo2 } from "lucide-react";
import { UndoPreviewDialog } from "@/components/undo-preview-dialog";

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

const PAGE_SIZE = 50;

const operationStyles: Record<string, string> = {
  CREATE:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  UNDO: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

const TARGET_MODELS = [
  "Entity",
  "Relationship",
  "LoreArticle",
  "TimelineEvent",
  "Era",
  "ItemType",
  "Plotline",
  "PlotPoint",
  "Work",
  "Chapter",
  "Scene",
  "Project",
];

function entryName(entry: LedgerEntry): string {
  const data = entry.afterData ?? entry.beforeData;
  if (!data) return entry.targetId.slice(0, 8);
  const name =
    (data as Record<string, unknown>).name ??
    (data as Record<string, unknown>).title ??
    (data as Record<string, unknown>).label;
  return name ? String(name) : entry.targetId.slice(0, 8);
}

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

export default function HistoryPage() {
  const params = useParams<{ slug: string }>();
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [undoing, setUndoing] = useState<string | null>(null);
  const [previewEntry, setPreviewEntry] = useState<LedgerEntry | null>(null);
  const [filterModel, setFilterModel] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let stale = false;
    const qs = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (filterModel !== "all") qs.set("targetModel", filterModel);

    api<HistoryResponse>(`/projects/${params.slug}/history?${qs}`)
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
  }, [params.slug, page, filterModel, refreshKey]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleUndo = async (entryId: string) => {
    setUndoing(entryId);
    try {
      await api(`/projects/${params.slug}/history/${entryId}/undo`, {
        method: "POST",
      });
      setPreviewEntry(null);
      setRefreshKey((k) => k + 1);
    } catch {
      // Entry stays in its current state; the user sees it has not changed
    } finally {
      setUndoing(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1>Change History</h1>
          <p className="text-sm text-muted-foreground">
            Append-only ledger of all changes to this project
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Select
          value={filterModel}
          onValueChange={(v) => {
            setFilterModel(v ?? "all");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TARGET_MODELS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {data && (
          <span className="text-sm text-muted-foreground">
            {data.total} {data.total === 1 ? "entry" : "entries"}
          </span>
        )}
      </div>

      {data && data.entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <History className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">No history yet</p>
          <p className="text-sm text-muted-foreground">
            Changes to this project will appear here
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data?.entries.map((entry) => {
              const isUndone = !!entry.undoneByEntryId;
              const canUndo = !isUndone && entry.operation !== "UNDO";

              return (
                <Card
                  key={entry.id}
                  className={isUndone ? "opacity-60" : undefined}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                            operationStyles[entry.operation] ?? ""
                          }`}
                        >
                          {entry.operation}
                        </span>
                        <CardTitle className="text-sm font-medium">
                          {entry.targetModel}
                        </CardTitle>
                        <span className="text-sm text-muted-foreground truncate">
                          {entryName(entry)}
                        </span>
                        {isUndone && (
                          <span className="text-xs text-muted-foreground">
                            (undone)
                          </span>
                        )}
                      </div>
                      {canUndo && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewEntry(entry)}
                          disabled={undoing === entry.id}
                        >
                          <Undo2 className="mr-1 h-3.5 w-3.5" />
                          Undo
                        </Button>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {formatDate(entry.createdAt)} &middot;{" "}
                      {actorDisplay(entry)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {entry.targetId}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {data!.total} {data!.total === 1 ? "entry" : "entries"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page + 1 >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      <UndoPreviewDialog
        entry={previewEntry}
        open={!!previewEntry}
        onOpenChange={(open) => {
          if (!open) setPreviewEntry(null);
        }}
        onConfirm={() => {
          if (previewEntry) handleUndo(previewEntry.id);
        }}
        confirming={!!undoing}
      />
    </div>
  );
}
