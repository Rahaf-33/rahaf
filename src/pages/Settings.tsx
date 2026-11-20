import { useState } from 'react';
import { Settings as SettingsIcon, Save, Plus, Pencil, Trash2, RotateCcw, Lock, School, Layers, Users, GraduationCap, Radar, DoorOpen, BookCheck, Server, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Badge, Button, Card, cx, Field, inputCls, Modal, PageHeader, Tabs, DemoBadge } from '@/components/ui';
import { ATTENDANCE_LABEL, SENSOR_LABEL, TYPE_LABEL } from '@/lib/labels';
import type { Attendance, ClassRoom, Exit, SafetyProcedure, Sensor, SensorKind, Student, Teacher } from '@/types';
import { uid } from '@/lib/random';

type Tab = 'school' | 'floors' | 'classes' | 'teachers' | 'students' | 'sensors' | 'exits' | 'procedures' | 'system';

export default function Settings() {
  const [tab, setTab] = useState<Tab>('school');
  const active = useStore((s) => s.emergency.active);
  return (
    <div>
      <PageHeader title="الإعدادات" icon={<SettingsIcon className="h-6 w-6" />} subtitle="بيانات المدرسة والطوابق والفصول والمعلمات والطالبات والحساسات ومخارج الطوارئ" actions={<DemoBadge>التغييرات محفوظة محليًا في المتصفح</DemoBadge>} />
      {active && <div className="mb-4 flex items-center gap-2 rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn-dark ring-1 ring-warn/30"><Lock className="h-4 w-4" /> الإعدادات مقفلة أثناء حالة الطوارئ لضمان ثبات البيانات.</div>}
      <Tabs className="mb-6" value={tab} onChange={setTab} items={[
        { value: 'school', label: <TabL i={<School className="h-4 w-4" />} t="المدرسة" /> },
        { value: 'floors', label: <TabL i={<Layers className="h-4 w-4" />} t="الطوابق" /> },
        { value: 'classes', label: <TabL i={<Users className="h-4 w-4" />} t="الفصول" /> },
        { value: 'teachers', label: <TabL i={<GraduationCap className="h-4 w-4" />} t="المعلمات" /> },
        { value: 'students', label: <TabL i={<Users className="h-4 w-4" />} t="الطالبات" /> },
        { value: 'sensors', label: <TabL i={<Radar className="h-4 w-4" />} t="الحساسات" /> },
        { value: 'exits', label: <TabL i={<DoorOpen className="h-4 w-4" />} t="المخارج" /> },
        { value: 'procedures', label: <TabL i={<BookCheck className="h-4 w-4" />} t="الإجراءات المعتمدة" /> },
        { value: 'system', label: <TabL i={<Server className="h-4 w-4" />} t="النظام" /> },
      ]} />
      <fieldset disabled={active} className={cx(active && 'pointer-events-none opacity-60')}>
        {tab === 'school' && <SchoolTab />}
        {tab === 'floors' && <FloorsTab />}
        {tab === 'classes' && <ClassesTab />}
        {tab === 'teachers' && <TeachersTab />}
        {tab === 'students' && <StudentsTab />}
        {tab === 'sensors' && <SensorsTab />}
        {tab === 'exits' && <ExitsTab />}
        {tab === 'procedures' && <ProceduresTab />}
        {tab === 'system' && <SystemTab />}
      </fieldset>
    </div>
  );
}

const TabL = ({ i, t }: { i: React.ReactNode; t: string }) => <span className="inline-flex items-center gap-1.5">{i}{t}</span>;

function SchoolTab() {
  const school = useStore((s) => s.school);
  const update = useStore((s) => s.updateSchool);
  const toast = useStore((s) => s.toast);
  const [f, setF] = useState(school);
  const fields: [keyof typeof school, string][] = [['name', 'اسم المدرسة'], ['district', 'مكتب التعليم'], ['principal', 'قائدة المدرسة'], ['safetyOfficer', 'مسؤولة السلامة'], ['phone', 'الهاتف'], ['address', 'العنوان'], ['shift', 'الدوام']];
  return (
    <Card title="بيانات المدرسة">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([k, l]) => <Field key={k} label={l}><input className={inputCls} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></Field>)}
      </div>
      <div className="mt-5 flex justify-end"><Button icon={<Save className="h-4 w-4" />} onClick={() => { update(f); toast({ title: 'تم حفظ بيانات المدرسة', level: 'success' }); }}>حفظ</Button></div>
    </Card>
  );
}

