import { useEffect, useState } from 'react';
import { LifeBuoy, Clock, MapPin, User, CheckCircle2, PlayCircle, Plus, Filter, AlertOctagon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Badge, Button, Card, cx, Empty, Field, inputCls, Modal, PageHeader, StatCard, DemoBadge } from '@/components/ui';
import { CASE_STATUS_LABEL, HELP_LABEL, PRIORITY_LABEL, PRIORITY_STYLE, formatDuration, formatTime } from '@/lib/labels';
import type { Case, HelpType } from '@/types';

const ASSIGNEES = ['مسؤولة السلامة – أ. منيرة الدوسري', 'المسؤولة الصحية – أ. خلود العمري', 'فريق الإخلاء – الطابق الأرضي', 'فريق الإخلاء – الطابق الأول', 'فريق الإخلاء – الطابق الثاني', 'وكيلة المدرسة – أ. أسماء القرني'];

export default function Cases() {
  const cases = useStore((s) => s.cases);
  const classes = useStore((s) => s.classes);
  const zones = useStore((s) => s.zones);
  const students = useStore((s) => s.students);
  const e = useStore((s) => s.emergency);
  const user = useStore((s) => s.user)!;
  const updateCase = useStore((s) => s.updateCase);
  const requestHelp = useStore((s) => s.requestHelp);
  const setSafety = useStore((s) => s.setStudentSafety);
  const setZoneStatus = useStore((s) => s.setZoneStatus);
  const now = useStore((s) => s.now);
  const [status, setStatus] = useState<Case['status'] | 'active' | 'all'>('active');
  const [priority, setPriority] = useState<Case['priority'] | 'all'>('all');
  const [newOpen, setNewOpen] = useState(false);
  const [, force] = useState(0);
  useEffect(() => { const id = setInterval(() => force((x) => x + 1), 1000); return () => clearInterval(id); }, []);

  const list = cases
    .filter((c) => (status === 'all' || (status === 'active' ? c.status !== 'resolved' : c.status === status)) && (priority === 'all' || c.priority === priority))
    .sort((a, b) => (a.status === 'resolved' ? 1 : 0) - (b.status === 'resolved' ? 1 : 0) || a.priority.localeCompare(b.priority) || a.createdAt - b.createdAt);

  const open = cases.filter((c) => c.status === 'open').length;
  const prog = cases.filter((c) => c.status === 'in_progress').length;
  const done = cases.filter((c) => c.status === 'resolved').length;
  const p1 = cases.filter((c) => c.priority === 'p1' && c.status !== 'resolved').length;

  return (
    <div>
      <PageHeader title="مركز الحالات" icon={<LifeBuoy className="h-6 w-6" />} subtitle="المناطق والفصول التي تحتاج تحققًا أو مساعدة، مرتبة حسب الأولوية والوقت" actions={<><DemoBadge /><Button icon={<Plus className="h-4 w-4" />} onClick={() => setNewOpen(true)} disabled={!e.active}>حالة جديدة</Button></>} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="عاجلة جدًا (P1)" value={p1} icon={<AlertOctagon className="h-4 w-4" />} tone="danger" />
        <StatCard label="مفتوحة" value={open} icon={<LifeBuoy className="h-4 w-4" />} tone="warn" />
        <StatCard label="قيد المعالجة" value={prog} icon={<PlayCircle className="h-4 w-4" />} tone="brand" />
        <StatCard label="تم حلها" value={done} icon={<CheckCircle2 className="h-4 w-4" />} tone="safe" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-navy-400" />
        {([['active', 'النشطة'], ['open', 'مفتوحة'], ['in_progress', 'قيد المعالجة'], ['resolved', 'تم الحل'], ['all', 'الكل']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setStatus(k)} className={cx('rounded-xl px-3 py-1.5 text-sm font-semibold ring-1', status === k ? 'bg-navy-800 text-white ring-navy-800' : 'bg-white text-navy-700 ring-navy-200')}>{l}</button>
        ))}
        <select className={cx(inputCls, 'w-auto')} value={priority} onChange={(ev) => setPriority(ev.target.value as Case['priority'] | 'all')}>
          <option value="all">كل الأولويات</option>
          {(Object.keys(PRIORITY_LABEL) as Case['priority'][]).map((k) => <option key={k} value={k}>{PRIORITY_LABEL[k]}</option>)}
        </select>
      </div>

      {list.length === 0 ? (
        <Card><Empty icon={<LifeBuoy className="h-6 w-6" />} title={e.active ? 'لا توجد حالات مطابقة' : 'لا توجد حالات – المدرسة في وضع آمن'} body={e.active ? 'جميع الحالات المطابقة للتصفية تمت معالجتها.' : 'تظهر الحالات هنا تلقائيًا عند تفعيل الطوارئ: طلبات المعلمات، الطالبات غير المؤكدات، والمناطق التي تحتاج تحقق.'} /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {list.map((c) => {
            const cls = classes.find((x) => x.id === c.classId);
            const zone = zones.find((z) => z.id === c.zoneId);
            const stu = students.find((s) => s.id === c.studentId);
            const age = ((c.resolvedAt ?? now()) - c.createdAt) / 1000;
            return (
              <div key={c.id} className={cx('flex flex-col rounded-2xl bg-white p-4 shadow-card ring-1', c.status === 'resolved' ? 'opacity-70 ring-navy-100' : c.priority === 'p1' ? 'ring-2 ring-danger/50' : 'ring-navy-100')}>
                <div className="flex items-start gap-2">
                  <span className={cx('rounded-lg px-2 py-0.5 text-[11px] font-bold', PRIORITY_STYLE[c.priority])}>{c.priority.toUpperCase()} · {PRIORITY_LABEL[c.priority]}</span>
                  <Badge className={c.status === 'resolved' ? 'bg-safe-soft text-safe-dark ring-safe/30' : c.status === 'in_progress' ? 'bg-sky-50 text-sky-800 ring-sky-300' : 'bg-warn-soft text-warn-dark ring-warn/30'}>{CASE_STATUS_LABEL[c.status]}</Badge>
                  <span className="flex-1" />
                  <span className={cx('inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums', c.status !== 'resolved' && age > 60 ? 'text-danger' : 'text-navy-500')}><Clock className="h-3.5 w-3.5" />{formatDuration(age)}</span>
                </div>
                <p className="mt-2 font-display text-base font-bold text-navy-900">{c.title}</p>
                <p className="mt-1 text-sm text-navy-600">{c.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                  <Badge>{HELP_LABEL[c.helpType]}</Badge>
                  {zone && <Badge><MapPin className="h-3 w-3" /> {zone.name}</Badge>}
                  {cls && <Badge>فصل {cls.name}</Badge>}
                  {stu && <Badge className="bg-danger-soft text-danger-dark ring-danger/30"><User className="h-3 w-3" /> {stu.name}</Badge>}
                </div>
                <p className="mt-2 text-[11px] text-navy-400">أُنشئت {formatTime(c.createdAt)} بواسطة {c.source}{c.resolvedAt ? ` · حُلت ${formatTime(c.resolvedAt)}` : ''}</p>
                {c.status !== 'resolved' && (
                  <div className="mt-auto space-y-2 border-t border-navy-50 pt-3">
                    <select className={cx(inputCls, 'py-1.5 text-xs')} value={c.assignee ?? ''} onChange={(ev) => updateCase(c.id, { assignee: ev.target.value, status: c.status === 'open' ? 'in_progress' : c.status }, user.name)}>
                      <option value="">إسناد إلى…</option>
                      {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <div className="flex flex-wrap gap-1.5">
                      {c.status === 'open' && <Button size="sm" variant="secondary" onClick={() => updateCase(c.id, { status: 'in_progress' }, user.name)}>بدء المعالجة</Button>}
                      {stu && <Button size="sm" variant="success" onClick={() => setSafety(stu.id, 'safe', user.name)}>تأكيد سلامة الطالبة</Button>}
                      {zone && c.helpType === 'zone_check' && <Button size="sm" variant="success" onClick={() => setZoneStatus(zone.id, 'cleared', user.name)}>تم التحقق من المنطقة</Button>}
                      <Button size="sm" variant="outline" onClick={() => updateCase(c.id, { status: 'resolved' }, user.name)}>إغلاق الحالة</Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <NewCaseModal open={newOpen} onClose={() => setNewOpen(false)} onSubmit={(d) => { requestHelp({ ...d, actor: user.name }); setNewOpen(false); }} />
    </div>
  );
}

function NewCaseModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (d: { helpType: HelpType; description: string; zoneId?: string; classId?: string; priority: Case['priority'] }) => void }) {
  const zones = useStore((s) => s.zones);
  const classes = useStore((s) => s.classes);
  const [helpType, setHelpType] = useState<HelpType>('zone_check');
  const [zoneId, setZoneId] = useState('');
  const [classId, setClassId] = useState('');
  const [priority, setPriority] = useState<Case['priority']>('p2');
  const [desc, setDesc] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="إنشاء حالة جديدة" footer={<><Button variant="outline" onClick={onClose}>إلغاء</Button><Button onClick={() => onSubmit({ helpType, description: desc || HELP_LABEL[helpType], zoneId: zoneId || undefined, classId: classId || undefined, priority })}>إنشاء</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="نوع المساعدة"><select className={inputCls} value={helpType} onChange={(e) => setHelpType(e.target.value as HelpType)}>{(Object.keys(HELP_LABEL) as HelpType[]).map((k) => <option key={k} value={k}>{HELP_LABEL[k]}</option>)}</select></Field>
        <Field label="الأولوية"><select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value as Case['priority'])}>{(Object.keys(PRIORITY_LABEL) as Case['priority'][]).map((k) => <option key={k} value={k}>{k.toUpperCase()} – {PRIORITY_LABEL[k]}</option>)}</select></Field>
        <Field label="المنطقة"><select className={inputCls} value={zoneId} onChange={(e) => setZoneId(e.target.value)}><option value="">—</option>{zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select></Field>
        <Field label="الفصل"><select className={inputCls} value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">—</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <div className="sm:col-span-2"><Field label="الوصف"><textarea className={cx(inputCls, 'min-h-[80px]')} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field></div>
      </div>
    </Modal>
  );
}
