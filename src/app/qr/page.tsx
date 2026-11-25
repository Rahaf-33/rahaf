import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { QrPanel } from "@/components/QrPanel";

export const metadata: Metadata = { title: "رمز QR للمنصة" };

export default function QrPage() {
  return (
    <Shell>
      <div className="container-page pt-10 sm:pt-14">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow">قبل بداية الورشة</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold">رمز QR للمنصة</h1>
          <p className="mt-3 text-lg leading-9 text-ink-soft">اعرضي هذا الرمز على الشاشة لتدخل جميع المعلمات من جوالاتهن إلى الرابط نفسه.</p>
        </div>
        <QrPanel />
      </div>
    </Shell>
  );
}
