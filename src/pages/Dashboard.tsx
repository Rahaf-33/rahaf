import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, School, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, Siren, ArrowLeft, Radar, Activity, UserX, Clock, LifeBuoy, Fingerprint,
} from 'lucide-react';
import { useStore, useCurrentStats } from '@/store/useStore';
import { Badge, Card, cx, StatCard, Tabs, Progress, DemoBadge } from '@/components/ui';
import { ClassBars, ProgressChart, StatusDonut, DonutLegend, C } from '@/components/charts';
import { FloorMap, MapLegend } from '@/components/FloorMap';
import { EmergencyControls } from '@/components/Layout';
import { CLASS_STATUS_LABEL, CLASS_STATUS_STYLE } from '@/store/selectors';
import { PRIORITY_LABEL, PRIORITY_STYLE, TYPE_LABEL, formatDuration, formatTime, pct, SEVERITY_LABEL } from '@/lib/labels';
import { SLOGAN } from '@/components/Logo';

export default function Dashboard() {
  const e = useStore((s) => s.emergency);
  const alert = useStore((s) => s.alerts.find((a) => a.id === s.emergency.alertId));
  const cases = useStore((s) => s.cases);
  const logs = useStore((s) => s.logs);
  const sensors = useStore((s) => s.sensors);
  const floors = useStore((s) => s.floors);
  const history = useStore((s) => s.history);
  const { stats, totals: t } = useCurrentStats();
  const [floor, setFloor] = useState('F1');

  const openCases = cases.filter((c) => c.status !== 'resolved').sort((a, b) => a.priority.localeCompare(b.priority));
  const onlineSensors = sensors.filter((s) => s.online).length;
  const safePct = pct(t.confirmed, t.expected);
  const urgent = logs.filter((l) => l.level === 'critical' || l.level === 'warning').slice(0, 6);
  const last = history[0];

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className={cx(
        'relative overflow-hidden rounded-3xl p-6 text-white shadow-card sm:p-8',
        e.active ? 'bg-gradient-to-br from-[#7a1010] via-danger-dark to-danger' : 'bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700',
      )}>
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 left-40 h-72 w-72 rounded-full bg-white/5" />
        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold', e.active ? 'bg-white/15' : 'bg-safe/25 text-green-100')}>
                <span className={cx('h-2 w-2 rounded-full', e.active ? 'bg-white animate-pulse' : 'bg-green-300')} />
                {e.active ? `حالة طوارئ نشطة${e.simulation ? ' (محاكاة)' : ''}` : 'حالة المدرسة: آمنة'}
              </span>
              <DemoBadge />
            </div>
            <h1 className="mt-4 font-display text-3xl font-black leading-tight sm:text-4xl">
              {e.active ? `${TYPE_LABEL[e.type!]} – ${alert?.location ?? 'المبنى المدرسي'}` : 'لوحة قيادة الاستجابة للطوارئ'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              {e.active
                ? `الخطورة: ${SEVERITY_LABEL[e.severity!]} · تم التحقق من سلامة ${t.confirmed} من ${t.expected} طالبة حاضرة بالاسم. ${t.unverified + t.help + t.notFound} طالبة تحتاج متابعة.`
                : `${SLOGAN} وضع الرصد متوقف – لا يتم تشغيل الكاميرات أو العدّ إلا عند تفعيل حالة الطوارئ.`}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <EmergencyControls />
              {e.active ? (
                <>
                  <Link to="/accountability" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25">حصر الطالبات <ArrowLeft className="h-4 w-4" /></Link>
                  <Link to="/cases" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25">مركز الحالات ({openCases.length}) <ArrowLeft className="h-4 w-4" /></Link>
                </>
              ) : (
                <Link to="/alerts" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">إدخال إنذار يدوي <ArrowLeft className="h-4 w-4" /></Link>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {e.active ? (
              <>
                <HeroStat label="الزمن المنقضي" value={formatDuration(e.tick)} icon={<Clock className="h-4 w-4" />} mono />
                <HeroStat label="نسبة التحقق بالاسم" value={`${safePct}%`} icon={<ShieldCheck className="h-4 w-4" />} />
                <HeroStat label="فصول مكتملة" value={`${t.complete}/${stats.length}`} icon={<CheckCircle2 className="h-4 w-4" />} />
                <HeroStat label="حالات مفتوحة" value={String(openCases.length)} icon={<LifeBuoy className="h-4 w-4" />} />
              </>
            ) : (
              <>
                <HeroStat label="الحاضرات اليوم" value={`${t.expected}`} icon={<Users className="h-4 w-4" />} />
                <HeroStat label="الحساسات المتصلة" value={`${onlineSensors}/${sensors.length}`} icon={<Radar className="h-4 w-4" />} />
                <HeroStat label="آخر تمرين" value={last ? formatDuration((last.endedAt - last.startedAt) / 1000) : '—'} icon={<Activity className="h-4 w-4" />} mono />
                <HeroStat label="وضع الرصد" value="متوقف" icon={<Fingerprint className="h-4 w-4" />} />
              </>
            )}
          </div>
        </div>
        {e.active && (
          <div className="relative mt-6">
            <div className="flex h-3 overflow-hidden rounded-full bg-white/15">
              <div className="bg-green-400 transition-all duration-500" style={{ width: `${pct(t.confirmed, t.expected)}%` }} />
              <div className="bg-red-300 transition-all duration-500" style={{ width: `${pct(t.help + t.notFound, t.expected)}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-white/75">
              <span>مؤكدة السلامة: {t.confirmed}</span>
              <span>تحتاج مساعدة: {t.help + t.notFound}</span>
              <span>لم يتم التحقق: {t.unverified}</span>
            </div>
          </div>
        )}
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <StatCard label="عدد الطالبات المسجلات" value={t.registered} icon={<Users className="h-4 w-4" />} hint={`${t.absent} غائبة اليوم`} />
        <StatCard label="الحاضرات (السجل)" value={t.expected} icon={<UserX className="h-4 w-4" />} tone="brand" hint="حاضرة + متأخرة" />
        <StatCard label="عدد الفصول" value={stats.length} icon={<School className="h-4 w-4" />} hint={`${floors.length} طوابق`} />
        <StatCard label="فصول مكتملة الحصر" value={e.active ? t.complete : '—'} icon={<CheckCircle2 className="h-4 w-4" />} tone="safe" />
        <StatCard label="فصول غير مكتملة" value={e.active ? t.incomplete : '—'} icon={<AlertTriangle className="h-4 w-4" />} tone="warn" />
        <StatCard label="مؤكدة السلامة بالاسم" value={e.active ? t.confirmed : '—'} icon={<ShieldCheck className="h-4 w-4" />} tone="safe" hint={e.active ? `${safePct}% من الحاضرات` : 'يبدأ عند الطوارئ'} />
        <StatCard label="لم يتم التحقق منهن" value={e.active ? t.unverified : '—'} icon={<HelpCircle className="h-4 w-4" />} tone="warn" />
        <StatCard label="تحتاج مساعدة / غير موجودة" value={e.active ? t.help + t.notFound : '—'} icon={<Siren className="h-4 w-4" />} tone="danger" />
      </div>

      {e.active && (
        <div className="flex items-start gap-3 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900 ring-1 ring-sky-200">
          <Fingerprint className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <b>العدد المرصود ({t.observed})</b> هو عدّ آلي مجهول الهوية من الحساسات الافتراضية، ويُستخدم للمؤشر فقط.
            <b> السلامة تُثبت بالاسم</b> عبر تأكيد المعلمة ({t.confirmed} طالبة) – ولا يُعتبر تطابق الأعداد إثباتًا لسلامة طالبة بعينها.
          </p>
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="منحنى الاستجابة اللحظي" subtitle="تطور التحقق بالاسم مقارنة بالعدّ الآلي منذ التفعيل" action={e.active ? <Badge className="bg-danger-soft text-danger-dark ring-danger/30"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-danger" /> مباشر</Badge> : undefined}>
          <ProgressChart data={e.progress} height={260} />
        </Card>
        <Card title="توزيع حالة الطالبات" subtitle={e.active ? 'محدث لحظيًا' : 'خارج الطوارئ: الكل بانتظار أي تفعيل'}>
          <StatusDonut safe={t.confirmed} unverified={t.unverified} help={t.help + t.notFound} absent={t.absent} height={190} center={{ value: e.active ? `${safePct}%` : `${t.expected}`, label: e.active ? 'تم التحقق' : 'حاضرة اليوم' }} />
          <div className="mt-3">
            <DonutLegend items={[
              { label: 'مؤكدة السلامة', value: t.confirmed, color: C.safe },
              { label: 'لم يتم التحقق', value: t.unverified, color: C.unverified },
              { label: 'تحتاج مساعدة / غير موجودة', value: t.help + t.notFound, color: C.help },
              { label: 'غائبات حسب السجل', value: t.absent, color: C.absent },
            ]} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="خريطة المدرسة الحية" subtitle="حالة المناطق والفصول حسب الطابق" action={
          <>
            <Tabs value={floor} onChange={setFloor} items={floors.map((f) => ({ value: f.id, label: f.name.replace('الطابق ', '') }))} />
            <Link to="/map" className="text-xs font-semibold text-brand hover:underline">الخريطة الكاملة</Link>
          </>
        }>
          <FloorMap floorId={floor} />
          <div className="mt-3"><MapLegend /></div>
        </Card>
        <Card title="التنبيهات العاجلة" subtitle="الحالات المفتوحة وآخر التحذيرات" action={<Link to="/cases" className="text-xs font-semibold text-brand hover:underline">مركز الحالات</Link>}>
          {openCases.length === 0 && urgent.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center text-sm text-navy-500">
              <ShieldCheck className="mb-2 h-10 w-10 text-safe" />
              لا توجد تنبيهات عاجلة – جميع الأنظمة في وضع الاستعداد.
            </div>
          )}
          <ul className="space-y-2">
            {openCases.slice(0, 5).map((c) => (
              <li key={c.id} className="rounded-xl bg-navy-50/60 p-3 ring-1 ring-navy-100">
                <div className="flex items-center gap-2">
                  <span className={cx('rounded-md px-1.5 py-0.5 text-[10px] font-bold', PRIORITY_STYLE[c.priority])}>{PRIORITY_LABEL[c.priority]}</span>
                  <p className="flex-1 truncate text-sm font-bold text-navy-900">{c.title}</p>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-navy-600">{c.description}</p>
                <p className="mt-1 text-[10px] text-navy-400">{formatTime(c.createdAt)} · {c.source}</p>
              </li>
            ))}
            {urgent.filter((l) => l.category !== 'case').slice(0, Math.max(0, 6 - openCases.length)).map((l) => (
              <li key={l.id} className="flex gap-2 rounded-xl p-2 text-xs">
                <span className={cx('mt-1 h-2 w-2 shrink-0 rounded-full', l.level === 'critical' ? 'bg-danger' : 'bg-warn')} />
                <div><p className="text-navy-800">{l.message}</p><p className="text-[10px] text-navy-400">{formatTime(l.at)} · {l.actor}</p></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="مقارنة الفصول: السجل × المرصود × المؤكد" subtitle="العدد المرصود مؤشر مساعد – التأكيد بالاسم هو المرجع">
          <ClassBars data={stats.map((s) => ({ name: s.cls.name, expected: s.expected, observed: s.observed, confirmed: s.confirmed }))} />
        </Card>
        <Card title="حالة الفصول" subtitle="اضغطي على فصل لفتح الحصر" padded={false}>
          <ul className="max-h-[300px] divide-y divide-navy-50 overflow-y-auto">
            {stats.map((s) => (
              <li key={s.cls.id}>
                <Link to={`/accountability?class=${s.cls.id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-navy-50/60">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy-50 font-display text-sm font-bold text-navy-800">{s.cls.name}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={CLASS_STATUS_STYLE[s.status]}>{CLASS_STATUS_LABEL[s.status]}</Badge>
                      <span className="text-xs tabular-nums text-navy-600">{s.confirmed}/{s.expected}</span>
                    </div>
                    <Progress value={pct(s.confirmed, s.expected)} tone={s.status === 'help' ? 'danger' : s.status === 'complete' ? 'safe' : 'warn'} className="mt-1.5" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function HeroStat({ label, value, icon, mono }: { label: string; value: string; icon: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
      <p className="flex items-center gap-1.5 text-xs text-white/75">{icon} {label}</p>
      <p className={cx('mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl', mono ? 'font-mono' : 'font-display')}>{value}</p>
    </div>
  );
}
