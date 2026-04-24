"use client";

import { useParams } from "next/navigation";
import { ApiKeysPanel } from "@/components/api-keys-panel";

export default function SettingsPage() {
  const params = useParams<{ slug: string }>();

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-6">Settings</h1>
      <div className="space-y-8">
        <ApiKeysPanel projectSlug={params.slug} />
      </div>
    </div>
  );
}
