import Link from "next/link";
import { Logo, Shield } from "./Icons";

const COLS = [
  { title: "Sản phẩm", links: ["Tài khoản mạng xã hội", "Proxy & VPN", "Email & phần mềm", "Bảng giá"] },
  { title: "Doanh nghiệp", links: ["Mua sỉ / API", "Tư vấn giải pháp", "Cam kết SLA", "Hoá đơn VAT"] },
  { title: "Hỗ trợ", links: ["Tài liệu", "Câu hỏi thường gặp", "Chính sách ký quỹ", "Liên hệ"] },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface mt-16">
      {/* Trust band */}
      <div className="border-b border-line">
        <div className="mx-auto max-w-[1200px] px-6 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] text-muted">
          <span className="flex items-center gap-2"><Shield size={15} className="text-good" /> Ký quỹ bảo vệ người mua</span>
          <span className="flex items-center gap-2 text-faint">·</span>
          <span>Hỗ trợ 24/7</span>
          <span className="flex items-center gap-2 text-faint">·</span>
          <span>Hoàn tiền nếu sai mô tả</span>
          <span className="flex items-center gap-2 text-faint">·</span>
          <span className="flex items-center gap-2">
            Thanh toán:
            {["VISA", "ATM", "MoMo", "USDT"].map((m) => (
              <span key={m} className="px-1.5 py-0.5 rounded border border-line bg-base font-mono text-[11px] text-muted">{m}</span>
            ))}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 py-10 grid gap-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 text-[13px] text-muted max-w-xs leading-relaxed">
            Chợ tài khoản &amp; dữ liệu số cho doanh nghiệp. Nguồn đã xác minh, giao ngay, ký quỹ minh bạch.
          </p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-faint mb-3">{col.title}</div>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l}><Link href="#" className="text-[13px] text-muted hover:text-fg transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-[12px] text-faint">
          <span>© {new Date().getFullYear()} Proxora. Demo marketplace.</span>
          <span>Giá đã gồm phí nền tảng · Tuân thủ pháp luật Việt Nam</span>
        </div>
      </div>
    </footer>
  );
}
