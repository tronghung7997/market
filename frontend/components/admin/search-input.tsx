"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
