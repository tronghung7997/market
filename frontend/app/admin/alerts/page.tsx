"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { motion } from "motion/react";

import { api } from "@/lib/api";
import { Card, Spinner, Button } from "@/components/ui";
import {
  FilterPills,
  SearchInput,
  StatsCard,
  ConfirmModal,
} from "@/components/admin";
import { AlertSeverityBadge } from "@/components/admin/status-badge";
import type { Alert } from "@/lib/types";

// Severity filter options
const SEVERITY_FILTER = [
  { key: "all", label: "Tất cả" },
  { key: "critical", label: "Nghiêm trọng" },
  { key: "warning", label: "Cảnh báo" },
  { key: "info", label: "Thông tin" },
];

// Vietnamese labels for alert types
const TYPE_LABELS: Record<string, string> = {
  provider_down: "Nhà cung cấp ngừng hoạt động",
  sla_breach: "Vi phạm SLA giao hàng",
  resource_error: "Tài nguyên bị lỗi",
  resource_low: "Tài nguyên sắp hết",
  dispute_opened: "Khiếu nại mới",
  escrow_expired: "Ký quỹ hết hạn",
  login_suspicious: "Đăng nhập bất thường",
};

const TARGET_LABELS: Record<string, string> = {
  provider: "NCC",
  seller: "Nhà bán",
  order: "Đơn",
  resource: "Tài nguyên",
  account: "Tài khoản",
};

// Base columns (without action column)
const baseColumns: ColumnDef<Alert>[] = [
  {
    accessorKey: "severity",
    header: "Mức độ",
    cell: ({ row }) => <AlertSeverityBadge severity={row.original.severity} />,
  },
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => (
      <span className="text-[13px] text-slate-700 font-medium">
        {TYPE_LABELS[row.original.type] ?? row.original.type}
      </span>
    ),
  },
  {
    accessorKey: "message",
    header: "Nội dung",
    cell: ({ row }) => (
      <span
        className="text-slate-600 max-w-xs truncate block"
        title={row.original.message}
      >
        {row.original.message}
      </span>
    ),
  },
  {
    id: "target",
    header: "Liên quan",
    cell: ({ row }) => (
      <span className="text-slate-500">
        {TARGET_LABELS[row.original.target_type] ?? row.original.target_type} #{row.original.target_id}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Thời gian",
    cell: ({ row }) => (
      <span className="text-slate-500">
        {new Date(row.original.created_at).toLocaleString("vi-VN", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        })}
      </span>
    ),
  },
];

export default function AdminAlertsPage() {
  // State
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [dismissModal, setDismissModal] = React.useState<number | null>(null);
  const [dismissing, setDissmissing] = React.useState<Set<number>>(new Set());

  // Fetch alerts
  const loadAlerts = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminAlerts();
      setAlerts(data);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Filter alerts
  const filteredAlerts = React.useMemo(() => {
    let result = alerts;

    if (filter !== "all") {
      result = result.filter((a) => a.severity === filter);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.message.toLowerCase().includes(searchLower) ||
          a.type.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [alerts, filter, search]);

  // Stats
  const activeAlerts = alerts.filter((a) => a.is_active);
  const countBySeverity = {
    critical: activeAlerts.filter((a) => a.severity === "critical").length,
    warning: activeAlerts.filter((a) => a.severity === "warning").length,
    info: activeAlerts.filter((a) => a.severity === "info").length,
  };

  // Handle dismiss
  const handleDismiss = async (alertId: number) => {
    setDissmissing((prev) => new Set(prev).add(alertId));
    try {
      await api.dismissAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch {
      // Error handled, alert remains in list
    } finally {
      setDissmissing((prev) => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  };

  // Add action column with access to setDismissModal
  const columns = React.useMemo<ColumnDef<Alert>[]>(
    () => [
      ...baseColumns,
      {
        id: "actions",
        header: "Hành động",
        cell: ({ row }) =>
          row.original.is_active ? (
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDismissModal(row.original.id);
              }}
            >
              Bỏ qua
            </Button>
          ) : (
            <span className="text-[12px] text-slate-400">Đã xử lý</span>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Table setup
  const table = useReactTable({
    data: filteredAlerts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return <Spinner label="Đang tải cảnh báo…" />;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-3"
      >
        <StatsCard
          label="Nghiêm trọng"
          value={countBySeverity.critical}
          tone="bad"
        />
        <StatsCard
          label="Cảnh báo"
          value={countBySeverity.warning}
          tone="warn"
        />
        <StatsCard
          label="Thông tin"
          value={countBySeverity.info}
          tone="iris"
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-0">
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-slate-900">
                Danh sách cảnh báo
              </h2>
              <FilterPills
                options={SEVERITY_FILTER}
                value={filter}
                onChange={setFilter}
              />
            </div>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm kiếm cảnh báo..."
            />
          </div>

          {/* Table */}
          {filteredAlerts.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-slate-500">Không có cảnh báo nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    {table.getHeaderGroups()[0].headers.map((header) => (
                      <th key={header.id} className="px-4 py-2.5 font-medium">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Dismiss Confirm Modal */}
      <ConfirmModal
        isOpen={dismissModal !== null}
        onClose={() => setDismissModal(null)}
        onConfirm={() => {
          if (dismissModal !== null) {
            handleDismiss(dismissModal);
            setDismissModal(null);
          }
        }}
        title="Bỏ qua cảnh báo"
        description="Bạn có chắc muốn bỏ qua cảnh báo này?"
        confirmText="Bỏ qua"
        variant="danger"
      />
    </div>
  );
}
