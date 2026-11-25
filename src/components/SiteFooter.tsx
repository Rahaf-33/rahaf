import Link from "next/link";
import { Mark } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink/[0.06]">
      <div className="container-page flex flex-col items-center justify-between gap-6 py-10 text-sm text-ink-mute sm:flex-row">
        <div className="flex items-center gap-2">
          <Mark className="h-6 w-6" />
          <span>بصمة رقمية — إبداع تقني يبدأ بفكرة، ويترك أثرًا في الممارسة.</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <span className="text-ink-mute/80">أدوات المدربة:</span>
          <Link className="hover:text-ink" href="/present">وضع العرض</Link>
          <Link className="hover:text-ink" href="/qr">رمز QR</Link>
          <Link className="hover:text-ink" href="/admin">الإدارة</Link>
        </div>
      </div>
    </footer>
  );
}
