import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Mark } from "@/components/Logo";
import { ClosingStats } from "@/components/ClosingStats";

export const metadata: Metadata = { title: "كل بصمة تصنع فرقًا" };

export default function ClosingPage() {
  return (
    <Shell>
      <section className="container-page pt-14 text-center sm:pt-20">
        <Mark className="mx-auto h-16 w-16" />
        <h1 className="mt-6 font-display text-4xl font-extrabold sm:text-6xl">كل بصمة تصنع فرقًا</h1>
        <p className="mx-auto mt-8 max-w-3xl font-display text-xl font-medium leading-[2.1] text-ink-soft sm:text-2xl sm:leading-[2.2]">
          شكرًا لكل معلمة شاركت فكرة، وجربت أداة، وقدمت ممارسة ملهمة. بصمتنا الرقمية اليوم ليست مجرد تطبيقات، بل خبرات نتبادلها وأثر يمتد إلى فصولنا وطالباتنا.
        </p>
      </section>
      <section className="container-page mt-14" aria-label="حصيلة الورشة">
        <ClosingStats />
        <p className="mt-4 text-center text-xs text-ink-mute">أرقام حقيقية من المشاركات المحفوظة، وتتحدث مباشرة.</p>
      </section>
      <div className="container-page mt-12 flex flex-col items-center gap-3">
        <Link href="/gallery" className="btn-primary !min-h-[52px] !px-8 !text-base"><LayoutGrid className="h-5 w-5" /> مكتبة المشاركات كاملة</Link>
        <p className="text-sm text-ink-mute">تبقى المشاركات متاحة بعد الورشة للرجوع إليها والاستفادة منها.</p>
      </div>
    </Shell>
  );
}
