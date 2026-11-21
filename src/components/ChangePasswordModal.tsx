import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { passwordProblem } from '@/lib/auth';
import { Button, Field, Modal, inputCls } from './ui';
import { useI18n } from '@/i18n';

/** Lets the signed-in user change her password. When `forced`, it cannot be dismissed (first sign-in). */
export function ChangePasswordModal({ open, onClose, forced = false }: { open: boolean; onClose: () => void; forced?: boolean }) {
  const { tr } = useI18n();
  const user = useStore((s) => s.user);
  const accounts = useStore((s) => s.accounts);
  const changePassword = useStore((s) => s.changePassword);
  const logout = useStore((s) => s.logout);
  const toast = useStore((s) => s.toast);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const username = accounts.find((a) => a.id === user?.id)?.username;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const problem = passwordProblem(next, username);
    if (problem) { setErr(tr(problem)); return; }
    if (next !== confirm) { setErr(tr('كلمتا المرور غير متطابقتين')); return; }
    if (next === cur) { setErr(tr('اختاري كلمة مرور مختلفة عن الحالية')); return; }
    setBusy(true);
    const res = await changePassword(cur, next);
    setBusy(false);
    if (res === 'wrong-current') { setErr(tr('كلمة المرور الحالية غير صحيحة')); return; }
    if (res === 'crypto') { setErr(tr('المتصفح لا يدعم التشفير الآمن على هذا الرابط. افتحي المنصة عبر رابط https أو localhost.')); return; }
    setCur(''); setNext(''); setConfirm(''); setErr('');
    toast({ title: 'تم تغيير كلمة المرور', level: 'success' });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={forced ? () => undefined : onClose}
      size="sm"
      title={<span className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> {forced ? tr('عيّني كلمة مرور جديدة') : tr('تغيير كلمة المرور')}</span>}
      footer={
        <>
          {forced ? <Button variant="ghost" onClick={() => logout()}>{tr('تسجيل الخروج')}</Button> : <Button variant="outline" onClick={onClose}>{tr('إلغاء')}</Button>}
          <Button onClick={() => submit()} disabled={busy || !cur || !next || !confirm} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>{tr('حفظ كلمة المرور')}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        {forced && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">{tr('هذا أول دخول لك بكلمة مرور مؤقتة. لحماية حسابك عيّني كلمة مرور خاصة بك قبل المتابعة.')}</p>}
        <input type="text" name="username" autoComplete="username" value={username ?? ''} readOnly hidden />
        <Field label={tr('كلمة المرور الحالية')}><input id="current-password" type="password" dir="ltr" autoComplete="current-password" className={inputCls} value={cur} onChange={(e) => setCur(e.target.value)} /></Field>
        <Field label={tr('كلمة المرور الجديدة')} hint={tr('8 أحرف على الأقل، وتحتوي على حروف وأرقام')}><input id="new-password" type="password" dir="ltr" autoComplete="new-password" className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} /></Field>
        <Field label={tr('تأكيد كلمة المرور الجديدة')}><input id="confirm-password" type="password" dir="ltr" autoComplete="new-password" className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        {err && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-xs text-danger-dark">{err}</p>}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
