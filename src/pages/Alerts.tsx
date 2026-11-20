import { useMemo, useState } from 'react';
import { Siren, Send, Zap, Filter, MapPin, Clock, BookCheck, CheckCheck, XCircle, Eye, BrainCircuit, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { DEMO_ALERT_TEXTS } from '@/data/seed';
import { Badge, Button, Card, cx, DemoBadge, Empty, Field, inputCls, PageHeader } from '@/components/ui';
import { SEVERITY_LABEL, SEVERITY_STYLE, TYPE_LABEL, TYPE_ICON_COLOR, formatTime, formatDate } from '@/lib/labels';
import type { Alert, EmergencyType, Severity } from '@/types';
import { analyzeAlert } from '@/lib/ai';

const STATUS_LABEL: Record<Alert['status'], string> = { new: 'جديد', acknowledged: 'تم الاطلاع', activated: 'تم تفعيل الطوارئ', dismissed: 'تم التجاهل', closed: 'مغلق' };
const STATUS_STYLE: Record<Alert['status'], string> = {
  new: 'bg-warn-soft text-warn-dark ring-warn/30', acknowledged: 'bg-navy-50 text-navy-700 ring-navy-200', activated: 'bg-danger-soft text-danger-dark ring-danger/30', dismissed: 'bg-gray-100 text-gray-600 ring-gray-200', closed: 'bg-safe-soft text-safe-dark ring-safe/30',
};

export default function Alerts() {
  const alerts = useStore((s) => s.alerts);
  const user = useStore((s) => s.user)!;
  const procedures = useStore((s) => s.procedures);
  const zones = useStore((s) => s.zones);
  const receiveAlert = useStore((s) => s.receiveAlert);
  const updateAlert = useStore((s) => s.updateAlert);
  const activate = useStore((s) => s.activateEmergency);
  const emergencyActive = useStore((s) => s.emergency.active);
  const canManage = user.role !== 'teacher';

  const [text, setText] = useState('');
  const [type, setType] = useState<EmergencyType | 'auto'>('auto');
  const [severity, setSeverity] = useState<Severity | 'auto'>('auto');
  const [selected, setSelected] = useState<string | null>(null);
  const [fType, setFType] = useState<EmergencyType | 'all'>('all');
  const [fStatus, setFStatus] = useState<Alert['status'] | 'all'>('all');
  const [q, setQ] = useState('');

  const preview = useMemo(() => (text.trim().length > 6 ? analyzeAlert(text, zones, procedures) : null), [text, zones, procedures]);
  const filtered = alerts.filter((a) => (fType === 'all' || a.type === fType) && (fStatus === 'all' || a.status === fStatus) && (!q || a.text.includes(q) || a.title.includes(q)));
  const current = alerts.find((a) => a.id === selected) ?? filtered[0];
  const proc = current && procedures.find((p) => p.id === current.analysis.procedureId);

  const submit = (source: 'manual' | 'demo', t = text, label = `إدخال يدوي – ${user.name}`) => {
    if (!t.trim()) return;
    const a = receiveAlert({ text: t.trim(), source, sourceLabel: label, type: type === 'auto' ? undefined : type, severity: severity === 'auto' ? undefined : severity });
    setSelected(a.id);
    setText('');
  };

  return (
    <div>
      <PageHeader title="مركز الإنذارات" icon={<Siren className="h-6 w-6" />} subtitle="استقبال الإنذارات التجريبية أو إدخالها يدويًا، وتصنيفها وعرض التعليمات المعتمدة" actions={<DemoBadge>لا يوجد ربط بجهات رسمية</DemoBadge>} />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.25fr]">
        <div className="space-y-6">
          {canManage && (
            <Card title="استقبال إنذار جديد" subtitle="يتم تحليل النص آليًا وتصنيفه، ويمكنك تجاوز التصنيف يدويًا">
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold text-navy-700">إنذارات تجريبية جاهزة</p>
                <div className="flex flex-wrap gap-2">
                  {DEMO_ALERT_TEXTS.map((d) => (
                    <button key={d.label} onClick={() => submit('demo', d.text, d.source)} className="inline-flex items-center gap-1.5 rounded-xl bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-800 ring-1 ring-navy-100 hover:bg-navy-100">
                      <Zap className="h-3.5 w-3.5 text-warn" /> {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="نص الإنذار">
                <textarea className={cx(inputCls, 'min-h-[110px]')} value={text} onChange={(e) => setText(e.target.value)} placeholder="مثال: رائحة دخان قرب مختبر الحاسب في الطابق الأول..." />
              </Field>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="نوع الإنذار">
                  <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as EmergencyType | 'auto')}>
                    <option value="auto">تلقائي (حسب التحليل)</option>
                    {(Object.keys(TYPE_LABEL) as EmergencyType[]).map((k) => <option key={k} value={k}>{TYPE_LABEL[k]}</option>)}
                  </select>
                </Field>
                <Field label="مستوى الخطورة">
                  <select className={inputCls} value={severity} onChange={(e) => setSeverity(e.target.value as Severity | 'auto')}>
                    <option value="auto">تلقائي (حسب التحليل)</option>
                    {(Object.keys(SEVERITY_LABEL) as Severity[]).map((k) => <option key={k} value={k}>{SEVERITY_LABEL[k]}</option>)}
                  </select>
                </Field>
              </div>
              {preview && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900 ring-1 ring-sky-200">
                  <BrainCircuit className="h-4 w-4" /> معاينة التحليل:
                  <b>{TYPE_LABEL[preview.type]}</b> · ثقة {preview.confidence}% · خطورة {SEVERITY_LABEL[preview.severity]}
                  {preview.location && <> · <MapPin className="h-3 w-3" /> {preview.location}</>}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <Button onClick={() => submit('manual')} disabled={!text.trim()} icon={<Send className="h-4 w-4" />}>تسجيل الإنذار وتحليله</Button>
              </div>
            </Card>
          )}

          <Card title={`سجل الإنذارات (${filtered.length})`} padded={false} action={
            <div className="flex items-center gap-1 text-xs text-navy-500"><Filter className="h-3.5 w-3.5" /> تصفية</div>
          }>
            <div className="grid grid-cols-1 gap-2 border-b border-navy-50 p-3 sm:grid-cols-3">
              <div className="relative">
                <Search className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-navy-300" />
                <input className={cx(inputCls, 'pr-8')} placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <select className={inputCls} value={fType} onChange={(e) => setFType(e.target.value as EmergencyType | 'all')}>
                <option value="all">كل الأنواع</option>
                {(Object.keys(TYPE_LABEL) as EmergencyType[]).map((k) => <option key={k} value={k}>{TYPE_LABEL[k]}</option>)}
              </select>
              <select className={inputCls} value={fStatus} onChange={(e) => setFStatus(e.target.value as Alert['status'] | 'all')}>
                <option value="all">كل الحالات</option>
                {(Object.keys(STATUS_LABEL) as Alert['status'][]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
              </select>
            </div>
            {filtered.length === 0 ? (
              <Empty icon={<Siren className="h-6 w-6" />} title="لا توجد إنذارات" body="أرسلي إنذارًا تجريبيًا أو اضغطي (محاكاة حالة طوارئ) لبدء سيناريو كامل." />
            ) : (
              <ul className="max-h-[520px] divide-y divide-navy-50 overflow-y-auto">
                {filtered.map((a) => (
                  <li key={a.id}>
                    <button onClick={() => setSelected(a.id)} className={cx('flex w-full items-start gap-3 px-4 py-3 text-right hover:bg-navy-50/60', current?.id === a.id && 'bg-sky-50/70')}>
                      <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', TYPE_ICON_COLOR[a.type])}><Siren className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-bold text-navy-900">{a.title}</p>
                          {a.source === 'demo' && <Badge className="bg-amber-100 text-amber-800 ring-amber-300">تجريبي</Badge>}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-navy-500">{a.text}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge className={SEVERITY_STYLE[a.severity]}>{SEVERITY_LABEL[a.severity]}</Badge>
                          <Badge className={STATUS_STYLE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                          <span className="text-[11px] text-navy-400">{formatTime(a.receivedAt)}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div>
          {!current ? (
            <Card><Empty icon={<BookCheck className="h-6 w-6" />} title="اختاري إنذارًا لعرض تفاصيله" body="ستظهر هنا نتيجة التصنيف ومستوى الخطورة والتعليمات المعتمدة من مكتبة الإجراءات." /></Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <div className="flex flex-wrap items-start gap-4">
                  <span className={cx('grid h-14 w-14 shrink-0 place-items-center rounded-2xl', TYPE_ICON_COLOR[current.type])}><Siren className="h-7 w-7" /></span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl font-extrabold text-navy-900">{current.title}</h2>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-navy-500">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatDate(current.receivedAt)} – {formatTime(current.receivedAt)}</span>
                      {current.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {current.location}</span>}
                      <span>المصدر: {current.sourceLabel}</span>
                    </div>
                  </div>
                  <Badge className={STATUS_STYLE[current.status]}>{STATUS_LABEL[current.status]}</Badge>
                </div>
                <p className="mt-4 rounded-xl bg-navy-50/70 p-4 text-sm leading-relaxed text-navy-800">{current.text}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Info label="النوع" value={TYPE_LABEL[current.type]} />
                  <Info label="الخطورة" value={<Badge className={SEVERITY_STYLE[current.severity]}>{SEVERITY_LABEL[current.severity]}</Badge>} />
                  <Info label="ثقة التصنيف" value={`${current.analysis.confidence}%`} />
                  <Info label="مراجعة بشرية" value={current.analysis.requiresHumanReview ? 'مطلوبة' : 'غير لازمة'} />
                </div>
                {canManage && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-navy-50 pt-4">
                    <select className={cx(inputCls, 'w-auto')} value={current.type} onChange={(e) => updateAlert(current.id, { type: e.target.value as EmergencyType })} disabled={current.status === 'activated' || current.status === 'closed'}>
                      {(Object.keys(TYPE_LABEL) as EmergencyType[]).map((k) => <option key={k} value={k}>تصنيف: {TYPE_LABEL[k]}</option>)}
                    </select>
                    <select className={cx(inputCls, 'w-auto')} value={current.severity} onChange={(e) => updateAlert(current.id, { severity: e.target.value as Severity })} disabled={current.status === 'activated' || current.status === 'closed'}>
                      {(Object.keys(SEVERITY_LABEL) as Severity[]).map((k) => <option key={k} value={k}>خطورة: {SEVERITY_LABEL[k]}</option>)}
                    </select>
                    <div className="flex-1" />
                    {current.status === 'new' && <Button variant="outline" size="sm" icon={<Eye className="h-4 w-4" />} onClick={() => updateAlert(current.id, { status: 'acknowledged' })}>تم الاطلاع</Button>}
                    {(current.status === 'new' || current.status === 'acknowledged') && (
                      <>
                        <Button variant="ghost" size="sm" icon={<XCircle className="h-4 w-4" />} onClick={() => updateAlert(current.id, { status: 'dismissed' })}>تجاهل (إنذار كاذب)</Button>
                        <Button variant="danger" size="sm" icon={<CheckCheck className="h-4 w-4" />} disabled={emergencyActive} onClick={() => activate(current.id)} title={emergencyActive ? 'توجد حالة طوارئ نشطة' : ''}>
                          تفعيل وضع الطوارئ
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </Card>

              {proc && (
                <Card title={<span className="flex items-center gap-2"><BookCheck className="h-5 w-5 text-safe-dark" /> التعليمات المعتمدة: {proc.title}</span>} subtitle={`المرجع: ${proc.source} · الإصدار ${proc.version}`}>
                  <ol className="space-y-2.5">
                    {proc.steps.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm text-navy-800">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-800 text-xs font-bold text-white">{i + 1}</span>
                        <span className="pt-1">{s}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {proc.roles.map((r) => (
                      <div key={r.role} className="rounded-xl bg-navy-50/70 p-3 text-xs ring-1 ring-navy-100">
                        <p className="font-bold text-navy-900">{{ principal: 'قائدة المدرسة', teacher: 'المعلمة', safety: 'مسؤولة السلامة', admin: 'مديرة النظام' }[r.role]}</p>
                        <p className="mt-1 text-navy-600">{r.action}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-amber-200">
                    التعليمات تُسترجع حرفيًا من مكتبة الإجراءات المعتمدة في الإعدادات، ولا يقوم النظام بتوليد أو تعديل أي تعليمات أمنية.
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-navy-100">
      <p className="text-[11px] text-navy-500">{label}</p>
      <div className="mt-0.5 text-sm font-bold text-navy-900">{value}</div>
    </div>
  );
}
