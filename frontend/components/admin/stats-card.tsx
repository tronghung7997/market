"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { StatusTone } from "./status-config";

const TONE_STYLES: Record<StatusTone, { bg: string; text: string; border: string; dot: string }> = {
  good: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  warn: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  bad: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  iris: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  neutral: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

export interface StatsCardProps {
  label: string;
  value: string | number;
  tone?: StatusTone;
  icon?: React.ReactNode;
  sub?: string;
  className?: string;
}

export function StatsCard({
  label,
  value,
  tone = "neutral",
  icon,
  sub,
  className,
}: StatsCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm",
        styles.border,
        className
      )}
    >
      {/* Accent bar at top */}
      <div className={cn("absolute inset-x-0 top-0 h-0.5", styles.dot)} />

      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-slate-500">{label}</p>
          <p
            className={cn(
              "mt-2 font-mono text-[26px] font-semibold tabular-nums leading-none truncate",
              styles.text
            )}
          >
            {value}
          </p>
          {sub && (
            <p className="mt-2 text-[11.5px] text-slate-400">{sub}</p>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              "ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              styles.bg,
              styles.text
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
