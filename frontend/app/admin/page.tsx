"use client";

import * as React from "react";
import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "motion/react";
import {
  Activity,
  ArrowRight,
  Bell,
  Clock,
  Inbox,
  TrendingUp,
} from "lucide-react";

import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/admin/stats-card";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { Spinner } from "@/components/ui/spinner";
import { vnd, formatDate } from "@/lib/utils/format";
import type { Order, Provider, Alert } from "@/lib/types";

const DONE = new Set(["delivered", "completed", "confirmed"]);
const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

// Chart data transformation
function get7DayChartData(orders: Order[]) {
  const days: { label: string; count: number; fullLabel: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const count = orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= d.getTime() && t < next.getTime();
    }).length;
    days.push({
      label: d.toLocaleDateString("vi-VN", { weekday: "short" }),
      count,
      fullLabel: d.toLocaleDateString("vi-VN", { day: "numeric", month: "short" }),
    });
  }
  return days;
}

// Table columns
const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) => (
      <span className="font-mono text-slate-400">#{row.original.id}</span>
    ),
  },
  {
    accessorKey: "buyer_id",
    header: "Người mua",
    cell: ({ row }) => (
      <span className="text-slate-600">#{row.original.buyer_id}</span>
    ),
  },
  {
    accessorKey: "total_amount",
    header: "Số tiền",
    cell: ({ row }) => (
      <span className="font-mono font-medium">{vnd(row.original.total_amount)}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "created_at",
    header: "Ngày",
    cell: ({ row }) => (
      <span className="text-slate-500">{formatDate(row.original.created_at)}</span>
    ),
  },
];

// Status row for system health
function StatusRow({
  icon: Icon,
  label,
  value,
  tone,
  href,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  tone: "good" | "warn" | "bad";
  href: string;
}) {
  const dotColors = { good: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-red-500" };
  const textColors = { good: "text-emerald-600", warn: "text-amber-600", bad: "text-red-600" };

  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon size={16} />
      </span>
      <span className="flex-1 min-w-0 text-[13px] text-slate-700 truncate">{label}</span>
      <span className={`flex items-center gap-1.5 font-mono text-[13px] font-semibold ${textColors[tone]}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotColors[tone]}`} />
        {value}
      </span>
    </Link>
  );
}

// KPI cards animation
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function AdminOverview() {
  // Data state
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [providers, setProviders] = React.useState<Provider[]>([]);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch data
  React.useEffect(() => {
    Promise.allSettled([
      api.adminOrders(),
      api.providers(),
      api.adminAlerts(),
    ]).then(([o, p, a]) => {
      if (o.status === "fulfilled") setOrders(o.value);
      if (p.status === "fulfilled") setProviders(p.value);
      if (a.status === "fulfilled") setAlerts(a.value);
    }).finally(() => setLoading(false));
  }, []);

  // Computed metrics
  const metrics = React.useMemo(() => {
    const revenue = orders
      .filter((o) => DONE.has(o.status))
      .reduce((s, o) => s + o.total_amount, 0);
    const pending = orders.filter(
      (o) => o.status === "pending" || o.status === "processing"
    ).length;
    const disputed = orders.filter((o) => o.status === "disputed").length;
    return { revenue, pending, disputed };
  }, [orders]);

  const healthyProviders = providers.filter((p) => p.is_active).length;
  const activeAlerts = alerts.filter((a) => a.is_active).length;
  const criticalAlerts = alerts.filter(
    (a) => a.is_active && a.severity === "critical"
  ).length;

  const chartData = React.useMemo(() => get7DayChartData(orders), [orders]);
  const peakCount = React.useMemo(
    () => Math.max(1, ...chartData.map((d) => d.count)),
    [chartData]
  );

  // Table setup
  const recentOrders = React.useMemo(() => orders.slice(0, 6), [orders]);
  const table = useReactTable({
    data: recentOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return <Spinner label="Đang tải bảng điều khiển…" />;
  }

  const kpis = [
    {
      label: "Tổng đơn hàng",
      value: orders.length.toLocaleString("vi-VN"),
      tone: "iris" as const,
      icon: <Inbox size={18} />,
      sub: "toàn hệ thống",
    },
    {
      label: "Doanh thu đã chốt",
      value: vnd(metrics.revenue),
      tone: "good" as const,
      icon: <TrendingUp size={18} />,
      sub: "đơn đã giao/hoàn tất",
    },
    {
      label: "Đang chờ xử lý",
      value: metrics.pending.toLocaleString("vi-VN"),
      tone: "warn" as const,
      icon: <Clock size={18} />,
      sub: "cần theo dõi",
    },
    {
      label: "Khiếu nại mở",
      value: metrics.disputed.toLocaleString("vi-VN"),
      tone: "bad" as const,
      icon: <Bell size={18} />,
      sub: "cần can thiệp",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={item}>
            <StatsCard
              label={kpi.label}
              value={kpi.value}
              tone={kpi.tone}
              icon={kpi.icon}
              sub={kpi.sub}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Chart + System Status */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* 7-day Order Volume Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-0 overflow-hidden">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Lưu lượng đơn 7 ngày</CardTitle>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Số đơn tạo mỗi ngày
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-md">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="20" x2="6" y2="14" /><line x1="12" y1="20" x2="12" y2="6" /><line x1="18" y1="20" x2="18" y2="11" />
                </svg> Theo ngày
              </span>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="30%">
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-[12px] shadow-lg">
                              <p className="font-medium">{data.fullLabel}</p>
                              <p className="text-slate-300">{data.count} đơn</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.count === peakCount ? "#4f46e5" : "#c7d2fe"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-0">
            <CardHeader>
              <CardTitle>Trạng thái hệ thống</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <StatusRow
                icon={Activity}
                label="Nhà cung cấp hoạt động"
                value={`${healthyProviders}/${providers.length}`}
                tone={
                  providers.length > 0 && healthyProviders === providers.length
                    ? "good"
                    : "warn"
                }
                href="/admin/providers"
              />
              <StatusRow
                icon={Bell}
                label="Cảnh báo đang mở"
                value={String(activeAlerts)}
                tone={
                  criticalAlerts > 0
                    ? "bad"
                    : activeAlerts > 0
                    ? "warn"
                    : "good"
                }
                href="/admin/alerts"
              />
              <StatusRow
                icon={Clock}
                label="Đơn chờ xử lý"
                value={String(metrics.pending)}
                tone={metrics.pending > 0 ? "warn" : "good"}
                href="/admin/orders"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-slate-900">
              Đơn hàng gần đây
            </h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-[12.5px] font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Xem tất cả <ArrowRight size={13} />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-slate-500">Chưa có đơn hàng nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    {table.getHeaderGroups()[0].headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-5 py-2.5 font-medium"
                      >
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
                        <td key={cell.id} className="px-5 py-2.5">
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
    </div>
  );
}
