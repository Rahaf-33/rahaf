import type { EmergencyRecord, LogEntry, ProgressPoint } from '@/types';
import { CLASSES } from './seed';

/** سجلات تمارين سابقة تجريبية لعرض صفحة التقارير قبل تشغيل أي محاكاة */
export function buildDemoHistory(): EmergencyRecord[] {
  const mk = (
    id: string, title: string, date: string, durationSec: number, type: EmergencyRecord['type'], present: number, unverifiedEnd: number, help: number,
  ): EmergencyRecord => {
    const startedAt = new Date(date).getTime();
    const progress: ProgressPoint[] = [];
    for (let t = 0; t <= durationSec; t += 10) {
      const k = Math.min(1, Math.max(0, (t - 25) / (durationSec * 0.75)));
      const eased = 1 - Math.pow(1 - k, 2.2);
      const safe = Math.round((present - unverifiedEnd - help) * eased);
      progress.push({ t, safe, unverified: present - safe - (t > durationSec * 0.4 ? help : 0), help: t > durationSec * 0.4 ? help : 0, observed: Math.min(present, Math.round(present * Math.min(1, t / (durationSec * 0.45)))) });
    }
    const log: LogEntry[] = [
      { id: `${id}-1`, at: startedAt, category: 'alert', level: 'warning', actor: 'منسقة التمرين', message: `بدء ${title}` },
      { id: `${id}-2`, at: startedAt + 2000, category: 'emergency', level: 'critical', actor: 'أ. هيفاء السبيعي', message: 'تفعيل وضع الطوارئ (تمرين)' },
      { id: `${id}-3`, at: startedAt + 4000, category: 'notification', level: 'info', actor: 'المنصة', message: 'إرسال إشعار داخل المنصة لجميع المعلمات' },
      { id: `${id}-4`, at: startedAt + 38000, category: 'teacher', level: 'success', actor: 'أ. نوف القحطاني', message: 'أول تأكيد سلامة بالاسم – فصل 1/1' },
      { id: `${id}-5`, at: startedAt + Math.round(durationSec * 0.55) * 1000, category: 'zone', level: 'success', actor: 'وحدة الرصد', message: 'انتهت حركة الإخلاء في جميع المناطق' },
      { id: `${id}-6`, at: startedAt + durationSec * 1000, category: 'emergency', level: 'success', actor: 'أ. هيفاء السبيعي', message: 'إنهاء التمرين وإعادة النظام للوضع الطبيعي' },
    ];
    const per = Math.floor(present / CLASSES.length);
    return {
      id, title, type, severity: 'medium', startedAt, endedAt: startedAt + durationSec * 1000, simulation: true,
      totalPresent: present, confirmedSafe: present - unverifiedEnd - help, unverified: unverifiedEnd, needsHelp: help, casesOpened: help + (unverifiedEnd ? 1 : 0),
      firstConfirmationSec: 38, zonesClearedSec: Math.round(durationSec * 0.55), log, progress,
      classes: CLASSES.map((c, i) => {
        const u = i === 5 ? unverifiedEnd : 0;
        const h = i === 9 ? help : 0;
        return { classId: c.id, name: c.name, present: per, observed: per, confirmed: per - u - h, unverified: u, help: h };
      }),
    };
  };
  return [
    mk('REC-DEMO-2', 'تمرين إخلاء دوري – الفصل الدراسي الأول', '2026-10-21T08:15:00', 312, 'evacuation', 289, 0, 0),
    mk('REC-DEMO-1', 'تمرين حريق افتراضي – الطابق الأول', '2026-09-24T09:40:00', 405, 'fire', 287, 2, 1),
  ];
}
