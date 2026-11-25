import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { AdminPanel } from "@/components/AdminPanel";

export const metadata: Metadata = { title: "إدارة المشاركات", robots: { index: false } };

export default function AdminPage() {
  return (
    <Shell>
      <div className="container-page max-w-4xl pt-10 sm:pt-14">
        <div className="mb-8">
          <p className="eyebrow">للمدربة فقط</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold">إدارة المشاركات</h1>
          <p className="mt-2 text-ink-soft">أخفي مشاركة مؤقتًا من المعرض ووضع العرض، أو احذفيها نهائيًا مع ملفاتها.</p>
        </div>
        <AdminPanel />
      </div>
    </Shell>
  );
}
