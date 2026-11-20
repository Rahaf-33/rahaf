import { useNavigate } from 'react-router-dom';
import { BookCheck, MapPin, Clock, ShieldAlert } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Badge, Button, Modal } from './ui';
import { SEVERITY_LABEL, SEVERITY_STYLE, TYPE_LABEL, formatTime, ROLE_LABEL } from '@/lib/labels';
import { useI18n } from '@/i18n';

export function AlertModal() {
  const id = useStore((s) => s.showAlertModal);
  const alert = useStore((s) => s.alerts.find((a) => a.id === id));
  const procedures = useStore((s) => s.procedures);
  const close = useStore((s) => s.setAlertModal);
  const user = useStore((s) => s.user);
  const nav = useNavigate();
  const { tr, tx, n, isEn } = useI18n();
  if (!alert) return null;
  const proc = procedures.find((p) => p.id === alert.analysis.procedureId);
  const myRole = proc?.roles.find((r) => r.role === user?.role);
  const steps = isEn && proc?.stepsEn?.length ? proc.stepsEn : proc?.steps ?? [];
  return (
    <Modal
      open={!!alert}
      onClose={() => close(null)}
      size="lg"
      title={<span className="flex items-center gap-2 text-danger"><ShieldAlert className="h-5 w-5" /> {alert.source === 'demo' ? tr('إنذار تجريبي') : tr('إنذار')} – {TYPE_LABEL[alert.type]}</span>}
      footer={
        <>
          <Button variant="outline" onClick={() => close(null)}>{tr('إغلاق')}</Button>
          {user?.role === 'teacher' ? (
            <Button variant="success" onClick={() => { close(null); nav('/teacher'); }}>{tr('الانتقال لتأكيد سلامة الطالبات')}</Button>
          ) : (
            <Button onClick={() => { close(null); nav('/'); }}>{tr('فتح لوحة التحكم')}</Button>
          )}
        </>
      }
    >
      <div className="rounded-2xl bg-danger-soft p-4 ring-1 ring-danger/20">
        <p className="font-display text-lg font-bold text-danger-dark">{tx(alert.title)}</p>
        <p className="mt-1 text-sm leading-relaxed text-navy-800">{tx(alert.text)}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge className={SEVERITY_STYLE[alert.severity]}>{tr('الخطورة:')} {SEVERITY_LABEL[alert.severity]}</Badge>
          <Badge><Clock className="h-3 w-3" /> {formatTime(alert.receivedAt)}</Badge>
          {alert.location && <Badge><MapPin className="h-3 w-3" /> {tx(alert.location)}</Badge>}
          <Badge className="bg-amber-100 text-amber-800 ring-amber-300">{tr('المصدر:')} {tx(alert.sourceLabel)}</Badge>
        </div>
      </div>
      {proc && (
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <BookCheck className="h-5 w-5 text-safe-dark" />
            <p className="font-bold text-navy-900">{n(proc, 'title')}</p>
            <Badge className="bg-safe-soft text-safe-dark ring-safe/30">{tr('من مكتبة الإجراءات المعتمدة')}</Badge>
          </div>
          {myRole && (
            <p className="mb-3 rounded-xl bg-navy-50 px-3 py-2 text-sm text-navy-800"><b>{tr('دورك ({role}):', { role: ROLE_LABEL[myRole.role] })}</b> {n(myRole, 'action')}</p>
          )}
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-navy-800">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-800 text-xs font-bold text-white">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] text-navy-400">{tr('المرجع:')} {tr(proc.source)} {tr('– الإصدار')} {proc.version}</p>
        </div>
      )}
    </Modal>
  );
}
