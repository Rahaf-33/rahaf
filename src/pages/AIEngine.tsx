import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Wand2, ShieldCheck, ListChecks, Sparkles, BookCheck, CheckCircle2, XCircle, Send, Lock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { analyzeAlert, normalizeArabic } from '@/lib/ai';
import { TYPE_LABEL } from '@/lib/labels';
import { Badge, Button, Card, cx, DemoBadge, inputCls, PageHeader, Progress } from '@/components/ui';
import { HBars } from '@/components/charts';
import { SEVERITY_LABEL, SEVERITY_STYLE } from '@/lib/labels';
import type { EmergencyType } from '@/types';
import { useNavigate } from 'react-router-dom';
import { bi, useI18n } from '@/i18n';

const TYPE_COLOR: Record<EmergencyType, string> = { fire: '#dc2f2f', external_threat: '#6250d6', evacuation: '#e09100', medical: '#2a78d6' };

const SAMPLES: { text: string; textEn: string; expected: EmergencyType }[] = [
  { text: 'دخان كثيف يخرج من غرفة الكهرباء بجانب المقصف', textEn: "Heavy smoke coming out of the electrical room next to the cafeteria", expected: 'fire' },
  { text: 'اشتعال في سلة المهملات داخل فصل 3/2', textEn: "A fire started in a trash bin inside class 3/2", expected: 'fire' },
  { text: 'شخص مشبوه يتجول قرب السور الخارجي ويحاول الدخول', textEn: "A suspicious person is wandering near the outer fence and trying to get in", expected: 'external_threat' },
  { text: 'بلاغ عن جسم مشبوه عند البوابة الرئيسية', textEn: "Report of a suspicious object at the main gate", expected: 'external_threat' },
  { text: 'هزة أرضية خفيفة وتصدع في جدار الطابق الثاني', textEn: "A light tremor and a crack in a wall on the Second Floor", expected: 'evacuation' },
  { text: 'تسرب غاز من مختبر العلوم مطلوب مغادرة المبنى', textEn: "Gas leak from the Science Lab, everyone must leave the building", expected: 'evacuation' },
  { text: 'طالبة سقطت على الدرج ولديها نزيف في الرأس', textEn: "A student fell on the stairs and has bleeding on her head", expected: 'medical' },
  { text: 'نوبة ربو حادة لطالبة في مركز مصادر التعلم', textEn: "Severe asthma attack for a student in the Learning Resource Center", expected: 'medical' },
  { text: 'إطلاق نار قريب من المدرسة، أبقوا الطالبات داخل الفصول', textEn: "Gunshots near the school, keep students inside classrooms", expected: 'external_threat' },
  { text: 'رائحة احتراق من جهاز العرض في قاعة النشاط', textEn: "Burning smell from the projector in the Activity Hall", expected: 'fire' },
];

