"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, mcpUrlForProject } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Key, Trash2 } from "lucide-react";
import { CreateApiKeyDialog } from "@/components/dialogs/create-api-key-dialog";
import { CopyBlock, CopyField } from "@/components/connect-ai-panel";

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
  const mcpUrl = mcpUrlForProject(projectSlug);
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
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-medium">
            <Key className="h-5 w-5" />
            API keys
          </h2>
          <p className="text-sm text-muted-foreground">
            For scripts, the REST API, and MCP clients that can&apos;t sign in
            with OAuth. Most people should use <b>Connect AI</b> above instead.
          </p>
        </div>
        <Button variant="outline" onClick={() => setDialogOpen(true)}>
          <Key className="mr-2 h-4 w-4" />
          Create key
        </Button>
      </div>

      {revealedKey && (
        <div className="mb-4 space-y-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div>
            <p className="mb-2 text-sm font-medium">
              Copy your API key now — it won&apos;t be shown again.
            </p>
            <CopyField value={revealedKey} />
          </div>
          <div className="space-y-3 border-t border-amber-500/20 pt-4">
            <p className="text-sm font-medium">Use it with an MCP client</p>
            <p className="text-xs text-muted-foreground">
              Claude Code — run this in your terminal:
            </p>
            <CopyBlock
              value={`claude mcp add --transport http loreum-${projectSlug} ${mcpUrl} --header "Authorization: Bearer ${revealedKey}"`}
            />
            <p className="text-xs text-muted-foreground">
              JSON-configured clients (Cursor, Windsurf, etc.):
            </p>
            <CopyBlock
              value={JSON.stringify(
                {
                  mcpServers: {
                    loreum: {
                      url: mcpUrl,
                      headers: { Authorization: `Bearer ${revealedKey}` },
                    },
                  },
                },
                null,
                2,
              )}
            />
            <p className="text-xs text-muted-foreground">
              REST: send the same <code>Authorization</code> header to{" "}
              <code>/v1/projects/{projectSlug}/…</code>. See the{" "}
              <Link
                href="/docs/mcp"
                className="underline hover:text-foreground"
              >
                MCP documentation
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : keys.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No API keys. You only need one for scripts or clients without OAuth
            support.
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
