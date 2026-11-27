"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useProject } from "@/lib/project-context";
import { Button } from "@loreum/ui/button";
import { Label } from "@loreum/ui/label";
import { Textarea } from "@loreum/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";

interface StyleGuide {
  pov?: string | null;
  tense?: string | null;
  voice?: string | null;
  tone?: string | null;
  pacing?: string | null;
  dialogueRules?: string | null;
  proseStyle?: string | null;
  vocabulary?: string | null;
  customRules?: string | null;
}

const POV_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "first", label: "First person" },
  { value: "second", label: "Second person" },
  { value: "third-limited", label: "Third person (limited)" },
  { value: "third-omniscient", label: "Third person (omniscient)" },
];

const TENSE_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "past", label: "Past tense" },
  { value: "present", label: "Present tense" },
];

const TEXT_FIELDS: {
  key: keyof StyleGuide;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "voice",
    label: "Voice",
    placeholder:
      "Describe the narrative voice: formal vs. casual, literary vs. conversational, distant vs. intimate...",
  },
  {
    key: "tone",
    label: "Tone",
    placeholder:
      "Overall emotional register: dark, whimsical, clinical, warm, sardonic, epic...",
  },
  {
    key: "pacing",
    label: "Pacing",
    placeholder:
      "How scenes should flow: short punchy paragraphs for action, longer for introspection...",
  },
  {
    key: "dialogueRules",
    label: "Dialogue rules",
    placeholder:
      "Dialogue formatting: tag style, punctuation, dialect conventions, inner monologue...",
  },
  {
    key: "proseStyle",
    label: "Prose style",
    placeholder:
      "Sentence structure preferences: length variation, figurative language, sensory detail...",
  },
  {
    key: "vocabulary",
    label: "Vocabulary",
    placeholder:
      "Terminology preferences: banned words, preferred terms, in-world jargon, anachronisms to avoid...",
  },
  {
    key: "customRules",
    label: "Custom rules",
    placeholder:
      "Any additional conventions: chapter structure, scene transitions, POV switches, content guidelines...",
  },
];

export default function StyleGuidePage() {
  const { project } = useProject();
  const [guide, setGuide] = useState<StyleGuide>({});
  const [original, setOriginal] = useState<StyleGuide>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    api<StyleGuide>(`/projects/${project.slug}/style-guide`)
      .then((data) => {
        if (stale) return;
        const normalized = normalize(data);
        setGuide(normalized);
        setOriginal(normalized);
      })
      .catch(() => {
        if (!stale) setError("Failed to load style guide");
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [project.slug]);

  const normalize = (g: StyleGuide): StyleGuide => ({
    pov: g.pov ?? "",
    tense: g.tense ?? "",
    voice: g.voice ?? "",
    tone: g.tone ?? "",
    pacing: g.pacing ?? "",
    dialogueRules: g.dialogueRules ?? "",
    proseStyle: g.proseStyle ?? "",
    vocabulary: g.vocabulary ?? "",
    customRules: g.customRules ?? "",
  });

  const dirty = JSON.stringify(guide) !== JSON.stringify(original);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !dirty) return;

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const body: Record<string, string | undefined> = {};
      for (const key of Object.keys(guide) as (keyof StyleGuide)[]) {
        const val = guide[key];
        if (val !== original[key]) {
          body[key] = val || undefined;
        }
      }
      const updated = await api<StyleGuide>(
        `/projects/${project.slug}/style-guide`,
        { method: "PUT", body: JSON.stringify(body) },
      );
      const normalized = normalize(updated);
      setGuide(normalized);
      setOriginal(normalized);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save style guide",
      );
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: keyof StyleGuide, value: string) => {
    setGuide((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground">Loading style guide...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1>Style Guide</h1>
        <p className="text-sm text-muted-foreground">
          Define the voice, tone, and writing conventions for this world. AI
          tools and collaborators use these rules when writing prose.
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-3xl space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sg-pov">Point of view</Label>
            <Select
              value={guide.pov ?? ""}
              onValueChange={(v) => setField("pov", v ?? "")}
            >
              <SelectTrigger id="sg-pov">
                <SelectValue>
                  {(value: string | null) =>
                    POV_OPTIONS.find((o) => o.value === value)?.label ??
                    "Not set"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {POV_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sg-tense">Tense</Label>
            <Select
              value={guide.tense ?? ""}
              onValueChange={(v) => setField("tense", v ?? "")}
            >
              <SelectTrigger id="sg-tense">
                <SelectValue>
                  {(value: string | null) =>
                    TENSE_OPTIONS.find((o) => o.value === value)?.label ??
                    "Not set"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TENSE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {TEXT_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`sg-${key}`}>{label}</Label>
            <Textarea
              id={`sg-${key}`}
              value={(guide[key] as string) ?? ""}
              onChange={(e) => setField(key, e.target.value)}
              placeholder={placeholder}
              rows={3}
            />
          </div>
        ))}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving || !dirty}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {saved && !dirty && (
            <span className="text-sm text-muted-foreground">Saved</span>
          )}
        </div>
      </form>
    </div>
  );
}
