"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "w-full rounded-lg bg-white border border-slate-300 px-3 py-2.5 text-sm text-slate-900",
          "placeholder:text-slate-400 transition-colors resize-y min-h-[80px]",
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
Textarea.displayName = "Textarea";
