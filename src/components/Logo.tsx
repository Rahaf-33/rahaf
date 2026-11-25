import Link from "next/link";

export function Mark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g fill="none" strokeLinecap="round" strokeWidth="3.4">
        <path d="M18 45c-3.5-4.5-4.6-9-4.6-13.4a18.6 18.6 0 0 1 37.2 0" stroke="#5F7F64" />
        <path d="M25.5 48.5c-2.2-4.6-3.3-10-3.3-16.6a9.8 9.8 0 0 1 19.6 0c0 3.2-.2 5.8-1 8.6" stroke="#3D6770" />
        <path d="M32 51c-1.3-5.3-2.1-11.6-2.1-18.6a2.1 2.1 0 0 1 4.2 0c0 5.6 1 10.6 3.2 15" stroke="#D98C73" />
      </g>
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="بصمة رقمية — الرئيسية">
      <Mark className={size === "lg" ? "h-12 w-12" : "h-9 w-9"} />
      <span className="leading-none">
        <span className={`block whitespace-nowrap font-display font-extrabold text-ink ${size === "lg" ? "text-2xl" : "text-[19px]"}`}>
          بصمة <span className="text-sage-600">رقمية</span>
        </span>
        <span className="mt-1 hidden text-[11px] min-[400px]:block font-medium text-ink-mute">مجتمع معلمات الحاسب</span>
      </span>
    </Link>
  );
}
