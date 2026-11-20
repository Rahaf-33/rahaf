import type { ClassRoom, Student } from '@/types';

export type ClassStatus = 'normal' | 'pending' | 'in_progress' | 'complete' | 'help';

export interface ClassStats {
  cls: ClassRoom;
  registered: number;
  absent: number;
  expected: number; // present + late (per attendance record)
  observed: number; // anonymous count from sensors – NOT identity
  confirmed: number; // confirmed safe by name
  help: number;
  notFound: number;
  unverified: number;
  status: ClassStatus;
}

export function classStats(
  classes: ClassRoom[],
  students: Student[],
  observed: Record<string, number>,
  emergencyActive: boolean,
): ClassStats[] {
  const byClass = new Map<string, Student[]>();
  for (const s of students) {
    const a = byClass.get(s.classId) ?? [];
    a.push(s);
    byClass.set(s.classId, a);
  }
  return classes.map((cls) => {
    const list = byClass.get(cls.id) ?? [];
    const present = list.filter((s) => s.attendance !== 'absent');
    const confirmed = present.filter((s) => s.safety === 'safe').length;
    const help = present.filter((s) => s.safety === 'needs_help').length;
    const notFound = present.filter((s) => s.safety === 'not_found').length;
    const expected = present.length;
    const unverified = expected - confirmed - help - notFound;
    let status: ClassStatus = 'normal';
    if (emergencyActive) {
      if (help > 0 || notFound > 0) status = 'help';
      else if (expected > 0 && confirmed === expected) status = 'complete';
      else if (confirmed > 0) status = 'in_progress';
      else status = 'pending';
    }
    return {
      cls, registered: list.length, absent: list.length - present.length, expected,
      observed: observed[cls.id] ?? 0, confirmed, help, notFound, unverified, status,
    };
  });
}

export function totals(stats: ClassStats[]) {
  return stats.reduce(
    (a, s) => ({
      registered: a.registered + s.registered,
      absent: a.absent + s.absent,
      expected: a.expected + s.expected,
      observed: a.observed + s.observed,
      confirmed: a.confirmed + s.confirmed,
      help: a.help + s.help,
      notFound: a.notFound + s.notFound,
      unverified: a.unverified + s.unverified,
      complete: a.complete + (s.status === 'complete' ? 1 : 0),
      incomplete: a.incomplete + (s.status !== 'complete' && s.status !== 'normal' ? 1 : 0),
    }),
    { registered: 0, absent: 0, expected: 0, observed: 0, confirmed: 0, help: 0, notFound: 0, unverified: 0, complete: 0, incomplete: 0 },
  );
}

export const CLASS_STATUS_LABEL: Record<ClassStatus, string> = {
  normal: 'وضع طبيعي', pending: 'بانتظار الحصر', in_progress: 'جارٍ الحصر', complete: 'مكتمل', help: 'يحتاج متابعة',
};
export const CLASS_STATUS_STYLE: Record<ClassStatus, string> = {
  normal: 'bg-navy-50 text-navy-700 ring-navy-200',
  pending: 'bg-warn-soft text-warn-dark ring-warn/30',
  in_progress: 'bg-sky-50 text-sky-800 ring-sky-300',
  complete: 'bg-safe-soft text-safe-dark ring-safe/30',
  help: 'bg-danger-soft text-danger-dark ring-danger/30',
};
