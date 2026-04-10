"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "./lib/utils";
import { CheckIcon, ChevronsUpDown, Plus, Search } from "lucide-react";

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onCreate?: (query: string) => void;
  createLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  onCreate,
  createLabel = "Create",
  className,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.sublabel?.toLowerCase().includes(q),
    );
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue === value ? "" : optionValue);
    setOpen(false);
    setQuery("");
  };

  const handleCreate = () => {
    if (onCreate && query.trim()) {
      onCreate(query.trim());
      setQuery("");
      setOpen(false);
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        disabled={disabled}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50",
          !selected && "text-muted-foreground",
          className,
        )}
      >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side="bottom"
          sideOffset={4}
          align="start"
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup className="z-50 w-(--anchor-width) min-w-48 origin-(--transform-origin) rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <div className="flex items-center gap-2 border-b px-2 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            <div className="max-h-56 overflow-y-auto p-1">
              {filtered.length === 0 && !onCreate && (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </p>
              )}
              {filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className="flex w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground"
                >
                  <CheckIcon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex-1 truncate text-left">
                    {option.label}
                  </span>
                  {option.sublabel && (
                    <span className="text-xs text-muted-foreground">
                      {option.sublabel}
                    </span>
                  )}
                </button>
              ))}
              {onCreate &&
                query.trim() &&
                filtered.every(
                  (o) => o.label.toLowerCase() !== query.trim().toLowerCase(),
                ) && (
                  <button
                    type="button"
                    onClick={handleCreate}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground outline-hidden hover:bg-accent hover:text-accent-foreground"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {createLabel} &ldquo;{query.trim()}&rdquo;
                    </span>
                  </button>
                )}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
