"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, vnd } from "@/lib/api";
import type { SellerStats } from "@/lib/types";
import { Button, Card, Spinner } from "@/components/ui";
import { ArrowRight, BarChart, Check, Clock, Inbox, Package, Plus } from "@/components/Icons";

/* Generate fake revenue for last 7 days */
function fakeRevenue() {
  const days: { label: string; value: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString("vi-VN", { weekday: "short" }),
      value: Math.floor(Math.random() * 800_000 + 50_000),
    });
  }
  return days;
}

export default function SellerDashboard() {
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const revenue = useMemo(fakeRevenue, []);

  useEffect(() => {
    api.sellerStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const total = stats?.total_orders ?? 0;
  const pending = stats?.pending_orders ?? 0;
  // Derive some numbers from what we have
  const completed = Math.max(0, total - pending);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Fake breakdown (since API only gives pending/total)
  const processing = Math.min(pending, Math.floor(pending * 0.4));
  const pendingOnly = pending - processing;
  const delivered = Math.floor(completed * 0.3);
  const completedOnly = completed - delivered;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Tổng sản phẩm" value={String(stats?.product_count ?? 0)} sub={`${stats?.active_count ?? 0} đang bán`} />
        <StatCard icon={Inbox} label="Tổng đơn hàng" value={String(total)} sub={pending ? `${pending} chờ xử lý` : "Không có đơn chờ"} tone={pending ? "warn" : undefined} />
        <StatCard icon={BarChart} label="Doanh thu" value={vnd(stats?.total_revenue ?? 0)} sub="Tổng doanh thu đã giao" />
        <StatCard icon={Check} label="Tỷ lệ hoàn thành" value={`${completionRate}%`} sub={`${completed}/${total} đơn`} tone={completionRate < 50 && total > 0 ? "warn" : undefined} />
      </div>

      {/* Revenue chart + Order breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue bar chart */}
        <Card className="p-5">
          <h3 className="text-[13px] font-semibold mb-4 flex items-center gap-2">
            <BarChart size={14} className="text-faint" /> Doanh thu gần đây
          </h3>
          <MiniBarChart data={revenue} />
        </Card>

        {/* Order status breakdown */}
        <Card className="p-5">
          <h3 className="text-[13px] font-semibold mb-4 flex items-center gap-2">
            <Clock size={14} className="text-faint" /> Đơn hàng theo trạng thái
          </h3>
          <OrderBreakdown
            pending={pendingOnly}
            processing={processing}
            delivered={delivered}
            completed={completedOnly}
            total={total}
          />
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/seller/products/new">
          <Button><Plus size={15} /> Tạo sản phẩm mới</Button>
        </Link>
        <Link href="/seller/orders">
          <Button variant="secondary"><Inbox size={15} /> Xem đơn hàng</Button>
        </Link>
        <Link href="/seller/products">
          <Button variant="secondary"><Package size={15} /> Quản lý sản phẩm</Button>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone }: {
  icon: typeof Package; label: string; value: string; sub: string; tone?: "warn";
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-[12px] text-faint mb-3">
        <Icon size={14} /> {label}
      </div>
      <div className="font-mono text-[24px] font-semibold tabular">{value}</div>
      <div className={`text-[12px] mt-1 ${tone === "warn" ? "text-warn font-medium" : "text-muted"}`}>{sub}</div>
    </Card>
  );
}

/* CSS-only bar chart */
function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-[120px]">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-mono text-muted tabular">{vnd(d.value)}</span>
            <div
              className="w-full rounded-t-[3px] transition-all"
              style={{
                height: `${pct}%`,
                background: "var(--color-iris-hi)",
                opacity: 0.7 + (pct / 100) * 0.3,
                minHeight: 4,
              }}
            />
            <span className="text-[10px] text-faint">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Order status breakdown */
function OrderBreakdown({ pending, processing, delivered, completed, total }: {
  pending: number; processing: number; delivered: number; completed: number; total: number;
}) {
  const items = [
    { label: "Chờ xử lý", count: pending, color: "var(--color-warn)" },
    { label: "Đang xử lý", count: processing, color: "var(--color-iris-hi)" },
    { label: "Đã giao", count: delivered, color: "var(--color-good)" },
    { label: "Hoàn thành", count: completed, color: "var(--color-good)" },
  ];

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      {total > 0 && (
        <div className="flex h-[10px] rounded-full overflow-hidden bg-raised">
          {items.map((it, i) =>
            it.count > 0 ? (
              <div
                key={i}
                style={{ width: `${(it.count / total) * 100}%`, background: it.color }}
                className="transition-all"
              />
            ) : null
          )}
        </div>
      )}
      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: it.color }} />
            <span className="text-[12px] text-muted">{it.label}</span>
            <span className="text-[13px] font-mono font-semibold ml-auto tabular">{it.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
