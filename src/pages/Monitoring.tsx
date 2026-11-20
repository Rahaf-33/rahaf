import { useMemo, useState } from 'react';
import { Radar, Camera, EyeOff, VideoOff, ShieldCheck, Power, WifiOff, Flame, Thermometer, DoorOpen, Users, Search, BatteryLow, Database } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Badge, Card, cx, DemoBadge, inputCls, PageHeader, StatCard } from '@/components/ui';
import { SENSOR_LABEL } from '@/lib/labels';
import { readingText } from './MapPage';
import { MiniArea } from '@/components/charts';
import type { Sensor, SensorKind } from '@/types';
import { mulberry32 } from '@/lib/random';
import { useI18n } from '@/i18n';

const KIND_ICON: Record<SensorKind, JSX.Element> = {
  camera: <Camera className="h-4 w-4" />, occupancy: <Users className="h-4 w-4" />, smoke: <Flame className="h-4 w-4" />, heat: <Thermometer className="h-4 w-4" />, door: <DoorOpen className="h-4 w-4" />,
};

function CameraTile({ s, active, zoneName }: { s: Sensor; active: boolean; zoneName: string }) {
  const { tr } = useI18n();
  const dots = useMemo(() => {
    const r = mulberry32(s.id.charCodeAt(4) * 31 + s.id.charCodeAt(5));
    return Array.from({ length: 40 }, (_, i) => ({ i, x: 10 + r() * 180, y: 20 + r() * 80, d: 2 + r() * 4, dx: (r() - 0.5) * 60 }));
  }, [s.id]);
  const n = Math.min(40, s.reading);
  return (
    <div className="overflow-hidden rounded-2xl bg-navy-950 ring-1 ring-navy-900/10">
      <div className="relative aspect-video">
        {!s.online ? (
          <div className="absolute inset-0 grid place-items-center text-center text-navy-400">
            <div><WifiOff className="mx-auto mb-1 h-7 w-7" /><p className="text-xs font-semibold">{tr('غير متصل')}</p><p className="text-[10px]">{tr('يلزم تحقق بشري من المنطقة')}</p></div>
          </div>
        ) : !active ? (
          <div className="absolute inset-0 grid place-items-center text-center text-navy-400">
            <div><VideoOff className="mx-auto mb-1 h-7 w-7" /><p className="text-xs font-semibold">{tr('وضع الاستعداد')}</p><p className="text-[10px]">{tr('لا يوجد بث أو عدّ خارج الطوارئ')}</p></div>
          </div>
        ) : (
          <>
            <svg viewBox="0 0 200 112" className="absolute inset-0 h-full w-full">
              <defs>
                <pattern id={`g-${s.id}`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#1f4485" strokeWidth=".4" /></pattern>
              </defs>
              <rect width="200" height="112" fill={`url(#g-${s.id})`} />
              <line x1="0" y1="92" x2="200" y2="92" stroke="#2a78d6" strokeWidth=".6" strokeDasharray="3 3" />
              {dots.slice(0, n).map((d) => (
                <circle key={d.i} cx={d.x} cy={d.y} r="3.2" fill="#5b9be6" opacity=".9">
                  <animate attributeName="cx" values={`${d.x};${d.x + d.dx};${d.x}`} dur={`${d.d}s`} repeatCount="indefinite" />
                </circle>
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-brand/20 to-transparent animate-scan" />
            <span className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-md bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> {tr('رصد مؤقت')}</span>
            <span className="absolute bottom-2 start-2 rounded-md bg-black/60 px-2 py-0.5 font-mono text-sm font-bold text-white">{s.reading}</span>
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 bg-navy-900 px-3 py-2 text-xs text-navy-200">
        <span className="truncate">{zoneName}</span>
        <span className="shrink-0 text-[10px] text-navy-400">{s.id}</span>
      </div>
    </div>
  );
}

export default function Monitoring() {
  const { tr, n } = useI18n();
  const sensors = useStore((s) => s.sensors);
  const zones = useStore((s) => s.zones);
  const floors = useStore((s) => s.floors);
  const aps = useStore((s) => s.assemblyPoints);
  const e = useStore((s) => s.emergency);
  const upsertSensor = useStore((s) => s.upsertSensor);
  const user = useStore((s) => s.user)!;
  const [kind, setKind] = useState<SensorKind | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'online' | 'offline' | 'triggered'>('all');
  const [floor, setFloor] = useState('all');
  const [q, setQ] = useState('');

  const where = (s: Sensor) => (s.zoneId ? n(zones.find((z) => z.id === s.zoneId)) : n(aps.find((a) => a.id === s.assemblyPointId))) || '—';
  const floorOf = (s: Sensor) => zones.find((z) => z.id === s.zoneId)?.floorId ?? 'OUT';
  const cams = sensors.filter((s) => s.kind === 'camera');
  const filtered = sensors.filter((s) =>
    (kind === 'all' || s.kind === kind) &&
    (status === 'all' || (status === 'online' ? s.online : status === 'offline' ? !s.online : s.triggered && s.kind !== 'door')) &&
    (floor === 'all' || floorOf(s) === floor) &&
    (!q || s.name.includes(q) || s.id.includes(q)),
  );

  return (
    <div>
      <PageHeader title={tr('الرصد الذكي')} icon={<Radar className="h-6 w-6" />} subtitle={tr('حالة الكاميرات والحساسات – يعمل العدّ والرصد فقط بعد تفعيل وضع الطوارئ')} actions={<DemoBadge>{tr('أجهزة افتراضية – لا اتصال بكاميرات حقيقية')}</DemoBadge>} />

      <div className={cx('mb-6 overflow-hidden rounded-3xl p-5 sm:p-6', e.active ? 'bg-gradient-to-l from-danger-dark to-danger text-white' : 'bg-white shadow-card ring-1 ring-navy-900/5')}>
        <div className="flex flex-wrap items-center gap-4">
          <span className={cx('grid h-14 w-14 place-items-center rounded-2xl', e.active ? 'bg-white/15 animate-pulseRing' : 'bg-navy-50 text-navy-500')}>
            {e.active ? <Radar className="h-7 w-7" /> : <Power className="h-7 w-7" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className={cx('font-display text-xl font-extrabold', !e.active && 'text-navy-900')}>
              {e.active ? tr('وضع الرصد المؤقت مُفعّل') : tr('وضع الرصد متوقف')}
            </p>
            <p className={cx('text-sm', e.active ? 'text-white/85' : 'text-navy-500')}>
              {e.active
                ? tr('تجري محاكاة العدّ مجهول الهوية ورصد الحركة لدعم الإخلاء. سيتوقف تلقائيًا عند إنهاء حالة الطوارئ.')
                : tr('لا يتم تشغيل أي رصد مستمر. تبقى الحساسات في وضع الاستعداد حتى تفعيل حالة طوارئ رسمية أو محاكاة.')}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: <EyeOff className="h-4 w-4" />, t: tr('بدون تعرّف على الوجوه أو الهوية') },
            { i: <VideoOff className="h-4 w-4" />, t: tr('لا يتم تخزين أو تسجيل أي فيديو') },
            { i: <Database className="h-4 w-4" />, t: tr('تُحفظ الأعداد الإجمالية فقط') },
            { i: <ShieldCheck className="h-4 w-4" />, t: tr('يعمل عند الطوارئ فقط ويتوقف بانتهائها') },
          ].map((p) => (
            <div key={p.t} className={cx('flex items-center gap-2 rounded-xl px-3 py-2', e.active ? 'bg-white/10' : 'bg-navy-50 text-navy-700')}>{p.i}{p.t}</div>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label={tr('إجمالي الأجهزة')} value={sensors.length} icon={<Radar className="h-4 w-4" />} />
        <StatCard label={tr('متصلة')} value={sensors.filter((s) => s.online).length} icon={<ShieldCheck className="h-4 w-4" />} tone="safe" />
        <StatCard label={tr('غير متصلة')} value={sensors.filter((s) => !s.online).length} icon={<WifiOff className="h-4 w-4" />} tone="danger" />
        <StatCard label={tr('بطارية منخفضة')} value={sensors.filter((s) => s.battery < 20).length} icon={<BatteryLow className="h-4 w-4" />} tone="warn" />
        <StatCard label={tr('إنذارات حساسات')} value={sensors.filter((s) => s.triggered && s.kind !== 'door').length} icon={<Flame className="h-4 w-4" />} tone="danger" />
      </div>

      <Card className="mb-6" title={tr('كاميرات العدّ (عرض تمثيلي)')} subtitle={tr('نقاط مجهولة الهوية تمثل الأشخاص المرصودين – ليست صورًا أو بثًا حقيقيًا')} action={e.active && e.progress.length > 1 ? <div className="w-40"><MiniArea data={e.progress as unknown as Record<string, number>[]} dataKey="observed" color="#2a78d6" height={36} /></div> : undefined}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {cams.map((c) => <CameraTile key={c.id} s={c} active={e.active} zoneName={where(c)} />)}
        </div>
      </Card>

      <Card title={tr('سجل الحساسات ({n})', { n: filtered.length })} padded={false}>
        <div className="grid grid-cols-2 gap-2 border-b border-navy-50 p-3 md:grid-cols-4">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="pointer-events-none absolute start-2.5 top-2.5 h-4 w-4 text-navy-300" />
            <input className={cx(inputCls, 'ps-8')} placeholder={tr('بحث بالاسم أو الرمز')} value={q} onChange={(e2) => setQ(e2.target.value)} />
          </div>
          <select className={inputCls} value={kind} onChange={(e2) => setKind(e2.target.value as SensorKind | 'all')}>
            <option value="all">{tr('كل الأنواع')}</option>
            {(Object.keys(SENSOR_LABEL) as SensorKind[]).map((k) => <option key={k} value={k}>{SENSOR_LABEL[k]}</option>)}
          </select>
          <select className={inputCls} value={status} onChange={(e2) => setStatus(e2.target.value as typeof status)}>
            <option value="all">{tr('كل الحالات')}</option><option value="online">{tr('متصل')}</option><option value="offline">{tr('غير متصل')}</option><option value="triggered">{tr('إنذار')}</option>
          </select>
          <select className={inputCls} value={floor} onChange={(e2) => setFloor(e2.target.value)}>
            <option value="all">{tr('كل المواقع')}</option>
            {floors.map((f) => <option key={f.id} value={f.id}>{n(f)}</option>)}
            <option value="OUT">{tr('نقاط التجمع')}</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-navy-50/60 text-xs text-navy-500">
              <tr><th className="px-4 py-2.5 text-start font-semibold">{tr('الجهاز')}</th><th className="text-start font-semibold">{tr('النوع')}</th><th className="text-start font-semibold">{tr('الموقع')}</th><th className="text-start font-semibold">{tr('الاتصال')}</th><th className="text-start font-semibold">{tr('البطارية')}</th><th className="text-start font-semibold">{tr('القراءة')}</th>{user.role !== 'principal' && <th className="text-start font-semibold">{tr('تحكم')}</th>}</tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {filtered.map((s) => (
                <tr key={s.id} className={cx(s.triggered && s.kind !== 'door' && 'bg-danger-soft/50')}>
                  <td className="px-4 py-2.5"><p className="font-semibold text-navy-900">{n(s)}</p><p className="text-[11px] text-navy-400">{s.id}</p></td>
                  <td><span className="inline-flex items-center gap-1.5 text-navy-700">{KIND_ICON[s.kind]} {SENSOR_LABEL[s.kind]}</span></td>
                  <td className="text-navy-700">{where(s)}</td>
                  <td>{s.online ? <Badge className="bg-safe-soft text-safe-dark ring-safe/30">{tr('متصل')}</Badge> : <Badge className="bg-danger-soft text-danger-dark ring-danger/30">{tr('غير متصل')}</Badge>}</td>
                  <td className={cx('tabular-nums', s.battery < 20 ? 'font-bold text-danger' : 'text-navy-600')}>{s.battery}%</td>
                  <td className="tabular-nums">
                    {!s.online ? '—' : !e.active ? <span className="text-navy-400">{tr('استعداد')}</span> : (
                      <span className={cx('font-semibold', s.triggered && s.kind !== 'door' ? 'text-danger' : 'text-navy-900')}>{readingText(s.kind, s.reading)}{s.triggered && s.kind !== 'door' ? ' ⚠' : ''}</span>
                    )}
                  </td>
                  {user.role !== 'principal' && (
                    <td>
                      <button onClick={() => upsertSensor({ ...s, online: !s.online })} className="rounded-lg px-2 py-1 text-xs font-semibold text-brand hover:bg-navy-50">
                        {s.online ? tr('تعطيل') : tr('تفعيل')}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
