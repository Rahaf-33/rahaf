import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { classStats } from '@/store/selectors';
import { ZONE_FILL } from '@/lib/labels';
import type { ZoneStatus } from '@/types';

const SENSOR_COLOR: Record<string, string> = { camera: '#2a78d6', smoke: '#6b7280', heat: '#eb6834', occupancy: '#6250d6', door: '#1baf7a' };

export function FloorMap({ floorId, selected, onSelect, showSensors = false, compact = false }: {
  floorId: string; selected?: string | null; onSelect?: (zoneId: string) => void; showSensors?: boolean; compact?: boolean;
}) {
  const zones = useStore((s) => s.zones);
  const exits = useStore((s) => s.exits);
  const zoneStatus = useStore((s) => s.zoneStatus);
  const sensors = useStore((s) => s.sensors);
  const classes = useStore((s) => s.classes);
  const students = useStore((s) => s.students);
  const observed = useStore((s) => s.observed);
  const active = useStore((s) => s.emergency.active);
  const type = useStore((s) => s.emergency.type);
  const stats = useMemo(() => classStats(classes, students, observed, active), [classes, students, observed, active]);
  const fz = zones.filter((z) => z.floorId === floorId);
  const fe = exits.filter((e) => e.floorId === floorId);
  const shelter = type === 'external_threat';

  return (
    <svg viewBox="0 0 1000 520" className="h-auto w-full select-none" role="img" aria-label="مخطط الطابق">
      <defs>
        <pattern id="hatch" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="10" stroke="#dc2f2f" strokeWidth="3" opacity=".25" />
        </pattern>
        <pattern id="hatch-check" width="10" height="10" patternTransform="rotate(135)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="10" stroke="#eb6834" strokeWidth="2.5" opacity=".25" />
        </pattern>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill="#12a150" />
        </marker>
      </defs>
      <rect x="20" y="20" width="960" height="480" rx="14" fill="#ffffff" stroke="#18356b" strokeWidth="3" />
      {fz.map((z) => {
        const st: ZoneStatus = zoneStatus[z.id] ?? 'normal';
        const c = ZONE_FILL[st];
        const cs = z.classId ? stats.find((s) => s.cls.id === z.classId) : undefined;
        const isSel = selected === z.id;
        const big = z.w >= 200;
        const isCorr = z.kind === 'corridor';
        return (
          <g key={z.id} onClick={() => onSelect?.(z.id)} className={onSelect ? 'cursor-pointer' : ''} role={onSelect ? 'button' : undefined} aria-label={z.name}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="10" fill={isCorr && st === 'normal' ? '#f7f9fd' : c.fill} stroke={isSel ? '#0b1a38' : c.stroke} strokeWidth={isSel ? 4 : 2} className="transition-colors duration-500" />
            {st === 'danger' && <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="10" fill="url(#hatch)" className="animate-pulse" />}
            {st === 'needs_check' && <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="10" fill="url(#hatch-check)" />}
            {!isCorr && (
              <>
                <text x={z.x + z.w / 2} y={z.y + (compact ? z.h / 2 : 34)} textAnchor="middle" fontSize={big ? 19 : 14} fontWeight={700} fill={c.text} style={{ direction: 'rtl' }}>
                  {z.kind === 'stairs' ? (z.name.includes('الرئيسي') ? 'الدرج' : 'الدرج') : z.name}
                </text>
                {!compact && cs && (
                  <>
                    <text x={z.x + z.w / 2} y={z.y + 64} textAnchor="middle" fontSize="13" fill="#52607a" style={{ direction: 'rtl' }}>
                      {teacherShort(cs.cls.teacherId)}
                    </text>
                    {active ? (
                      <g>
                        <rect x={z.x + 18} y={z.y + 86} width={z.w - 36} height={10} rx="5" fill="#ffffff" stroke="#d9e3f4" />
                        <rect x={z.x + 18 + (z.w - 36) * (1 - cs.confirmed / Math.max(1, cs.expected))} y={z.y + 86} width={(z.w - 36) * (cs.confirmed / Math.max(1, cs.expected))} height={10} rx="5" fill="#12a150" className="transition-all duration-500" />
                        <text x={z.x + z.w / 2} y={z.y + 124} textAnchor="middle" fontSize="15" fontWeight={700} fill="#0b1a38" style={{ direction: 'rtl' }}>
                          {cs.confirmed}/{cs.expected} مؤكدة
                        </text>
                        <text x={z.x + z.w / 2} y={z.y + 148} textAnchor="middle" fontSize="12" fill="#52607a" style={{ direction: 'rtl' }}>
                          مرصود: {cs.observed}{cs.help + cs.notFound > 0 ? ` · ⚠ ${cs.help + cs.notFound}` : ''}
                        </text>
                      </g>
                    ) : (
                      <text x={z.x + z.w / 2} y={z.y + 110} textAnchor="middle" fontSize="13" fill="#52607a" style={{ direction: 'rtl' }}>
                        {cs.expected} حاضرة من {cs.registered}
                      </text>
                    )}
                  </>
                )}
                {!compact && !cs && z.kind !== 'stairs' && (
                  <text x={z.x + z.w / 2} y={z.y + 64} textAnchor="middle" fontSize="12" fill="#52607a" style={{ direction: 'rtl' }}>
                    {statusText(st, shelter)}
                  </text>
                )}
              </>
            )}
            {isCorr && (
              <text x={500} y={z.y + 20} textAnchor="middle" fontSize="13" fontWeight={600} fill="#7f9fd4" style={{ direction: 'rtl' }}>
                {z.name}{st !== 'normal' ? ` – ${statusText(st, shelter)}` : ''}
              </text>
            )}
          </g>
        );
      })}

      {/* evacuation routes */}
      {active && !shelter && (
        <g pointerEvents="none">
          <path d="M470 262 H46" stroke="#12a150" strokeWidth="5" strokeDasharray="14 10" fill="none" markerEnd="url(#arrow)" className="animate-dash" />
          <path d="M530 262 H954" stroke="#12a150" strokeWidth="5" strokeDasharray="14 10" fill="none" markerEnd="url(#arrow)" className="animate-dash" />
          {fz.filter((z) => z.kind !== 'corridor' && z.kind !== 'stairs').map((z) => {
            const top = z.y < 210;
            const cx = z.x + z.w / 2;
            return <path key={z.id} d={top ? `M${cx} ${z.y + z.h - 6} V236` : `M${cx} ${z.y + 6} V288`} stroke="#12a150" strokeWidth="3" strokeDasharray="6 6" markerEnd="url(#arrow)" className="animate-dash" opacity={0.7} />;
          })}
        </g>
      )}

      {/* exits */}
      {fe.map((e) => (
        <g key={e.id}>
          <rect x={e.x - 12} y={e.y - 30} width={24} height={60} rx="6" fill="#12a150" />
          <text x={e.x} y={e.y + 5} textAnchor="middle" fontSize="16" fontWeight={900} fill="#fff">⇆</text>
          <text x={e.x < 500 ? 130 : 870} y={292} textAnchor="middle" fontSize="12" fontWeight={700} fill="#0b7a3b" style={{ direction: 'rtl' }}>
            {e.x < 500 ? '◀ ' : ''}{e.name}{e.x < 500 ? '' : ' ▶'}
          </text>
        </g>
      ))}

      {/* sensors */}
      {showSensors && sensors.filter((s) => s.zoneId && zones.find((z) => z.id === s.zoneId)?.floorId === floorId).map((s, i) => {
        const z = zones.find((x) => x.id === s.zoneId)!;
        const sameZone = sensors.filter((x) => x.zoneId === s.zoneId);
        const k = sameZone.indexOf(s);
        const x = z.x + z.w - 14 - k * 18;
        const y = z.y + 14;
        return (
          <g key={s.id + i}>
            <circle cx={x} cy={y} r="7" fill={s.online ? SENSOR_COLOR[s.kind] : '#9ca3af'} stroke="#fff" strokeWidth="2">
              <title>{s.name}{s.online ? '' : ' (غير متصل)'}</title>
            </circle>
            {active && s.online && (s.kind === 'camera' || s.kind === 'occupancy') && <circle cx={x} cy={y} r="11" fill="none" stroke={SENSOR_COLOR[s.kind]} strokeWidth="2" opacity=".5" className="animate-ping" style={{ transformOrigin: `${x}px ${y}px` }} />}
            {s.triggered && s.kind !== 'door' && <circle cx={x} cy={y} r="12" fill="none" stroke="#dc2f2f" strokeWidth="3" />}
          </g>
        );
      })}
    </svg>
  );

  function teacherShort(tid: string) {
    const t = useStore.getState().teachers.find((x) => x.id === tid);
    return t ? t.name : '';
  }
}

function statusText(s: ZoneStatus, shelter: boolean) {
  return { normal: 'طبيعي', evacuating: shelter ? 'إيواء' : 'جارٍ الإخلاء', cleared: shelter ? 'مؤمّن' : 'تم الإخلاء', needs_check: 'يحتاج تحقق', danger: 'منطقة خطر' }[s];
}

export function MapLegend() {
  const items: { s: ZoneStatus; l: string }[] = [
    { s: 'normal', l: 'طبيعي' }, { s: 'evacuating', l: 'جارٍ الإخلاء / إيواء' }, { s: 'cleared', l: 'تم الإخلاء / مؤمّن' }, { s: 'needs_check', l: 'يحتاج تحقق' }, { s: 'danger', l: 'منطقة خطر' },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-navy-700">
      {items.map((i) => (
        <span key={i.s} className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded" style={{ background: ZONE_FILL[i.s].fill, border: `2px solid ${ZONE_FILL[i.s].stroke}` }} />
          {i.l}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-safe" /> مخرج طوارئ</span>
    </div>
  );
}

export const SENSOR_COLORS = SENSOR_COLOR;
