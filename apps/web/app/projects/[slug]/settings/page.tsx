"use client";

import { useParams } from "next/navigation";
import { ConnectAiPanel } from "@/components/connect-ai-panel";
import { ApiKeysPanel } from "@/components/api-keys-panel";

export default function SettingsPage() {
  const params = useParams<{ slug: string }>();

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-6">Settings</h1>
      <div className="max-w-3xl space-y-10">
        <ConnectAiPanel projectSlug={params.slug} />
        <ApiKeysPanel projectSlug={params.slug} />
      </div>
    </div>
  );
}
