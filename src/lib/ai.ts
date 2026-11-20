import type { AIAnalysis, EmergencyType, SafetyProcedure, Severity, Zone } from '@/types';

/**
 * محرك تحليل الإنذارات – نموذج محاكاة قائم على القواعد (Rule-based NLP).
 * - يطبّع النص العربي (إزالة التشكيل وتوحيد الهمزات والتاء المربوطة).
 * - يطابق المصطلحات بالأطول أولًا حتى لا تُحتسب "نار" داخل "إطلاق نار".
 * - يحسب درجة لكل نوع خطر ونسبة ثقة ومستوى خطورة.
 * - لا يولّد أي تعليمات: يختار فقط إجراءً من مكتبة الإجراءات المعتمدة مسبقًا.
 */

export function normalizeArabic(input: string): string {
  return input
    .replace(/[ً-ْٰـ]/g, '') // tashkeel + tatweel
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^؀-ۿa-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

interface Term { term: string; type: EmergencyType | 'severity'; weight: number }

const RAW_TERMS: Term[] = [
  // fire
  { term: 'حريق', type: 'fire', weight: 5 }, { term: 'حرائق', type: 'fire', weight: 5 }, { term: 'نار', type: 'fire', weight: 3 },
  { term: 'دخان', type: 'fire', weight: 4 }, { term: 'كاشف الدخان', type: 'fire', weight: 5 }, { term: 'اشتعال', type: 'fire', weight: 4 },
  { term: 'لهب', type: 'fire', weight: 4 }, { term: 'احتراق', type: 'fire', weight: 4 }, { term: 'رائحه احتراق', type: 'fire', weight: 5 },
  { term: 'ماس كهربائي', type: 'fire', weight: 3 }, { term: 'حراره مرتفعه', type: 'fire', weight: 2 }, { term: 'شراره', type: 'fire', weight: 2 },
  // external threat
  { term: 'تهديد', type: 'external_threat', weight: 5 }, { term: 'مسلح', type: 'external_threat', weight: 6 }, { term: 'اقتحام', type: 'external_threat', weight: 6 },
  { term: 'شخص مشبوه', type: 'external_threat', weight: 6 }, { term: 'مشبوه', type: 'external_threat', weight: 4 }, { term: 'جسم مشبوه', type: 'external_threat', weight: 6 },
  { term: 'اطلاق نار', type: 'external_threat', weight: 7 }, { term: 'عبوه', type: 'external_threat', weight: 5 }, { term: 'متسلل', type: 'external_threat', weight: 5 },
  { term: 'اغلاق الابواب', type: 'external_threat', weight: 4 }, { term: 'داخل الفصول', type: 'external_threat', weight: 2 }, { term: 'البوابه', type: 'external_threat', weight: 1 },
  { term: 'شغب', type: 'external_threat', weight: 4 }, { term: 'ايواء', type: 'external_threat', weight: 3 },
  // evacuation (non-fire hazards)
  { term: 'اخلاء', type: 'evacuation', weight: 3 }, { term: 'مغادره المبني', type: 'evacuation', weight: 3 }, { term: 'تسرب غاز', type: 'evacuation', weight: 6 },
  { term: 'غاز', type: 'evacuation', weight: 3 }, { term: 'زلزال', type: 'evacuation', weight: 6 }, { term: 'هزه ارضيه', type: 'evacuation', weight: 6 },
  { term: 'تصدع', type: 'evacuation', weight: 5 }, { term: 'انهيار', type: 'evacuation', weight: 5 }, { term: 'تسرب مياه', type: 'evacuation', weight: 3 },
  { term: 'سيول', type: 'evacuation', weight: 5 }, { term: 'انقطاع الكهرباء', type: 'evacuation', weight: 2 }, { term: 'مواد كيميائيه', type: 'evacuation', weight: 4 },
  // medical
  { term: 'اغماء', type: 'medical', weight: 6 }, { term: 'اصابه', type: 'medical', weight: 4 }, { term: 'نزيف', type: 'medical', weight: 6 },
  { term: 'ربو', type: 'medical', weight: 5 }, { term: 'اختناق', type: 'medical', weight: 5 }, { term: 'تشنج', type: 'medical', weight: 6 },
  { term: 'سقوط', type: 'medical', weight: 3 }, { term: 'كسر', type: 'medical', weight: 4 }, { term: 'حساسيه', type: 'medical', weight: 4 },
  { term: 'صعوبه في التنفس', type: 'medical', weight: 6 }, { term: 'فقدان الوعي', type: 'medical', weight: 7 }, { term: 'المسؤوله الصحيه', type: 'medical', weight: 3 },
  { term: 'اسعاف', type: 'medical', weight: 3 }, { term: 'حاله صحيه', type: 'medical', weight: 5 },
  // severity modifiers
  { term: 'عاجل', type: 'severity', weight: 2 }, { term: 'فوري', type: 'severity', weight: 2 }, { term: 'الفوري', type: 'severity', weight: 2 },
  { term: 'كثيف', type: 'severity', weight: 2 }, { term: 'انتشار', type: 'severity', weight: 2 }, { term: 'خطير', type: 'severity', weight: 2 },
  { term: 'محاصر', type: 'severity', weight: 3 }, { term: 'عدد كبير', type: 'severity', weight: 2 }, { term: 'اصابات', type: 'severity', weight: 3 },
  { term: 'بسيط', type: 'severity', weight: -2 }, { term: 'محدود', type: 'severity', weight: -2 }, { term: 'تمت السيطره', type: 'severity', weight: -3 },
];

const TERMS = RAW_TERMS.map((t) => ({ ...t, norm: normalizeArabic(t.term) })).sort((a, b) => b.norm.length - a.norm.length);

const BASE_SEVERITY: Record<EmergencyType, number> = { fire: 3, external_threat: 3, evacuation: 2, medical: 1 };
const TYPE_TO_PROCEDURE: Record<EmergencyType, string> = {
  fire: 'PR-FIRE', external_threat: 'PR-THREAT', evacuation: 'PR-EVAC', medical: 'PR-MED',
};

export function analyzeAlert(text: string, zones: Zone[], procedures: SafetyProcedure[]): AIAnalysis {
  let hay = ` ${normalizeArabic(text)} `;
  const matched: AIAnalysis['matched'] = [];
  const scores: Record<EmergencyType, number> = { fire: 0, external_threat: 0, evacuation: 0, medical: 0 };
  let sevMod = 0;

  for (const t of TERMS) {
    // match as whole word-ish with optional Arabic prefixes (ال، و، ب، ل)
    const re = new RegExp(`(^|\\s)(و|ب|ل|ف)?(ال)?${escapeRe(t.norm)}(ا|ه|ات|ين)?(?=\\s|$)`, 'g');
    if (re.test(hay)) {
      hay = hay.replace(re, ' ');
      matched.push({ term: t.term, type: t.type, weight: t.weight });
      if (t.type === 'severity') sevMod += t.weight;
      else scores[t.type] += t.weight;
    }
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const sorted = (Object.entries(scores) as [EmergencyType, number][]).sort((a, b) => b[1] - a[1]);
  const [topType, topScore] = sorted[0];
  const second = sorted[1][1];
  const type: EmergencyType = total === 0 ? 'evacuation' : topType;

  let confidence = 0;
  if (total > 0) {
    const dominance = topScore / total; // 0.25..1
    const strength = Math.min(1, topScore / 10);
    confidence = Math.round((0.55 * dominance + 0.45 * strength) * 100);
    if (topScore === second) confidence = Math.min(confidence, 50);
  }

  // location detection
  const normText = normalizeArabic(text);
  let location: string | undefined;
  let best = 0;
  for (const z of zones) {
    const zn = normalizeArabic(z.name.replace('فصل ', ''));
    if (zn.length > best && normText.includes(zn)) { location = z.name; best = zn.length; }
  }
  if (!location) {
    const m = text.match(/الطابق\s+(الأرضي|الأول|الثاني)/);
    if (m) location = m[0];
  }

  let sevScore = BASE_SEVERITY[type] + Math.sign(sevMod) * Math.min(2, Math.ceil(Math.abs(sevMod) / 2));
  if (topScore >= 12) sevScore += 1;
  sevScore = Math.max(1, Math.min(4, sevScore));
  const severity: Severity = (['low', 'medium', 'high', 'critical'] as Severity[])[sevScore - 1];

  const procedureId = procedures.find((p) => p.id === TYPE_TO_PROCEDURE[type])?.id ?? procedures.find((p) => p.type === type)?.id ?? procedures[0].id;

  const reasoning: string[] = [];
  if (total === 0) {
    reasoning.push('لم يتم العثور على مصطلحات معروفة في النص؛ تم اقتراح "إخلاء" كخيار احترازي ويلزم تصنيف يدوي.');
  } else {
    reasoning.push(`أعلى درجة لنوع "${TYPE_LABEL[type]}" (${topScore} نقطة من أصل ${total}).`);
    const kw = matched.filter((m) => m.type === type).map((m) => m.term);
    if (kw.length) reasoning.push(`مصطلحات دالة: ${kw.join('، ')}.`);
    if (sevMod !== 0) reasoning.push(`معدّلات الخطورة ${sevMod > 0 ? 'رفعت' : 'خفّضت'} المستوى (${matched.filter((m) => m.type === 'severity').map((m) => m.term).join('، ')}).`);
    if (location) reasoning.push(`تم تحديد الموقع المحتمل: ${location}.`);
    reasoning.push(`تم اختيار الإجراء من المكتبة المعتمدة: ${procedures.find((p) => p.id === procedureId)?.title ?? procedureId}.`);
  }

  return {
    type, confidence, severity, scores, matched, location, procedureId, reasoning,
    requiresHumanReview: confidence < 60 || total === 0,
  };
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const TYPE_LABEL: Record<EmergencyType, string> = {
  fire: 'حريق', external_threat: 'تهديد خارجي', evacuation: 'إخلاء', medical: 'حالة طارئة صحية',
};
