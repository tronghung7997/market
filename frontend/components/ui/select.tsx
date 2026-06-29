"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => {
    return (
      <select
        className={cn(
          "h-10 w-full rounded-lg bg-white border border-slate-300 px-3 text-sm text-slate-900",
          "transition-colors cursor-pointer",
          "focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Select.displayName = "Select";
