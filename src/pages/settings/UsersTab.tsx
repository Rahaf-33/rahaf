import { useState } from 'react';
import { KeyRound, Plus, Pencil, Trash2, UserCheck, UserX, Loader2 } from 'lucide-react';
import { useStore, type AccountInput } from '@/store/useStore';
import { Badge, Button, Card, cx, Field, Modal, inputCls } from '@/components/ui';
import { ROLE_LABEL, formatDateTime } from '@/lib/labels';
import { passwordProblem } from '@/lib/auth';
import { uid } from '@/lib/random';
import { useI18n } from '@/i18n';
import type { Account, Role } from '@/types';

type Edit = { input: AccountInput; isNew: boolean; password: string };

export function UsersTab() {
  const { tr, n } = useI18n();
  const accounts = useStore((s) => s.accounts);
  const teachers = useStore((s) => s.teachers);
  const me = useStore((s) => s.user);
  const saveAccount = useStore((s) => s.saveAccount);
  const resetPw = useStore((s) => s.resetAccountPassword);
  const setActive = useStore((s) => s.setAccountActive);
  const remove = useStore((s) => s.removeAccount);
  const toast = useStore((s) => s.toast);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [reset, setReset] = useState<{ acc: Account; pw: string } | null>(null);
  const [askDelete, setAskDelete] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const blank = (): Edit => ({ isNew: true, password: '', input: { id: uid('U'), username: '', name: '', nameEn: '', role: 'teacher', title: 'معلمة', titleEn: 'Teacher', active: true } });

  const save = async () => {
    if (!edit) return;
    const u = edit.input.username.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,32}$/.test(u)) { setErr(tr('اسم المستخدم: 3 أحرف إنجليزية على الأقل (حروف وأرقام و . _ -)')); return; }
    if (accounts.some((a) => a.username === u && a.id !== edit.input.id)) { setErr(tr('اسم المستخدم مستخدم مسبقًا')); return; }
    if (!edit.input.name.trim()) { setErr(tr('أدخلي الاسم')); return; }
    if (edit.input.role === 'teacher' && !edit.input.teacherId) { setErr(tr('اختاري المعلمة المرتبطة بالحساب')); return; }
    if (edit.isNew || edit.password) {
      const p = passwordProblem(edit.password, u);
      if (p) { setErr(tr(p)); return; }
    }
    setBusy(true);
    await saveAccount({ ...edit.input, username: u }, edit.password || undefined);
    setBusy(false);
    toast({ title: edit.isNew ? 'تم إنشاء الحساب' : 'تم حفظ الحساب', level: 'success' });
    setEdit(null); setErr('');
  };

  const doReset = async () => {
    if (!reset) return;
    const p = passwordProblem(reset.pw, reset.acc.username);
    if (p) { setErr(tr(p)); return; }
    setBusy(true);
    await resetPw(reset.acc.id, reset.pw);
    setBusy(false);
    toast({ title: 'تمت إعادة تعيين كلمة المرور', body: 'سيُطلب من المستخدمة تغييرها عند الدخول', level: 'success' });
    setReset(null); setErr('');
  };

  return (
    <Card title={tr('المستخدمون وصلاحيات الدخول ({n})', { n: accounts.length })} subtitle={tr('كلمات المرور محفوظة مشفّرة (PBKDF2) ولا يمكن لأحد الاطلاع عليها')} action={<Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => { setErr(''); setEdit(blank()); }}>{tr('إضافة مستخدم')}</Button>} padded={false}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>{[tr('اسم المستخدم'), tr('الاسم'), tr('الدور'), tr('آخر دخول'), tr('الحالة'), ''].map((h, i) => <th key={i} className={cx('py-2.5 text-start font-semibold', i === 0 && 'px-4')}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-navy-50 text-navy-800">
            {accounts.map((a) => (
              <tr key={a.id} className={cx(!a.active && 'opacity-60')}>
                <td className="px-4 py-2.5 font-mono text-xs font-bold" dir="ltr">{a.username}</td>
                <td><p className="font-semibold">{n(a)}</p>{a.teacherId && <p className="text-[11px] text-navy-400">{n(a, 'title')}</p>}</td>
                <td>{ROLE_LABEL[a.role]}</td>
                <td className="text-xs text-navy-500">{a.lastLoginAt ? formatDateTime(a.lastLoginAt) : '—'}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {a.active ? <Badge className="bg-safe-soft text-safe-dark ring-safe/30">{tr('نشط')}</Badge> : <Badge className="bg-gray-100 text-gray-600 ring-gray-200">{tr('موقوف')}</Badge>}
                    {a.mustChangePassword && <Badge className="bg-warn-soft text-warn-dark ring-warn/30">{tr('كلمة مرور مؤقتة')}</Badge>}
                  </div>
                </td>
                <td className="whitespace-nowrap pe-3 text-end">
                  {askDelete === a.id ? (
                    <span className="inline-flex gap-1">
                      <button onClick={() => { remove(a.id); setAskDelete(null); }} className="rounded-lg bg-danger px-2 py-1 text-xs font-bold text-white">{tr('تأكيد الحذف')}</button>
                      <button onClick={() => setAskDelete(null)} className="rounded-lg px-2 py-1 text-xs text-navy-500 hover:bg-navy-50">{tr('إلغاء')}</button>
                    </span>
                  ) : (
                    <>
                      <button onClick={() => { setErr(''); setEdit({ isNew: false, password: '', input: { id: a.id, username: a.username, name: a.name, nameEn: a.nameEn, role: a.role, title: a.title, titleEn: a.titleEn, teacherId: a.teacherId, active: a.active, mustChangePassword: a.mustChangePassword } }); }} className="rounded-lg p-1.5 text-navy-500 hover:bg-navy-50" aria-label={tr('تعديل')} title={tr('تعديل')}><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => { setErr(''); setReset({ acc: a, pw: '' }); }} className="rounded-lg p-1.5 text-navy-500 hover:bg-navy-50" aria-label={tr('إعادة تعيين كلمة المرور')} title={tr('إعادة تعيين كلمة المرور')}><KeyRound className="h-4 w-4" /></button>
                      {a.id !== me?.id && (
                        <>
                          <button onClick={() => setActive(a.id, !a.active)} className="rounded-lg p-1.5 text-navy-500 hover:bg-navy-50" aria-label={a.active ? tr('إيقاف الحساب') : tr('تفعيل الحساب')} title={a.active ? tr('إيقاف الحساب') : tr('تفعيل الحساب')}>{a.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}</button>
                          <button onClick={() => setAskDelete(a.id)} className="rounded-lg p-1.5 text-navy-400 hover:bg-danger-soft hover:text-danger" aria-label={tr('حذف')} title={tr('حذف')}><Trash2 className="h-4 w-4" /></button>
                        </>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <Modal open onClose={() => setEdit(null)} title={edit.isNew ? tr('إضافة مستخدم') : tr('تعديل المستخدم')} footer={<><Button variant="outline" onClick={() => setEdit(null)}>{tr('إلغاء')}</Button><Button onClick={save} disabled={busy} icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>{tr('حفظ')}</Button></>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr('اسم المستخدم')}><input id="acc-username" dir="ltr" autoComplete="off" className={inputCls} value={edit.input.username} onChange={(e) => setEdit({ ...edit, input: { ...edit.input, username: e.target.value } })} /></Field>
            <Field label={tr('الدور')}>
              <select id="acc-role" className={inputCls} value={edit.input.role} onChange={(e) => { const role = e.target.value as Role; setEdit({ ...edit, input: { ...edit.input, role, teacherId: role === 'teacher' ? edit.input.teacherId : undefined, title: ROLE_TITLES[role][0], titleEn: ROLE_TITLES[role][1] } }); }}>
                {(Object.keys(ROLE_TITLES) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </Field>
            <Field label={tr('الاسم بالعربية')}><input id="acc-name" className={inputCls} value={edit.input.name} onChange={(e) => setEdit({ ...edit, input: { ...edit.input, name: e.target.value } })} /></Field>
            <Field label={tr('الاسم بالإنجليزية')}><input id="acc-name-en" dir="ltr" className={inputCls} value={edit.input.nameEn ?? ''} onChange={(e) => setEdit({ ...edit, input: { ...edit.input, nameEn: e.target.value } })} /></Field>
            {edit.input.role === 'teacher' && (
              <Field label={tr('المعلمة المرتبطة (لعرض فصلها)')}>
                <select id="acc-teacher" className={inputCls} value={edit.input.teacherId ?? ''} onChange={(e) => setEdit({ ...edit, input: { ...edit.input, teacherId: e.target.value || undefined } })}>
                  <option value="">—</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{n(t)}</option>)}
                </select>
              </Field>
            )}
            <Field label={edit.isNew ? tr('كلمة المرور المؤقتة') : tr('كلمة مرور جديدة (اتركيها فارغة دون تغيير)')} hint={tr('8 أحرف على الأقل، وتحتوي على حروف وأرقام')}>
              <input id="acc-password" type="password" dir="ltr" autoComplete="new-password" className={inputCls} value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} />
            </Field>
          </div>
          {err && <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-xs text-danger-dark">{err}</p>}
          <p className="mt-3 text-[11px] text-navy-400">{tr('سيُطلب من المستخدمة تغيير كلمة المرور المؤقتة عند أول دخول.')}</p>
        </Modal>
      )}

      {reset && (
        <Modal open size="sm" onClose={() => setReset(null)} title={tr('إعادة تعيين كلمة المرور')} footer={<><Button variant="outline" onClick={() => setReset(null)}>{tr('إلغاء')}</Button><Button onClick={doReset} disabled={busy || !reset.pw}>{tr('حفظ')}</Button></>}>
          <p className="mb-3 text-sm text-navy-700">{tr('كلمة مرور مؤقتة جديدة للحساب')} <b dir="ltr">{reset.acc.username}</b></p>
          <Field label={tr('كلمة المرور المؤقتة')} hint={tr('8 أحرف على الأقل، وتحتوي على حروف وأرقام')}><input id="reset-password" type="password" dir="ltr" autoComplete="new-password" className={inputCls} value={reset.pw} onChange={(e) => setReset({ ...reset, pw: e.target.value })} /></Field>
          {err && <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-xs text-danger-dark">{err}</p>}
        </Modal>
      )}
    </Card>
  );
}

const ROLE_TITLES: Record<Role, [string, string]> = {
  principal: ['قائدة المدرسة', 'School Principal'],
  teacher: ['معلمة', 'Teacher'],
  safety: ['مسؤولة الأمن والسلامة', 'Safety & Security Officer'],
  admin: ['مديرة النظام', 'System Administrator'],
};
