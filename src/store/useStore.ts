import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Alert, AssemblyPoint, Case, ClassRoom, EmergencyRecord, EmergencyState, EmergencyType, Exit, Floor, HelpType,
  LogEntry, Notification, Role, SafetyProcedure, SafetyStatus, SchoolInfo, Sensor, Severity, Student, Teacher, User, Zone, ZoneStatus, Attendance,
} from '@/types';
import {
  ASSEMBLY_POINTS, CLASSES, DEMO_ALERT_TEXTS, EXITS, FLOORS, PROCEDURES, SCHOOL, TEACHERS, ZONES, buildSensors, buildStudents,
} from '@/data/seed';
import { analyzeAlert, TYPE_LABEL, TYPE_LABEL_EN } from '@/lib/ai';
import { bi, both, N, textOf, type Lang, type Text } from '@/i18n/core';
import { mulberry32, uid } from '@/lib/random';
import { classStats, totals } from './selectors';
import { buildDemoHistory } from '@/data/history';

export interface Toast { id: string; title: Text; body?: Text; level: 'info' | 'success' | 'warning' | 'critical' }

/* ---------------- simulation plan (kept outside React state) ---------------- */
interface ClassPlan { clearAt: number; exitStart: number; confirmStart: number; rate: number; limit: number; noise: number }
interface SimEvent { at: number; done: boolean; run: () => void }
interface Plan {
  classes: Record<string, ClassPlan>;
  zones: Record<string, { clearAt: number; final: ZoneStatus }>;
  events: SimEvent[];
  scripted: boolean;
}
let plan: Plan | null = null;

const EMPTY_EMERGENCY: EmergencyState = { active: false, simulation: false, tick: 0, speed: 1, paused: false, progress: [] };

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  user: User | null;
  school: SchoolInfo;
  floors: Floor[];
  zones: Zone[];
  exits: Exit[];
  assemblyPoints: AssemblyPoint[];
  classes: ClassRoom[];
  teachers: Teacher[];
  students: Student[];
  sensors: Sensor[];
  procedures: SafetyProcedure[];
  alerts: Alert[];
  logs: LogEntry[];
  notifications: Notification[];
  cases: Case[];
  emergency: EmergencyState;
  zoneStatus: Record<string, ZoneStatus>;
  observed: Record<string, number>;
  history: EmergencyRecord[];
  toasts: Toast[];
  showAlertModal: string | null;

  login: (u: User) => void;
  logout: () => void;
  now: () => number;
  log: (e: Omit<LogEntry, 'id' | 'at'>) => void;
  notify: (n: Omit<Notification, 'id' | 'at' | 'read'>, toast?: boolean) => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  markNotificationsRead: (role: Role, teacherId?: string) => void;
  markNotificationRead: (id: string) => void;
  setAlertModal: (id: string | null) => void;

  receiveAlert: (input: { text: Text; source: 'demo' | 'manual'; sourceLabel: Text; title?: Text; type?: EmergencyType; severity?: Severity }) => Alert;
  updateAlert: (id: string, patch: Partial<Pick<Alert, 'type' | 'severity' | 'status'>>) => void;
  activateEmergency: (alertId: string, opts?: { simulation?: boolean }) => void;
  startSimulation: () => void;
  endEmergency: () => void;
  tick: () => void;
  setSpeed: (n: number) => void;
  togglePause: () => void;

  setStudentSafety: (studentId: string, safety: SafetyStatus, actor: Text, note?: Text) => void;
  confirmAllPresent: (classId: string, actor: Text) => void;
  setAttendance: (studentId: string, attendance: Attendance, actor: Text) => void;
  setObservedManual: (classId: string, value: number, actor: Text) => void;
  setZoneStatus: (zoneId: string, status: ZoneStatus, actor: Text) => void;
  requestHelp: (input: { classId?: string; zoneId?: string; studentId?: string; helpType: HelpType; description: Text; actor: Text; priority?: Case['priority'] }) => void;
  updateCase: (id: string, patch: Partial<Pick<Case, 'status' | 'assignee' | 'priority'>>, actor: Text) => void;

  updateSchool: (patch: Partial<SchoolInfo>) => void;
  upsertClass: (c: ClassRoom) => void;
  removeClass: (id: string) => void;
  upsertTeacher: (t: Teacher) => void;
  removeTeacher: (id: string) => void;
  upsertStudent: (s: Student) => void;
  removeStudent: (id: string) => void;
  upsertSensor: (s: Sensor) => void;
  removeSensor: (id: string) => void;
  upsertExit: (e: Exit) => void;
  removeExit: (id: string) => void;
  upsertFloor: (f: Floor) => void;
  updateProcedure: (p: SafetyProcedure) => void;
  resetDemoData: () => void;
}

const initialZoneStatus = () => Object.fromEntries(ZONES.map((z) => [z.id, 'normal' as ZoneStatus]));

