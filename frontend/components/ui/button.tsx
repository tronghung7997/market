"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Slot } from "@radix-ui/react-slot";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  asChild?: boolean;
}

const VARIANTS = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400",
  ghost:
    "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
  danger:
    "bg-red-600 text-white hover:bg-red-700 shadow-sm",
} as const;

const SIZES = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-4 text-[13px] gap-2",
  lg: "h-11 px-5 text-sm gap-2",
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      block,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 cursor-pointer",
          "disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
          VARIANTS[variant],
          SIZES[size],
          block && "w-full",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
