import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardCheck, Download, Search, Fingerprint, ShieldCheck, HelpCircle, Siren, Users, UserCheck, Pencil, Check, X, AlertTriangle } from 'lucide-react';
import { useStore, useCurrentStats } from '@/store/useStore';
import { Badge, Button, Card, cx, DemoBadge, inputCls, Modal, PageHeader, Progress, StatCard } from '@/components/ui';
import { CLASS_STATUS_LABEL, CLASS_STATUS_STYLE, type ClassStatus } from '@/store/selectors';
import { ATTENDANCE_LABEL, SAFETY_LABEL, SAFETY_STYLE, pct, formatTime } from '@/lib/labels';
import { downloadFile, toCSV } from '@/lib/export';
import type { Attendance, SafetyStatus } from '@/types';
import { N, useI18n } from '@/i18n';

export default function Accountability() {
  const { tr, n } = useI18n();
  const { stats, totals: t } = useCurrentStats();
  const floors = useStore((s) => s.floors);
  const teachers = useStore((s) => s.teachers);
  const students = useStore((s) => s.students);
  const e = useStore((s) => s.emergency);
  const user = useStore((s) => s.user)!;
  const setObservedManual = useStore((s) => s.setObservedManual);
  const [params, setParams] = useSearchParams();
  const [floor, setFloor] = useState('all');
  const [status, setStatus] = useState<ClassStatus | 'all'>('all');
  const [q, setQ] = useState('');
  const [editObs, setEditObs] = useState<{ id: string; v: number } | null>(null);
  const openClass = params.get('class');

  const rows = stats.filter((s) =>
    (floor === 'all' || s.cls.floorId === floor) &&
    (status === 'all' || s.status === status) &&
    (!q || s.cls.name.includes(q) || teachers.find((x) => x.id === s.cls.teacherId)?.name.includes(q) || students.some((st) => st.classId === s.cls.id && st.name.includes(q))),
  );

  const exportCSV = () => {
    const header = [tr('الفصل'), tr('المعلمة'), tr('المسجلات'), tr('الغائبات'), tr('الحاضرات'), tr('المرصود (عدّ مجهول)'), tr('المؤكدة بالاسم'), tr('تحتاج مساعدة'), tr('غير موجودة'), tr('لم يتم التحقق'), tr('الحالة')];
    const body = stats.map((s) => [s.cls.name, teachers.find((x) => x.id === s.cls.teacherId)?.name, s.registered, s.absent, s.expected, s.observed, s.confirmed, s.help, s.notFound, s.unverified, CLASS_STATUS_LABEL[s.status]]);
    const studentsRows = students.filter((s) => s.attendance !== 'absent' && s.safety !== 'safe').map((s) => [stats.find((x) => x.cls.id === s.classId)?.cls.name, s.name, SAFETY_LABEL[s.safety], s.note ?? '']);
    downloadFile(`istibaq-accountability-${Date.now()}.csv`, toCSV([header, ...body, [], [tr('الطالبات غير المؤكدة')], [tr('الفصل'), tr('الاسم'), tr('الحالة'), tr('ملاحظة')], ...studentsRows]), 'text/csv;charset=utf-8');
  };

  return (
    <div>
      <PageHeader title={tr('حصر الطالبات')} icon={<ClipboardCheck className="h-6 w-6" />} subtitle={tr('مطابقة سجل الحضور مع العدّ الآلي وتأكيد المعلمات بالاسم')} actions={<><DemoBadge /><Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={exportCSV}>{tr('تصدير CSV')}</Button></>} />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label={tr('الحاضرات حسب السجل')} value={t.expected} icon={<Users className="h-4 w-4" />} hint={tr('من {n} مسجلة', { n: t.registered })} />
        <StatCard label={tr('العدد المرصود')} value={t.observed} icon={<Fingerprint className="h-4 w-4" />} tone="brand" hint={tr('عدّ مجهول الهوية')} />
        <StatCard label={tr('مؤكدة السلامة بالاسم')} value={t.confirmed} icon={<ShieldCheck className="h-4 w-4" />} tone="safe" hint={`${pct(t.confirmed, t.expected)}%`} />
        <StatCard label={tr('لم يتم التحقق')} value={t.unverified} icon={<HelpCircle className="h-4 w-4" />} tone="warn" />
        <StatCard label={tr('تحتاج مساعدة')} value={t.help} icon={<Siren className="h-4 w-4" />} tone="danger" />
        <StatCard label={tr('غير موجودة')} value={t.notFound} icon={<AlertTriangle className="h-4 w-4" />} tone="danger" />
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900 ring-1 ring-sky-200">
        <Fingerprint className="mt-0.5 h-5 w-5 shrink-0" />
        <p><b>{tr('مبدأ الفصل بين العدد والهوية:')}</b> {tr('العدد المرصود يأتي من حساسات افتراضية ولا يحدد هوية أي طالبة. لا تُحتسب الطالبة "آمنة" إلا بتأكيد صريح بالاسم من المعلمة أو الفريق المختص. الفروقات بين العددين تُعرض كتنبيه للتحقق فقط.')}</p>
      </div>

      <Card padded={false}>
        <div className="grid grid-cols-1 gap-2 border-b border-navy-50 p-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-2.5 h-4 w-4 text-navy-300" />
            <input className={cx(inputCls, 'ps-8')} placeholder={tr('بحث بالفصل أو المعلمة أو اسم الطالبة')} value={q} onChange={(e2) => setQ(e2.target.value)} />
          </div>
          <select className={inputCls} value={floor} onChange={(e2) => setFloor(e2.target.value)}>
            <option value="all">{tr('كل الطوابق')}</option>
            {floors.map((f) => <option key={f.id} value={f.id}>{n(f)}</option>)}
          </select>
          <select className={inputCls} value={status} onChange={(e2) => setStatus(e2.target.value as ClassStatus | 'all')}>
            <option value="all">{tr('كل الحالات')}</option>
            {(Object.keys(CLASS_STATUS_LABEL) as ClassStatus[]).map((k) => <option key={k} value={k}>{CLASS_STATUS_LABEL[k]}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-navy-50/60 text-xs text-navy-500">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">{tr('الفصل')}</th>
                <th className="text-start font-semibold">{tr('المعلمة')}</th>
                <th className="text-center font-semibold">{tr('المسجل')}</th>
                <th className="text-center font-semibold">{tr('الحاضرات')}</th>
                <th className="text-center font-semibold">{tr('المرصود')}</th>
                <th className="text-center font-semibold">{tr('أكدت المعلمة')}</th>
                <th className="text-center font-semibold">{tr('لم يتحقق')}</th>
                <th className="text-center font-semibold">{tr('مساعدة')}</th>
                <th className="w-40 text-start font-semibold">{tr('التقدم')}</th>
                <th className="text-start font-semibold">{tr('الحالة')}</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {rows.map((s) => {
                const diff = s.observed - s.confirmed;
                return (
                  <tr key={s.cls.id} className="hover:bg-navy-50/40">
                    <td className="px-4 py-3"><p className="font-display text-base font-bold text-navy-900">{s.cls.name}</p><p className="text-[11px] text-navy-400">{n(floors.find((f) => f.id === s.cls.floorId))}</p></td>
                    <td className="text-navy-700">{n(teachers.find((x) => x.id === s.cls.teacherId))}</td>
                    <td className="text-center tabular-nums">{s.registered}</td>
                    <td className="text-center tabular-nums">{s.expected}<span className="text-[10px] text-navy-400"> ({s.absent} {tr('غ)')}</span></td>
                    <td className="text-center tabular-nums">
                      {editObs?.id === s.cls.id ? (
                        <span className="inline-flex items-center gap-1">
                          <input type="number" className="w-14 rounded-lg px-1 py-0.5 text-center ring-1 ring-navy-200" value={editObs.v} onChange={(e2) => setEditObs({ id: s.cls.id, v: Number(e2.target.value) })} />
                          <button onClick={() => { setObservedManual(s.cls.id, editObs.v, N(user)); setEditObs(null); }} className="text-safe"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditObs(null)} className="text-navy-400"><X className="h-4 w-4" /></button>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          {s.observed}
                          {e.active && diff !== 0 && s.observed > 0 && <span className={cx('text-[10px] font-bold', diff > 0 ? 'text-brand' : 'text-warn-dark')} title={tr('الفرق بين المرصود والمؤكد')}>({diff > 0 ? '+' : ''}{diff})</span>}
                          {e.active && <button onClick={() => setEditObs({ id: s.cls.id, v: s.observed })} className="text-navy-300 hover:text-navy-600" aria-label={tr('تعديل يدوي')}><Pencil className="h-3 w-3" /></button>}
                        </span>
                      )}
                    </td>
                    <td className="text-center font-bold tabular-nums text-safe-dark">{s.confirmed}</td>
                    <td className={cx('text-center tabular-nums', s.unverified > 0 && e.active ? 'font-bold text-warn-dark' : '')}>{s.unverified}</td>
                    <td className={cx('text-center tabular-nums', s.help + s.notFound > 0 ? 'font-bold text-danger' : '')}>{s.help + s.notFound}</td>
                    <td className="pe-4"><Progress value={pct(s.confirmed, s.expected)} tone={s.status === 'help' ? 'danger' : s.status === 'complete' ? 'safe' : 'warn'} /><p className="mt-0.5 text-[10px] text-navy-400">{pct(s.confirmed, s.expected)}%</p></td>
                    <td><Badge className={CLASS_STATUS_STYLE[s.status]}>{CLASS_STATUS_LABEL[s.status]}</Badge></td>
                    <td className="pe-3"><Button size="sm" variant="outline" onClick={() => setParams({ class: s.cls.id })}>{tr('الطالبات')}</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ClassModal classId={openClass} onClose={() => setParams({})} />
    </div>
  );
}

function ClassModal({ classId, onClose }: { classId: string | null; onClose: () => void }) {
  const { tr, tx, n } = useI18n();
  const cls = useStore((s) => s.classes.find((c) => c.id === classId));
  const all = useStore((s) => s.students);
  const teacher = useStore((s) => s.teachers.find((t) => t.id === cls?.teacherId));
  const user = useStore((s) => s.user)!;
  const active = useStore((s) => s.emergency.active);
  const setSafety = useStore((s) => s.setStudentSafety);
  const setAttendance = useStore((s) => s.setAttendance);
  const confirmAll = useStore((s) => s.confirmAllPresent);
  const [filter, setFilter] = useState<SafetyStatus | 'all' | 'absent'>('all');
  useEffect(() => setFilter('all'), [classId]);
  const list = useMemo(() => all.filter((s) => s.classId === classId), [all, classId]);
  if (!cls) return null;
  const shown = list.filter((s) => filter === 'all' || (filter === 'absent' ? s.attendance === 'absent' : s.attendance !== 'absent' && s.safety === filter));
  const present = list.filter((s) => s.attendance !== 'absent');
  const confirmed = present.filter((s) => s.safety === 'safe').length;

  return (
    <Modal open={!!cls} onClose={onClose} size="xl" title={`${tr('فصل {name}', { name: cls.name })} – ${n(teacher)}`} footer={
      <>
        {active && <Button variant="success" icon={<UserCheck className="h-4 w-4" />} onClick={() => confirmAll(cls.id, N(user))} disabled={present.every((s) => s.safety !== 'unverified')}>{tr('تأكيد جميع الحاضرات غير المؤكدات')}</Button>}
        <Button variant="outline" onClick={onClose}>{tr('إغلاق')}</Button>
      </>
    }>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <div className="mb-1 flex justify-between text-xs text-navy-600"><span>{tr('تم التحقق بالاسم')}</span><span className="font-bold">{confirmed}/{present.length}</span></div>
          <Progress value={pct(confirmed, present.length)} />
        </div>
        <select className={cx(inputCls, 'w-auto')} value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option value="all">{tr('الكل (')}{list.length})</option>
          {(Object.keys(SAFETY_LABEL) as SafetyStatus[]).map((k) => <option key={k} value={k}>{SAFETY_LABEL[k]} ({present.filter((s) => s.safety === k).length})</option>)}
          <option value="absent">{tr('غائبات (')}{list.length - present.length})</option>
        </select>
      </div>
      {!active && <p className="mb-3 rounded-xl bg-navy-50 px-3 py-2 text-xs text-navy-600">{tr('خارج حالة الطوارئ يمكن تحديث سجل الحضور فقط. أزرار تأكيد السلامة تعمل عند تفعيل الطوارئ أو المحاكاة.')}</p>}
      <ul className="divide-y divide-navy-50 rounded-xl ring-1 ring-navy-100">
        {shown.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
            <div className="min-w-[180px] flex-1">
              <p className="text-sm font-semibold text-navy-900">{n(s)}</p>
              <p className="text-[11px] text-navy-400">{s.id}{s.medicalNote ? ` · ⚕ ${n(s, 'medicalNote')}` : ''}{s.confirmedBy ? ` · ${tx(s.confirmedBy)} ${s.confirmedAt ? formatTime(s.confirmedAt) : ''}` : ''}</p>
              {s.note && <p className="text-[11px] text-danger-dark">{tx(s.note)}</p>}
            </div>
            <select className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-navy-200" value={s.attendance} onChange={(e) => setAttendance(s.id, e.target.value as Attendance, N(user))}>
              {(Object.keys(ATTENDANCE_LABEL) as Attendance[]).map((k) => <option key={k} value={k}>{ATTENDANCE_LABEL[k]}</option>)}
            </select>
            {s.attendance === 'absent' ? <Badge className="bg-gray-100 text-gray-600 ring-gray-200">{tr('غائبة حسب السجل')}</Badge> : <Badge className={SAFETY_STYLE[s.safety]}>{SAFETY_LABEL[s.safety]}</Badge>}
            {active && s.attendance !== 'absent' && (
              <div className="flex gap-1">
                <button title={tr('تأكيد السلامة')} onClick={() => setSafety(s.id, 'safe', N(user))} className={cx('rounded-lg px-2 py-1 text-xs font-bold', s.safety === 'safe' ? 'bg-safe text-white' : 'bg-safe-soft text-safe-dark hover:bg-safe/20')}>{tr('آمنة')}</button>
                <button title={tr('تحتاج مساعدة')} onClick={() => setSafety(s.id, 'needs_help', N(user), tr('تحتاج مساعدة – تحديث من الإدارة'))} className={cx('rounded-lg px-2 py-1 text-xs font-bold', s.safety === 'needs_help' ? 'bg-danger text-white' : 'bg-danger-soft text-danger-dark hover:bg-danger/20')}>{tr('مساعدة')}</button>
                <button title={tr('غير موجودة')} onClick={() => setSafety(s.id, 'not_found', N(user), tr('غير موجودة في نقطة التجمع'))} className={cx('rounded-lg px-2 py-1 text-xs font-bold', s.safety === 'not_found' ? 'bg-danger-dark text-white' : 'bg-navy-50 text-navy-700 hover:bg-navy-100')}>{tr('مفقودة')}</button>
                {s.safety !== 'unverified' && <button title={tr('إعادة')} onClick={() => setSafety(s.id, 'unverified', N(user))} className="rounded-lg px-2 py-1 text-xs text-navy-400 hover:bg-navy-50">↺</button>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