function FloorsTab() {
  const floors = useStore((s) => s.floors);
  const zones = useStore((s) => s.zones);
  const upsert = useStore((s) => s.upsertFloor);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {floors.map((f) => (
        <Card key={f.id} title={<input className="w-full rounded-lg bg-transparent font-display font-bold focus:bg-navy-50 focus:outline-none" defaultValue={f.name} onBlur={(e) => e.target.value !== f.name && upsert({ ...f, name: e.target.value })} />} subtitle={`المستوى ${f.level} · الرمز ${f.id}`}>
          <ul className="space-y-1 text-sm">
            {zones.filter((z) => z.floorId === f.id).map((z) => (
              <li key={z.id} className="flex justify-between"><span>{z.name}</span><span className="text-xs text-navy-400">{({ classroom: 'فصل', lab: 'مختبر', library: 'مكتبة', admin: 'إداري', service: 'خدمات', corridor: 'ممر', stairs: 'درج', hall: 'قاعة', clinic: 'عيادة' })[z.kind]}</span></li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function ClassesTab() {
  const classes = useStore((s) => s.classes);
  const teachers = useStore((s) => s.teachers);
  const zones = useStore((s) => s.zones);
  const aps = useStore((s) => s.assemblyPoints);
  const floors = useStore((s) => s.floors);
  const students = useStore((s) => s.students);
  const upsert = useStore((s) => s.upsertClass);
  const remove = useStore((s) => s.removeClass);
  const [edit, setEdit] = useState<ClassRoom | null>(null);
  const freeZones = zones.filter((z) => ['classroom', 'lab', 'hall', 'library'].includes(z.kind) && (!z.classId || z.classId === edit?.id));
  return (
    <Card title={`الفصول (${classes.length})`} action={<Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setEdit({ id: uid('C'), name: '', grade: 'الأول الثانوي', floorId: freeZones[0]?.floorId ?? 'G', zoneId: freeZones[0]?.id ?? '', teacherId: teachers[0]?.id ?? '', assemblyPointId: aps[0].id })}>إضافة فصل</Button>} padded={false}>
      <Table head={['الفصل', 'المرحلة', 'الموقع', 'رائدة الفصل', 'نقطة التجمع', 'الطالبات', '']}>
        {classes.map((c) => (
          <tr key={c.id}>
            <td className="px-4 py-2.5 font-bold">{c.name}</td><td>{c.grade}</td>
            <td>{zones.find((z) => z.id === c.zoneId)?.name} · {floors.find((f) => f.id === c.floorId)?.name}</td>
            <td>{teachers.find((t) => t.id === c.teacherId)?.name}</td>
            <td>{aps.find((a) => a.id === c.assemblyPointId)?.name}</td>
            <td className="tabular-nums">{students.filter((s) => s.classId === c.id).length}</td>
            <RowActions onEdit={() => setEdit(c)} onDelete={() => confirm(`حذف فصل ${c.name} وجميع طالباته؟`) && remove(c.id)} />
          </tr>
        ))}
      </Table>
      {edit && (
        <Modal open onClose={() => setEdit(null)} title={classes.some((c) => c.id === edit.id) ? 'تعديل فصل' : 'إضافة فصل'} footer={<><Button variant="outline" onClick={() => setEdit(null)}>إلغاء</Button><Button disabled={!edit.name || !edit.zoneId} onClick={() => { upsert({ ...edit, floorId: zones.find((z) => z.id === edit.zoneId)?.floorId ?? edit.floorId }); setEdit(null); }}>حفظ</Button></>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="اسم الفصل"><input className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="مثال: 1/5" /></Field>
            <Field label="المرحلة"><select className={inputCls} value={edit.grade} onChange={(e) => setEdit({ ...edit, grade: e.target.value })}>{['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'].map((g) => <option key={g}>{g}</option>)}</select></Field>
            <Field label="الموقع على الخريطة"><select className={inputCls} value={edit.zoneId} onChange={(e) => setEdit({ ...edit, zoneId: e.target.value })}>{freeZones.map((z) => <option key={z.id} value={z.id}>{z.name} – {floors.find((f) => f.id === z.floorId)?.name}</option>)}</select></Field>
            <Field label="رائدة الفصل"><select className={inputCls} value={edit.teacherId} onChange={(e) => setEdit({ ...edit, teacherId: e.target.value })}>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
            <Field label="نقطة التجمع"><select className={inputCls} value={edit.assemblyPointId} onChange={(e) => setEdit({ ...edit, assemblyPointId: e.target.value })}>{aps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
          </div>
        </Modal>
      )}
    </Card>
  );
}

function TeachersTab() {
  const teachers = useStore((s) => s.teachers);
  const classes = useStore((s) => s.classes);
  const upsert = useStore((s) => s.upsertTeacher);
  const remove = useStore((s) => s.removeTeacher);
  const [edit, setEdit] = useState<Teacher | null>(null);
  return (
    <Card title={`المعلمات (${teachers.length})`} action={<Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setEdit({ id: uid('T'), name: 'أ. ', subject: '', classId: '', phone: '' })}>إضافة معلمة</Button>} padded={false}>
      <Table head={['الاسم', 'التخصص', 'رائدة فصل', 'الجوال', '']}>
        {teachers.map((t) => (
          <tr key={t.id}>
            <td className="px-4 py-2.5 font-semibold">{t.name}</td><td>{t.subject}</td><td>{classes.find((c) => c.teacherId === t.id)?.name ?? '—'}</td><td dir="ltr" className="text-right">{t.phone}</td>
            <RowActions onEdit={() => setEdit(t)} onDelete={() => confirm(`حذف ${t.name}؟`) && remove(t.id)} />
          </tr>
        ))}
      </Table>
      {edit && (
        <Modal open onClose={() => setEdit(null)} title="بيانات المعلمة" footer={<><Button variant="outline" onClick={() => setEdit(null)}>إلغاء</Button><Button disabled={edit.name.trim().length < 4} onClick={() => { upsert(edit); setEdit(null); }}>حفظ</Button></>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الاسم"><input className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="التخصص"><input className={inputCls} value={edit.subject} onChange={(e) => setEdit({ ...edit, subject: e.target.value })} /></Field>
            <Field label="الجوال"><input className={inputCls} dir="ltr" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </Card>
  );
}

function StudentsTab() {
  const students = useStore((s) => s.students);
  const classes = useStore((s) => s.classes);
  const upsert = useStore((s) => s.upsertStudent);
  const remove = useStore((s) => s.removeStudent);
  const [cls, setCls] = useState(classes[0]?.id ?? '');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Student | null>(null);
  const list = students.filter((s) => (cls === 'all' || s.classId === cls) && (!q || s.name.includes(q)));
  return (
    <Card title={`الطالبات (${students.length})`} action={
      <>
        <select className={cx(inputCls, 'w-auto py-1.5')} value={cls} onChange={(e) => setCls(e.target.value)}><option value="all">كل الفصول</option>{classes.map((c) => <option key={c.id} value={c.id}>فصل {c.name}</option>)}</select>
        <div className="relative"><Search className="pointer-events-none absolute right-2.5 top-2 h-4 w-4 text-navy-300" /><input className={cx(inputCls, 'w-40 py-1.5 pr-8')} placeholder="بحث" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setEdit({ id: uid('S'), name: '', classId: cls === 'all' ? classes[0].id : cls, attendance: 'present', safety: 'unverified' })}>إضافة طالبة</Button>
      </>
    } padded={false}>
      <div className="max-h-[560px] overflow-y-auto">
        <Table head={['الرقم', 'الاسم', 'الفصل', 'الحضور اليوم', 'ملاحظة صحية', '']}>
          {list.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-2 text-xs text-navy-400">{s.id}</td><td className="font-semibold">{s.name}</td><td>{classes.find((c) => c.id === s.classId)?.name}</td>
              <td><Badge className={s.attendance === 'absent' ? 'bg-gray-100 text-gray-600 ring-gray-200' : s.attendance === 'late' ? 'bg-warn-soft text-warn-dark ring-warn/30' : 'bg-safe-soft text-safe-dark ring-safe/30'}>{ATTENDANCE_LABEL[s.attendance]}</Badge></td>
              <td className="text-xs text-navy-600">{s.medicalNote ?? '—'}</td>
              <RowActions onEdit={() => setEdit(s)} onDelete={() => confirm(`حذف ${s.name}؟`) && remove(s.id)} />
            </tr>
          ))}
        </Table>
      </div>
      {edit && (
        <Modal open onClose={() => setEdit(null)} title="بيانات الطالبة" footer={<><Button variant="outline" onClick={() => setEdit(null)}>إلغاء</Button><Button disabled={edit.name.trim().length < 3} onClick={() => { upsert(edit); setEdit(null); }}>حفظ</Button></>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الاسم الثلاثي"><input className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="الفصل"><select className={inputCls} value={edit.classId} onChange={(e) => setEdit({ ...edit, classId: e.target.value })}>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="الحضور اليوم"><select className={inputCls} value={edit.attendance} onChange={(e) => setEdit({ ...edit, attendance: e.target.value as Attendance })}>{(Object.keys(ATTENDANCE_LABEL) as Attendance[]).map((k) => <option key={k} value={k}>{ATTENDANCE_LABEL[k]}</option>)}</select></Field>
            <Field label="ملاحظة صحية (اختياري)"><input className={inputCls} value={edit.medicalNote ?? ''} onChange={(e) => setEdit({ ...edit, medicalNote: e.target.value || undefined })} /></Field>
          </div>
        </Modal>
      )}
    </Card>
  );
}

function SensorsTab() {
  const sensors = useStore((s) => s.sensors);
  const zones = useStore((s) => s.zones);
  const aps = useStore((s) => s.assemblyPoints);
  const upsert = useStore((s) => s.upsertSensor);
  const remove = useStore((s) => s.removeSensor);
  const [edit, setEdit] = useState<Sensor | null>(null);
  return (
    <Card title={`الحساسات والكاميرات الافتراضية (${sensors.length})`} subtitle="أجهزة محاكاة – لا يوجد اتصال بأجهزة حقيقية" action={<Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setEdit({ id: uid('SN'), name: '', kind: 'smoke', zoneId: zones[0].id, online: true, battery: 100, reading: 0, triggered: false })}>إضافة حساس</Button>} padded={false}>
      <div className="max-h-[560px] overflow-y-auto">
        <Table head={['الرمز', 'الاسم', 'النوع', 'الموقع', 'البطارية', 'الحالة', '']}>
          {sensors.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-2 text-xs text-navy-400">{s.id}</td><td className="font-semibold">{s.name}</td><td>{SENSOR_LABEL[s.kind]}</td>
              <td>{zones.find((z) => z.id === s.zoneId)?.name ?? aps.find((a) => a.id === s.assemblyPointId)?.name}</td>
              <td className={cx('tabular-nums', s.battery < 20 && 'font-bold text-danger')}>{s.battery}%</td>
              <td><button onClick={() => upsert({ ...s, online: !s.online })} className={cx('relative inline-flex h-6 w-11 items-center rounded-full transition', s.online ? 'bg-safe' : 'bg-gray-300')} aria-label="تبديل"><span className={cx('inline-block h-5 w-5 rounded-full bg-white shadow transition', s.online ? '-translate-x-0.5' : '-translate-x-[22px]')} /></button></td>
              <RowActions onEdit={() => setEdit(s)} onDelete={() => confirm(`حذف ${s.name}؟`) && remove(s.id)} />
            </tr>
          ))}
        </Table>
      </div>
      {edit && (
        <Modal open onClose={() => setEdit(null)} title="بيانات الحساس" footer={<><Button variant="outline" onClick={() => setEdit(null)}>إلغاء</Button><Button disabled={!edit.name} onClick={() => { upsert(edit); setEdit(null); }}>حفظ</Button></>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الاسم"><input className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="النوع"><select className={inputCls} value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value as SensorKind })}>{(Object.keys(SENSOR_LABEL) as SensorKind[]).map((k) => <option key={k} value={k}>{SENSOR_LABEL[k]}</option>)}</select></Field>
            <Field label="المنطقة"><select className={inputCls} value={edit.zoneId ?? ''} onChange={(e) => setEdit({ ...edit, zoneId: e.target.value, assemblyPointId: undefined })}>{zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select></Field>
            <Field label="البطارية %"><input type="number" min={0} max={100} className={inputCls} value={edit.battery} onChange={(e) => setEdit({ ...edit, battery: Number(e.target.value) })} /></Field>
          </div>
        </Modal>
      )}
    </Card>
  );
}

function ExitsTab() {
  const exits = useStore((s) => s.exits);
  const floors = useStore((s) => s.floors);
  const aps = useStore((s) => s.assemblyPoints);
  const upsert = useStore((s) => s.upsertExit);
  const remove = useStore((s) => s.removeExit);
  const [edit, setEdit] = useState<Exit | null>(null);
  return (
    <Card title={`مخارج الطوارئ (${exits.length})`} action={<Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setEdit({ id: uid('EX'), name: '', floorId: floors[0].id, x: 12, y: 255, assemblyPointId: aps[0].id, kind: 'emergency' })}>إضافة مخرج</Button>} padded={false}>
      <Table head={['المخرج', 'الطابق', 'النوع', 'يؤدي إلى', '']}>
        {exits.map((x) => (
          <tr key={x.id}>
            <td className="px-4 py-2.5 font-semibold">{x.name}</td><td>{floors.find((f) => f.id === x.floorId)?.name}</td><td>{({ main: 'رئيسي', emergency: 'طوارئ', stairs: 'درج طوارئ' })[x.kind]}</td><td>{aps.find((a) => a.id === x.assemblyPointId)?.name}</td>
            <RowActions onEdit={() => setEdit(x)} onDelete={() => confirm(`حذف ${x.name}؟`) && remove(x.id)} />
          </tr>
        ))}
      </Table>
      {edit && (
        <Modal open onClose={() => setEdit(null)} title="بيانات المخرج" footer={<><Button variant="outline" onClick={() => setEdit(null)}>إلغاء</Button><Button disabled={!edit.name} onClick={() => { upsert(edit); setEdit(null); }}>حفظ</Button></>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الاسم"><input className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="الطابق"><select className={inputCls} value={edit.floorId} onChange={(e) => setEdit({ ...edit, floorId: e.target.value })}>{floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></Field>
            <Field label="الجهة على المخطط"><select className={inputCls} value={edit.x < 500 ? 'E' : 'W'} onChange={(e) => setEdit({ ...edit, x: e.target.value === 'E' ? 12 : 988 })}><option value="E">شرق (يسار المخطط)</option><option value="W">غرب (يمين المخطط)</option></select></Field>
            <Field label="نقطة التجمع"><select className={inputCls} value={edit.assemblyPointId} onChange={(e) => setEdit({ ...edit, assemblyPointId: e.target.value })}>{aps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
            <Field label="النوع"><select className={inputCls} value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value as Exit['kind'] })}><option value="main">رئيسي</option><option value="emergency">طوارئ</option><option value="stairs">درج طوارئ</option></select></Field>
          </div>
        </Modal>
      )}
    </Card>
  );
}

function ProceduresTab() {
  const procedures = useStore((s) => s.procedures);
  const update = useStore((s) => s.updateProcedure);
  const toast = useStore((s) => s.toast);
  const [edit, setEdit] = useState<SafetyProcedure | null>(null);
  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        هذه المكتبة هي المصدر الوحيد للتعليمات المعروضة في المنصة. المحتوى الحالي نموذج للعرض ويجب استبداله بالإجراءات المعتمدة رسميًا من الجهة المختصة قبل أي استخدام فعلي.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {procedures.map((p) => (
          <Card key={p.id} title={p.title} subtitle={`${TYPE_LABEL[p.type]} · الإصدار ${p.version}`} action={<Button size="sm" variant="outline" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEdit(p)}>تحرير</Button>}>
            <ol className="list-inside list-decimal space-y-1 text-sm text-navy-700">{p.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            <p className="mt-3 text-[11px] text-navy-400">{p.source}</p>
          </Card>
        ))}
      </div>
      {edit && (
        <Modal open size="lg" onClose={() => setEdit(null)} title={`تحرير: ${edit.title}`} footer={<><Button variant="outline" onClick={() => setEdit(null)}>إلغاء</Button><Button onClick={() => { update(edit); setEdit(null); toast({ title: 'تم تحديث الإجراء المعتمد', level: 'success' }); }}>حفظ</Button></>}>
          <div className="space-y-3">
            <Field label="العنوان"><input className={inputCls} value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label="الخطوات (خطوة في كل سطر)"><textarea className={cx(inputCls, 'min-h-[200px]')} value={edit.steps.join('\n')} onChange={(e) => setEdit({ ...edit, steps: e.target.value.split('\n').filter((x) => x.trim()) })} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="المرجع / الجهة المعتمِدة"><input className={inputCls} value={edit.source} onChange={(e) => setEdit({ ...edit, source: e.target.value })} /></Field>
              <Field label="الإصدار"><input className={inputCls} value={edit.version} onChange={(e) => setEdit({ ...edit, version: e.target.value })} /></Field>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SystemTab() {
  const reset = useStore((s) => s.resetDemoData);
  const toast = useStore((s) => s.toast);
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="حول النسخة">
        <ul className="space-y-2 text-sm text-navy-700">
          <li>• نسخة عرض (Prototype) تعمل محليًا بالكامل في المتصفح.</li>
          <li>• جميع البيانات (الطالبات، المعلمات، الحساسات، الإنذارات) تجريبية ومولّدة آليًا.</li>
          <li>• لا يوجد اتصال بكاميرات أو حساسات حقيقية أو بالدفاع المدني أو أي جهة رسمية.</li>
          <li>• الإشعارات داخلية في المنصة فقط ولا تُرسل رسائل SMS أو بريد.</li>
          <li>• الرصد لا يتضمن تعرّفًا على الوجوه ولا تخزينًا للفيديو.</li>
          <li>• نقاط التكامل المستقبلية: نظام إنذار الحريق (BACnet/Modbus)، حساسات IoT عبر MQTT، نظام الحضور المدرسي عبر API.</li>
        </ul>
      </Card>
      <Card title="إعادة تعيين البيانات">
        <p className="text-sm text-navy-600">إعادة جميع البيانات التجريبية والإعدادات إلى الوضع الافتراضي ومسح السجلات والإنذارات.</p>
        <Button variant="danger" className="mt-4" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setOpen(true)}>إعادة التعيين</Button>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="تأكيد إعادة التعيين" size="sm" footer={<><Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button><Button variant="danger" onClick={() => { reset(); setOpen(false); toast({ title: 'تمت إعادة تعيين البيانات التجريبية', level: 'success' }); }}>إعادة التعيين</Button></>}>
        <p className="text-sm text-navy-700">سيتم حذف كل التعديلات والسجلات. هل أنتِ متأكدة؟</p>
      </Modal>
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="sticky top-0 bg-navy-50 text-xs text-navy-500"><tr>{head.map((h, i) => <th key={i} className={cx('py-2.5 text-right font-semibold', i === 0 && 'px-4')}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-navy-50 text-navy-800">{children}</tbody>
      </table>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <td className="whitespace-nowrap pl-3 text-left">
      <button onClick={onEdit} className="rounded-lg p-1.5 text-navy-500 hover:bg-navy-50 hover:text-navy-800" aria-label="تعديل"><Pencil className="h-4 w-4" /></button>
      <button onClick={onDelete} className="rounded-lg p-1.5 text-navy-400 hover:bg-danger-soft hover:text-danger" aria-label="حذف"><Trash2 className="h-4 w-4" /></button>
    </td>
  );
}
