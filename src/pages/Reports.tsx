import { useMemo, useState } from 'react';
import { FileBarChart2, Download, Printer, FileJson, Clock, ShieldCheck, HelpCircle, Siren, Timer, Users, LifeBuoy, Activity } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '@/store/useStore';
import { classStats, totals } from '@/store/selectors';
import { Badge, Button, Card, cx, DemoBadge, PageHeader, StatCard, Empty } from '@/components/ui';
import { ProgressChart, C } from '@/components/charts';
import { TYPE_LABEL, SEVERITY_LABEL, formatDateTime, formatDuration, formatTime, pct } from '@/lib/labels';
import { downloadFile, toCSV } from '@/lib/export';
import type { EmergencyRecord } from '@/types';
import { Logo } from '@/components/Logo';

export default function Reports() {
  const history = useStore((s) => s.history);
  const e = useStore((s) => s.emergency);
  const logs = useStore((s) => s.logs);
  const cases = useStore((s) => s.cases);
  const classes = useStore((s) => s.classes);
  const students = useStore((s) => s.students);
  const observed = useStore((s) => s.observed);
  const alerts = useStore((s) => s.alerts);
  const school = useStore((s) => s.school);

  const live: EmergencyRecord | null = useMemo(() => {
    if (!e.active || !e.startedAt) return null;
    const st = classStats(classes, students, observed, true);
    const t = totals(st);
    return {
      id: 'LIVE', type: e.type!, severity: e.severity!, title: `${alerts.find((a) => a.id === e.alertId)?.title ?? 'حالة طوارئ'} (جارية)`,
      startedAt: e.startedAt, endedAt: e.startedAt + e.tick * 1000, simulation: e.simulation,
      totalPresent: t.expected, confirmedSafe: t.confirmed, unverified: t.unverified, needsHelp: t.help + t.notFound, casesOpened: cases.length,
      firstConfirmationSec: e.firstConfirmationAt, zonesClearedSec: e.allZonesClearedAt,
      log: logs.filter((l) => l.at >= e.startedAt! - 2000).slice().reverse(), progress: e.progress,
      classes: st.map((s) => ({ classId: s.cls.id, name: s.cls.name, present: s.expected, observed: s.observed, confirmed: s.confirmed, unverified: s.unverified, help: s.help + s.notFound })),
    };
  }, [e, classes, students, observed, logs, cases, alerts]);

  const records = live ? [live, ...history] : history;
  const [selId, setSelId] = useState<string | null>(null);
  const rec = records.find((r) => r.id === selId) ?? records[0];

  if (!rec) return <Card><Empty icon={<FileBarChart2 className="h-6 w-6" />} title="لا توجد تقارير بعد" body="شغّلي محاكاة حالة طوارئ لإنشاء أول تقرير." /></Card>;

  const duration = (rec.endedAt - rec.startedAt) / 1000;
  const milestone = (ratio: number) => rec.progress.find((p) => p.safe >= rec.totalPresent * ratio)?.t;
  const m50 = milestone(0.5), m90 = milestone(0.9), m100 = milestone(1);

  const exportCSV = () => {
    const rows: (string | number | undefined)[][] = [
      ['ISTIBAQ | استباق – تقرير حالة طوارئ (بيانات تجريبية)'],
      ['المدرسة', school.name], ['العنوان', rec.title], ['النوع', TYPE_LABEL[rec.type]], ['الخطورة', SEVERITY_LABEL[rec.severity]],
      ['البداية', formatDateTime(rec.startedAt)], ['المدة', formatDuration(duration)], ['محاكاة', rec.simulation ? 'نعم' : 'لا'],
      ['الحاضرات', rec.totalPresent], ['مؤكدة السلامة', rec.confirmedSafe], ['لم يتم التحقق', rec.unverified], ['تحتاج مساعدة/غير موجودة', rec.needsHelp],
      ['أول تأكيد (ث)', rec.firstConfirmationSec], ['انتهاء حركة الإخلاء (ث)', rec.zonesClearedSec], ['50% (ث)', m50], ['90% (ث)', m90], ['100% (ث)', m100],
      [],
      ['الفصل', 'الحاضرات', 'المرصود', 'المؤكدة', 'لم يتحقق', 'مساعدة'],
      ...rec.classes.map((c) => [c.name, c.present, c.observed, c.confirmed, c.unverified, c.help]),
      [],
      ['الوقت', 'الفئة', 'المنفذ', 'الحدث'],
      ...rec.log.map((l) => [formatTime(l.at), l.category, l.actor, l.message]),
    ];
    downloadFile(`istibaq-report-${rec.id}.csv`, toCSV(rows), 'text/csv;charset=utf-8');
  };
  const exportJSON = () => downloadFile(`istibaq-report-${rec.id}.json`, JSON.stringify({ school: school.name, demoData: true, ...rec }, null, 2), 'application/json');

  return (
    <div>
      <PageHeader title="التقارير" icon={<FileBarChart2 className="h-6 w-6" />} subtitle="تقرير زمني لكل حالة طوارئ أو تمرين مع مؤشرات الاستجابة" actions={
        <div className="no-print flex flex-wrap gap-2">
          <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={exportCSV}>CSV / Excel</Button>
          <Button variant="outline" icon={<FileJson className="h-4 w-4" />} onClick={exportJSON}>JSON</Button>
          <Button icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>طباعة / PDF</Button>
        </div>
      } />

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Card className="no-print h-fit" title="السجلات" subtitle={`${records.length} حالة`} padded={false}>
          <ul className="divide-y divide-navy-50">
            {records.map((r) => (
              <li key={r.id}>
                <button onClick={() => setSelId(r.id)} className={cx('w-full px-4 py-3 text-right hover:bg-navy-50/60', rec.id === r.id && 'bg-sky-50/70')}>
                  <div className="flex items-center gap-2">
                    {r.id === 'LIVE' && <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />}
                    <p className="line-clamp-1 flex-1 text-sm font-bold text-navy-900">{r.title}</p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-navy-500">{formatDateTime(r.startedAt)} · {formatDuration((r.endedAt - r.startedAt) / 1000)}</p>
                  <div className="mt-1 flex gap-1.5">
                    <Badge>{TYPE_LABEL[r.type]}</Badge>
                    <Badge className={pct(r.confirmedSafe, r.totalPresent) === 100 ? 'bg-safe-soft text-safe-dark ring-safe/30' : 'bg-warn-soft text-warn-dark ring-warn/30'}>{pct(r.confirmedSafe, r.totalPresent)}% مؤكدة</Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-navy-900/5">
            <div className="mb-4 hidden items-center justify-between border-b border-navy-100 pb-4 print:flex"><Logo /><p className="text-xs text-navy-500">{school.name} · تقرير مولّد من بيانات تجريبية</p></div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-navy-900">{rec.title}</h2>
                <p className="mt-1 text-sm text-navy-500">{formatDateTime(rec.startedAt)} – {formatTime(rec.endedAt)} · {TYPE_LABEL[rec.type]} · خطورة {SEVERITY_LABEL[rec.severity]}</p>
              </div>
              <div className="flex gap-2">{rec.simulation && <Badge className="bg-amber-100 text-amber-800 ring-amber-300">محاكاة / تمرين</Badge>}<DemoBadge /></div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="مدة الحالة" value={<span className="font-mono">{formatDuration(duration)}</span>} icon={<Clock className="h-4 w-4" />} />
            <StatCard label="الحاضرات" value={rec.totalPresent} icon={<Users className="h-4 w-4" />} tone="brand" />
            <StatCard label="تم التحقق من سلامتهن" value={rec.confirmedSafe} icon={<ShieldCheck className="h-4 w-4" />} tone="safe" hint={`${pct(rec.confirmedSafe, rec.totalPresent)}%`} />
            <StatCard label="حالات غير مكتملة" value={rec.unverified + rec.needsHelp} icon={<HelpCircle className="h-4 w-4" />} tone="warn" hint={`${rec.unverified} لم يتحقق · ${rec.needsHelp} مساعدة`} />
          </div>

          <Card title={<span className="flex items-center gap-2"><Timer className="h-5 w-5 text-brand" /> مؤشرات وقت الاستجابة</span>}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                { l: 'أول تأكيد بالاسم', v: rec.firstConfirmationSec },
                { l: 'انتهاء حركة الإخلاء', v: rec.zonesClearedSec },
                { l: 'تأكيد 50%', v: m50 },
                { l: 'تأكيد 90%', v: m90 },
                { l: 'تأكيد 100%', v: m100 },
              ].map((m) => (
                <div key={m.l} className="rounded-xl bg-navy-50/60 p-3 text-center ring-1 ring-navy-100">
                  <p className="font-mono text-xl font-bold text-navy-900">{m.v !== undefined ? formatDuration(m.v) : '—'}</p>
                  <p className="text-[11px] text-navy-500">{m.l}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-navy-500"><LifeBuoy className="h-4 w-4" /> عدد الحالات المفتوحة خلال الحدث: <b className="text-navy-800">{rec.casesOpened}</b></div>
          </Card>

          <Card title="المنحنى الزمني للتحقق">
            <ProgressChart data={rec.progress} height={260} />
          </Card>

          <Card title="نتائج الفصول" padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-navy-50/60 text-xs text-navy-500"><tr><th className="px-4 py-2.5 text-right">الفصل</th><th className="text-center">الحاضرات</th><th className="text-center">المرصود</th><th className="text-center">المؤكدة</th><th className="text-center">لم يتحقق</th><th className="text-center">مساعدة</th><th className="text-center">النتيجة</th></tr></thead>
                <tbody className="divide-y divide-navy-50">
                  {rec.classes.map((c) => (
                    <tr key={c.classId}>
                      <td className="px-4 py-2 font-bold">{c.name}</td>
                      <td className="text-center tabular-nums">{c.present}</td>
                      <td className="text-center tabular-nums">{c.observed}</td>
                      <td className="text-center font-bold tabular-nums text-safe-dark">{c.confirmed}</td>
                      <td className={cx('text-center tabular-nums', c.unverified && 'font-bold text-warn-dark')}>{c.unverified}</td>
                      <td className={cx('text-center tabular-nums', c.help && 'font-bold text-danger')}>{c.help}</td>
                      <td className="text-center">{c.confirmed === c.present ? <Badge className="bg-safe-soft text-safe-dark ring-safe/30">مكتمل</Badge> : <Badge className="bg-warn-soft text-warn-dark ring-warn/30">غير مكتمل</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title={<span className="flex items-center gap-2"><Activity className="h-5 w-5 text-brand" /> التسلسل الزمني للأحداث</span>} subtitle={`${rec.log.length} حدث`} className="print-break">
            <ol className="relative max-h-[520px] space-y-3 overflow-y-auto border-r-2 border-navy-100 pr-5 print:max-h-none">
              {rec.log.map((l) => (
                <li key={l.id} className="relative">
                  <span className={cx('absolute -right-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white', { info: 'bg-brand', success: 'bg-safe', warning: 'bg-warn', critical: 'bg-danger' }[l.level])} />
                  <p className="text-sm text-navy-800">{l.message}</p>
                  <p className="text-[11px] text-navy-400"><span className="font-mono">+{formatDuration((l.at - rec.startedAt) / 1000)}</span> · {formatTime(l.at)} · {l.actor}</p>
                </li>
              ))}
            </ol>
          </Card>

          {history.length > 1 && (
            <Card title="مقارنة الحالات والتمارين" className="no-print">
              <div dir="ltr" style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...records].reverse().map((r) => ({ name: formatDateTime(r.startedAt).split('،')[0], duration: Math.round((r.endedAt - r.startedAt) / 1000), pct: pct(r.confirmedSafe, r.totalPresent) }))} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke={C.grid} vertical={false} />
                    <XAxis dataKey="name" reversed stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v: number, n: string) => [n === 'pct' ? `${v}%` : `${v} ث`, n === 'pct' ? 'نسبة التحقق' : 'المدة']} />
                    <Legend formatter={(v) => <span className="text-xs text-navy-700">{v === 'pct' ? 'نسبة التحقق %' : 'المدة (ثانية)'}</span>} />
                    <Bar dataKey="pct" fill={C.safe} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-navy-500"><Siren className="ml-1 inline h-3.5 w-3.5" />يساعد التحليل المقارن على قياس تحسن زمن الاستجابة بين التمارين الدورية.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
