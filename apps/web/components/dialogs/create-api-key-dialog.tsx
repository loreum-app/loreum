"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@loreum/ui/dialog";
import { Input } from "@loreum/ui/input";
import { Label } from "@loreum/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  onCreated: (key: {
    id: string;
    name: string;
    permissions: "READ_ONLY" | "READ_WRITE";
    lastUsedAt: null;
    expiresAt: string | null;
    createdAt: string;
    key: string;
  }) => void;
}

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  projectSlug,
  onCreated,
}: CreateApiKeyDialogProps) {
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<"READ_ONLY" | "READ_WRITE">(
    "READ_WRITE",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await api<{
        id: string;
        name: string;
        permissions: "READ_ONLY" | "READ_WRITE";
        expiresAt: string | null;
        createdAt: string;
        key: string;
      }>(`/projects/${projectSlug}/api-keys`, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          permissions,
        }),
      });
      setName("");
      setPermissions("READ_WRITE");
      onCreated({ ...result, lastUsedAt: null });
    } catch {
      setError("Failed to create API key");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>
              Generate a key for MCP or programmatic access to this project.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Claude Desktop"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key-permissions">Permissions</Label>
              <Select
                value={permissions}
                onValueChange={(v) =>
                  setPermissions(v as "READ_ONLY" | "READ_WRITE")
                }
              >
                <SelectTrigger id="key-permissions">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="READ_WRITE">Read & Write</SelectItem>
                  <SelectItem value="READ_ONLY">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "Creating..." : "Create key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
