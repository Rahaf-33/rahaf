import type { EmergencyType, HelpType, Role, SafetyStatus, SensorKind, Severity, ZoneStatus, Case, Attendance } from '@/types';
export { TYPE_LABEL } from './ai';

export const ROLE_LABEL: Record<Role, string> = {
  principal: 'قائدة المدرسة', teacher: 'معلمة', safety: 'مسؤولة السلامة', admin: 'مديرة النظام',
};

export const SEVERITY_LABEL: Record<Severity, string> = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', critical: 'حرجة' };
export const SEVERITY_STYLE: Record<Severity, string> = {
  low: 'bg-navy-50 text-navy-700 ring-navy-200',
  medium: 'bg-warn-soft text-warn-dark ring-warn/30',
  high: 'bg-danger-soft text-danger-dark ring-danger/30',
  critical: 'bg-danger text-white ring-danger',
};

export const TYPE_ICON_COLOR: Record<EmergencyType, string> = {
  fire: 'text-danger bg-danger-soft', external_threat: 'text-violet-700 bg-violet-100', evacuation: 'text-warn-dark bg-warn-soft', medical: 'text-brand-dark bg-navy-50',
};

export const SAFETY_LABEL: Record<SafetyStatus, string> = {
  unverified: 'لم يتم التحقق', safe: 'مؤكدة السلامة', needs_help: 'تحتاج مساعدة', not_found: 'غير موجودة',
};
export const SAFETY_STYLE: Record<SafetyStatus, string> = {
  unverified: 'bg-warn-soft text-warn-dark ring-warn/30',
  safe: 'bg-safe-soft text-safe-dark ring-safe/30',
  needs_help: 'bg-danger-soft text-danger-dark ring-danger/30',
  not_found: 'bg-danger text-white ring-danger',
};

export const ATTENDANCE_LABEL: Record<Attendance, string> = { present: 'حاضرة', absent: 'غائبة', late: 'متأخرة (حاضرة)' };

export function zoneStatusLabel(s: ZoneStatus, type?: EmergencyType): string {
  const shelter = type === 'external_threat';
  return {
    normal: 'طبيعي',
    evacuating: shelter ? 'إيواء – جارٍ التحقق' : 'جارٍ الإخلاء',
    cleared: shelter ? 'مؤمّن' : 'تم الإخلاء',
    needs_check: 'يحتاج تحقق',
    danger: 'منطقة خطر',
  }[s];
}

export const ZONE_FILL: Record<ZoneStatus, { fill: string; stroke: string; text: string }> = {
  normal: { fill: '#eef3fb', stroke: '#b3c6e8', text: '#18356b' },
  evacuating: { fill: '#fff4dc', stroke: '#e09100', text: '#7a4d00' },
  cleared: { fill: '#e3f6ea', stroke: '#12a150', text: '#0b5c2e' },
  needs_check: { fill: '#ffe9d6', stroke: '#eb6834', text: '#8a3410' },
  danger: { fill: '#fde8e8', stroke: '#dc2f2f', text: '#8f1717' },
};

export const SENSOR_LABEL: Record<SensorKind, string> = {
  camera: 'كاميرا عدّ (مجهول الهوية)', smoke: 'كاشف دخان', heat: 'حساس حرارة', occupancy: 'عدّاد إشغال', door: 'حساس باب',
};

export const HELP_LABEL: Record<HelpType, string> = {
  first_aid: 'إسعافات أولية', evacuation_assist: 'مساعدة في الإخلاء', missing_student: 'طالبة غير مؤكدة الموقع', zone_check: 'تحقق من منطقة', other: 'أخرى',
};

export const PRIORITY_LABEL: Record<Case['priority'], string> = { p1: 'عاجلة جدًا', p2: 'عاجلة', p3: 'متابعة' };
export const PRIORITY_STYLE: Record<Case['priority'], string> = {
  p1: 'bg-danger text-white', p2: 'bg-warn text-white', p3: 'bg-navy-100 text-navy-700',
};
export const CASE_STATUS_LABEL: Record<Case['status'], string> = { open: 'مفتوحة', in_progress: 'قيد المعالجة', resolved: 'تم الحل' };

const fmtTime = new Intl.DateTimeFormat('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
const fmtDate = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { year: 'numeric', month: 'long', day: 'numeric' });
const fmtDateTime = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

export const formatTime = (t: number) => fmtTime.format(t);
export const formatDate = (t: number) => fmtDate.format(t);
export const formatDateTime = (t: number) => fmtDateTime.format(t);
export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
export function timeAgo(t: number, now = Date.now()): string {
  const d = Math.round((now - t) / 1000);
  if (d < 10) return 'الآن';
  if (d < 60) return `قبل ${d} ث`;
  if (d < 3600) return `قبل ${Math.floor(d / 60)} د`;
  if (d < 86400) return `قبل ${Math.floor(d / 3600)} س`;
  return formatDate(t);
}
export const pct = (a: number, b: number) => (b <= 0 ? 0 : Math.round((a / b) * 100));
