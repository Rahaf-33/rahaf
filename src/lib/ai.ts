import type { AIAnalysis, EmergencyType, SafetyProcedure, Severity, Zone, Text } from '@/types';
import { bi } from '@/i18n/core';

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
  // English vocabulary
  { term: 'fire', type: 'fire', weight: 5 }, { term: 'smoke', type: 'fire', weight: 4 }, { term: 'smoke detector', type: 'fire', weight: 5 }, { term: 'flames', type: 'fire', weight: 4 },
  { term: 'burning', type: 'fire', weight: 4 }, { term: 'burning smell', type: 'fire', weight: 5 }, { term: 'short circuit', type: 'fire', weight: 3 }, { term: 'sparks', type: 'fire', weight: 2 },
  { term: 'threat', type: 'external_threat', weight: 5 }, { term: 'armed', type: 'external_threat', weight: 6 }, { term: 'intruder', type: 'external_threat', weight: 6 },
  { term: 'suspicious person', type: 'external_threat', weight: 6 }, { term: 'suspicious', type: 'external_threat', weight: 4 }, { term: 'suspicious object', type: 'external_threat', weight: 6 },
  { term: 'gunshots', type: 'external_threat', weight: 7 }, { term: 'shooting', type: 'external_threat', weight: 7 }, { term: 'lock the doors', type: 'external_threat', weight: 4 },
  { term: 'inside classrooms', type: 'external_threat', weight: 2 }, { term: 'lockdown', type: 'external_threat', weight: 5 }, { term: 'gate', type: 'external_threat', weight: 1 },
  { term: 'evacuate', type: 'evacuation', weight: 3 }, { term: 'evacuation', type: 'evacuation', weight: 3 }, { term: 'leave the building', type: 'evacuation', weight: 3 },
  { term: 'gas leak', type: 'evacuation', weight: 6 }, { term: 'gas', type: 'evacuation', weight: 3 }, { term: 'earthquake', type: 'evacuation', weight: 6 }, { term: 'tremor', type: 'evacuation', weight: 5 },
  { term: 'crack', type: 'evacuation', weight: 5 }, { term: 'collapse', type: 'evacuation', weight: 5 }, { term: 'flood', type: 'evacuation', weight: 5 }, { term: 'chemicals', type: 'evacuation', weight: 4 },
  { term: 'fainted', type: 'medical', weight: 6 }, { term: 'fainting', type: 'medical', weight: 6 }, { term: 'injury', type: 'medical', weight: 4 }, { term: 'injured', type: 'medical', weight: 4 },
  { term: 'bleeding', type: 'medical', weight: 6 }, { term: 'asthma', type: 'medical', weight: 5 }, { term: 'choking', type: 'medical', weight: 5 }, { term: 'seizure', type: 'medical', weight: 6 },
  { term: 'fell', type: 'medical', weight: 3 }, { term: 'fracture', type: 'medical', weight: 4 }, { term: 'allergy', type: 'medical', weight: 4 }, { term: 'difficulty breathing', type: 'medical', weight: 6 },
  { term: 'unconscious', type: 'medical', weight: 7 }, { term: 'health officer', type: 'medical', weight: 3 }, { term: 'first aid', type: 'medical', weight: 3 },
  { term: 'urgent', type: 'severity', weight: 2 }, { term: 'immediate', type: 'severity', weight: 2 }, { term: 'heavy', type: 'severity', weight: 2 }, { term: 'spreading', type: 'severity', weight: 2 },
  { term: 'dangerous', type: 'severity', weight: 2 }, { term: 'trapped', type: 'severity', weight: 3 }, { term: 'minor', type: 'severity', weight: -2 }, { term: 'under control', type: 'severity', weight: -3 },
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
  let best = 0;
  let locZone: Zone | undefined;
  for (const z of zones) {
    for (const cand of [z.name.replace('فصل ', ''), (z.nameEn ?? '').replace('Class ', '')]) {
      const zn = normalizeArabic(cand);
      if (zn.length > 2 && zn.length > best && normText.includes(zn)) { locZone = z; best = zn.length; }
    }
  }
  let location: Text | undefined = locZone ? bi(locZone.name, locZone.nameEn ?? locZone.name) : undefined;
  if (!location) {
    const m = text.match(/الطابق\s+(الأرضي|الأول|الثاني)/);
    const me = text.match(/(ground|first|second) floor/i);
    const FL: Record<string, [string, string]> = { 'الأرضي': ['الطابق الأرضي', 'Ground Floor'], 'الأول': ['الطابق الأول', 'First Floor'], 'الثاني': ['الطابق الثاني', 'Second Floor'], ground: ['الطابق الأرضي', 'Ground Floor'], first: ['الطابق الأول', 'First Floor'], second: ['الطابق الثاني', 'Second Floor'] };
    const k = m?.[1] ?? me?.[1]?.toLowerCase();
    if (k && FL[k]) location = bi(FL[k][0], FL[k][1]);
  }

  let sevScore = BASE_SEVERITY[type] + Math.sign(sevMod) * Math.min(2, Math.ceil(Math.abs(sevMod) / 2));
  if (topScore >= 12) sevScore += 1;
  sevScore = Math.max(1, Math.min(4, sevScore));
  const severity: Severity = (['low', 'medium', 'high', 'critical'] as Severity[])[sevScore - 1];

  const procedureId = procedures.find((p) => p.id === TYPE_TO_PROCEDURE[type])?.id ?? procedures.find((p) => p.type === type)?.id ?? procedures[0].id;

  const reasoning: Text[] = [];
  const proc = procedures.find((p) => p.id === procedureId);
  if (total === 0) {
    reasoning.push(bi('لم يتم العثور على مصطلحات معروفة في النص؛ تم اقتراح "إخلاء" كخيار احترازي ويلزم تصنيف يدوي.', 'No known terms were found in the text; "Evacuation" is suggested as a precaution and manual classification is required.'));
  } else {
    reasoning.push(bi(`أعلى درجة لنوع "${TYPE_LABEL[type]}" (${topScore} نقطة من أصل ${total}).`, `Highest score for "${TYPE_LABEL_EN[type]}" (${topScore} of ${total} points).`));
    const kw = matched.filter((m) => m.type === type).map((m) => m.term);
    if (kw.length) reasoning.push(bi(`مصطلحات دالة: ${kw.join('، ')}.`, `Indicative terms: ${kw.join(', ')}.`));
    const sevTerms = matched.filter((m) => m.type === 'severity').map((m) => m.term);
    if (sevMod !== 0) reasoning.push(bi(`معدّلات الخطورة ${sevMod > 0 ? 'رفعت' : 'خفّضت'} المستوى (${sevTerms.join('، ')}).`, `Severity modifiers ${sevMod > 0 ? 'raised' : 'lowered'} the level (${sevTerms.join(', ')}).`));
    if (location) reasoning.push(bi(`تم تحديد الموقع المحتمل: ${typeof location === 'string' ? location : location.ar}.`, `Probable location: ${typeof location === 'string' ? location : location.en}.`));
    reasoning.push(bi(`تم اختيار الإجراء من المكتبة المعتمدة: ${proc?.title ?? procedureId}.`, `Procedure retrieved from the approved library: ${proc?.titleEn ?? proc?.title ?? procedureId}.`));
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
export const TYPE_LABEL_EN: Record<EmergencyType, string> = {
  fire: 'Fire', external_threat: 'External threat', evacuation: 'Evacuation', medical: 'Medical emergency',
};