export default function AIEngine() {
  const { tr, tx, n, isEn } = useI18n();
  const zones = useStore((s) => s.zones);
  const procedures = useStore((s) => s.procedures);
  const receiveAlert = useStore((s) => s.receiveAlert);
  const user = useStore((s) => s.user)!;
  const nav = useNavigate();
  const defaultText = tr('عاجل: دخان كثيف ورائحة احتراق في مختبر العلوم بالطابق الأول');
  const [text, setText] = useState(defaultText);
  useEffect(() => setText(defaultText), [defaultText]);
  const samples = useMemo(() => SAMPLES.map((s) => ({ text: isEn ? s.textEn : s.text, expected: s.expected })), [isEn]);
  const a = useMemo(() => analyzeAlert(text, zones, procedures), [text, zones, procedures]);
  const proc = procedures.find((p) => p.id === a.procedureId);
  const norm = normalizeArabic(text);

  const bench = useMemo(() => samples.map((s) => ({ ...s, got: analyzeAlert(s.text, zones, procedures) })), [samples, zones, procedures]);
  const accuracy = Math.round((bench.filter((b) => b.got.type === b.expected).length / bench.length) * 100);

  const highlighted = useMemo(() => {
    let parts: (string | { t: string; type: string })[] = [text];
    for (const m of a.matched) {
      const next: typeof parts = [];
      for (const p of parts) {
        if (typeof p !== 'string') { next.push(p); continue; }
        const idx = p.toLowerCase().indexOf(m.term.toLowerCase());
        if (idx < 0) { next.push(p); continue; }
        next.push(p.slice(0, idx), { t: p.slice(idx, idx + m.term.length), type: m.type }, p.slice(idx + m.term.length));
      }
      parts = next;
    }
    return parts;
  }, [text, a.matched]);

  return (
    <div>
      <PageHeader title={tr('محرك الذكاء الاصطناعي')} icon={<BrainCircuit className="h-6 w-6" />} subtitle={tr('نموذج محاكاة لتحليل نص الإنذار وتصنيفه واقتراح الإجراء من مكتبة معتمدة مسبقًا')} actions={<DemoBadge>{tr('نموذج محاكاة قائم على القواعد')}</DemoBadge>} />

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        {[
          { n: 1, t: tr('تطبيع النص العربي'), d: tr('إزالة التشكيل وتوحيد الهمزات') },
          { n: 2, t: tr('مطابقة المصطلحات'), d: tr('قاموس أوزان – الأطول أولًا') },
          { n: 3, t: tr('حساب الدرجات'), d: tr('درجة لكل نوع ونسبة ثقة') },
          { n: 4, t: tr('تقدير الخطورة'), d: tr('نوع الخطر + معدّلات الشدة') },
          { n: 5, t: tr('استرجاع الإجراء'), d: tr('من المكتبة المعتمدة فقط') },
        ].map((s, i) => (
          <div key={s.n} className="relative rounded-2xl bg-white p-4 shadow-card ring-1 ring-navy-900/5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-800 text-sm font-bold text-white">{s.n}</span>
            <p className="mt-2 text-sm font-bold text-navy-900">{s.t}</p>
            <p className="text-xs text-navy-500">{s.d}</p>
            {i < 4 && <span className="absolute -end-3 top-1/2 hidden -translate-y-1/2 text-navy-300 md:block">◀</span>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card title={<span className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-brand" /> {tr('مختبر التحليل المباشر')}</span>} subtitle={tr('اكتبي أي نص إنذار وشاهدي التحليل لحظيًا')}>
            <textarea className={cx(inputCls, 'min-h-[100px] text-base')} value={text} onChange={(e) => setText(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {samples.slice(0, 6).map((s) => (
                <button key={s.text} onClick={() => setText(s.text)} className="rounded-lg bg-navy-50 px-2 py-1 text-[11px] text-navy-700 hover:bg-navy-100">{s.text.slice(0, 30)}…</button>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-navy-50/60 p-3 text-sm leading-loose text-navy-800">
              <p className="mb-1 text-[11px] font-semibold text-navy-500">{tr('المصطلحات المكتشفة في النص:')}</p>
              {highlighted.map((p, i) => typeof p === 'string' ? <span key={i}>{p}</span> : (
                <mark key={i} className="rounded px-1 font-bold" style={{ background: p.type === 'severity' ? '#fde68a' : `${TYPE_COLOR[p.type as EmergencyType]}22`, color: p.type === 'severity' ? '#92400e' : TYPE_COLOR[p.type as EmergencyType] }}>{p.t}</mark>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-navy-400" dir="rtl">{tr('النص بعد التطبيع:')} <span className="font-mono">{norm || '—'}</span></p>
          </Card>

          <Card title={tr('درجات التصنيف حسب نوع الخطر')}>
            <HBars data={(Object.keys(a.scores) as EmergencyType[]).map((k) => ({ name: TYPE_LABEL[k], value: a.scores[k], color: TYPE_COLOR[k] }))} height={190} />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.matched.map((m) => (
                <Badge key={m.term} className={m.type === 'severity' ? 'bg-amber-100 text-amber-800 ring-amber-300' : 'bg-navy-50 text-navy-700 ring-navy-200'}>
                  {m.term} <span className="opacity-60">{m.weight > 0 ? `+${m.weight}` : m.weight}</span>
                </Badge>
              ))}
              {a.matched.length === 0 && <span className="text-xs text-navy-400">{tr('لا توجد مصطلحات مطابقة')}</span>}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={<span className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-brand" /> {tr('نتيجة التحليل')}</span>}>
            <div className="flex items-center gap-4">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#eef3fb" strokeWidth="10" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={TYPE_COLOR[a.type]} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(a.confidence / 100) * 264} 264`} className="transition-all duration-500" />
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div><p className="font-display text-2xl font-extrabold text-navy-900">{a.confidence}%</p><p className="text-[10px] text-navy-500">{tr('ثقة')}</p></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-navy-500">{tr('التصنيف المقترح')}</p>
                <p className="font-display text-2xl font-extrabold" style={{ color: TYPE_COLOR[a.type] }}>{TYPE_LABEL[a.type]}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge className={SEVERITY_STYLE[a.severity]}>{tr('خطورة')} {SEVERITY_LABEL[a.severity]}</Badge>
                  {a.location && <Badge>📍 {tx(a.location)}</Badge>}
                  {a.requiresHumanReview ? <Badge className="bg-warn-soft text-warn-dark ring-warn/30">{tr('يتطلب مراجعة بشرية')}</Badge> : <Badge className="bg-safe-soft text-safe-dark ring-safe/30">{tr('ثقة كافية')}</Badge>}
                </div>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-navy-700">
              {a.reasoning.map((r, i) => <li key={i} className="flex gap-2"><span className="text-brand">◂</span>{tx(r)}</li>)}
            </ul>
            {user.role !== 'teacher' && (
              <Button className="mt-4 w-full" variant="secondary" icon={<Send className="h-4 w-4" />} onClick={() => { receiveAlert({ text, source: 'manual', sourceLabel: bi(`محرك التحليل – ${user.name}`, `Analysis engine – ${user.nameEn ?? user.name}`) }); nav('/alerts'); }}>
                {tr('إرسال إلى مركز الإنذارات')}
              </Button>
            )}
          </Card>

          {proc && (
            <Card title={<span className="flex items-center gap-2"><BookCheck className="h-5 w-5 text-safe-dark" /> {tr('الإجراء المسترجع')}</span>} subtitle={n(proc, 'title')}>
              <ol className="list-inside list-decimal space-y-1 text-sm text-navy-700 marker:font-bold marker:text-navy-400">
                {(isEn && proc.stepsEn?.length ? proc.stepsEn : proc.steps).map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              <p className="mt-3 text-[11px] text-navy-400">{tr(proc.source)}</p>
            </Card>
          )}

          <Card title={<span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-safe-dark" /> {tr('ضوابط الاستخدام المسؤول')}</span>}>
            <ul className="space-y-2 text-sm text-navy-700">
              {[
                tr('لا يولّد المحرك أي تعليمات أمنية أو رسمية؛ يسترجع فقط من مكتبة الإجراءات المعتمدة.'),
                tr('عند انخفاض الثقة عن 60% يُطلب تأكيد بشري قبل التفعيل.'),
                tr('قرار تفعيل الطوارئ بيد قائدة المدرسة أو مسؤولة السلامة دائمًا.'),
                tr('جميع التصنيفات والتعديلات اليدوية تُسجل في السجل الزمني.'),
              ].map((t) => <li key={t} className="flex gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />{t}</li>)}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="mt-6" title={<span className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-brand" /> {tr('اختبار دقة النموذج على عينة تجريبية')}</span>} subtitle={tr('{n} نصوص معنونة مسبقًا – الدقة الحالية {acc}%', { n: bench.length, acc: accuracy })} action={<div className="w-40"><Progress value={accuracy} tone={accuracy >= 80 ? 'safe' : 'warn'} /></div>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-xs text-navy-500">
              <tr className="border-b border-navy-50"><th className="py-2 text-start font-semibold">{tr('النص')}</th><th className="text-start font-semibold">{tr('المتوقع')}</th><th className="text-start font-semibold">{tr('نتيجة النموذج')}</th><th className="text-start font-semibold">{tr('الثقة')}</th><th className="text-start font-semibold">{tr('الخطورة')}</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {bench.map((b) => (
                <tr key={b.text} className="cursor-pointer hover:bg-navy-50/50" onClick={() => setText(b.text)}>
                  <td className="py-2 pe-3 text-navy-800">{b.text}</td>
                  <td className="whitespace-nowrap">{TYPE_LABEL[b.expected]}</td>
                  <td className="whitespace-nowrap font-semibold" style={{ color: TYPE_COLOR[b.got.type] }}>{TYPE_LABEL[b.got.type]}</td>
                  <td className="tabular-nums">{b.got.confidence}%</td>
                  <td><Badge className={SEVERITY_STYLE[b.got.severity]}>{SEVERITY_LABEL[b.got.severity]}</Badge></td>
                  <td>{b.got.type === b.expected ? <CheckCircle2 className="h-5 w-5 text-safe" /> : <XCircle className="h-5 w-5 text-danger" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
