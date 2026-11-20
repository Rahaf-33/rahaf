import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, ComposedChart,
} from 'recharts';
import type { ProgressPoint } from '@/types';
import { formatDuration } from '@/lib/labels';
import { useI18n } from '@/i18n';

export const C = {
  safe: '#12a150', unverified: '#e09100', help: '#dc2f2f', absent: '#9aa5b8', observed: '#2a78d6', expected: '#b3c6e8', grid: '#e7edf7', axis: '#7a879e',
};

function TipBox({ title, rows }: { title: string; rows: { label: string; value: string | number; color: string }[] }) {
  const { dir } = useI18n();
  return (
    <div dir={dir} className="rounded-xl bg-white px-3 py-2 text-xs shadow-xl ring-1 ring-navy-100">
      <p className="mb-1 font-bold text-navy-900">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 text-navy-700">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
          <span className="flex-1">{r.label}</span>
          <b className="tabular-nums text-navy-900">{r.value}</b>
        </p>
      ))}
    </div>
  );
}

const legendFmt = (v: string) => <span className="mx-1 text-xs text-navy-700">{v}</span>;

export function ProgressChart({ data, height = 240 }: { data: ProgressPoint[]; height?: number }) {
  const { tr } = useI18n();
  if (data.length < 2) {
    return <div className="grid place-items-center text-sm text-navy-400" style={{ height }}>{tr('يبدأ الرسم البياني عند تفعيل وضع الطوارئ')}</div>;
  }
  return (
    <div dir="ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="gSafe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.safe} stopOpacity={0.35} /><stop offset="1" stopColor={C.safe} stopOpacity={0.02} /></linearGradient>
            <linearGradient id="gUnv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.unverified} stopOpacity={0.3} /><stop offset="1" stopColor={C.unverified} stopOpacity={0.02} /></linearGradient>
          </defs>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="t" tickFormatter={(v) => formatDuration(v)} stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TipBox title={tr('الزمن {t}', { t: formatDuration(Number(label)) })} rows={[
                  { label: tr('مؤكدة السلامة بالاسم'), value: payload.find((p) => p.dataKey === 'safe')?.value as number, color: C.safe },
                  { label: tr('لم يتم التحقق'), value: payload.find((p) => p.dataKey === 'unverified')?.value as number, color: C.unverified },
                  { label: tr('تحتاج مساعدة / غير موجودة'), value: payload.find((p) => p.dataKey === 'help')?.value as number, color: C.help },
                  { label: tr('العدد المرصود (مجهول الهوية)'), value: payload.find((p) => p.dataKey === 'observed')?.value as number, color: C.observed },
                ]} />
              ) : null
            }
          />
          <Legend verticalAlign="top" height={30} formatter={legendFmt} iconType="circle" iconSize={8} />
          <Area type="monotone" dataKey="safe" name={tr('مؤكدة السلامة')} stroke={C.safe} strokeWidth={2} fill="url(#gSafe)" isAnimationActive={false} />
          <Area type="monotone" dataKey="unverified" name={tr('لم يتم التحقق')} stroke={C.unverified} strokeWidth={2} fill="url(#gUnv)" isAnimationActive={false} />
          <Line type="monotone" dataKey="help" name={tr('تحتاج مساعدة')} stroke={C.help} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="observed" name={tr('المرصود (عدّ)')} stroke={C.observed} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDonut({ safe, unverified, help, absent, height = 220, center }: { safe: number; unverified: number; help: number; absent: number; height?: number; center?: { value: string; label: string } }) {
  const { tr } = useI18n();
  const data = [
    { name: tr('مؤكدة السلامة'), value: safe, color: C.safe },
    { name: tr('لم يتم التحقق'), value: unverified, color: C.unverified },
    { name: tr('تحتاج مساعدة / غير موجودة'), value: help, color: C.help },
    { name: tr('غائبات (حسب السجل)'), value: absent, color: C.absent },
  ];
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="relative" style={{ height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="90%" paddingAngle={total ? 2 : 0} stroke="#fff" strokeWidth={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip content={({ active, payload }) => active && payload?.length ? (
            <TipBox title={String(payload[0].name)} rows={[{ label: tr('العدد'), value: payload[0].value as number, color: (payload[0].payload as { color: string }).color }, { label: tr('النسبة'), value: `${total ? Math.round(((payload[0].value as number) / total) * 100) : 0}%`, color: 'transparent' }]} />
          ) : null} />
        </PieChart>
      </ResponsiveContainer>
      {center && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center" dir="rtl">
            <p className="font-display text-3xl font-extrabold tabular-nums text-navy-900">{center.value}</p>
            <p className="text-[11px] text-navy-500">{center.label}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function DonutLegend({ items }: { items: { label: string; value: number; color: string }[] }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <span className="h-3 w-3 rounded" style={{ background: i.color }} />
          <span className="flex-1 text-navy-700">{i.label}</span>
          <b className="tabular-nums text-navy-900">{i.value}</b>
        </li>
      ))}
    </ul>
  );
}

export function ClassBars({ data, height = 260 }: { data: { name: string; expected: number; observed: number; confirmed: number }[]; height?: number }) {
  const { tr, isEn } = useI18n();
  return (
    <div dir="ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={2} barCategoryGap="22%">
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="name" reversed={!isEn} stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: '#eef3fb' }} content={({ active, payload, label }) => active && payload?.length ? (
            <TipBox title={tr('فصل {name}', { name: String(label) })} rows={[
              { label: tr('الحاضرات حسب السجل'), value: payload.find((p) => p.dataKey === 'expected')?.value as number, color: C.expected },
              { label: tr('العدد المرصود (مجهول الهوية)'), value: payload.find((p) => p.dataKey === 'observed')?.value as number, color: C.observed },
              { label: tr('مؤكدة السلامة بالاسم'), value: payload.find((p) => p.dataKey === 'confirmed')?.value as number, color: C.safe },
            ]} />
          ) : null} />
          <Legend verticalAlign="top" height={30} formatter={legendFmt} iconType="circle" iconSize={8} />
          <Bar dataKey="expected" name={tr('الحاضرات (السجل)')} fill={C.expected} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="observed" name={tr('المرصود (عدّ)')} fill={C.observed} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="confirmed" name={tr('المؤكدة (بالاسم)')} fill={C.safe} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MiniArea({ data, dataKey, color, height = 48 }: { data: Record<string, number>[]; dataKey: string; color: string; height?: number }) {
  return (
    <div dir="ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HBars({ data, height = 220 }: { data: { name: string; value: number; color?: string }[]; height?: number }) {
  const { tr, isEn } = useI18n();
  return (
    <div dir="ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={C.grid} horizontal={false} />
          <XAxis type="number" stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" orientation={isEn ? 'left' : 'right'} width={110} stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: '#eef3fb' }} content={({ active, payload }) => active && payload?.length ? (
            <TipBox title={String((payload[0].payload as { name: string }).name)} rows={[{ label: tr('العدد'), value: payload[0].value as number, color: (payload[0].payload as { color?: string }).color ?? C.observed }]} />
          ) : null} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.name} fill={d.color ?? C.observed} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
