"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Plus } from "lucide-react";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/tracks/interactive", label: "الحصة التفاعلية" },
  { href: "/tracks/assessment", label: "التقويم من أجل التعلم" },
  { href: "/gallery", label: "إبداعات معلماتنا" },
  { href: "/closing", label: "الختام" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-ink/[0.05] bg-ivory/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-full px-3.5 py-2 text-[14px] font-medium transition ${
                isActive(n.href) ? "bg-sage-100 text-sage-700" : "text-ink-soft hover:bg-ink/[0.04] hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/submit" className="btn-primary !min-h-[40px] !px-4 !text-sm">
            <Plus className="h-4 w-4" aria-hidden />
            <span className="whitespace-nowrap"><span className="hidden sm:inline">أضيفي </span>مشاركتك</span>
          </Link>
          <button
            type="button"
            className="btn-ghost !min-h-[40px] !px-2.5 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-ink/[0.05] bg-ivory lg:hidden" aria-label="التنقل">
          <div className="container-page grid gap-1 py-3">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-2xl px-4 py-3 text-base font-medium ${
                  isActive(n.href) ? "bg-sage-100 text-sage-700" : "text-ink-soft"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
