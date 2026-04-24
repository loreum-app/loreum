"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Key, Trash2 } from "lucide-react";
import { CreateApiKeyDialog } from "@/components/dialogs/create-api-key-dialog";

interface ApiKey {
  id: string;
  name: string;
  permissions: "READ_ONLY" | "READ_WRITE";
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface NewApiKey extends ApiKey {
  key: string;
}

interface ApiKeysPanelProps {
  projectSlug: string;
}

export function ApiKeysPanel({ projectSlug }: ApiKeysPanelProps) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    api<ApiKey[]>(`/projects/${projectSlug}/api-keys`)
      .then(setKeys)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectSlug]);

  const handleCreated = (newKey: NewApiKey) => {
    setKeys((prev) => [newKey, ...prev]);
    setRevealedKey(newKey.key);
    setDialogOpen(false);
  };

  const handleRevoke = async (keyId: string) => {
    setRevoking(keyId);
    try {
      await api(`/projects/${projectSlug}/api-keys/${keyId}`, {
        method: "DELETE",
      });
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch {
      // ignore
    } finally {
      setRevoking(null);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Manage API keys for MCP and programmatic access.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Key className="mr-2 h-4 w-4" />
          Create key
        </Button>
      </div>

      {revealedKey && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="mb-2 text-sm font-medium">
            Copy your API key now — it won't be shown again.
          </p>
          <code className="block break-all rounded bg-muted px-3 py-2 text-sm">
            {revealedKey}
          </code>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              navigator.clipboard.writeText(revealedKey);
            }}
          >
            Copy to clipboard
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : keys.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Key className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No API keys yet. Create one to use with MCP or the API.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{k.name}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {k.permissions === "READ_ONLY" ? "Read" : "Read / Write"}
                  </span>
                </div>
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                  <span>Created {formatDate(k.createdAt)}</span>
                  {k.lastUsedAt && (
                    <span>Last used {formatDate(k.lastUsedAt)}</span>
                  )}
                  {k.expiresAt && (
                    <span>Expires {formatDate(k.expiresAt)}</span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRevoke(k.id)}
                disabled={revoking === k.id}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <CreateApiKeyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectSlug={projectSlug}
        onCreated={handleCreated}
      />
    </section>
  );
}
