"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button, Card } from "@/components/ui";
import { ArrowRight, Bolt, Shield } from "@/components/Icons";

const SOLUTIONS = [
  {
    slug: "scraper",
    href: "/products/11",
    icon: Bolt,
    eyebrow: "Thu thập",
    title: "TikTok Scraper API",
    subtitle: "Trích xuất dữ liệu TikTok quy mô lớn",
    description:
      "API truy xuất profile, video, comments, hashtags. Mua gói credit, mỗi request trừ credit. REST + JSON, SDK Python & Node.js.",
    features: [
      { label: "100 req/s", detail: "Rate limit cao" },
      { label: "REST + JSON", detail: "Tích hợp nhanh" },
      { label: "Credit-based", detail: "Chỉ trả khi dùng" },
      { label: "SDK sẵn", detail: "Python, Node.js" },
    ],
    price: "Từ 10 ₫ / request",
    accent: "iris" as const,
    stats: [
      { value: "67", label: "đã mua" },
      { value: "4.5", label: "đánh giá" },
      { value: "5", label: "endpoints" },
    ],
  },
  {
    slug: "takedown",
    href: "/products/12",
    icon: Shield,
    eyebrow: "Bảo vệ",
    title: "Takedown đa nền tảng",
    subtitle: "Gỡ nội dung vi phạm trên mạng xã hội",
    description:
      "Dịch vụ takedown nội dung trên Facebook, Instagram, TikTok, YouTube. Team xử lý 24–72h, tracking real-time qua dashboard.",
    features: [
      { label: "4 nền tảng", detail: "FB, IG, TikTok, YT" },
      { label: "24–72h SLA", detail: "Cam kết thời gian" },
      { label: "Real-time", detail: "Dashboard theo dõi" },
      { label: "> 85%", detail: "Tỷ lệ thành công" },
    ],
    price: "Từ 500.000 ₫ / yêu cầu",
    accent: "good" as const,
    stats: [
      { value: "143", label: "đã mua" },
      { value: "4.6", label: "đánh giá" },
      { value: "24h", label: "phản hồi" },
    ],
  },
];

const TRUST = [
  "API access bảo mật qua Bearer token",
  "Ký quỹ 3 ngày — hoàn tiền nếu không đạt",
  "Hỗ trợ kỹ thuật trong giờ hành chính",
  "Dashboard theo dõi đơn hàng real-time",
];

const accentMap = {
  iris: {
    bg: "bg-iris-soft",
    text: "text-iris-hi",
    border: "border-iris/20",
    dot: "bg-iris",
    badge: "bg-iris text-white",
    hoverBorder: "group-hover:border-iris/40",
  },
  good: {
    bg: "bg-good-soft",
    text: "text-good",
    border: "border-good/20",
    dot: "bg-good",
    badge: "bg-good text-white",
    hoverBorder: "group-hover:border-good/40",
  },
};

export default function SolutionsPage() {
  return (
    <div>
      {/* ──── Hero ──── */}
      <section className="border-b border-line">
        <div className="w-full mx-auto max-w-[1200px] px-6 pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-2 text-[12px] font-medium text-iris bg-iris-soft border border-iris/20 px-3 py-1 rounded-full mb-6">
            <Bolt size={12} />
            Giải pháp doanh nghiệp
          </div>
          <h1 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)] tracking-tight leading-[1.15] max-w-[680px] mx-auto">
            Thu thập dữ liệu.{" "}
            <br className="hidden sm:block" />
            <span className="text-iris italic">Bảo vệ thương hiệu.</span>
          </h1>
          <p className="mt-4 text-[15px] text-muted max-w-[520px] mx-auto leading-relaxed">
            Hai công cụ cốt lõi cho doanh nghiệp vận hành trên nền tảng số —
            từ khai thác dữ liệu đến bảo vệ nội dung.
          </p>
        </div>
      </section>

      {/* ──── Solution Cards ──── */}
      <section className="bg-surface">
        <div className="w-full mx-auto max-w-[1200px] px-6 py-14">
          <div className="grid gap-6 lg:grid-cols-2">
            {SOLUTIONS.map((s) => {
              const a = accentMap[s.accent];
              return (
                <Link key={s.slug} href={s.href} className="group">
                  <Card
                    className={cn(
                      "p-0 h-full flex flex-col overflow-hidden border transition-all duration-200",
                      a.border,
                      a.hoverBorder,
                      "group-hover:shadow-card-lg group-hover:-translate-y-1",
                    )}
                  >
                    {/* Card header */}
                    <div className="px-6 pt-6 pb-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "grid place-items-center h-10 w-10 rounded-lg",
                              a.bg,
                              a.text,
                            )}
                          >
                            <s.icon size={20} />
                          </span>
                          <span
                            className={cn(
                              "text-[11px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded",
                              a.badge,
                            )}
                          >
                            {s.eyebrow}
                          </span>
                        </div>
                        <ArrowRight
                          size={18}
                          className="text-faint group-hover:text-fg group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                      <h2 className="font-serif text-[22px] font-semibold tracking-tight">
                        {s.title}
                      </h2>
                      <p className="text-[13.5px] text-muted mt-1">
                        {s.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <div className="px-6 pb-5">
                      <p className="text-[13px] text-muted leading-relaxed">
                        {s.description}
                      </p>
                    </div>

                    {/* Features grid */}
                    <div className="px-6 pb-5 grid grid-cols-2 gap-2.5 flex-1">
                      {s.features.map((f) => (
                        <div
                          key={f.label}
                          className="rounded-lg bg-raised/60 border border-line px-3 py-2.5"
                        >
                          <div className="font-mono text-[14px] font-semibold tabular">
                            {f.label}
                          </div>
                          <div className="text-[11.5px] text-faint mt-0.5">
                            {f.detail}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-auto px-6 py-4 border-t border-line bg-raised/40 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        {s.stats.map((st) => (
                          <div key={st.label} className="text-center">
                            <div
                              className={cn(
                                "font-mono text-[15px] font-semibold tabular",
                                a.text,
                              )}
                            >
                              {st.value}
                            </div>
                            <div className="text-[10.5px] text-faint">
                              {st.label}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-right">
                        <div className="text-[10.5px] text-faint">Giá từ</div>
                        <div className="font-mono text-[13px] font-semibold">
                          {s.price}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──── Trust signals ──── */}
      <section className="border-y border-line">
        <div className="w-full mx-auto max-w-[1200px] px-6 py-10">
          <div className="text-center mb-6">
            <h3 className="font-serif text-[18px] font-semibold tracking-tight">
              An tâm sử dụng
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST.map((t, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 text-[13px] text-muted"
              >
                <span className="mt-0.5 shrink-0 h-4 w-4 rounded-full bg-good-soft grid place-items-center">
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-good"
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section className="aura">
        <div className="w-full mx-auto max-w-[1200px] px-6 py-16 text-center">
          <h2 className="font-serif text-[clamp(1.4rem,3vw,2rem)] tracking-tight">
            Cần tư vấn giải pháp riêng?
          </h2>
          <p className="mt-2 text-[14px] text-muted max-w-md mx-auto">
            Đội ngũ Proxora sẵn sàng hỗ trợ doanh nghiệp của bạn tìm giải pháp
            phù hợp nhất.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="lg">
                Mở tài khoản <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="secondary">
                Khám phá chợ
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
