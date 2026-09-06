"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Check, Copy, Plug, Trash2 } from "lucide-react";
import { api, mcpUrlForProject } from "@/lib/api";
import { Button } from "@loreum/ui/button";

interface Connection {
  id: string;
  client: {
    clientId: string;
    name: string;
    uri: string | null;
    logoUri: string | null;
  };
  permissions: "READ_ONLY" | "READ_WRITE";
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

type ClientTab = "claude" | "claude-code" | "cursor" | "other";

const TABS: { id: ClientTab; label: string }[] = [
  { id: "claude", label: "Claude" },
  { id: "claude-code", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
  { id: "other", label: "Other clients" },
];

export function ConnectAiPanel({ projectSlug }: { projectSlug: string }) {
  const url = mcpUrlForProject(projectSlug);
  const [tab, setTab] = useState<ClientTab>("claude");
  const [connections, setConnections] = useState<Connection[] | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Connection[]>(`/projects/${projectSlug}/connections`)
      .then(setConnections)
      .catch(() => setConnections([]));
  }, [projectSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const revoke = async (id: string) => {
    setRevoking(id);
    try {
      await api(`/projects/${projectSlug}/connections/${id}`, {
        method: "DELETE",
      });
      setConnections((prev) => prev?.filter((c) => c.id !== id) ?? null);
    } catch {
      /* keep list */
    } finally {
      setRevoking(null);
    }
  };

  return (
    <section>
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <Bot className="h-5 w-5" />
          Connect AI
        </h2>
        <p className="text-sm text-muted-foreground">
          Give Claude, Cursor, or any MCP-compatible assistant access to this
          world. Each app signs in with your Loreum account and you approve what
          it can do.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            MCP server URL for this world
          </p>
          <CopyField value={url} />
        </div>

        <div>
          <div className="mb-3 flex flex-wrap gap-1 border-b">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={[
                  "-mb-px border-b-2 px-3 py-1.5 text-sm transition-colors",
                  tab === t.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "claude" && (
            <Steps
              intro="Works in Claude on the web, the desktop app, and mobile. No keys to copy: Claude opens a Loreum page where you approve access."
              steps={[
                <>
                  Open Claude → <b>Settings</b> → <b>Connectors</b> (or
                  Customize → Connectors).
                </>,
                <>
                  Choose <b>Add custom connector</b> and paste the URL above.
                  Leave the OAuth client fields empty.
                </>,
                <>
                  Click <b>Connect</b>. A Loreum page opens: pick read &amp;
                  write or read only, then <b>Allow access</b>.
                </>,
                <>
                  Enable the connector in a chat and ask about your world. It
                  also appears in Claude Code automatically.
                </>,
              ]}
            />
          )}

          {tab === "claude-code" && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Add the server, then authenticate in the browser when prompted
                (or run <code className="rounded bg-muted px-1">/mcp</code>{" "}
                inside Claude Code).
              </p>
              <CopyBlock
                value={`claude mcp add --transport http loreum-${projectSlug} ${url}`}
              />
              <p className="text-xs text-muted-foreground">
                Prefer a key instead of signing in? Create an API key below and
                add{" "}
                <code className="rounded bg-muted px-1">
                  --header &quot;Authorization: Bearer lrm_…&quot;
                </code>
                .
              </p>
            </div>
          )}

          {tab === "cursor" && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Add to{" "}
                <code className="rounded bg-muted px-1">.cursor/mcp.json</code>{" "}
                (or Settings → MCP → Add server). Cursor will open the Loreum
                approval page.
              </p>
              <CopyBlock
                value={JSON.stringify(
                  { mcpServers: { loreum: { url } } },
                  null,
                  2,
                )}
              />
            </div>
          )}

          {tab === "other" && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Any client that speaks MCP over Streamable HTTP works. Clients
                that support OAuth (ChatGPT developer mode, Windsurf, VS Code,
                the MCP Inspector…) discover Loreum&apos;s sign-in flow from the
                URL alone. Clients that only support static headers can use an
                API key from the section below:
              </p>
              <CopyBlock
                value={JSON.stringify(
                  {
                    mcpServers: {
                      loreum: {
                        url,
                        headers: { Authorization: "Bearer lrm_your_api_key" },
                      },
                    },
                  },
                  null,
                  2,
                )}
              />
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Full guide:{" "}
          <Link href="/docs/mcp" className="underline hover:text-foreground">
            MCP documentation
          </Link>
        </p>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Plug className="h-4 w-4" />
          Connected apps
        </h3>
        {connections === null ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : connections.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No apps are connected to this world yet. Apps you approve will
            appear here and can be disconnected at any time.
          </p>
        ) : (
          <ul className="space-y-2">
            {connections.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {c.client.name}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {c.permissions === "READ_ONLY" ? "Read" : "Read / Write"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>Connected {formatDate(c.createdAt)}</span>
                    <span>
                      {c.lastUsedAt
                        ? `Last used ${formatDate(c.lastUsedAt)}`
                        : "Not used yet"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revoke(c.id)}
                  disabled={revoking === c.id}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Disconnect
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Steps({ intro, steps }: { intro: string; steps: React.ReactNode[] }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">{intro}</p>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return { copied, copy };
}

export function CopyField({ value }: { value: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-3 py-2 text-sm">
        {value}
      </code>
      <Button
        variant="outline"
        size="sm"
        onClick={() => copy(value)}
        className="shrink-0"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

export function CopyBlock({ value }: { value: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border bg-muted p-3 pr-20 text-xs">
        {value}
      </pre>
      <Button
        variant="outline"
        size="xs"
        onClick={() => copy(value)}
        className="absolute right-2 top-2"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
