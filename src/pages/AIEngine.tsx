import { useMemo, useState } from 'react';
import { BrainCircuit, Wand2, ShieldCheck, ListChecks, Sparkles, BookCheck, CheckCircle2, XCircle, Send, Lock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { analyzeAlert, normalizeArabic, TYPE_LABEL } from '@/lib/ai';
import { Badge, Button, Card, cx, DemoBadge, inputCls, PageHeader, Progress } from '@/components/ui';
import { HBars } from '@/components/charts';
import { SEVERITY_LABEL, SEVERITY_STYLE } from '@/lib/labels';
import type { EmergencyType } from '@/types';
import { useNavigate } from 'react-router-dom';

const TYPE_COLOR: Record<EmergencyType, string> = { fire: '#dc2f2f', external_threat: '#6250d6', evacuation: '#e09100', medical: '#2a78d6' };

const SAMPLES: { text: string; expected: EmergencyType }[] = [
  { text: 'دخان كثيف يخرج من غرفة الكهرباء بجانب المقصف', expected: 'fire' },
  { text: 'اشتعال في سلة المهملات داخل فصل 3/2', expected: 'fire' },
  { text: 'شخص مشبوه يتجول قرب السور الخارجي ويحاول الدخول', expected: 'external_threat' },
  { text: 'بلاغ عن جسم مشبوه عند البوابة الرئيسية', expected: 'external_threat' },
  { text: 'هزة أرضية خفيفة وتصدع في جدار الطابق الثاني', expected: 'evacuation' },
  { text: 'تسرب غاز من مختبر العلوم مطلوب مغادرة المبنى', expected: 'evacuation' },
  { text: 'طالبة سقطت على الدرج ولديها نزيف في الرأس', expected: 'medical' },
  { text: 'نوبة ربو حادة لطالبة في مركز مصادر التعلم', expected: 'medical' },
  { text: 'إطلاق نار قريب من المدرسة، أبقوا الطالبات داخل الفصول', expected: 'external_threat' },
  { text: 'رائحة احتراق من جهاز العرض في قاعة النشاط', expected: 'fire' },
];

export default function AIEngine() {
  const zones = useStore((s) => s.zones);
  const procedures = useStore((s) => s.procedures);
  const receiveAlert = useStore((s) => s.receiveAlert);
  const user = useStore((s) => s.user)!;
  const nav = useNavigate();
  const [text, setText] = useState('عاجل: دخان كثيف ورائحة احتراق في مختبر العلوم بالطابق الأول');
  const a = useMemo(() => analyzeAlert(text, zones, procedures), [text, zones, procedures]);
  const proc = procedures.find((p) => p.id === a.procedureId);
  const norm = normalizeArabic(text);

  const bench = useMemo(() => SAMPLES.map((s) => ({ ...s, got: analyzeAlert(s.text, zones, procedures) })), [zones, procedures]);
  const accuracy = Math.round((bench.filter((b) => b.got.type === b.expected).length / bench.length) * 100);

  const highlighted = useMemo(() => {
    let parts: (string | { t: string; type: string })[] = [text];
    for (const m of a.matched) {
      const next: typeof parts = [];
      for (const p of parts) {
        if (typeof p !== 'string') { next.push(p); continue; }
        const idx = p.indexOf(m.term);
        if (idx < 0) { next.push(p); continue; }
        next.push(p.slice(0, idx), { t: m.term, type: m.type }, p.slice(idx + m.term.length));
      }
      parts = next;
    }
    return parts;
  }, [text, a.matched]);

  return (
    <div>
      <PageHeader title="محرك الذكاء الاصطناعي" icon={<BrainCircuit className="h-6 w-6" />} subtitle="نموذج محاكاة لتحليل نص الإنذار وتصنيفه واقتراح الإجراء من مكتبة معتمدة مسبقًا" actions={<DemoBadge>نموذج محاكاة قائم على القواعد</DemoBadge>} />

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        {[
          { n: 1, t: 'تطبيع النص العربي', d: 'إزالة التشكيل وتوحيد الهمزات' },
          { n: 2, t: 'مطابقة المصطلحات', d: 'قاموس أوزان – الأطول أولًا' },
          { n: 3, t: 'حساب الدرجات', d: 'درجة لكل نوع ونسبة ثقة' },
          { n: 4, t: 'تقدير الخطورة', d: 'نوع الخطر + معدّلات الشدة' },
          { n: 5, t: 'استرجاع الإجراء', d: 'من المكتبة المعتمدة فقط' },
        ].map((s, i) => (
          <div key={s.n} className="relative rounded-2xl bg-white p-4 shadow-card ring-1 ring-navy-900/5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-800 text-sm font-bold text-white">{s.n}</span>
            <p className="mt-2 text-sm font-bold text-navy-900">{s.t}</p>
            <p className="text-xs text-navy-500">{s.d}</p>
            {i < 4 && <span className="absolute -left-3 top-1/2 hidden -translate-y-1/2 text-navy-300 md:block">◀</span>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card title={<span className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-brand" /> مختبر التحليل المباشر</span>} subtitle="اكتبي أي نص إنذار وشاهدي التحليل لحظيًا">
            <textarea className={cx(inputCls, 'min-h-[100px] text-base')} value={text} onChange={(e) => setText(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SAMPLES.slice(0, 6).map((s) => (
                <button key={s.text} onClick={() => setText(s.text)} className="rounded-lg bg-navy-50 px-2 py-1 text-[11px] text-navy-700 hover:bg-navy-100">{s.text.slice(0, 30)}…</button>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-navy-50/60 p-3 text-sm leading-loose text-navy-800">
              <p className="mb-1 text-[11px] font-semibold text-navy-500">المصطلحات المكتشفة في النص:</p>
              {highlighted.map((p, i) => typeof p === 'string' ? <span key={i}>{p}</span> : (
                <mark key={i} className="rounded px-1 font-bold" style={{ background: p.type === 'severity' ? '#fde68a' : `${TYPE_COLOR[p.type as EmergencyType]}22`, color: p.type === 'severity' ? '#92400e' : TYPE_COLOR[p.type as EmergencyType] }}>{p.t}</mark>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-navy-400" dir="rtl">النص بعد التطبيع: <span className="font-mono">{norm || '—'}</span></p>
          </Card>

          <Card title="درجات التصنيف حسب نوع الخطر">
            <HBars data={(Object.keys(a.scores) as EmergencyType[]).map((k) => ({ name: TYPE_LABEL[k], value: a.scores[k], color: TYPE_COLOR[k] }))} height={190} />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.matched.map((m) => (
                <Badge key={m.term} className={m.type === 'severity' ? 'bg-amber-100 text-amber-800 ring-amber-300' : 'bg-navy-50 text-navy-700 ring-navy-200'}>
                  {m.term} <span className="opacity-60">{m.weight > 0 ? `+${m.weight}` : m.weight}</span>
                </Badge>
              ))}
              {a.matched.length === 0 && <span className="text-xs text-navy-400">لا توجد مصطلحات مطابقة</span>}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={<span className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-brand" /> نتيجة التحليل</span>}>
            <div className="flex items-center gap-4">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#eef3fb" strokeWidth="10" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={TYPE_COLOR[a.type]} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(a.confidence / 100) * 264} 264`} className="transition-all duration-500" />
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div><p className="font-display text-2xl font-extrabold text-navy-900">{a.confidence}%</p><p className="text-[10px] text-navy-500">ثقة</p></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-navy-500">التصنيف المقترح</p>
                <p className="font-display text-2xl font-extrabold" style={{ color: TYPE_COLOR[a.type] }}>{TYPE_LABEL[a.type]}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge className={SEVERITY_STYLE[a.severity]}>خطورة {SEVERITY_LABEL[a.severity]}</Badge>
                  {a.location && <Badge>📍 {a.location}</Badge>}
                  {a.requiresHumanReview ? <Badge className="bg-warn-soft text-warn-dark ring-warn/30">يتطلب مراجعة بشرية</Badge> : <Badge className="bg-safe-soft text-safe-dark ring-safe/30">ثقة كافية</Badge>}
                </div>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-navy-700">
              {a.reasoning.map((r, i) => <li key={i} className="flex gap-2"><span className="text-brand">◂</span>{r}</li>)}
            </ul>
            {user.role !== 'teacher' && (
              <Button className="mt-4 w-full" variant="secondary" icon={<Send className="h-4 w-4" />} onClick={() => { receiveAlert({ text, source: 'manual', sourceLabel: `محرك التحليل – ${user.name}` }); nav('/alerts'); }}>
                إرسال إلى مركز الإنذارات
              </Button>
            )}
          </Card>

          {proc && (
            <Card title={<span className="flex items-center gap-2"><BookCheck className="h-5 w-5 text-safe-dark" /> الإجراء المسترجع</span>} subtitle={proc.title}>
              <ol className="list-inside list-decimal space-y-1 text-sm text-navy-700 marker:font-bold marker:text-navy-400">
                {proc.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              <p className="mt-3 text-[11px] text-navy-400">{proc.source}</p>
            </Card>
          )}

          <Card title={<span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-safe-dark" /> ضوابط الاستخدام المسؤول</span>}>
            <ul className="space-y-2 text-sm text-navy-700">
              {[
                'لا يولّد المحرك أي تعليمات أمنية أو رسمية؛ يسترجع فقط من مكتبة الإجراءات المعتمدة.',
                'عند انخفاض الثقة عن 60% يُطلب تأكيد بشري قبل التفعيل.',
                'قرار تفعيل الطوارئ بيد قائدة المدرسة أو مسؤولة السلامة دائمًا.',
                'جميع التصنيفات والتعديلات اليدوية تُسجل في السجل الزمني.',
              ].map((t) => <li key={t} className="flex gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />{t}</li>)}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="mt-6" title={<span className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-brand" /> اختبار دقة النموذج على عينة تجريبية</span>} subtitle={`${bench.length} نصوص معنونة مسبقًا – الدقة الحالية ${accuracy}%`} action={<div className="w-40"><Progress value={accuracy} tone={accuracy >= 80 ? 'safe' : 'warn'} /></div>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-xs text-navy-500">
              <tr className="border-b border-navy-50"><th className="py-2 text-right font-semibold">النص</th><th className="text-right font-semibold">المتوقع</th><th className="text-right font-semibold">نتيجة النموذج</th><th className="text-right font-semibold">الثقة</th><th className="text-right font-semibold">الخطورة</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {bench.map((b) => (
                <tr key={b.text} className="cursor-pointer hover:bg-navy-50/50" onClick={() => setText(b.text)}>
                  <td className="py-2 pl-3 text-navy-800">{b.text}</td>
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
