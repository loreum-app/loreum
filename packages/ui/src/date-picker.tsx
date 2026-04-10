"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "./lib/utils";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  minYear?: number;
  maxYear?: number;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  minYear = 1900,
  maxYear = 3000,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const isValid = value && !isNaN(value.getTime());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex h-9 items-center justify-start gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer",
          !isValid && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon className="h-4 w-4" />
        {isValid ? format(value, "PPP") : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={isValid ? value : undefined}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          captionLayout="dropdown"
          startMonth={new Date(minYear, 0)}
          endMonth={new Date(maxYear, 11)}
          defaultMonth={isValid ? value : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
