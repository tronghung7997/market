"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, Spinner, Tag } from "@/components/ui";
import { Search } from "@/components/Icons";
import type { LogEntry } from "@/lib/types";

const LEVEL_TONE: Record<string, "neutral" | "warn" | "bad" | "iris"> = {
  info: "iris", warning: "warn", critical: "bad",
};
const EVENT_LABEL: Record<string, string> = {
  order_placed: "Đặt hàng", resources_assigned: "Cấp tài nguyên", order_confirmed: "Xác nhận",
  order_delivered_manual: "Giao thủ công", escrow_released: "Giải ngân ký quỹ", sla_refund: "Hoàn tiền SLA",
  resource_expired: "Tài nguyên hết hạn", dispute_opened: "Mở khiếu nại", dispute_refunded: "Hoàn tiền KN",
  dispute_rejected: "Từ chối KN", provider_down: "Provider lỗi",
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState("");
  const [requestId, setRequestId] = useState("");

  const load = (params: { order_id?: number; request_id?: string } = {}) => {
    setLoading(true);
    api.adminLogs({ ...params, limit: 200 }).then(setLogs).catch(() => setLogs([])).finally(() => setLoading(false));
  };
  useEffect(() => load(), []);

  const search = () => load({
    order_id: orderId.trim() ? Number(orderId.trim()) : undefined,
    request_id: requestId.trim() || undefined,
  });

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[12px] text-muted">Mã đơn (order_id)
            <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="VD: 12"
              className="h-9 w-40 rounded-lg bg-surface border border-line px-3 text-[13px] focus:border-iris" />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-muted">Request ID
            <input value={requestId} onChange={(e) => setRequestId(e.target.value)} placeholder="uuid…"
              className="h-9 w-64 rounded-lg bg-surface border border-line px-3 text-[13px] font-mono focus:border-iris" />
          </label>
          <Button onClick={search}><Search size={15} /> Truy vết</Button>
          <Button variant="ghost" onClick={() => { setOrderId(""); setRequestId(""); load(); }}>Xoá lọc</Button>
        </div>
      </Card>

      {loading ? <Spinner label="Đang tải nhật ký…" /> : logs.length === 0 ? (
        <Card className="p-8 text-center text-[13px] text-muted">Không có nhật ký phù hợp.</Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-faint border-b border-line">
                <th className="px-4 py-2.5 font-medium">Thời gian</th>
                <th className="px-3 py-2.5 font-medium">Mức</th>
                <th className="px-3 py-2.5 font-medium">Sự kiện</th>
                <th className="px-3 py-2.5 font-medium">Thông điệp</th>
                <th className="px-3 py-2.5 font-medium">Đơn</th>
                <th className="px-4 py-2.5 font-medium">Nguồn</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => {
                const ev = (l.metadata?.event as string) ?? "";
                const oid = l.metadata?.order_id as number | undefined;
                return (
                  <tr key={l.id} className="border-b border-line last:border-0 hover:bg-raised/50">
                    <td className="px-4 py-2.5 text-muted whitespace-nowrap">{new Date(l.created_at).toLocaleString("vi-VN")}</td>
                    <td className="px-3 py-2.5"><Tag tone={LEVEL_TONE[l.level] ?? "neutral"}>{l.level}</Tag></td>
                    <td className="px-3 py-2.5">{(EVENT_LABEL[ev] ?? ev) || "—"}</td>
                    <td className="px-3 py-2.5 text-muted max-w-[280px] truncate" title={l.message}>{l.message}</td>
                    <td className="px-3 py-2.5 font-mono">{oid != null ? `#${oid}` : "—"}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-faint">
                      {l.request_id ? `req ${l.request_id.slice(0, 8)}` : (l.job_id ? `job ${l.job_id.slice(0, 8)}` : "—")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