function baseData() {
  return {
    school: SCHOOL,
    floors: FLOORS,
    zones: ZONES,
    exits: EXITS,
    assemblyPoints: ASSEMBLY_POINTS,
    classes: CLASSES,
    teachers: TEACHERS,
    students: buildStudents(),
    sensors: buildSensors(),
    procedures: PROCEDURES,
    history: buildDemoHistory(),
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      lang: 'ar',
      setLang: (l) => set({ lang: l }),
      user: null,
      ...baseData(),
      alerts: [],
      logs: [],
      notifications: [],
      cases: [],
      emergency: EMPTY_EMERGENCY,
      zoneStatus: initialZoneStatus(),
      observed: {},
      toasts: [],
      showAlertModal: null,

      /* ---------------- basics ---------------- */
      login: (u) => {
        set({ user: u });
        get().log({ category: 'system', level: 'info', actor: N(u), message: bi(`تسجيل دخول بصفة ${u.title}`, `Signed in as ${u.titleEn ?? u.title}`) });
      },
      logout: () => {
        const u = get().user;
        if (u) get().log({ category: 'system', level: 'info', actor: N(u), message: 'تسجيل خروج' });
        set({ user: null });
      },
      now: () => {
        const e = get().emergency;
        return e.active && e.startedAt ? e.startedAt + e.tick * 1000 : Date.now();
      },
      log: (e) => set((s) => ({ logs: [{ ...e, id: uid('log'), at: get().now() }, ...s.logs].slice(0, 800) })),
      notify: (n, toast = true) => {
        set((s) => ({ notifications: [{ ...n, id: uid('ntf'), at: get().now(), read: false }, ...s.notifications].slice(0, 200) }));
        const u = get().user;
        if (toast && u && n.audience.includes(u.role) && (!n.teacherId || n.teacherId === u.teacherId)) {
          get().toast({ title: n.title, body: n.body, level: n.level });
        }
      },
      toast: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: uid('tst') }].slice(-5) })),
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      markNotificationsRead: (role, teacherId) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.audience.includes(role) && (!n.teacherId || n.teacherId === teacherId) ? { ...n, read: true } : n,
          ),
        })),
      markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      setAlertModal: (id) => set({ showAlertModal: id }),

      /* ---------------- alerts ---------------- */
      receiveAlert: ({ text, source, sourceLabel, title, type, severity }) => {
        const st = get();
        const analysis = analyzeAlert(both(text).ar, st.zones, st.procedures);
        const alert: Alert = {
          id: uid('ALR'),
          title: title ?? bi(`إنذار ${TYPE_LABEL[type ?? analysis.type]}`, `${TYPE_LABEL_EN[type ?? analysis.type]} alert`),
          text,
          source,
          sourceLabel,
          type: type ?? analysis.type,
          severity: severity ?? analysis.severity,
          receivedAt: st.now(),
          status: 'new',
          analysis,
          location: analysis.location,
        };
        set((s) => ({ alerts: [alert, ...s.alerts] }));
        st.log({
          category: 'alert', level: 'warning', actor: sourceLabel,
          message: bi(`استلام ${source === 'demo' ? 'إنذار تجريبي' : 'إنذار مُدخل يدويًا'}: ${textOf('ar', alert.title)} – خطورة ${severityAr(alert.severity)}`, `${source === 'demo' ? 'Demo alert' : 'Manually entered alert'} received: ${textOf('en', alert.title)} – ${SEV_EN[alert.severity]} severity`),
        });
        st.log({
          category: 'system', level: 'info', actor: 'محرك التحليل (محاكاة)',
          message: bi(`تصنيف آلي: ${TYPE_LABEL[analysis.type]} بثقة ${analysis.confidence}%${analysis.requiresHumanReview ? ' – يتطلب مراجعة بشرية' : ''}`, `Automatic classification: ${TYPE_LABEL_EN[analysis.type]} with ${analysis.confidence}% confidence${analysis.requiresHumanReview ? ' – human review required' : ''}`),
        });
        return alert;
      },
      updateAlert: (id, patch) => {
        set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
        const u = get().user;
        if (patch.type || patch.severity) {
          get().log({ category: 'manual', level: 'info', actor: who(u), message: bi(`تعديل تصنيف الإنذار يدويًا${patch.type ? ` إلى ${TYPE_LABEL[patch.type]}` : ''}${patch.severity ? ` – خطورة ${severityAr(patch.severity)}` : ''}`, `Alert classification changed manually${patch.type ? ` to ${TYPE_LABEL_EN[patch.type]}` : ''}${patch.severity ? ` – ${SEV_EN[patch.severity]} severity` : ''}`) });
        }
        if (patch.status === 'dismissed') get().log({ category: 'alert', level: 'info', actor: who(u), message: 'تم تجاهل الإنذار بعد المراجعة' });
        if (patch.status === 'acknowledged') get().log({ category: 'alert', level: 'info', actor: who(u), message: 'تم الاطلاع على الإنذار' });
      },

      activateEmergency: (alertId, opts) => {
        const st = get();
        if (st.emergency.active) return;
        const alert = st.alerts.find((a) => a.id === alertId);
        if (!alert) return;
        const simulation = !!opts?.simulation;
        const startedAt = Date.now();
        plan = buildPlan(st, alert, simulation);
        const zoneStatus: Record<string, ZoneStatus> = {};
        for (const z of st.zones) zoneStatus[z.id] = plan.zones[z.id]?.final === 'danger' ? 'danger' : 'evacuating';
        set((s) => ({
          emergency: { ...EMPTY_EMERGENCY, speed: s.emergency.speed, active: true, simulation, alertId, type: alert.type, severity: alert.severity, startedAt, tick: 0, progress: [] },
          alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, status: 'activated' } : a)),
          zoneStatus,
          observed: {},
          cases: [],
          students: s.students.map((x) => ({ ...x, safety: 'unverified', note: undefined, confirmedAt: undefined, confirmedBy: undefined })),
          sensors: s.sensors.map((x) => ({ ...x, reading: 0, triggered: false })),
        }));
        const actor = who(st.user);
        const g = get();
        g.log({ category: 'emergency', level: 'critical', actor, message: bi(`تفعيل وضع الطوارئ (${TYPE_LABEL[alert.type]})${simulation ? ' – محاكاة' : ''}`, `Emergency mode activated (${TYPE_LABEL_EN[alert.type]})${simulation ? ' – simulation' : ''}`) });
        g.log({ category: 'sensor', level: 'info', actor: 'وحدة الرصد', message: 'تفعيل وضع الرصد المؤقت: بدء محاكاة العدّ مجهول الهوية – بدون تعرّف على الوجوه وبدون تسجيل فيديو' });
        const proc = g.procedures.find((p) => p.id === alert.analysis.procedureId);
        g.notify({
          title: bi(`🚨 حالة طوارئ: ${TYPE_LABEL[alert.type]}`, `🚨 Emergency: ${TYPE_LABEL_EN[alert.type]}`),
          body: bi(`${alert.location ? `الموقع: ${both(alert.location).ar}. ` : ''}يرجى اتباع: ${proc?.title ?? 'الإجراءات المعتمدة'} وتأكيد سلامة الطالبات بالاسم عبر المنصة.`, `${alert.location ? `Location: ${both(alert.location).en}. ` : ''}Please follow: ${proc?.titleEn ?? proc?.title ?? 'the approved procedures'} and confirm each student's safety by name on the platform.`),
          audience: ['principal', 'safety', 'teacher', 'admin'], level: 'critical', link: '/teacher',
        });
        g.log({ category: 'notification', level: 'info', actor: 'المنصة', message: bi(`إرسال إشعار داخل المنصة إلى ${g.teachers.length} معلمة وقائدة المدرسة ومسؤولة السلامة (إشعار داخلي – لا يوجد إرسال خارجي)`, `In-app notification sent to ${g.teachers.length} teachers, the principal and the safety officer (internal only – nothing sent externally)`) });
        set({ showAlertModal: alertId });
      },

      startSimulation: () => {
        const st = get();
        if (st.emergency.active) return;
        const demo = DEMO_ALERT_TEXTS[0];
        const alert = st.receiveAlert({ text: bi(demo.text, demo.textEn), source: 'demo', sourceLabel: bi(demo.source, demo.sourceEn), title: bi('إنذار حريق – مختبر العلوم (تجريبي)', 'Fire alert – Science Lab (demo)') });
        get().activateEmergency(alert.id, { simulation: true });
      },

      endEmergency: () => {
        const st = get();
        const e = st.emergency;
        if (!e.active || !e.startedAt) return;
        const stats = classStats(st.classes, st.students, st.observed, true);
        const t = totals(stats);
        const alert = st.alerts.find((a) => a.id === e.alertId);
        st.log({ category: 'emergency', level: 'success', actor: who(st.user), message: bi(`${e.simulation ? 'إنهاء المحاكاة' : 'إنهاء حالة الطوارئ'} وإعادة النظام للوضع الطبيعي – المدة ${Math.floor(e.tick / 60)}:${String(e.tick % 60).padStart(2, '0')}`, `${e.simulation ? 'Simulation ended' : 'Emergency ended'} and system returned to normal – duration ${Math.floor(e.tick / 60)}:${String(e.tick % 60).padStart(2, '0')}`) });
        const fin = get();
        const record: EmergencyRecord = {
          id: uid('REC'),
          type: e.type!, severity: e.severity!, title: alert?.title ?? bi('حالة طوارئ', 'Emergency'),
          startedAt: e.startedAt, endedAt: e.startedAt + e.tick * 1000, simulation: e.simulation,
          totalPresent: t.expected, confirmedSafe: t.confirmed, unverified: t.unverified, needsHelp: t.help + t.notFound,
          casesOpened: fin.cases.length,
          firstConfirmationSec: e.firstConfirmationAt !== undefined ? e.firstConfirmationAt : undefined,
          zonesClearedSec: e.allZonesClearedAt,
          log: fin.logs.filter((l) => l.at >= e.startedAt! - 2000).slice().reverse(),
          progress: e.progress,
          classes: stats.map((s) => ({ classId: s.cls.id, name: s.cls.name, present: s.expected, observed: s.observed, confirmed: s.confirmed, unverified: s.unverified, help: s.help + s.notFound })),
        };
        plan = null;
        set((s) => ({
          history: [record, ...s.history],
          emergency: { ...EMPTY_EMERGENCY, speed: s.emergency.speed },
          zoneStatus: initialZoneStatus(),
          observed: {},
          cases: [],
          showAlertModal: null,
          alerts: s.alerts.map((a) => (a.id === e.alertId ? { ...a, status: 'closed' } : a)),
          students: s.students.map((x) => ({ ...x, safety: 'unverified', note: undefined, confirmedAt: undefined, confirmedBy: undefined })),
          sensors: s.sensors.map((x) => ({ ...x, reading: 0, triggered: false })),
        }));
        get().notify({ title: bi('✅ انتهت حالة الطوارئ', '✅ Emergency ended'), body: bi('عاد النظام إلى الوضع الطبيعي وتم إيقاف وضع الرصد. التقرير متاح في صفحة التقارير.', 'The system is back to normal and monitoring has stopped. The report is available on the Reports page.'), audience: ['principal', 'safety', 'teacher', 'admin'], level: 'success', link: '/reports' });
        get().log({ category: 'sensor', level: 'info', actor: 'وحدة الرصد', message: 'إيقاف وضع الرصد – الحساسات في وضع الاستعداد (لا يوجد رصد مستمر)' });
      },

      setSpeed: (n) => set((s) => ({ emergency: { ...s.emergency, speed: n } })),
      togglePause: () => set((s) => ({ emergency: { ...s.emergency, paused: !s.emergency.paused } })),

      tick: () => {
        const st = get();
        const e = st.emergency;
        if (!e.active || e.paused || !plan) return;
        const t = e.tick + 1;
        set((s) => ({ emergency: { ...s.emergency, tick: t } }));
        const p = plan;

        /* zones */
        const zs = { ...get().zoneStatus };
        const clearedNow: string[] = [];
        for (const [zid, zp] of Object.entries(p.zones)) {
          if (zs[zid] === 'evacuating' && t >= zp.clearAt) {
            zs[zid] = zp.final;
            clearedNow.push(zid);
          }
        }
        if (clearedNow.length) {
          set({ zoneStatus: zs });
          for (const zid of clearedNow) {
            const z = st.zones.find((x) => x.id === zid)!;
            const fin = zs[zid];
            if (z.kind === 'classroom' || z.kind === 'corridor' || fin === 'needs_check') {
              get().log({
                category: 'zone', level: fin === 'cleared' ? 'success' : 'warning', actor: 'وحدة الرصد',
                message: fin === 'cleared'
                  ? bi(`${z.name}: ${e.type === 'external_threat' ? 'تم تأمين المنطقة' : 'عدّاد الإشغال يشير إلى خلو المنطقة'} (قراءة آلية)`, `${N(z).en}: ${e.type === 'external_threat' ? 'area secured' : 'occupancy counter shows the area is empty'} (automatic reading)`)
                  : bi(`${z.name}: يحتاج تحقق بشري – لا تتوفر قراءة موثوقة`, `${N(z).en}: needs a human check – no reliable reading available`),
              });
            }
          }
        }
        if (e.allZonesClearedAt === undefined && Object.values(zs).every((v) => v !== 'evacuating')) {
          set((s) => ({ emergency: { ...s.emergency, allZonesClearedAt: t } }));
          get().log({ category: 'zone', level: 'success', actor: 'وحدة الرصد', message: 'انتهت حركة الإخلاء في جميع المناطق (حسب قراءات الحساسات)' });
        }

        /* anonymous counts */
        const stats = classStats(get().classes, get().students, get().observed, true);
        const obs = { ...get().observed };
        const rnd = mulberry32(t * 7919);
        for (const s of stats) {
          const cp = p.classes[s.cls.id];
          if (!cp || t < cp.exitStart) continue;
          const target = Math.max(0, s.expected + cp.noise);
          const cur = obs[s.cls.id] ?? 0;
          if (cur < target) obs[s.cls.id] = Math.min(target, cur + 2 + Math.floor(rnd() * 4));
        }
        set({ observed: obs });

        /* sensors */
        const totalObs = Object.values(obs).reduce((a, b) => a + b, 0);
        set((s) => ({
          sensors: s.sensors.map((sn) => {
            if (!sn.online) return sn;
            if (sn.kind === 'occupancy') {
              const cls = s.classes.find((c) => c.zoneId === sn.zoneId);
              const st2 = stats.find((x) => x.cls.id === cls?.id);
              return { ...sn, reading: Math.max(0, (st2?.expected ?? 0) - (obs[cls?.id ?? ''] ?? 0)) };
            }
            if (sn.kind === 'camera' && sn.assemblyPointId) {
              const ids = s.classes.filter((c) => c.assemblyPointId === sn.assemblyPointId).map((c) => c.id);
              const staff = Math.min(ids.length + 2, Math.floor(t / 4));
              return { ...sn, reading: ids.reduce((a, id) => a + (obs[id] ?? 0), 0) + staff };
            }
            if (sn.kind === 'camera') {
              const z = s.zones.find((x) => x.id === sn.zoneId);
              const moving = stats
                .filter((x) => x.cls.floorId === z?.floorId)
                .reduce((a, x) => a + Math.max(0, Math.min(x.expected, (obs[x.cls.id] ?? 0)) - Math.max(0, (obs[x.cls.id] ?? 0) - 6)), 0);
              const z2 = s.zoneStatus[sn.zoneId ?? ''];
              return { ...sn, reading: z2 === 'evacuating' ? Math.max(0, Math.round(moving * (0.5 + rnd() * 0.5))) : 0 };
            }
            if (sn.kind === 'door') return { ...sn, reading: t >= 2 ? 1 : 0, triggered: t >= 2 };
            if ((sn.kind === 'smoke' || sn.kind === 'heat') && p.zones[sn.zoneId ?? '']?.final === 'danger') {
              const v = sn.kind === 'smoke' ? Math.min(92, 20 + t * 9) : Math.min(68, 26 + t * 4);
              return { ...sn, reading: v, triggered: sn.kind === 'smoke' ? v > 45 : v > 55 };
            }
            if (sn.kind === 'smoke') return { ...sn, reading: 2 + Math.round(rnd() * 3) };
            if (sn.kind === 'heat') return { ...sn, reading: 24 + Math.round(rnd() * 2) };
            return sn;
          }),
        }));
        void totalObs;

        /* scripted teacher confirmations */
        if (p.scripted) {
          const teacherOf = (cid: string) => {
            const c = get().classes.find((x) => x.id === cid);
            const tt = get().teachers.find((x) => x.id === c?.teacherId);
            return tt ? N(tt) : bi('المعلمة', 'The teacher');
          };
          let students = get().students;
          let changed = false;
          for (const s of stats) {
            const cp = p.classes[s.cls.id];
            if (!cp || t < cp.confirmStart) continue;
            const done = s.confirmed + s.help + s.notFound;
            if (s.confirmed >= cp.limit || done >= s.expected) continue;
            const take = Math.min(cp.rate, cp.limit - s.confirmed);
            const pending = students.filter((x) => x.classId === s.cls.id && x.attendance !== 'absent' && x.safety === 'unverified');
            const reserved = new Set(reservedStudents(students, s.cls.id));
            const chosen = pending.filter((x) => !reserved.has(x.id)).slice(0, take).map((x) => x.id);
            if (!chosen.length) continue;
            const tName = teacherOf(s.cls.id);
            const at = get().now();
            students = students.map((x) => (chosen.includes(x.id) ? { ...x, safety: 'safe', confirmedAt: at, confirmedBy: tName } : x));
            changed = true;
            if (s.confirmed === 0) {
              const apN = N(get().assemblyPoints.find((a) => a.id === s.cls.assemblyPointId));
              get().log({ category: 'teacher', level: 'info', actor: tName, message: bi(`بدء تأكيد سلامة طالبات فصل ${s.cls.name} بالاسم في ${apN.ar}`, `Started confirming class ${s.cls.name} students by name at ${apN.en}`) });
            }
            const newConfirmed = s.confirmed + chosen.length;
            if (newConfirmed === s.expected) {
              get().log({ category: 'teacher', level: 'success', actor: tName, message: bi(`اكتمل حصر فصل ${s.cls.name}: ${newConfirmed}/${s.expected} طالبة مؤكدة السلامة`, `Class ${s.cls.name} fully accounted for: ${newConfirmed}/${s.expected} students confirmed safe`) });
            }
          }
          if (changed) set({ students });
        }
        const after = totals(classStats(get().classes, get().students, get().observed, true));
        if (get().emergency.firstConfirmationAt === undefined && after.confirmed > 0) {
          set((s) => ({ emergency: { ...s.emergency, firstConfirmationAt: t } }));
        }

        /* scripted events */
        for (const ev of p.events) {
          if (!ev.done && t >= ev.at) {
            ev.done = true;
            ev.run();
          }
        }

        /* progress snapshot */
        if (t % 2 === 0 || t <= 2) {
          const tt = totals(classStats(get().classes, get().students, get().observed, true));
          set((s) => ({
            emergency: {
              ...s.emergency,
              progress: [...s.emergency.progress, { t, safe: tt.confirmed, unverified: tt.unverified, help: tt.help + tt.notFound, observed: tt.observed }].slice(-400),
            },
          }));
        }
      },

      /* ---------------- accountability ---------------- */
      setStudentSafety: (studentId, safety, actor, note) => {
        const st = get();
        const stu = st.students.find((s) => s.id === studentId);
        if (!stu) return;
        const at = st.now();
        set((s) => ({
          students: s.students.map((x) =>
            x.id === studentId ? { ...x, safety, note: note ?? (safety === 'safe' ? undefined : x.note), confirmedAt: at, confirmedBy: actor } : x,
          ),
        }));
        const cls = st.classes.find((c) => c.id === stu.classId);
        const g = get();
        g.log({
          category: 'teacher', level: safety === 'safe' ? 'success' : safety === 'unverified' ? 'info' : 'critical', actor,
          message: bi(`${stu.name} (${cls?.name}): ${{ safe: 'تأكيد السلامة', needs_help: 'تحتاج مساعدة', not_found: 'غير موجودة في نقطة التجمع', unverified: 'إعادة إلى "لم يتم التحقق"' }[safety]}${note ? ` – ${both(note).ar}` : ''}`, `${N(stu).en} (${cls?.name}): ${{ safe: 'confirmed safe', needs_help: 'needs help', not_found: 'not found at the assembly point', unverified: 'reset to "not verified"' }[safety]}${note ? ` – ${both(note).en}` : ''}`),
        });
        if (g.emergency.firstConfirmationAt === undefined && safety === 'safe' && g.emergency.active) {
          set((s) => ({ emergency: { ...s.emergency, firstConfirmationAt: s.emergency.tick } }));
        }
        // auto-resolve linked open cases when a student is confirmed safe
        if (safety === 'safe') {
          const linked = g.cases.filter((c) => c.studentId === studentId && c.status !== 'resolved');
          if (linked.length) {
            set((s) => ({ cases: s.cases.map((c) => (c.studentId === studentId && c.status !== 'resolved' ? { ...c, status: 'resolved', resolvedAt: at } : c)) }));
            g.log({ category: 'case', level: 'success', actor, message: bi(`إغلاق ${linked.length} حالة مرتبطة بالطالبة ${stu.name} بعد تأكيد سلامتها`, `Closed ${linked.length} case(s) linked to ${N(stu).en} after confirming she is safe`) });
            g.notify({ title: bi('تم تأكيد سلامة طالبة', 'Student confirmed safe'), body: bi(`${stu.name} – فصل ${cls?.name}. أُغلقت الحالة المرتبطة.`, `${N(stu).en} – class ${cls?.name}. The linked case was closed.`), audience: ['principal', 'safety'], level: 'success', link: '/cases' });
          }
        }
        if ((safety === 'needs_help' || safety === 'not_found') && g.emergency.active) {
          const exists = g.cases.some((c) => c.studentId === studentId && c.status !== 'resolved');
          if (!exists) {
            g.requestHelp({
              classId: stu.classId, studentId, actor, priority: 'p1',
              helpType: safety === 'needs_help' ? 'first_aid' : 'missing_student',
              description: bi(`${stu.name} – ${note ? both(note).ar : safety === 'needs_help' ? 'تحتاج مساعدة' : 'لم يتم العثور عليها في نقطة التجمع'}`, `${N(stu).en} – ${note ? both(note).en : safety === 'needs_help' ? 'needs help' : 'not found at the assembly point'}`),
            });
          }
        }
      },
      confirmAllPresent: (classId, actor) => {
        const st = get();
        const at = st.now();
        const targets = st.students.filter((s) => s.classId === classId && s.attendance !== 'absent' && s.safety === 'unverified');
        if (!targets.length) return;
        const ids = new Set(targets.map((t) => t.id));
        set((s) => ({ students: s.students.map((x) => (ids.has(x.id) ? { ...x, safety: 'safe', confirmedAt: at, confirmedBy: actor } : x)) }));
        const cls = st.classes.find((c) => c.id === classId);
        get().log({ category: 'teacher', level: 'success', actor, message: bi(`تأكيد جماعي لسلامة ${targets.length} طالبة في فصل ${cls?.name} بعد المطابقة بالاسم`, `Bulk confirmation of ${targets.length} students in class ${cls?.name} after checking names`) });
        if (get().emergency.firstConfirmationAt === undefined && get().emergency.active) {
          set((s) => ({ emergency: { ...s.emergency, firstConfirmationAt: s.emergency.tick } }));
        }
      },
      setAttendance: (studentId, attendance, actor) => {
        const stu = get().students.find((s) => s.id === studentId);
        set((s) => ({ students: s.students.map((x) => (x.id === studentId ? { ...x, attendance } : x)) }));
        get().log({ category: 'manual', level: 'info', actor, message: bi(`تحديث سجل الحضور: ${stu?.name} ← ${{ present: 'حاضرة', absent: 'غائبة', late: 'متأخرة' }[attendance]}`, `Attendance updated: ${N(stu).en} → ${{ present: 'present', absent: 'absent', late: 'late' }[attendance]}`) });
      },
      setObservedManual: (classId, value, actor) => {
        set((s) => ({ observed: { ...s.observed, [classId]: Math.max(0, value) } }));
        const cls = get().classes.find((c) => c.id === classId);
        get().log({ category: 'manual', level: 'info', actor, message: bi(`تعديل يدوي للعدد المرصود لفصل ${cls?.name} إلى ${value} (عدّ مجهول الهوية)`, `Observed count for class ${cls?.name} manually set to ${value} (anonymous count)`) });
      },
      setZoneStatus: (zoneId, status, actor) => {
        set((s) => ({ zoneStatus: { ...s.zoneStatus, [zoneId]: status } }));
        const z = get().zones.find((x) => x.id === zoneId);
        get().log({ category: 'zone', level: status === 'cleared' ? 'success' : status === 'normal' ? 'info' : 'warning', actor, message: bi(`تحديث يدوي لحالة ${z?.name}: ${({ normal: 'طبيعي', evacuating: 'جارٍ الإخلاء', cleared: 'تم التحقق والإخلاء', needs_check: 'يحتاج تحقق', danger: 'منطقة خطر' } as const)[status]}`, `Manual status update for ${N(z).en}: ${({ normal: 'normal', evacuating: 'evacuating', cleared: 'verified and cleared', needs_check: 'needs check', danger: 'danger zone' } as const)[status]}`) });
        if (status === 'cleared') {
          const linked = get().cases.filter((c) => c.zoneId === zoneId && c.helpType === 'zone_check' && c.status !== 'resolved');
          if (linked.length) set((s) => ({ cases: s.cases.map((c) => (linked.includes(c) ? { ...c, status: 'resolved', resolvedAt: get().now() } : c)) }));
        }
      },
      requestHelp: ({ classId, zoneId, studentId, helpType, description, actor, priority }) => {
        const st = get();
        const cls = st.classes.find((c) => c.id === classId);
        const zone = st.zones.find((z) => z.id === (zoneId ?? cls?.zoneId));
        const pr: Case['priority'] = priority ?? (helpType === 'first_aid' || helpType === 'missing_student' ? 'p1' : helpType === 'evacuation_assist' ? 'p2' : 'p3');
        const c: Case = {
          id: uid('CASE'),
          createdAt: st.now(),
          title: bi(`${({ first_aid: 'طلب إسعافات أولية', evacuation_assist: 'طلب مساعدة في الإخلاء', missing_student: 'طالبة غير مؤكدة الموقع', zone_check: 'منطقة تحتاج تحقق', other: 'طلب متابعة' } as const)[helpType]}${cls ? ` – فصل ${cls.name}` : zone ? ` – ${zone.name}` : ''}`, `${({ first_aid: 'First aid request', evacuation_assist: 'Evacuation assistance request', missing_student: 'Student location unconfirmed', zone_check: 'Area needs checking', other: 'Follow-up request' } as const)[helpType]}${cls ? ` – class ${cls.name}` : zone ? ` – ${N(zone).en}` : ''}`),
          description,
          classId,
          zoneId: zoneId ?? cls?.zoneId,
          studentId,
          helpType,
          priority: pr,
          status: 'open',
          source: actor,
        };
        set((s) => ({ cases: [c, ...s.cases] }));
        const g = get();
        g.log({ category: 'case', level: pr === 'p1' ? 'critical' : 'warning', actor, message: bi(`فتح حالة: ${both(c.title).ar} – ${both(description).ar}`, `Case opened: ${both(c.title).en} – ${both(description).en}`) });
        g.notify({ title: bi(`${pr === 'p1' ? '🔴' : '🟠'} ${both(c.title).ar}`, `${pr === 'p1' ? '🔴' : '🟠'} ${both(c.title).en}`), body: description, audience: ['principal', 'safety'], level: pr === 'p1' ? 'critical' : 'warning', link: '/cases' });
      },
      updateCase: (id, patch, actor) => {
        const c0 = get().cases.find((c) => c.id === id);
        set((s) => ({ cases: s.cases.map((c) => (c.id === id ? { ...c, ...patch, resolvedAt: patch.status === 'resolved' ? get().now() : c.resolvedAt } : c)) }));
        if (c0) {
          const ar: string[] = [];
          const en: string[] = [];
          if (patch.status) { ar.push(`الحالة ← ${({ open: 'مفتوحة', in_progress: 'قيد المعالجة', resolved: 'تم الحل' } as const)[patch.status]}`); en.push(`status → ${({ open: 'open', in_progress: 'in progress', resolved: 'resolved' } as const)[patch.status]}`); }
          if (patch.assignee) { ar.push(`إسناد إلى ${patch.assignee}`); en.push(`assigned to ${both(patch.assignee).en}`); }
          if (patch.priority) { ar.push(`الأولوية ← ${patch.priority.toUpperCase()}`); en.push(`priority → ${patch.priority.toUpperCase()}`); }
          get().log({ category: 'case', level: patch.status === 'resolved' ? 'success' : 'info', actor, message: bi(`${both(c0.title).ar}: ${ar.join('، ')}`, `${both(c0.title).en}: ${en.join(', ')}`) });
        }
      },

      /* ---------------- settings ---------------- */
      updateSchool: (patch) => { set((s) => ({ school: { ...s.school, ...patch } })); settingsLog(get, bi('تحديث بيانات المدرسة', 'school details updated')); },
      upsertClass: (c) => {
        const exists = get().classes.some((x) => x.id === c.id);
        set((s) => ({
          classes: exists ? s.classes.map((x) => (x.id === c.id ? c : x)) : [...s.classes, c],
          zones: s.zones.map((z) => (z.id === c.zoneId ? { ...z, classId: c.id } : z.classId === c.id ? { ...z, classId: undefined } : z)),
          teachers: s.teachers.map((t) => (t.id === c.teacherId ? { ...t, classId: c.id } : t)),
        }));
        settingsLog(get, bi(`${exists ? 'تعديل' : 'إضافة'} فصل ${c.name}`, `class ${c.name} ${exists ? 'edited' : 'added'}`));
      },
      removeClass: (id) => {
        const c = get().classes.find((x) => x.id === id);
        set((s) => ({
          classes: s.classes.filter((x) => x.id !== id),
          students: s.students.filter((x) => x.classId !== id),
          zones: s.zones.map((z) => (z.classId === id ? { ...z, classId: undefined } : z)),
        }));
        settingsLog(get, bi(`حذف فصل ${c?.name} وطالباته`, `class ${c?.name} and its students deleted`));
      },
      upsertTeacher: (t) => {
        const exists = get().teachers.some((x) => x.id === t.id);
        set((s) => ({ teachers: exists ? s.teachers.map((x) => (x.id === t.id ? t : x)) : [...s.teachers, t] }));
        settingsLog(get, bi(`${exists ? 'تعديل' : 'إضافة'} المعلمة ${t.name}`, `teacher ${N(t).en} ${exists ? 'edited' : 'added'}`));
      },
      removeTeacher: (id) => { const t = get().teachers.find((x) => x.id === id); set((s) => ({ teachers: s.teachers.filter((x) => x.id !== id) })); settingsLog(get, bi(`حذف المعلمة ${t?.name}`, `teacher ${N(t).en} deleted`)); },
      upsertStudent: (stu) => {
        const exists = get().students.some((x) => x.id === stu.id);
        set((s) => ({ students: exists ? s.students.map((x) => (x.id === stu.id ? stu : x)) : [...s.students, stu] }));
        settingsLog(get, bi(`${exists ? 'تعديل' : 'إضافة'} الطالبة ${stu.name}`, `student ${N(stu).en} ${exists ? 'edited' : 'added'}`));
      },
      removeStudent: (id) => { const x = get().students.find((s) => s.id === id); set((s) => ({ students: s.students.filter((y) => y.id !== id) })); settingsLog(get, bi(`حذف الطالبة ${x?.name}`, `student ${N(x).en} deleted`)); },
      upsertSensor: (sn) => {
        const old = get().sensors.find((x) => x.id === sn.id);
        set((s) => ({ sensors: old ? s.sensors.map((x) => (x.id === sn.id ? sn : x)) : [...s.sensors, sn] }));
        if (old && old.online !== sn.online) {
          get().log({ category: 'sensor', level: sn.online ? 'success' : 'warning', actor: who(get().user), message: bi(`${sn.name}: ${sn.online ? 'تم تفعيل الحساس' : 'تم تعطيل الحساس / غير متصل'}`, `${N(sn).en}: ${sn.online ? 'sensor enabled' : 'sensor disabled / offline'}`) });
        } else settingsLog(get, bi(`${old ? 'تعديل' : 'إضافة'} الحساس ${sn.name}`, `sensor ${N(sn).en} ${old ? 'edited' : 'added'}`));
      },
      removeSensor: (id) => { const x = get().sensors.find((s) => s.id === id); set((s) => ({ sensors: s.sensors.filter((y) => y.id !== id) })); settingsLog(get, bi(`حذف الحساس ${x?.name}`, `sensor ${N(x).en} deleted`)); },
      upsertExit: (ex) => {
        const exists = get().exits.some((x) => x.id === ex.id);
        set((s) => ({ exits: exists ? s.exits.map((x) => (x.id === ex.id ? ex : x)) : [...s.exits, ex] }));
        settingsLog(get, bi(`${exists ? 'تعديل' : 'إضافة'} مخرج الطوارئ ${ex.name}`, `emergency exit ${N(ex).en} ${exists ? 'edited' : 'added'}`));
      },
      removeExit: (id) => { const x = get().exits.find((s) => s.id === id); set((s) => ({ exits: s.exits.filter((y) => y.id !== id) })); settingsLog(get, bi(`حذف المخرج ${x?.name}`, `exit ${N(x).en} deleted`)); },
      upsertFloor: (f) => { set((s) => ({ floors: s.floors.map((x) => (x.id === f.id ? f : x)) })); settingsLog(get, bi(`تعديل ${f.name}`, `${N(f).en} edited`)); },
      updateProcedure: (p) => { set((s) => ({ procedures: s.procedures.map((x) => (x.id === p.id ? p : x)) })); settingsLog(get, bi(`تحديث الإجراء المعتمد: ${p.title}`, `approved procedure updated: ${p.titleEn ?? p.title}`)); },
      resetDemoData: () => {
        plan = null;
        set({ ...baseData(), alerts: [], logs: [], notifications: [], cases: [], emergency: EMPTY_EMERGENCY, zoneStatus: initialZoneStatus(), observed: {}, showAlertModal: null });
        get().log({ category: 'system', level: 'info', actor: who(get().user), message: 'إعادة تعيين البيانات التجريبية إلى الوضع الافتراضي' });
      },
    }),
    {
      name: 'istibaq-demo-v4',
      version: 1,
      partialize: (s) => ({
        lang: s.lang,
        user: s.user, school: s.school, floors: s.floors, classes: s.classes, teachers: s.teachers,
        students: s.students.map((x) => ({ ...x, safety: 'unverified' as const, note: undefined, confirmedAt: undefined, confirmedBy: undefined })),
        sensors: s.sensors.map((x) => ({ ...x, reading: 0, triggered: false })), exits: s.exits, procedures: s.procedures, history: s.history,
        zones: s.zones,
      }),
    },
  ),
);

