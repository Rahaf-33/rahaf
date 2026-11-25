"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { AlertTriangle, Check, Copy, Download, MonitorPlay } from "lucide-react";
import Link from "next/link";
import { isLocalUrl, useSiteUrl } from "@/lib/site-url";
import { QrImage } from "./QrImage";

/** يرسم بطاقة PNG عالية الدقة: الشعار النصي + رمز QR + الرابط */
async function renderPoster(url: string): Promise<string> {
  const W = 1400, H = 1750;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  await document.fonts?.ready;
  ctx.fillStyle = "#FBF8F3";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(110, 400, W - 220, 1080, 60);
  ctx.fill();

  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillStyle = "#2F3437";
  ctx.font = '800 150px Tajawal, "IBM Plex Sans Arabic", sans-serif';
  ctx.fillText("بصمة رقمية", W / 2, 230);
  ctx.fillStyle = "#3D6770";
  ctx.font = '700 54px Tajawal, "IBM Plex Sans Arabic", sans-serif';
  ctx.fillText("إبداع تقني يبدأ بفكرة، ويترك أثرًا في الممارسة", W / 2, 325);

  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, url, { width: 880, margin: 0, errorCorrectionLevel: "M", color: { dark: "#2F3437", light: "#FFFFFF" } });
  ctx.drawImage(qr, (W - 880) / 2, 490);

  ctx.direction = "ltr";
  ctx.fillStyle = "#3D6770";
  ctx.font = '600 50px "IBM Plex Sans Arabic", sans-serif';
  ctx.fillText(url.replace(/^https?:\/\//, ""), W / 2, 1440);

  ctx.direction = "rtl";
  ctx.fillStyle = "#5B6266";
  ctx.font = '500 52px "IBM Plex Sans Arabic", Tajawal, sans-serif';
  ctx.fillText("امسحي الرمز بكاميرا الجوال وشاركي بصمتك", W / 2, 1600);
  return c.toDataURL("image/png");
}

export function QrPanel() {
  const siteUrl = useSiteUrl();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const local = siteUrl ? isLocalUrl(siteUrl) : false;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function download(kind: "poster" | "plain") {
    setBusy(true);
    try {
      const data =
        kind === "poster"
          ? await renderPoster(siteUrl)
          : await QRCode.toDataURL(siteUrl, { width: 1200, margin: 2, color: { dark: "#2F3437", light: "#FFFFFF" } });
      const a = document.createElement("a");
      a.href = data;
      a.download = kind === "poster" ? "basmah-raqamiah-qr-poster.png" : "basmah-raqamiah-qr.png";
      a.click();
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[auto_1fr]">
      <div className="card mx-auto flex flex-col items-center gap-5 p-8 sm:p-10">
        {siteUrl ? <QrImage value={siteUrl} size={320} className="h-auto w-full max-w-[320px]" label="رمز QR لمنصة بصمة رقمية" /> : <div className="h-80 w-80" />}
        <p className="font-display text-xl font-extrabold">امسحي وشاركي بصمتك</p>
        <p className="text-lg font-semibold text-petrol-600" dir="ltr">{siteUrl.replace(/^https?:\/\//, "")}</p>
      </div>
      <div className="space-y-6">
        {local && (
          <div className="flex gap-3 rounded-3xl border border-peach-200 bg-peach-50 p-5 text-sm leading-7" role="alert">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-peach-500" />
            <p>
              هذا رابط محلي ({new URL(siteUrl).host}) لن يعمل على جوالات المعلمات. افتحي هذه الصفحة من رابط النشر العام (مثل Vercel)،
              أو اضبطي المتغير <code dir="ltr">NEXT_PUBLIC_SITE_URL</code> على الرابط المنشور.
            </p>
          </div>
        )}
        <div>
          <p className="label">الرابط العام للمنصة</p>
          <div className="flex gap-2">
            <input readOnly value={siteUrl} dir="ltr" className="field text-left" onFocus={(e) => e.target.select()} aria-label="رابط المنصة" />
            <button onClick={copy} className="btn-soft shrink-0">{copied ? <Check className="h-4 w-4 text-sage-600" /> : <Copy className="h-4 w-4" />}{copied ? "نُسخ" : "نسخ"}</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => download("poster")} disabled={!siteUrl || busy} className="btn-primary"><Download className="h-4 w-4" /> تحميل بطاقة QR للعرض</button>
          <button onClick={() => download("plain")} disabled={!siteUrl || busy} className="btn-soft"><Download className="h-4 w-4" /> تحميل الرمز فقط</button>
          <Link href="/present" className="btn-ghost"><MonitorPlay className="h-4 w-4" /> وضع العرض</Link>
        </div>
        <ul className="space-y-2 text-sm leading-7 text-ink-soft">
          <li>• رابط واحد ورمز واحد للمنصة كاملة: المساران، والتطبيق، والرفع، والمعرض.</li>
          <li>• ضعي البطاقة في أول شريحة من عرضك، أو اضغطي <kbd className="rounded bg-ivory-deep px-1.5">Q</kbd> داخل وضع العرض لإظهار الرمز في أي لحظة.</li>
        </ul>
      </div>
    </div>
  );
}
