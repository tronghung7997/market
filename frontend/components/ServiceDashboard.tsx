"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardData, DashboardResource, DashboardTask } from "@/lib/types";
import { Card, Spinner, Tag } from "@/components/ui";

/* ── Helpers ── */

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN");
}

function daysRemaining(expiresAt: string | null): string {
  if (!expiresAt) return "Vĩnh viễn";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Hết hạn";
  return `${Math.ceil(ms / 86400000)} ngày`;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-raised border border-line rounded-lg p-3">
      <div className="text-[11px] text-faint">{label}</div>
      <div className="text-[18px] font-semibold tabular mt-0.5">{value}</div>
      {sub && <div className="text-[11px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-md bg-raised border border-line hover:border-line-2 transition-colors"
    >
      {copied ? "Da sao chep!" : label ?? "Sao chep"}
    </button>
  );
}

function MaskedValue({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  const masked = value.length > 8 ? value.slice(0, 4) + "****" + value.slice(-4) : "****";
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[12.5px]">
      <span>{visible ? value : masked}</span>
      <button
        onClick={() => setVisible((v) => !v)}
        className="text-[11px] text-iris-hi hover:underline"
      >
        {visible ? "An" : "Hien"}
      </button>
      <CopyButton text={value} />
    </span>
  );
}

/* ── Proxy Dashboard ── */

function ProxyDashboard({ data }: { data: DashboardData }) {
  const resources = data.resources ?? [];
  const activeCount = resources.filter((r) => r.status === "assigned" || r.status === "available").length;

  // Find earliest expiry for days remaining
  const expiringResource = resources
    .filter((r) => r.expires_at)
    .sort((a, b) => new Date(a.expires_at!).getTime() - new Date(b.expires_at!).getTime())[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Trang thai" value={data.status === "delivered" ? "Hoat dong" : data.status} />
        <StatCard label="Con lai" value={daysRemaining(expiringResource?.expires_at ?? null)} />
        <StatCard label="So IP" value={resources.length} sub={`${activeCount} hoat dong`} />
        <StatCard label="Uptime" value="99.9%" sub="30 ngay qua" />
      </div>

      {resources.length > 0 && (
        <div>
          <h4 className="text-[12.5px] font-medium text-muted mb-2">Danh sach IP / Proxy</h4>
          <div className="space-y-1.5">
            {resources.map((r) => (
              <ResourceRow key={r.id} resource={r} />
            ))}
          </div>
        </div>
      )}

      {resources.length > 0 && (
        <div className="flex gap-2">
          <CopyButton
            text={resources.map((r) => r.data).join("\n")}
            label="Sao chep tat ca"
          />
        </div>
      )}
    </div>
  );
}

function ResourceRow({ resource }: { resource: DashboardResource }) {
  const tone = resource.status === "assigned" ? "good" as const
    : resource.status === "expired" ? "warn" as const
    : resource.status === "error" ? "bad" as const
    : "neutral" as const;
  const label = { assigned: "Hoat dong", expired: "Het han", error: "Loi", available: "San sang" }[resource.status] ?? resource.status;

  return (
    <div className="flex items-center gap-3 text-[12.5px] px-3 py-2 rounded-lg bg-surface border border-line">
      <span className="font-mono text-faint">#{resource.id}</span>
      <MaskedValue value={resource.data} />
      <Tag tone={tone}>{label}</Tag>
      <span className="ml-auto text-muted text-[11px]">{daysRemaining(resource.expires_at)}</span>
    </div>
  );
}

/* ── Endpoint Dashboard ── */

