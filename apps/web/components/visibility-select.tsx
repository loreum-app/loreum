"use client";

import type { ProjectVisibility } from "@loreum/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";

export const VISIBILITY_OPTIONS: {
  value: ProjectVisibility;
  label: string;
  description: string;
}[] = [
  {
    value: "PRIVATE",
    label: "Private",
    description: "Only you can see this project",
  },
  {
    value: "PUBLIC",
    label: "Public",
    description: "Anyone can view the wiki",
  },
  {
    value: "UNLISTED",
    label: "Unlisted",
    description: "Accessible via direct link only",
  },
];

export function isProjectVisibility(
  value: string | null,
): value is ProjectVisibility {
  return VISIBILITY_OPTIONS.some((o) => o.value === value);
}

interface VisibilitySelectProps {
  id?: string;
  value: ProjectVisibility;
  onChange: (value: ProjectVisibility) => void;
  className?: string;
  disabled?: boolean;
}

export function VisibilitySelect({
  id,
  value,
  onChange,
  className,
  disabled,
}: VisibilitySelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (isProjectVisibility(next)) onChange(next);
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {VISIBILITY_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
