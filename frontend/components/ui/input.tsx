"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          "h-10 w-full rounded-lg bg-white border border-slate-300 px-3 text-sm text-slate-900",
          "placeholder:text-slate-400 transition-colors",
          "focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:bg-white",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
