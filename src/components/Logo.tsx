import { useId } from 'react';
import { cx } from './ui';

export function LogoMark({ className }: { className?: string }) {
  const gid = `lg-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b9be6" />
          <stop offset="1" stopColor="#2a78d6" />
        </linearGradient>
      </defs>
      <path d="M32 6 52 14v16c0 13.5-8.6 23-20 28C20.6 53 12 43.5 12 30V14z" fill={`url(#${gid})`} />
      <path d="M32 6 52 14v16c0 13.5-8.6 23-20 28z" fill="#ffffff" opacity=".12" />
      <circle cx="32" cy="30" r="10" fill="none" stroke="#fff" strokeWidth="3" opacity=".55" />
      <circle cx="32" cy="30" r="17" fill="none" stroke="#fff" strokeWidth="2" opacity=".25" />
      <path d="m26 30 4.5 4.5L39 26" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ dark = false, compact = false, className }: { dark?: boolean; compact?: boolean; className?: string }) {
  return (
    <div className={cx('flex items-center gap-2.5', className)}>
      <LogoMark className="h-10 w-10 shrink-0 drop-shadow" />
      {!compact && (
        <div className="leading-tight">
          <div className={cx('flex items-baseline gap-1.5 font-display', dark ? 'text-white' : 'text-navy-900')}>
            <span className="text-lg font-black tracking-[0.18em]" dir="ltr">ISTIBAQ</span>
            <span className={cx('text-sm font-light', dark ? 'text-navy-300' : 'text-navy-300')}>|</span>
            <span className="text-lg font-extrabold">استباق</span>
          </div>
          <p className={cx('text-[10px] font-medium', dark ? 'text-navy-300' : 'text-navy-500')}>منصة الاستجابة المدرسية للطوارئ</p>
        </div>
      )}
    </div>
  );
}

export const SLOGAN = 'نرصد الخطر، ننظم الاستجابة، ونطمئن على الجميع.';
