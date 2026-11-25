import Link from "next/link";
import { Shell } from "@/components/Shell";

export default function NotFound() {
  return (
    <Shell>
      <div className="container-page flex flex-col items-center py-24 text-center">
        <p className="font-display text-6xl font-extrabold text-peach-200">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold">لم نجد هذه الصفحة</h1>
        <p className="mt-2 text-ink-soft">ربما حُذفت المشاركة أو تغيّر الرابط.</p>
        <Link href="/" className="btn-primary mt-8">العودة للرئيسية</Link>
      </div>
    </Shell>
  );
}