function EndpointDashboard({ data }: { data: DashboardData }) {
  const usage = data.usage?.[0];
  const resources = data.resources ?? [];
  const apiKey = resources[0]?.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Credit con lai"
          value={usage?.credits_remaining ?? "N/A"}
        />
        <StatCard
          label="Credit da dung"
          value={usage?.credits_used ?? 0}
        />
        <StatCard
          label="Request hom nay"
          value={usage?.requests_today ?? 0}
        />
        <StatCard label="Latency" value="~120ms" sub="Trung binh" />
      </div>

      {apiKey && (
        <div className="bg-raised border border-line rounded-lg p-3">
          <div className="text-[11px] text-faint mb-1">API Key</div>
          <MaskedValue value={apiKey} />
        </div>
      )}

      {resources.length > 1 && (
        <div>
          <h4 className="text-[12.5px] font-medium text-muted mb-2">Tai nguyen</h4>
          <div className="space-y-1.5">
            {resources.map((r) => (
              <ResourceRow key={r.id} resource={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Takedown Dashboard ── */

const TASK_STATUS_MAP: Record<string, { label: string; tone: "good" | "bad" | "warn" | "iris" | "neutral" }> = {
  pending: { label: "Cho xu ly", tone: "warn" },
  assigned: { label: "Da nhan", tone: "iris" },
  processing: { label: "Dang xu ly", tone: "iris" },
  completed: { label: "Hoan tat", tone: "good" },
  failed: { label: "That bai", tone: "bad" },
};

function TakedownDashboard({ data }: { data: DashboardData }) {
  const tasks = data.tasks ?? [];
  const completed = tasks.filter((t) => t.status === "completed").length;
  const processing = tasks.filter((t) => t.status === "processing" || t.status === "assigned").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Tong task" value={tasks.length} />
        <StatCard label="Hoan tat" value={completed} />
        <StatCard label="Dang xu ly" value={processing} />
      </div>

      {tasks.length > 0 && (
        <div>
          <h4 className="text-[12.5px] font-medium text-muted mb-2">Chi tiet task</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-2 pr-3 font-medium text-faint">ID</th>
                  <th className="py-2 pr-3 font-medium text-faint">Nen tang</th>
                  <th className="py-2 pr-3 font-medium text-faint">URL</th>
                  <th className="py-2 pr-3 font-medium text-faint">Trang thai</th>
                  <th className="py-2 pr-3 font-medium text-faint">Nguoi xu ly</th>
                  <th className="py-2 font-medium text-faint">Tao luc</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: DashboardTask }) {
  const st = TASK_STATUS_MAP[task.status] ?? { label: task.status, tone: "neutral" as const };
  return (
    <tr className="border-b border-line/50">
      <td className="py-2 pr-3 font-mono text-faint">#{task.id}</td>
      <td className="py-2 pr-3">{task.platform}</td>
      <td className="py-2 pr-3 max-w-[200px] truncate">
        <span className="font-mono text-[11px]">{task.target_url}</span>
      </td>
      <td className="py-2 pr-3"><Tag tone={st.tone}>{st.label}</Tag></td>
      <td className="py-2 pr-3 text-muted">{task.assignee ?? "Chua co"}</td>
      <td className="py-2 text-muted">{fmtDate(task.created_at)}</td>
    </tr>
  );
}

/* ── Default Dashboard ── */

function DefaultDashboard({ data }: { data: DashboardData }) {
  return (
    <div>
      {data.delivered_data ? (
        <pre className="font-mono text-[12px] bg-raised border border-line rounded-lg p-2.5 whitespace-pre-wrap break-all">
          {data.delivered_data}
        </pre>
      ) : (
        <p className="text-[12.5px] text-muted">Khong co du lieu dashboard cho dich vu nay.</p>
      )}
    </div>
  );
}

/* ── Main ServiceDashboard ── */

export default function ServiceDashboard({ orderId }: { orderId: number }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api.orderDashboard(orderId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Khong the tai dashboard"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId]);

  if (loading) return <Spinner label="Dang tai dashboard..." />;
  if (error) return <p className="text-[12px] text-bad py-2">{error}</p>;
  if (!data) return null;

  const DashboardComponent = data.service_type === "proxy" ? ProxyDashboard
    : data.service_type === "endpoint" ? EndpointDashboard
    : data.service_type === "takedown" ? TakedownDashboard
    : DefaultDashboard;

  return (
    <Card className="p-4 mt-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold">
          Dashboard — {data.product_title}
        </h3>
        <Tag tone={data.status === "delivered" ? "iris" : data.status === "completed" ? "good" : "neutral"}>
          {data.service_type}
        </Tag>
      </div>
      <DashboardComponent data={data} />
    </Card>
  );
}
