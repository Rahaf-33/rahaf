import { useMemo, useState } from 'react';
import { UserRoundCheck, CheckCircle2, AlertTriangle, LifeBuoy, Siren, MapPin, Flag, Search, UserX, ShieldCheck, Bell, BookCheck } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Badge, Button, Card, cx, DemoBadge, Field, inputCls, Modal, PageHeader, Progress } from '@/components/ui';
import { ATTENDANCE_LABEL, HELP_LABEL, SAFETY_LABEL, SAFETY_STYLE, TYPE_LABEL, formatTime, pct, timeAgo, ROLE_LABEL } from '@/lib/labels';
import type { Attendance, HelpType, Student } from '@/types';
import { N, useI18n } from '@/i18n';

export default function TeacherPanel() {
  const { tr, tx, n, isEn } = useI18n();
  const user = useStore((s) => s.user)!;
  const teachers = useStore((s) => s.teachers);
  const classes = useStore((s) => s.classes);
  const allStudents = useStore((s) => s.students);
  const aps = useStore((s) => s.assemblyPoints);
  const exits = useStore((s) => s.exits);
  const floors = useStore((s) => s.floors);
  const e = useStore((s) => s.emergency);
  const alert = useStore((s) => s.alerts.find((a) => a.id === s.emergency.alertId));
  const procedures = useStore((s) => s.procedures);
  const notifications = useStore((s) => s.notifications);
  const cases = useStore((s) => s.cases);
  const setSafety = useStore((s) => s.setStudentSafety);
  const setAttendance = useStore((s) => s.setAttendance);
  const confirmAll = useStore((s) => s.confirmAllPresent);
  const requestHelp = useStore((s) => s.requestHelp);

  const defaultTeacher = user.teacherId ?? teachers.find((t) => t.id === 'T7')?.id ?? teachers[0]?.id;
  const [teacherId, setTeacherId] = useState(defaultTeacher);
  const teacher = teachers.find((t) => t.id === teacherId);
  const cls = classes.find((c) => c.id === teacher?.classId);
  const students = useMemo(() => allStudents.filter((s) => s.classId === cls?.id), [allStudents, cls?.id]);
  const present = students.filter((s) => s.attendance !== 'absent');
  const confirmed = present.filter((s) => s.safety === 'safe').length;
  const issues = present.filter((s) => s.safety === 'needs_help' || s.safety === 'not_found').length;
  const remaining = present.length - confirmed - issues;
  const actor = teacher ? N(teacher) : N(user);
  const proc = procedures.find((p) => p.id === alert?.analysis.procedureId);
  const ap = aps.find((a) => a.id === cls?.assemblyPointId);
  const exit = exits.find((x) => x.floorId === cls?.floorId && x.assemblyPointId === cls?.assemblyPointId);
  const myNotifs = notifications.filter((n) => n.audience.includes('teacher') && (!n.teacherId || n.teacherId === teacherId)).slice(0, 6);
  const myCases = cases.filter((c) => c.classId === cls?.id);

  const [q, setQ] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpStudent, setHelpStudent] = useState<Student | null>(null);
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);
  const shown = students.filter((s) => !q || s.name.includes(q)).sort((a, b) => order(a) - order(b));

  if (!teacher || !cls) return <p>{tr('لا يوجد فصل مرتبط بهذا الحساب.')}</p>;

  return (
    <div>
      <PageHeader
        title={tr('لوحة المعلمة')}
        icon={<UserRoundCheck className="h-6 w-6" />}
        subtitle={`${n(teacher)} · ${tr('رائدة فصل {name}', { name: cls.name })} · ${n(teacher, 'subject')}`}
        actions={
          <>
            {user.role !== 'teacher' && (
              <select className={cx(inputCls, 'w-auto')} value={teacherId} onChange={(ev) => setTeacherId(ev.target.value)} aria-label={tr('عرض لوحة معلمة')}>
                {teachers.map((t) => <option key={t.id} value={t.id}>{tr('عرض كـ:')} {n(t)} ({n(classes.find((c) => c.id === t.classId))})</option>)}
              </select>
            )}
            <DemoBadge />
          </>
        }
      />

      {e.active ? (
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-l from-danger-dark to-danger p-5 text-white shadow-card sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 animate-pulseRing"><Siren className="h-7 w-7" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-extrabold sm:text-2xl">{tr('حالة طوارئ:')} {TYPE_LABEL[e.type!]}{e.simulation ? tr(' (محاكاة)') : ''}</p>
              <p className="text-sm text-white/85">{e.type === 'external_threat' ? tr('أبقي الطالبات داخل الفصل وأكدي وجودهن بالاسم.') : tr('توجهي بالطالبات إلى {ap} عبر {exit}، ثم أكدي سلامة كل طالبة بالاسم.', { ap: n(ap), exit: exit ? n(exit) : tr('أقرب مخرج آمن') })}</p>
            </div>
            <Button variant="outline" className="!bg-white !text-danger" icon={<LifeBuoy className="h-4 w-4" />} onClick={() => { setHelpStudent(null); setHelpOpen(true); }}>{tr('طلب مساعدة')}</Button>
          </div>
          {proc && (
            <details className="mt-4 rounded-xl bg-white/10 p-3 text-sm">
              <summary className="flex cursor-pointer items-center gap-2 font-semibold"><BookCheck className="h-4 w-4" /> {tr('التعليمات المعتمدة:')} {n(proc, 'title')}</summary>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-white/90">{(isEn && proc.stepsEn?.length ? proc.stepsEn : proc.steps).map((s, i) => <li key={i}>{s}</li>)}</ol>
              <p className="mt-2 text-xs text-white/70">{tr('دورك:')} {n(proc.roles.find((r) => r.role === 'teacher'), 'action')}</p>
            </details>
          )}
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-3xl bg-white p-5 shadow-card ring-1 ring-navy-900/5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-safe-soft text-safe-dark"><ShieldCheck className="h-6 w-6" /></span>
          <div className="flex-1">
            <p className="font-display text-lg font-extrabold text-navy-900">{tr('لا توجد حالة طوارئ حاليًا')}</p>
            <p className="text-sm text-navy-500">{tr('يمكنك تحديث سجل الحضور اليومي. عند أي طارئ ستصلك التعليمات هنا فورًا مع أزرار تأكيد السلامة.')}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile label={tr('المسجلات')} v={students.length} />
            <Tile label={tr('الحاضرات')} v={present.length} />
            <Tile label={e.active ? tr('مؤكدة السلامة') : tr('الغائبات')} v={e.active ? confirmed : students.length - present.length} tone={e.active ? 'safe' : undefined} />
            <Tile label={e.active ? tr('متبقٍ للتأكيد') : tr('المتأخرات')} v={e.active ? remaining : students.filter((s) => s.attendance === 'late').length} tone={e.active && remaining > 0 ? 'warn' : undefined} />
          </div>

          <Card
            title={e.active ? tr('تأكيد سلامة الطالبات بالاسم') : tr('سجل الحضور اليومي')}
            subtitle={e.active ? tr('اضغطي "آمنة" بعد رؤية الطالبة فعليًا – العدد وحده لا يكفي') : tr('تحديث حالة الحضور لكل طالبة')}
            action={
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute start-2.5 top-2.5 h-4 w-4 text-navy-300" />
                  <input className={cx(inputCls, 'w-44 ps-8')} placeholder={tr('بحث عن طالبة')} value={q} onChange={(ev) => setQ(ev.target.value)} />
                </div>
                {e.active && <Button variant="success" size="sm" icon={<CheckCircle2 className="h-4 w-4" />} disabled={remaining === 0} onClick={() => setConfirmAllOpen(true)}>{tr('تأكيد جميع المتبقيات')}</Button>}
              </>
            }
          >
            {e.active && (
              <div className="mb-4">
                <div className="mb-1 flex justify-between text-xs text-navy-600"><span>{tr('نسبة التحقق')}</span><span className="font-bold">{confirmed}/{present.length} ({pct(confirmed, present.length)}%)</span></div>
                <Progress value={pct(confirmed, present.length)} className="h-3" />
              </div>
            )}
            <ul className="grid gap-2 md:grid-cols-2">
              {shown.map((s) => (
                <li key={s.id} className={cx('rounded-2xl p-3 ring-1 transition', s.attendance === 'absent' ? 'bg-gray-50 ring-gray-200 opacity-70' : s.safety === 'safe' ? 'bg-safe-soft/60 ring-safe/30' : s.safety === 'unverified' ? 'bg-white ring-navy-100' : 'bg-danger-soft/60 ring-danger/30')}>
                  <div className="flex items-start gap-2">
                    <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold', s.safety === 'safe' ? 'bg-safe text-white' : 'bg-navy-100 text-navy-700')}>{n(s).charAt(0)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-navy-900">{n(s)}</p>
                      <p className="text-[11px] text-navy-500">
                        {ATTENDANCE_LABEL[s.attendance]}{s.medicalNote ? ` · ⚕ ${n(s, 'medicalNote')}` : ''}
                      </p>
                      {s.note && <p className="text-[11px] font-semibold text-danger-dark">{tx(s.note)}</p>}
                    </div>
                    {e.active && s.attendance !== 'absent' && <Badge className={SAFETY_STYLE[s.safety]}>{SAFETY_LABEL[s.safety]}</Badge>}
                  </div>
                  {e.active && s.attendance !== 'absent' ? (
                    <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                      <button onClick={() => setSafety(s.id, 'safe', actor)} className={cx('rounded-xl py-2 text-xs font-bold transition', s.safety === 'safe' ? 'bg-safe text-white' : 'bg-safe-soft text-safe-dark hover:bg-safe/20')}>{tr('✓ آمنة')}</button>
                      <button onClick={() => { setHelpStudent(s); setHelpOpen(true); }} className={cx('rounded-xl py-2 text-xs font-bold transition', s.safety === 'needs_help' ? 'bg-danger text-white' : 'bg-danger-soft text-danger-dark hover:bg-danger/20')}>{tr('⚠ مساعدة')}</button>
                      <button onClick={() => setSafety(s.id, 'not_found', actor, tr('لم تُشاهد في نقطة التجمع'))} className={cx('rounded-xl py-2 text-xs font-bold transition', s.safety === 'not_found' ? 'bg-danger-dark text-white' : 'bg-navy-50 text-navy-700 hover:bg-navy-100')}>{tr('✗ غير موجودة')}</button>
                    </div>
                  ) : !e.active ? (
                    <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                      {(['present', 'late', 'absent'] as Attendance[]).map((a) => (
                        <button key={a} onClick={() => setAttendance(s.id, a, actor)} className={cx('rounded-xl py-1.5 text-xs font-bold', s.attendance === a ? (a === 'absent' ? 'bg-gray-500 text-white' : a === 'late' ? 'bg-warn text-white' : 'bg-navy-800 text-white') : 'bg-navy-50 text-navy-600 hover:bg-navy-100')}>
                          {a === 'present' ? tr('حاضرة') : a === 'late' ? tr('متأخرة') : tr('غائبة')}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={tr('معلومات الإخلاء')}>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-brand" /><div><p className="text-xs text-navy-500">{tr('موقع الفصل')}</p><p className="font-semibold">{n(floors.find((f) => f.id === cls.floorId))}</p></div></li>
              <li className="flex gap-3"><Flag className="h-5 w-5 shrink-0 text-safe" /><div><p className="text-xs text-navy-500">{tr('نقطة التجمع')}</p><p className="font-semibold">{n(ap)}</p><p className="text-xs text-navy-500">{n(ap, 'description')}</p></div></li>
              <li className="flex gap-3"><UserX className="h-5 w-5 shrink-0 text-warn" /><div><p className="text-xs text-navy-500">{tr('مسار الخروج')}</p><p className="font-semibold">{exit ? n(exit) : tr('أقرب مخرج آمن')}</p></div></li>
            </ul>
            <Button variant="outline" className="mt-4 w-full" icon={<LifeBuoy className="h-4 w-4" />} onClick={() => { setHelpStudent(null); setHelpOpen(true); }} disabled={!e.active}>{tr('طلب مساعدة')}</Button>
          </Card>

          {myCases.length > 0 && (
            <Card title={tr('طلباتي')} padded={false}>
              <ul className="divide-y divide-navy-50 text-sm">
                {myCases.map((c) => (
                  <li key={c.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2"><p className="font-semibold text-navy-900">{tx(c.title)}</p><Badge className={c.status === 'resolved' ? 'bg-safe-soft text-safe-dark ring-safe/30' : 'bg-warn-soft text-warn-dark ring-warn/30'}>{c.status === 'resolved' ? tr('تم الحل') : c.status === 'in_progress' ? tr('قيد المعالجة') : tr('مفتوحة')}</Badge></div>
                    <p className="text-xs text-navy-500">{tx(c.description)}</p>
                    <p className="text-[10px] text-navy-400">{formatTime(c.createdAt)}{c.assignee ? ` · ${tr('مسندة إلى')} ${tr(c.assignee)}` : ''}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title={<span className="flex items-center gap-2"><Bell className="h-4 w-4" /> {tr('إشعاراتي')}</span>} padded={false}>
            {myNotifs.length === 0 ? <p className="p-5 text-center text-sm text-navy-400">{tr('لا توجد إشعارات')}</p> : (
              <ul className="divide-y divide-navy-50">
                {myNotifs.map((n) => (
                  <li key={n.id} className="px-5 py-3">
                    <p className="text-sm font-semibold text-navy-900">{tx(n.title)}</p>
                    <p className="text-xs text-navy-500">{tx(n.body)}</p>
                    <p className="text-[10px] text-navy-400">{timeAgo(n.at)}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-navy-50 px-5 py-2 text-[10px] text-navy-400">{tr('إشعارات داخل المنصة –')} {ROLE_LABEL.teacher}</p>
          </Card>
        </div>
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} student={helpStudent} students={present} onSubmit={(type, desc, sid) => {
        if (sid) setSafety(sid, 'needs_help', actor, desc);
        else requestHelp({ classId: cls.id, helpType: type, description: desc, actor });
        setHelpOpen(false);
      }} />

      <Modal open={confirmAllOpen} onClose={() => setConfirmAllOpen(false)} title={tr('تأكيد جماعي')} size="sm" footer={
        <>
          <Button variant="outline" onClick={() => setConfirmAllOpen(false)}>{tr('إلغاء')}</Button>
          <Button variant="success" onClick={() => { confirmAll(cls.id, actor); setConfirmAllOpen(false); }}>{tr('نعم، تحققت منهن بالاسم')}</Button>
        </>
      }>
        <p className="flex gap-2 text-sm text-navy-700"><AlertTriangle className="h-5 w-5 shrink-0 text-warn" /> {tr('سيتم تأكيد سلامة')} {remaining} {tr('طالبة متبقية. يرجى التأكد من أنك شاهدتِ كل طالبة فعليًا ونادَيتِ اسمها، فالمنصة لا تعتمد العدد كإثبات للسلامة.')}</p>
      </Modal>
    </div>
  );
}

function order(s: Student) {
  if (s.attendance === 'absent') return 5;
  return { needs_help: 0, not_found: 1, unverified: 2, safe: 3 }[s.safety];
}

function Tile({ label, v, tone }: { label: string; v: number; tone?: 'safe' | 'warn' }) {
  return (
    <div className={cx('rounded-2xl p-4 shadow-card ring-1', tone === 'safe' ? 'bg-safe-soft ring-safe/20' : tone === 'warn' ? 'bg-warn-soft ring-warn/20' : 'bg-white ring-navy-900/5')}>
      <p className="text-xs text-navy-500">{label}</p>
      <p className="font-display text-3xl font-extrabold tabular-nums text-navy-900">{v}</p>
    </div>
  );
}

function HelpModal({ open, onClose, student, students, onSubmit }: {
  open: boolean; onClose: () => void; student: Student | null; students: Student[]; onSubmit: (type: HelpType, desc: string, studentId?: string) => void;
}) {
  const { tr, n } = useI18n();
  const [type, setType] = useState<HelpType>('first_aid');
  const [desc, setDesc] = useState('');
  const [sid, setSid] = useState<string>('');
  const effective = student?.id ?? sid;
  return (
    <Modal open={open} onClose={onClose} title={student ? tr('طلب مساعدة للطالبة {name}', { name: n(student) }) : tr('طلب مساعدة')} footer={
      <>
        <Button variant="outline" onClick={onClose}>{tr('إلغاء')}</Button>
        <Button variant="danger" icon={<LifeBuoy className="h-4 w-4" />} onClick={() => { onSubmit(type, desc.trim() || HELP_LABEL[type], effective || undefined); setDesc(''); setSid(''); }}>{tr('إرسال الطلب')}</Button>
      </>
    }>
      <div className="space-y-3">
        <Field label={tr('نوع المساعدة')}>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(HELP_LABEL) as HelpType[]).filter((k) => k !== 'zone_check').map((k) => (
              <button key={k} onClick={() => setType(k)} className={cx('rounded-xl px-3 py-2 text-sm font-semibold ring-1', type === k ? 'bg-danger text-white ring-danger' : 'bg-white text-navy-700 ring-navy-200')}>{HELP_LABEL[k]}</button>
            ))}
          </div>
        </Field>
        {!student && (
          <Field label={tr('الطالبة المعنية (اختياري)')}>
            <select className={inputCls} value={sid} onChange={(e) => setSid(e.target.value)}>
              <option value="">{tr('– طلب عام للفصل –')}</option>
              {students.map((s) => <option key={s.id} value={s.id}>{n(s)}</option>)}
            </select>
          </Field>
        )}
        <Field label={tr('وصف مختصر')}>
          <textarea className={cx(inputCls, 'min-h-[80px]')} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={tr('مثال: ضيق تنفس – تحتاج بخاخ الربو')} />
        </Field>
        <p className="text-[11px] text-navy-400">{tr('يُرسل الطلب إلى مركز الحالات (قائدة المدرسة ومسؤولة السلامة) داخل المنصة فقط.')}</p>
      </div>
    </Modal>
  );
}
