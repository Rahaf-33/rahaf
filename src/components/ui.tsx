import { X } from 'lucide-react';
import { useEffect, type ReactNode, type ButtonHTMLAttributes } from 'react';

export const cx = (...a: (string | number | false | null | undefined)[]) => a.filter(Boolean).join(' ');

export function Card({ children, className, title, subtitle, action, padded = true }: {
  children: ReactNode; className?: string; title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; padded?: boolean;
}) {
  return (
    <section className={cx('rounded-2xl bg-white shadow-card ring-1 ring-navy-900/5', className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-navy-50 px-5 py-4">
          <div className="min-w-0">
            {title && <h3 className="font-display text-base font-bold text-navy-900">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-navy-500">{subtitle}</p>}
          </div>
          {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', className ?? 'bg-navy-50 text-navy-700 ring-navy-200')}>
      {children}
    </span>
  );
}

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline' | 'warning';
const VARIANT: Record<Variant, string> = {
  primary: 'bg-navy-800 text-white hover:bg-navy-700 focus-visible:ring-navy-400',
  secondary: 'bg-navy-50 text-navy-800 hover:bg-navy-100 focus-visible:ring-navy-300',
  danger: 'bg-danger text-white hover:bg-danger-dark focus-visible:ring-danger/40',
  success: 'bg-safe text-white hover:bg-safe-dark focus-visible:ring-safe/40',
  warning: 'bg-warn text-white hover:bg-warn-dark focus-visible:ring-warn/40',
  ghost: 'text-navy-700 hover:bg-navy-50',
  outline: 'bg-white text-navy-800 ring-1 ring-inset ring-navy-200 hover:bg-navy-50',
};
export function Button({ variant = 'primary', size = 'md', className, children, icon, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: ReactNode;
}) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-5 py-3 text-base' : 'px-4 py-2 text-sm',
        VARIANT[variant], className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function StatCard({ label, value, hint, icon, tone = 'navy', className }: {
  label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: 'navy' | 'safe' | 'warn' | 'danger' | 'brand'; className?: string;
}) {
  const toneCls = {
    navy: 'bg-navy-50 text-navy-700', safe: 'bg-safe-soft text-safe-dark', warn: 'bg-warn-soft text-warn-dark', danger: 'bg-danger-soft text-danger-dark', brand: 'bg-sky-50 text-brand-dark',
  }[tone];
  return (
    <div className={cx('rounded-2xl bg-white p-4 shadow-card ring-1 ring-navy-900/5', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-navy-500">{label}</p>
        {icon && <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', toneCls)}>{icon}</span>}
      </div>
      <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-navy-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-navy-500">{hint}</p>}
    </div>
  );
}

export function Progress({ value, tone = 'safe', className }: { value: number; tone?: 'safe' | 'warn' | 'danger' | 'brand'; className?: string }) {
  const c = { safe: 'bg-safe', warn: 'bg-warn', danger: 'bg-danger', brand: 'bg-brand' }[tone];
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-navy-50', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full transition-all duration-500', c)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className={cx('max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl animate-slideIn', w)} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-navy-50 bg-white px-5 py-4">
          <h2 className="font-display text-lg font-bold text-navy-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-navy-500 hover:bg-navy-50" aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-navy-50 bg-white px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, icon, actions }: { title: string; subtitle?: ReactNode; icon?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-800 text-white shadow-card">{icon}</span>}
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-navy-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ icon, title, body }: { icon?: ReactNode; title: string; body?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      {icon && <span className="grid h-14 w-14 place-items-center rounded-2xl bg-navy-50 text-navy-400">{icon}</span>}
      <p className="font-semibold text-navy-800">{title}</p>
      {body && <p className="max-w-md text-sm text-navy-500">{body}</p>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div className={cx('inline-flex flex-wrap gap-1 rounded-xl bg-navy-50 p-1', className)} role="tablist">
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={cx('rounded-lg px-3 py-1.5 text-sm font-semibold transition', value === it.value ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500 hover:text-navy-800')}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function DemoBadge({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-inset ring-amber-300', className)}>
      ● {children ?? 'بيانات تجريبية'}
    </span>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-navy-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-navy-400">{hint}</span>}
    </label>
  );
}

export const inputCls = 'w-full rounded-xl border-0 bg-white px-3 py-2 text-sm text-navy-900 ring-1 ring-inset ring-navy-200 placeholder:text-navy-300 focus:ring-2 focus:ring-brand';