function settingsLog(get: () => AppState, message: Text) {
  const m = both(message);
  get().log({ category: 'manual', level: 'info', actor: who(get().user), message: bi(`الإعدادات: ${m.ar}`, `Settings: ${m.en}`) });
}

function who(u: User | null): Text {
  return u ? N(u) : 'النظام';
}

const SEV_EN: Record<Severity, string> = { low: 'low', medium: 'medium', high: 'high', critical: 'critical' };

function severityAr(s: Severity) {
  return { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', critical: 'حرجة' }[s];
}

/** students held back by the script for scripted incidents */
function reservedStudents(students: Student[], classId: string): string[] {
  const list = students.filter((x) => x.classId === classId && x.attendance !== 'absent');
  if (classId === 'C2-2') {
    const asthma = list.find((x) => x.medicalNote?.startsWith('ربو'));
    return asthma ? [asthma.id] : [];
  }
  if (classId === 'C1-3') return list.length ? [list[list.length - 1].id] : [];
  return [];
}

/* ------------------------------------------------------------------ */
function buildPlan(st: AppState, alert: Alert, scripted: boolean): Plan {
  const rnd = mulberry32(Math.floor(Date.now() / 1000));
  const r = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
  const floorRange: Record<string, [number, number]> = { G: [4, 8], F1: [8, 14], F2: [11, 19] };
  const level = (fid: string) => st.floors.find((f) => f.id === fid)?.level ?? 0;
  const range = (fid: string): [number, number] => floorRange[fid] ?? [6 + level(fid) * 4, 12 + level(fid) * 5];

  // danger zone: alert location (or scripted fire origin)
  const dangerZone = scripted
    ? 'F1-B4'
    : st.zones.find((z) => alert.location && z.name === both(alert.location).ar && (alert.type === 'fire' || alert.type === 'evacuation'))?.id;

  const zones: Plan['zones'] = {};
  const floorMax: Record<string, number> = {};
  for (const z of st.zones) {
    if (z.kind === 'corridor' || z.kind === 'stairs') continue;
    const [a, b] = range(z.floorId);
    const clearAt = r(a, b);
    floorMax[z.floorId] = Math.max(floorMax[z.floorId] ?? 0, clearAt);
    zones[z.id] = { clearAt, final: z.id === dangerZone ? 'danger' : 'cleared' };
  }
  for (const z of st.zones) {
    if (z.kind === 'corridor') zones[z.id] = { clearAt: (floorMax[z.floorId] ?? 10) + 3, final: 'cleared' };
    if (z.kind === 'stairs') zones[z.id] = { clearAt: (floorMax[z.floorId] ?? 10) + 5, final: 'cleared' };
  }
  // zones whose camera is offline cannot be confirmed automatically
  for (const sn of st.sensors) {
    if (!sn.online && sn.kind === 'camera' && sn.zoneId && zones[sn.zoneId]) zones[sn.zoneId].final = 'needs_check';
  }
  if (dangerZone && zones[dangerZone]) zones[dangerZone].clearAt = 0;

  const classes: Plan['classes'] = {};
  for (const c of st.classes) {
    const clearAt = zones[c.zoneId]?.clearAt ?? 8;
    const expected = st.students.filter((s) => s.classId === c.id && s.attendance !== 'absent').length;
    let limit = expected;
    let confirmStart = clearAt + r(5, 9);
    let rate = r(2, 4);
    if (c.id === 'C2-3') limit = Math.round(expected * 0.6); // demo teacher – left for manual confirmation
    if (c.id === 'C3-4') { limit = Math.max(0, expected - 3); confirmStart += 8; rate = 2; }
    if (c.id === 'C1-3' || c.id === 'C2-2') limit = expected - 1;
    classes[c.id] = { clearAt, exitStart: Math.max(1, clearAt - 3), confirmStart, rate, limit, noise: c.id === 'C3-4' ? 0 : c.id === 'C1-4' ? 2 : c.id === 'C2-1' ? -1 : 0 };
  }

  const events: SimEvent[] = [];
  const S = () => useStore.getState();
  const teacherNameOf = (cid: string) => {
    const c = S().classes.find((x) => x.id === cid);
    const tt = S().teachers.find((x) => x.id === c?.teacherId);
    return tt ? N(tt) : bi('المعلمة', 'The teacher');
  };
  if (scripted) {
    events.push({
      at: 1, done: false, run: () => {
        S().log({ category: 'sensor', level: 'critical', actor: 'كاشف دخان – مختبر العلوم', message: 'قراءة دخان مرتفعة وتجاوز حد الإنذار – تم تصنيف مختبر العلوم "منطقة خطر"' });
      },
    });
    events.push({
      at: 2, done: false, run: () => {
        S().log({ category: 'sensor', level: 'info', actor: 'حساسات الأبواب', message: 'رصد فتح مخارج الطوارئ في جميع الطوابق (قراءة محاكاة)' });
      },
    });
    events.push({
      at: 3, done: false, run: () => {
        S().log({ category: 'sensor', level: 'warning', actor: 'وحدة الرصد', message: 'كاميرا عدّ درج الطابق الثاني غير متصلة (بطارية 12%) – منطقة الدرج تتطلب تحققًا بشريًا' });
        S().notify({ title: bi('حساس غير متصل', 'Sensor offline'), body: bi('كاميرا عدّ درج الطابق الثاني لا ترسل قراءات. يلزم تحقق بشري من المنطقة.', 'The Second Floor stairs counting camera is not sending readings. A human check of the area is required.'), audience: ['safety', 'admin'], level: 'warning', link: '/monitoring' }, false);
      },
    });
    events.push({
      at: 6, done: false, run: () => {
        S().requestHelp({ zoneId: 'F1-B4', helpType: 'zone_check', priority: 'p1', actor: 'وحدة الرصد', description: bi('مصدر الدخان المحتمل في مختبر العلوم – يمنع الدخول، ويلزم التنسيق مع الجهة المختصة وتأكيد خلو المختبر.', 'Probable source of smoke in the Science Lab – no entry; coordinate with the competent authority and confirm the lab is empty.') });
      },
    });
    events.push({
      at: 18, done: false, run: () => {
        const stu = S().students.find((x) => x.classId === 'C2-2' && x.attendance !== 'absent' && x.medicalNote?.startsWith('ربو'));
        if (stu && stu.safety === 'unverified') S().setStudentSafety(stu.id, 'needs_help', teacherNameOf('C2-2'), bi('ضيق تنفس (ربو) في نقطة التجمع – تحتاج المسؤولة الصحية', 'Shortness of breath (asthma) at the assembly point – needs the health officer'));
      },
    });
    events.push({
      at: 22, done: false, run: () => {
        const z = S().zoneStatus['F2-T2'];
        if (z === 'needs_check') S().requestHelp({ zoneId: 'F2-T2', helpType: 'zone_check', priority: 'p2', actor: 'وحدة الرصد', description: bi('لا تتوفر قراءة عدّ لدرج الطابق الثاني بسبب انقطاع الكاميرا – يلزم تفقد بشري.', 'No count is available for the Second Floor stairs because the camera is offline – a human check is required.') });
      },
    });
    events.push({
      at: 30, done: false, run: () => {
        const list = S().students.filter((x) => x.classId === 'C1-3' && x.attendance !== 'absent');
        const stu = list[list.length - 1];
        if (stu && stu.safety === 'unverified') {
          S().setStudentSafety(stu.id, 'not_found', teacherNameOf('C1-3'), bi('لم تُشاهد في نقطة التجمع – آخر مشاهدة حسب زميلاتها: دورات المياه بالطابق الأرضي', 'Not seen at the assembly point – classmates last saw her at the Ground Floor restrooms'));
          S().setZoneStatus('G-B2', 'needs_check', 'وحدة الرصد');
        }
      },
    });
    events.push({
      at: 34, done: false, run: () => {
        const st2 = S();
        const stats = classStats(st2.classes, st2.students, st2.observed, true).filter((x) => x.cls.assemblyPointId === 'AP-A');
        const obs = stats.reduce((a, x) => a + x.observed, 0);
        const conf = stats.reduce((a, x) => a + x.confirmed, 0);
        st2.log({ category: 'system', level: 'warning', actor: 'محرك المطابقة', message: bi(`نقطة التجمع (أ): العدد المرصود ${obs} مقابل ${conf} مؤكدة بالاسم – الفرق لا يُعتبر إثباتًا لسلامة أي طالبة بعينها`, `Assembly Point A: ${obs} observed vs ${conf} confirmed by name – the count does not prove any specific student is safe`) });
      },
    });
    events.push({
      at: 44, done: false, run: () => {
        const st2 = S();
        const stats = classStats(st2.classes, st2.students, st2.observed, true);
        for (const s of stats) {
          if (s.unverified > 0 && !st2.cases.some((c) => c.classId === s.cls.id && c.status !== 'resolved')) {
            const teacher = st2.teachers.find((x) => x.id === s.cls.teacherId);
            S().requestHelp({ classId: s.cls.id, helpType: 'other', priority: 'p2', actor: 'محرك المطابقة', description: bi(`${s.unverified} طالبة لم يتم تأكيد سلامتها بالاسم بعد مرور 44 ثانية (العدد المرصود ${s.observed}).`, `${s.unverified} student(s) still not confirmed by name after 44 seconds (observed count ${s.observed}).`) });
            S().notify({ title: bi(`مطلوب استكمال حصر فصل ${s.cls.name}`, `Please complete accountability for class ${s.cls.name}`), body: bi(`يرجى تأكيد سلامة ${s.unverified} طالبة متبقية بالاسم.`, `Please confirm the remaining ${s.unverified} student(s) by name.`), audience: ['teacher'], teacherId: teacher?.id, level: 'warning', link: '/teacher' });
          }
        }
      },
    });
    events.push({
      at: 48, done: false, run: () => {
        S().log({ category: 'system', level: 'info', actor: 'المنصة', message: 'اكتمل السيناريو الآلي – الحالات المتبقية بانتظار المتابعة اليدوية من الفريق' });
      },
    });
  }
  return { classes, zones, events, scripted };
}

export function useCurrentStats() {
  const classes = useStore((s) => s.classes);
  const students = useStore((s) => s.students);
  const observed = useStore((s) => s.observed);
  const active = useStore((s) => s.emergency.active);
  const stats = classStats(classes, students, observed, active);
  return { stats, totals: totals(stats) };
}
