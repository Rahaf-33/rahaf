import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, X } from 'lucide-react';
import { useStore, type Toast } from '@/store/useStore';
import { cx } from './ui';

function ToastItem({ t }: { t: Toast }) {
  const dismiss = useStore((s) => s.dismissToast);
  useEffect(() => {
    const id = setTimeout(() => dismiss(t.id), t.level === 'critical' ? 7000 : 4500);
    return () => clearTimeout(id);
  }, [t, dismiss]);
  const Icon = { info: Info, success: CheckCircle2, warning: AlertTriangle, critical: OctagonAlert }[t.level];
  return (
    <div className={cx('pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl bg-white p-3.5 shadow-2xl ring-1 animate-slideIn',
      { info: 'ring-navy-200', success: 'ring-safe/40', warning: 'ring-warn/50', critical: 'ring-danger/60' }[t.level])}
    >
      <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-xl', { info: 'bg-navy-50 text-navy-700', success: 'bg-safe-soft text-safe-dark', warning: 'bg-warn-soft text-warn-dark', critical: 'bg-danger text-white' }[t.level])}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-navy-900">{t.title}</p>
        {t.body && <p className="mt-0.5 line-clamp-3 text-xs text-navy-600">{t.body}</p>}
      </div>
      <button onClick={() => dismiss(t.id)} className="rounded-md p-1 text-navy-400 hover:bg-navy-50" aria-label="إغلاق"><X className="h-4 w-4" /></button>
    </div>
  );
}

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="no-print pointer-events-none fixed bottom-4 left-4 z-[60] flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => <ToastItem key={t.id} t={t} />)}
    </div>
  );
}
