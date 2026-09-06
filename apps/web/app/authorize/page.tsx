"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Globe, Laptop, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Label } from "@loreum/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";

type Permission = "READ_ONLY" | "READ_WRITE";

interface ConsentContext {
  client: {
    clientId: string;
    name: string;
    uri: string | null;
    logoUri: string | null;
    redirectHost: string;
    isLoopbackRedirect: boolean;
  };
  requestedScopes: ("read" | "write")[];
  project: { slug: string; name: string } | null;
  projectUnavailable: boolean;
  projects: { slug: string; name: string }[];
}

const AUTHORIZE_KEYS = [
  "response_type",
  "client_id",
  "redirect_uri",
  "code_challenge",
  "code_challenge_method",
  "scope",
  "state",
  "resource",
] as const;

export default function AuthorizePage() {
  return (
    <Suspense fallback={<Centered>Loading...</Centered>}>
      <AuthorizeInner />
    </Suspense>
  );
}

function AuthorizeInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(() => {
    const out: Record<string, string> = {};
    for (const k of AUTHORIZE_KEYS) {
      const v = searchParams.get(k);
      if (v) out[k] = v;
    }
    return out;
  }, [searchParams]);

  const [ctx, setCtx] = useState<ConsentContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectSlug, setProjectSlug] = useState<string>("");
  const [permission, setPermission] = useState<Permission>("READ_WRITE");
  const [submitting, setSubmitting] = useState<"allow" | "deny" | null>(null);

  // Not signed in: go sign in, then come straight back here.
  useEffect(() => {
    if (authLoading || user) return;
    const returnTo = `${pathname}?${searchParams.toString()}`;
    router.replace(`/auth/signin?return_to=${encodeURIComponent(returnTo)}`);
  }, [authLoading, user, pathname, searchParams, router]);

  useEffect(() => {
    if (!user) return;
    const qs = new URLSearchParams(params).toString();
    api<ConsentContext>(`/oauth/consent?${qs}`)
      .then((c) => {
        setCtx(c);
        setProjectSlug(c.project?.slug ?? c.projects[0]?.slug ?? "");
        setPermission(
          c.requestedScopes.includes("write") ? "READ_WRITE" : "READ_ONLY",
        );
      })
      .catch((e: unknown) => {
        setError(
          e instanceof ApiError
            ? e.message
            : "This authorization request is invalid.",
        );
      });
  }, [user, params]);

  const decide = async (decision: "allow" | "deny") => {
    setSubmitting(decision);
    setError(null);
    try {
      const { redirect } = await api<{ redirect: string }>("/oauth/consent", {
        method: "POST",
        body: JSON.stringify({
          ...params,
          decision,
          projectSlug: decision === "allow" ? projectSlug : undefined,
          permissions: decision === "allow" ? permission : undefined,
        }),
      });
      window.location.assign(redirect);
    } catch (e: unknown) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Something went wrong. Please try again.",
      );
      setSubmitting(null);
    }
  };

  if (authLoading || !user) return <Centered>Loading...</Centered>;

  if (error && !ctx) {
    return (
      <Centered>
        <div className="w-full max-w-md space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
          <p className="font-medium">Can&apos;t continue</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">
            Go back to the app that sent you here and try connecting again.
          </p>
        </div>
      </Centered>
    );
  }

  if (!ctx) return <Centered>Loading...</Centered>;

  const canWrite = ctx.requestedScopes.includes("write");
  const fixedProject = ctx.project;
  const noProject = !fixedProject && ctx.projects.length === 0;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center px-4 py-12 md:items-center">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            {ctx.client.logoUri ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote logo from the OAuth client
              <img
                src={ctx.client.logoUri}
                alt=""
                className="h-10 w-10 rounded-md object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-lg font-semibold">
                {ctx.client.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="text-muted-foreground">→</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              Connect <span className="text-primary">{ctx.client.name}</span> to
              Loreum
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {ctx.client.name} wants to read
              {canWrite ? " and change" : ""} the contents of one of your worlds
              through MCP.
            </p>
          </div>
        </div>

        {ctx.projectUnavailable && (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
            The app asked for a world you don&apos;t own. Pick one of yours
            below or cancel.
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="consent-project">World</Label>
            {fixedProject ? (
              <div
                id="consent-project"
                className="rounded-md border bg-muted/40 px-3 py-2 text-sm font-medium"
              >
                {fixedProject.name}
              </div>
            ) : noProject ? (
              <p className="text-sm text-muted-foreground">
                You don&apos;t have any worlds yet. Create one in Loreum first,
                then connect.
              </p>
            ) : (
              <Select
                value={projectSlug}
                onValueChange={(v) => v && setProjectSlug(v)}
              >
                <SelectTrigger id="consent-project" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ctx.projects.map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Access level</Label>
            <div className="grid grid-cols-2 gap-2">
              <PermissionOption
                selected={permission === "READ_WRITE"}
                disabled={!canWrite}
                title="Read & write"
                description="Can create and edit entities, lore, timeline, and story content."
                onClick={() => setPermission("READ_WRITE")}
              />
              <PermissionOption
                selected={permission === "READ_ONLY"}
                title="Read only"
                description="Can search and read your world but never change it."
                onClick={() => setPermission("READ_ONLY")}
              />
            </div>
            {!canWrite && (
              <p className="text-xs text-muted-foreground">
                {ctx.client.name} only asked for read access.
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-md border p-3 text-xs text-muted-foreground">
            {ctx.client.isLoopbackRedirect ? (
              <Laptop className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Globe className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>
              After you allow, you&apos;ll be sent to{" "}
              <span className="font-mono text-foreground">
                {ctx.client.redirectHost}
              </span>
              {ctx.client.isLoopbackRedirect
                ? " — an app running on this computer. Only continue if you just started this from an app you trust."
                : "."}{" "}
              You can revoke access any time from the world&apos;s settings.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={submitting !== null}
            onClick={() => decide("deny")}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={submitting !== null || noProject || !projectSlug}
            onClick={() => decide("allow")}
          >
            <ShieldCheck className="h-4 w-4" />
            {submitting === "allow" ? "Connecting..." : "Allow access"}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Signed in as {user.email}
        </p>
      </div>
    </div>
  );
}

function PermissionOption({
  selected,
  disabled,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "rounded-md border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "border-primary bg-primary/10" : "hover:bg-muted",
      ].join(" ")}
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
