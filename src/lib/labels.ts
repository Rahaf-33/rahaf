import type { EmergencyType, HelpType, Role, SafetyStatus, SensorKind, Severity, ZoneStatus, Case, Attendance } from '@/types';
import { TYPE_LABEL as TYPE_LABEL_AR } from './ai';
import { translate } from '@/i18n/core';
import { useStore } from '@/store/useStore';
const getLang = () => useStore.getState().lang;

/** Wraps an Arabic label map so every read returns the label in the current UI language. */
export function localized<K extends string>(map: Record<K, string>): Record<K, string> {
  return new Proxy(map, { get: (o, k) => (typeof k === 'string' && k in o ? translate(getLang(), (o as Record<string, string>)[k]) : undefined) });
}
export const TYPE_LABEL = localized(TYPE_LABEL_AR);

export const ROLE_LABEL: Record<Role, string> = localized({
  principal: 'قائدة المدرسة', teacher: 'معلمة', safety: 'مسؤولة السلامة', admin: 'مديرة النظام',
});

export const SEVERITY_LABEL: Record<Severity, string> = localized({ low: 'منخفضة', medium: 'متوسطة', high: 'عالية', critical: 'حرجة' });
export const SEVERITY_STYLE: Record<Severity, string> = {
  low: 'bg-navy-50 text-navy-700 ring-navy-200',
  medium: 'bg-warn-soft text-warn-dark ring-warn/30',
  high: 'bg-danger-soft text-danger-dark ring-danger/30',
  critical: 'bg-danger text-white ring-danger',
};

export const TYPE_ICON_COLOR: Record<EmergencyType, string> = {
  fire: 'text-danger bg-danger-soft', external_threat: 'text-violet-700 bg-violet-100', evacuation: 'text-warn-dark bg-warn-soft', medical: 'text-brand-dark bg-navy-50',
};

export const SAFETY_LABEL: Record<SafetyStatus, string> = localized({
  unverified: 'لم يتم التحقق', safe: 'مؤكدة السلامة', needs_help: 'تحتاج مساعدة', not_found: 'غير موجودة',
});
export const SAFETY_STYLE: Record<SafetyStatus, string> = {
  unverified: 'bg-warn-soft text-warn-dark ring-warn/30',
  safe: 'bg-safe-soft text-safe-dark ring-safe/30',
  needs_help: 'bg-danger-soft text-danger-dark ring-danger/30',
  not_found: 'bg-danger text-white ring-danger',
};

export const ATTENDANCE_LABEL: Record<Attendance, string> = localized({ present: 'حاضرة', absent: 'غائبة', late: 'متأخرة (حاضرة)' });

export function zoneStatusLabel(s: ZoneStatus, type?: EmergencyType): string {
  const shelter = type === 'external_threat';
  return translate(getLang(), {
    normal: 'طبيعي',
    evacuating: shelter ? 'إيواء – جارٍ التحقق' : 'جارٍ الإخلاء',
    cleared: shelter ? 'مؤمّن' : 'تم الإخلاء',
    needs_check: 'يحتاج تحقق',
    danger: 'منطقة خطر',
  }[s]);
}

export const ZONE_FILL: Record<ZoneStatus, { fill: string; stroke: string; text: string }> = {
  normal: { fill: '#eef3fb', stroke: '#b3c6e8', text: '#18356b' },
  evacuating: { fill: '#fff4dc', stroke: '#e09100', text: '#7a4d00' },
  cleared: { fill: '#e3f6ea', stroke: '#12a150', text: '#0b5c2e' },
  needs_check: { fill: '#ffe9d6', stroke: '#eb6834', text: '#8a3410' },
  danger: { fill: '#fde8e8', stroke: '#dc2f2f', text: '#8f1717' },
};

export const SENSOR_LABEL: Record<SensorKind, string> = localized({
  camera: 'كاميرا عدّ (مجهول الهوية)', smoke: 'كاشف دخان', heat: 'حساس حرارة', occupancy: 'عدّاد إشغال', door: 'حساس باب',
});

export const HELP_LABEL: Record<HelpType, string> = localized({
  first_aid: 'إسعافات أولية', evacuation_assist: 'مساعدة في الإخلاء', missing_student: 'طالبة غير مؤكدة الموقع', zone_check: 'تحقق من منطقة', other: 'أخرى',
});

export const PRIORITY_LABEL: Record<Case['priority'], string> = localized({ p1: 'عاجلة جدًا', p2: 'عاجلة', p3: 'متابعة' });
export const PRIORITY_STYLE: Record<Case['priority'], string> = {
  p1: 'bg-danger text-white', p2: 'bg-warn text-white', p3: 'bg-navy-100 text-navy-700',
};
export const CASE_STATUS_LABEL: Record<Case['status'], string> = localized({ open: 'مفتوحة', in_progress: 'قيد المعالجة', resolved: 'تم الحل' });

const fmts = {
  ar: {
    time: new Intl.DateTimeFormat('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    date: new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { year: 'numeric', month: 'long', day: 'numeric' }),
    dt: new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
  },
  en: {
    time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    date: new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    dt: new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
  },
};

export const formatTime = (t: number) => fmts[getLang()].time.format(t);
export const formatDate = (t: number) => fmts[getLang()].date.format(t);
export const formatDateTime = (t: number) => fmts[getLang()].dt.format(t);
export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
export function timeAgo(t: number, now = Date.now()): string {
  const d = Math.round((now - t) / 1000);
  const L = getLang();
  if (d < 10) return translate(L, 'الآن');
  if (d < 60) return translate(L, 'قبل {n} ث', { n: d });
  if (d < 3600) return translate(L, 'قبل {n} د', { n: Math.floor(d / 60) });
  if (d < 86400) return translate(L, 'قبل {n} س', { n: Math.floor(d / 3600) });
  return formatDate(t);
}
export const pct = (a: number, b: number) => (b <= 0 ? 0 : Math.round((a / b) * 100));

/** School info field in the current language. */
export function schoolText(school: import('@/types').SchoolInfo, key: Exclude<keyof import('@/types').SchoolInfo, 'en'>, lang: 'ar' | 'en'): string {
  return (lang === 'en' ? school.en?.[key] : undefined) ?? school[key];
}
