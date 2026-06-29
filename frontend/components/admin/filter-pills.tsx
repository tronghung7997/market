"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface FilterPillsProps {
  options: { key: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterPills({ options, value, onChange, className }: FilterPillsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => onChange(option.key)}
          className={cn(
            "px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors",
            value === option.key
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
