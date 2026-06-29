"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "good" | "warn" | "bad" | "iris" | "neutral";

const TONE_STYLES: Record<Tone, string> = {
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
  bad: "bg-red-50 text-red-700 border-red-200",
  iris: "bg-indigo-50 text-indigo-700 border-indigo-200",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none transition-colors",
        TONE_STYLES[tone],
        className
      )}
      {...props}
    />
  );
}
