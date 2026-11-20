import { useMemo, useState } from 'react';
import { Map as MapIcon, Layers, Radar, DoorOpen, Flag, Users, MousePointerClick } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { classStats } from '@/store/selectors';
import { FloorMap, MapLegend, SENSOR_COLORS } from '@/components/FloorMap';
import { Badge, Card, cx, PageHeader, Tabs, DemoBadge, Button } from '@/components/ui';
import { SENSOR_LABEL, ZONE_FILL, zoneStatusLabel, SAFETY_LABEL, SAFETY_STYLE } from '@/lib/labels';
import type { ZoneStatus } from '@/types';
import { CLASS_STATUS_LABEL, CLASS_STATUS_STYLE } from '@/store/selectors';

export default function MapPage() {
  const floors = useStore((s) => s.floors);
  const zones = useStore((s) => s.zones);
  const exits = useStore((s) => s.exits);
  const aps = useStore((s) => s.assemblyPoints);
  const sensors = useStore((s) => s.sensors);
  const zoneStatus = useStore((s) => s.zoneStatus);
  const classes = useStore((s) => s.classes);
  const students = useStore((s) => s.students);
  const teachers = useStore((s) => s.teachers);
  const observed = useStore((s) => s.observed);
  const e = useStore((s) => s.emergency);
  const user = useStore((s) => s.user)!;
  const setZoneStatus = useStore((s) => s.setZoneStatus);
  const [floor, setFloor] = useState<string>('all');
  const [sel, setSel] = useState<string | null>(null);
  const [showSensors, setShowSensors] = useState(true);
  const stats = useMemo(() => classStats(classes, students, observed, e.active), [classes, students, observed, e.active]);

  const zone = zones.find((z) => z.id === sel);
  const zs = zone ? (zoneStatus[zone.id] ?? 'normal') : 'normal';
  const zoneClass = zone?.classId ? stats.find((s) => s.cls.id === zone.classId) : undefined;
  const zoneSensors = sensors.filter((s) => s.zoneId === zone?.id);
  const canEdit = user.role !== 'teacher' && e.active;

  const counts = Object.values(zoneStatus).reduce<Record<ZoneStatus, number>>((a, s) => ({ ...a, [s]: (a[s] ?? 0) + 1 }), { normal: 0, evacuating: 0, cleared: 0, needs_check: 0, danger: 0 });
  const shown = floor === 'all' ? [...floors].sort((a, b) => b.level - a.level) : floors.filter((f) => f.id === floor);

  return (
    <div>
      <PageHeader title="خريطة المدرسة التفاعلية" icon={<MapIcon className="h-6 w-6" />} subtitle="الطوابق والفصول والمخارج ونقاط التجمع مع حالة كل منطقة لحظيًا" actions={<DemoBadge>مخطط افتراضي</DemoBadge>} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={floor} onChange={setFloor} items={[{ value: 'all', label: <span className="inline-flex items-center gap-1"><Layers className="h-4 w-4" /> كل الطوابق</span> }, ...floors.map((f) => ({ value: f.id, label: f.name }))]} />
        <button onClick={() => setShowSensors((v) => !v)} className={cx('inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold ring-1', showSensors ? 'bg-navy-800 text-white ring-navy-800' : 'bg-white text-navy-700 ring-navy-200')}>
          <Radar className="h-4 w-4" /> الحساسات
        </button>
        <div className="flex-1" />
        <div className="flex flex-wrap gap-2 text-xs">
          {(Object.keys(counts) as ZoneStatus[]).filter((k) => counts[k] > 0).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-semibold ring-1 ring-navy-100">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: ZONE_FILL[k].stroke }} /> {zoneStatusLabel(k, e.type)}: {counts[k]}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {shown.map((f) => (
            <Card key={f.id} title={f.name} subtitle={`${zones.filter((z) => z.floorId === f.id && z.kind === 'classroom').length} فصول · ${exits.filter((x) => x.floorId === f.id).length} مخارج`} padded={false}>
              <div className="p-3 sm:p-5"><FloorMap floorId={f.id} selected={sel} onSelect={setSel} showSensors={showSensors} /></div>
            </Card>
          ))}
          <Card>
            <MapLegend />
            {showSensors && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-navy-700">
                {Object.entries(SENSOR_COLORS).map(([k, c]) => (
                  <span key={k} className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: c }} />{SENSOR_LABEL[k as keyof typeof SENSOR_LABEL]}</span>
                ))}
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-gray-400" />غير متصل</span>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="تفاصيل المنطقة" subtitle={zone ? floors.find((f) => f.id === zone.floorId)?.name : undefined}>
            {!zone ? (
              <div className="flex flex-col items-center py-6 text-center text-sm text-navy-500"><MousePointerClick className="mb-2 h-8 w-8 text-navy-300" /> اضغطي على أي منطقة في الخريطة لعرض تفاصيلها</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-xl font-extrabold text-navy-900">{zone.name}</p>
                  <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: ZONE_FILL[zs].fill, color: ZONE_FILL[zs].text, boxShadow: `inset 0 0 0 1.5px ${ZONE_FILL[zs].stroke}` }}>{zoneStatusLabel(zs, e.type)}</span>
                </div>
                {zoneClass && (
                  <div className="rounded-xl bg-navy-50/70 p-3 text-sm">
                    <p className="mb-2 flex items-center justify-between"><span className="font-bold">فصل {zoneClass.cls.name} – {zoneClass.cls.grade}</span><Badge className={CLASS_STATUS_STYLE[zoneClass.status]}>{CLASS_STATUS_LABEL[zoneClass.status]}</Badge></p>
                    <p className="text-xs text-navy-600">المعلمة: {teachers.find((t) => t.id === zoneClass.cls.teacherId)?.name} · نقطة التجمع: {aps.find((a) => a.id === zoneClass.cls.assemblyPointId)?.name}</p>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      <Mini label="مسجلة" v={zoneClass.registered} />
                      <Mini label="حاضرة" v={zoneClass.expected} />
                      <Mini label="مرصود" v={zoneClass.observed} />
                      <Mini label="مؤكدة" v={zoneClass.confirmed} tone="safe" />
                    </div>
                    {e.active && (
                      <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto">
                        {students.filter((s) => s.classId === zoneClass.cls.id && s.attendance !== 'absent' && s.safety !== 'safe').map((s) => (
                          <li key={s.id} className="flex items-center justify-between text-xs"><span>{s.name}</span><Badge className={SAFETY_STYLE[s.safety]}>{SAFETY_LABEL[s.safety]}</Badge></li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {!zoneClass && <p className="text-sm text-navy-600">السعة التقديرية: {zone.capacity} شخص</p>}
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-navy-500">الحساسات في المنطقة ({zoneSensors.length})</p>
                  {zoneSensors.length === 0 && <p className="text-xs text-navy-400">لا توجد حساسات</p>}
                  <ul className="space-y-1.5">
                    {zoneSensors.map((s) => (
                      <li key={s.id} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-xs ring-1 ring-navy-100">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.online ? SENSOR_COLORS[s.kind] : '#9ca3af' }} />
                        <span className="flex-1">{s.name}</span>
                        <span className="tabular-nums text-navy-500">{!s.online ? 'غير متصل' : e.active ? readingText(s.kind, s.reading) : 'استعداد'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {canEdit && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-navy-500">تحديث الحالة يدويًا (بعد تحقق بشري)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['cleared', 'needs_check', 'evacuating', 'danger'] as ZoneStatus[]).map((st) => (
                        <Button key={st} size="sm" variant={zs === st ? 'primary' : 'outline'} onClick={() => setZoneStatus(zone.id, st, user.name)}>{zoneStatusLabel(st, e.type)}</Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title={<span className="flex items-center gap-2"><Flag className="h-5 w-5 text-safe-dark" /> نقاط التجمع</span>}>
            <div className="space-y-3">
              {aps.map((ap) => {
                const cls = stats.filter((s) => s.cls.assemblyPointId === ap.id);
                const cam = sensors.find((s) => s.assemblyPointId === ap.id);
                const conf = cls.reduce((a, s) => a + s.confirmed, 0);
                const exp = cls.reduce((a, s) => a + s.expected, 0);
                return (
                  <div key={ap.id} className="rounded-xl bg-safe-soft/60 p-3 ring-1 ring-safe/20">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-navy-900">{ap.name}</p>
                      <Badge className="bg-white text-navy-700 ring-navy-200"><Users className="h-3 w-3" /> {e.active ? cam?.reading ?? 0 : 0} مرصود</Badge>
                    </div>
                    <p className="text-xs text-navy-600">{ap.description}</p>
                    <p className="mt-2 text-xs text-navy-700">الفصول: {cls.map((c) => c.cls.name).join('، ')}</p>
                    <p className="mt-1 text-xs font-semibold text-safe-dark">مؤكدة بالاسم: {conf} / {exp}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title={<span className="flex items-center gap-2"><DoorOpen className="h-5 w-5 text-safe-dark" /> مخارج الطوارئ</span>} padded={false}>
            <ul className="divide-y divide-navy-50 text-sm">
              {exits.map((x) => (
                <li key={x.id} className="flex items-center justify-between px-5 py-2.5">
                  <div><p className="font-semibold text-navy-900">{x.name}</p><p className="text-xs text-navy-500">{floors.find((f) => f.id === x.floorId)?.name}</p></div>
                  <Badge className="bg-safe-soft text-safe-dark ring-safe/30">← {aps.find((a) => a.id === x.assemblyPointId)?.name}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, v, tone }: { label: string; v: number; tone?: 'safe' }) {
  return (
    <div className="rounded-lg bg-white p-1.5 ring-1 ring-navy-100">
      <p className={cx('font-display text-lg font-extrabold tabular-nums', tone === 'safe' ? 'text-safe-dark' : 'text-navy-900')}>{v}</p>
      <p className="text-[10px] text-navy-500">{label}</p>
    </div>
  );
}

export function readingText(kind: string, v: number) {
  if (kind === 'camera' || kind === 'occupancy') return `${v} شخص`;
  if (kind === 'smoke') return `${v}% دخان`;
  if (kind === 'heat') return `${v}°م`;
  if (kind === 'door') return v ? 'مفتوح' : 'مغلق';
  return String(v);
}
