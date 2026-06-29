"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface PaginationProps {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  perPage,
  total,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = Math.min((page - 1) * perPage + 1, total);
  const end = Math.min(page * perPage, total);

  if (total === 0) return null;

  return (
    <div className={cn("flex items-center justify-between text-[12px]", className)}>
      <span className="text-slate-500">
        Hiển thị {start}–{end} / {total}
      </span>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="px-3 py-1.5 text-slate-500">
          {page} / {totalPages}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 px-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
