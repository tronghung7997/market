"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { Card, Spinner, Tag } from "@/components/ui";
import { FilterPills } from "@/components/admin";
import type { ResourceSummary, AdminResource } from "@/lib/types";

const SUMMARY_CARDS: { key: keyof ResourceSummary; label: string; tone: string }[] = [
  { key: "available", label: "Sẵn sàng", tone: "text-good" },
  { key: "assigned", label: "Đã cấp phát", tone: "text-iris-hi" },
  { key: "expired", label: "Hết hạn", tone: "text-warn" },
  { key: "error", label: "Lỗi", tone: "text-bad" },
];

const STATUS_FILTER = [
  { key: "all", label: "Tất cả" },
  { key: "available", label: "Sẵn sàng" },
  { key: "assigned", label: "Đã cấp phát" },
  { key: "expired", label: "Hết hạn" },
  { key: "error", label: "Lỗi" },
];

const STATUS_TONE: Record<string, "good" | "warn" | "bad" | "neutral" | "iris"> = {
  available: "good",
  assigned: "iris",
  expired: "warn",
  error: "bad",
};

const STATUS_LABEL: Record<string, string> = {
  available: "Sẵn sàng",
  assigned: "Đã cấp phát",
  expired: "Hết hạn",
  error: "Lỗi",
};

function SortHeader({
  column,
  label,
}: {
  column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc?: boolean) => void };
  label: string;
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="flex items-center gap-1 group hover:text-slate-700"
    >
      {label}
      {sorted === "asc" ? (
        <ChevronUp size={13} className="text-indigo-600" />
      ) : sorted === "desc" ? (
        <ChevronDown size={13} className="text-indigo-600" />
      ) : (
        <ChevronsUpDown size={13} className="text-slate-300 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

const columns: ColumnDef<AdminResource>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortHeader column={column} label="ID" />,
    cell: ({ row }) => <span className="font-mono text-slate-400">#{row.original.id}</span>,
    enableSorting: true,
  },
  {
    accessorKey: "product_title",
    header: "Sản phẩm",
    cell: ({ row }) => (
      <span className="truncate max-w-[200px] block font-medium">
        {row.original.product_title ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "variant_name",
    header: "Biến thể",
    cell: ({ row }) => (
      <span className="text-slate-500 truncate max-w-[150px] block">
        {row.original.variant_name ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "seller_email",
    header: "Người bán",
    cell: ({ row }) => (
      <span className="text-slate-500 truncate max-w-[160px] block">
        {row.original.seller_email ?? `#${row.original.seller_id}`}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortHeader column={column} label="Trạng thái" />,
    cell: ({ row }) => (
      <Tag tone={STATUS_TONE[row.original.status] ?? "neutral"}>
        {STATUS_LABEL[row.original.status] ?? row.original.status}
      </Tag>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "order_id",
    header: "Đơn hàng",
    cell: ({ row }) =>
      row.original.order_id ? (
        <Link
          href={`/admin/orders?highlight=${row.original.order_id}`}
          className="font-mono text-indigo-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          #{row.original.order_id}
        </Link>
      ) : (
        <span className="text-slate-400">—</span>
      ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => <SortHeader column={column} label="Ngày tạo" />,
    cell: ({ row }) => (
      <span className="text-slate-500">
        {new Date(row.original.created_at).toLocaleDateString("vi-VN")}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "expires_at",
    header: ({ column }) => <SortHeader column={column} label="Hết hạn" />,
    cell: ({ row }) => (
      <span className="text-slate-500">
        {row.original.expires_at
          ? new Date(row.original.expires_at).toLocaleDateString("vi-VN")
          : "—"}
      </span>
    ),
    enableSorting: true,
  },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

const PER_PAGE = 20;

export default function AdminResourcesPage() {
  const [status, setStatus] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => { setPage(1); }, [status, debouncedSearch]);

  const { data: summary } = useQuery({
    queryKey: ["admin", "resources", "summary"],
    queryFn: () => api.adminResourceSummary(),
    staleTime: 30_000,
  });

  const apiParams = React.useMemo(() => ({
    status: status === "all" ? undefined : status,
    search: debouncedSearch || undefined,
    page,
    per_page: PER_PAGE,
  }), [status, debouncedSearch, page]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "resources", apiParams],
    queryFn: () => api.adminResources(apiParams),
  });

  const resources = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const table = useReactTable({
    data: resources,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalCount = summary
    ? summary.available + summary.assigned + summary.expired + summary.error
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_CARDS.map((c) => (
          <Card key={c.key} className="p-5">
            <p className="text-[12px] text-slate-500">{c.label}</p>
            <p className={`mt-2 font-mono text-[26px] font-semibold tabular ${c.tone}`}>
              {summary?.[c.key] ?? 0}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="text-[14px] font-semibold mb-1">Tổng tài nguyên</h2>
        <p className="font-mono text-[20px] font-semibold tabular">{totalCount}</p>
        <p className="text-[12px] text-slate-500 mt-1">
          Vòng đời: sẵn sàng → đã cấp phát → hết hạn / lỗi.
        </p>
      </Card>

      {/* Resource List */}
      <Card className="p-0">
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            <FilterPills
              options={STATUS_FILTER}
              value={status}
              onChange={(v) => { setStatus(v); setPage(1); }}
            />
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm theo ID, sản phẩm, biến thể, seller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {(status !== "all" || search) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400">Đang lọc:</span>
              {status !== "all" && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  {STATUS_FILTER.find((f) => f.key === status)?.label}
                  <button onClick={() => setStatus("all")}><X size={11} /></button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                  &ldquo;{search}&rdquo;
                  <button onClick={() => setSearch("")}><X size={11} /></button>
                </span>
              )}
              <button
                onClick={() => { setStatus("all"); setSearch(""); }}
                className="text-[11px] text-indigo-600 hover:underline"
              >
                Xoá tất cả
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="relative">
          {isFetching && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
              <span className="h-4 w-4 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
            </div>
          )}

          {!isLoading && resources.length === 0 ? (
            <p className="text-[13px] text-slate-500 px-4 py-8 text-center">
              Không tìm thấy tài nguyên phù hợp.
            </p>
          ) : isLoading ? (
            <div className="py-8 flex justify-center"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50/50">
                    {table.getHeaderGroups()[0].headers.map((header) => (
                      <th key={header.id} className="px-4 py-2.5 font-medium">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-2.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && total > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-[12px]">
            <span className="text-slate-500">
              Hiển thị {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} / {total.toLocaleString("vi-VN")} tài nguyên
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 px-3 rounded-lg text-[12px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ←
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-[12px] font-medium transition-colors ${
                      page === pageNum
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3 rounded-lg text-[12px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                →
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
