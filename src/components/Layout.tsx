import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, PlayCircle, Square, X, Pause, Play, ShieldCheck, Gauge, Siren } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { NAV } from '@/lib/nav';
import { Logo, useSlogan } from './Logo';
import { LangToggle } from './LangToggle';
import { schoolText } from '@/lib/labels';
import { Button, cx, DemoBadge } from './ui';
import { ROLE_LABEL, TYPE_LABEL, formatDuration, timeAgo } from '@/lib/labels';
import { Toaster } from './Toaster';
import { AlertModal } from './AlertModal';
import { useI18n } from '@/i18n';

function SimulationDriver() {
  const active = useStore((s) => s.emergency.active);
  const speed = useStore((s) => s.emergency.speed);
  const paused = useStore((s) => s.emergency.paused);
  const tick = useStore((s) => s.tick);
  useEffect(() => {
    if (!active || paused) return;
    const id = window.setInterval(tick, 1000 / speed);
    return () => window.clearInterval(id);
  }, [active, paused, speed, tick]);
  return null;
}

export function EmergencyControls({ compact = false }: { compact?: boolean }) {
  const { tr } = useI18n();
  const e = useStore((s) => s.emergency);
  const user = useStore((s) => s.user);
  const startSimulation = useStore((s) => s.startSimulation);
  const endEmergency = useStore((s) => s.endEmergency);
  const [confirmEnd, setConfirmEnd] = useState(false);
  if (!user || user.role === 'teacher') return null;
  if (!e.active) {
    return (
      <Button variant="danger" size={compact ? 'sm' : 'md'} onClick={startSimulation} icon={<PlayCircle className="h-4 w-4" />} className="shadow-glow">
        {tr('محاكاة حالة طوارئ')}
      </Button>
    );
  }
  return confirmEnd ? (
    <div className="flex items-center gap-1.5">
      <Button variant="success" size="sm" onClick={() => { endEmergency(); setConfirmEnd(false); }}>{tr('تأكيد الإنهاء')}</Button>
      <Button variant="outline" size="sm" onClick={() => setConfirmEnd(false)}>{tr('تراجع')}</Button>
    </div>
  ) : (
    <Button variant="outline" size={compact ? 'sm' : 'md'} onClick={() => setConfirmEnd(true)} icon={<Square className="h-4 w-4" />}>
      {e.simulation ? tr('إنهاء المحاكاة') : tr('إنهاء الطوارئ')}
    </Button>
  );
}

function EmergencyBanner() {
  const { tr, tx } = useI18n();
  const e = useStore((s) => s.emergency);
  const alert = useStore((s) => s.alerts.find((a) => a.id === s.emergency.alertId));
  const setSpeed = useStore((s) => s.setSpeed);
  const togglePause = useStore((s) => s.togglePause);
  const setAlertModal = useStore((s) => s.setAlertModal);
  const user = useStore((s) => s.user);
  if (!e.active) return null;
  return (
    <div className="no-print bg-gradient-to-l from-danger-dark via-danger to-danger-dark text-white shadow-lg">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white/15 animate-pulseRing">
          <Siren className="h-5 w-5" />
        </span>
        <button className="min-w-0 flex-1 text-start" onClick={() => setAlertModal(e.alertId ?? null)}>
          <p className="truncate font-display text-sm font-extrabold sm:text-base">
            {tr('وضع الطوارئ مُفعّل —')} {TYPE_LABEL[e.type!]} {e.simulation && <span className="ms-1 rounded bg-white/20 px-1.5 py-0.5 text-[11px] font-bold">{tr('محاكاة')}</span>}
          </p>
          <p className="truncate text-xs text-white/85">{alert?.location ? `${tr('الموقع:')} ${tx(alert.location)} · ` : ''}{tx(alert?.title)} {tr('· اضغطي لعرض التعليمات المعتمدة')}</p>
        </button>
        <div className="flex items-center gap-2 rounded-xl bg-black/15 px-3 py-1.5 font-mono text-lg font-bold tabular-nums" title={tr('الزمن المنقضي منذ التفعيل')}>
          {formatDuration(e.tick)}
        </div>
        {user?.role !== 'teacher' && e.simulation && (
          <div className="flex items-center gap-1 rounded-xl bg-black/15 p-1">
            <button onClick={togglePause} className="rounded-lg p-1.5 hover:bg-white/15" aria-label={e.paused ? tr('استئناف') : tr('إيقاف مؤقت')}>
              {e.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <Gauge className="mx-0.5 h-4 w-4 opacity-70" />
            {[1, 2, 4].map((n) => (
              <button key={n} onClick={() => setSpeed(n)} className={cx('rounded-lg px-2 py-1 text-xs font-bold', e.speed === n ? 'bg-white text-danger' : 'hover:bg-white/15')}>
                {n}×
              </button>
            ))}
          </div>
        )}
        <EmergencyControls compact />
      </div>
    </div>
  );
}

function NotificationsMenu() {
  const { tr, tx } = useI18n();
  const user = useStore((s) => s.user)!;
  const all = useStore((s) => s.notifications);
  const markAll = useStore((s) => s.markNotificationsRead);
  const markOne = useStore((s) => s.markNotificationRead);
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const mine = useMemo(() => all.filter((n) => n.audience.includes(user.role) && (!n.teacherId || n.teacherId === user.teacherId)), [all, user]);
  const unread = mine.filter((n) => !n.read).length;
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-xl p-2 text-navy-700 hover:bg-navy-50" aria-label={tr('الإشعارات')}>
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -end-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute end-0 z-40 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-navy-900/10 animate-slideIn">
          <div className="flex items-center justify-between border-b border-navy-50 px-4 py-3">
            <p className="font-bold text-navy-900">{tr('الإشعارات')}</p>
            <button className="text-xs font-semibold text-brand hover:underline" onClick={() => markAll(user.role, user.teacherId)}>{tr('تحديد الكل كمقروء')}</button>
          </div>
          <p className="bg-amber-50 px-4 py-1.5 text-[11px] text-amber-800">{tr('إشعارات داخل المنصة فقط (محاكاة) – لا يتم إرسال رسائل خارجية.')}</p>
          <ul className="max-h-96 divide-y divide-navy-50 overflow-y-auto">
            {mine.length === 0 && <li className="p-6 text-center text-sm text-navy-400">{tr('لا توجد إشعارات')}</li>}
            {mine.slice(0, 40).map((n) => (
              <li key={n.id}>
                <button
                  className={cx('block w-full px-4 py-3 text-start hover:bg-navy-50', !n.read && 'bg-sky-50/60')}
                  onClick={() => { markOne(n.id); if (n.link) nav(n.link); setOpen(false); }}
                >
                  <div className="flex items-start gap-2">
                    <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', { info: 'bg-brand', success: 'bg-safe', warning: 'bg-warn', critical: 'bg-danger' }[n.level])} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-900">{tx(n.title)}</p>
                      <p className="line-clamp-2 text-xs text-navy-500">{tx(n.body)}</p>
                      <p className="mt-0.5 text-[10px] text-navy-400">{timeAgo(n.at)}</p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const { tr, n, lang } = useI18n();
  const slogan = useSlogan();
  const user = useStore((s) => s.user)!;
  const logout = useStore((s) => s.logout);
  const school = useStore((s) => s.school);
  const e = useStore((s) => s.emergency);
  const openCases = useStore((s) => s.cases.filter((c) => c.status !== 'resolved').length);
  const newAlerts = useStore((s) => s.alerts.filter((a) => a.status === 'new').length);
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setMobileOpen(false), [loc.pathname]);
  const items = NAV.filter((it) => it.roles.includes(user.role));

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-900 text-navy-100">
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <Logo dark />
        <button className="rounded-lg p-1.5 text-navy-300 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} aria-label={tr('إغلاق القائمة')}><X className="h-5 w-5" /></button>
      </div>
      <div className={cx('mx-4 mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold', e.active ? 'bg-danger/20 text-red-200' : 'bg-safe/15 text-green-200')}>
        <span className={cx('h-2 w-2 rounded-full', e.active ? 'bg-danger animate-pulse' : 'bg-safe')} />
        {e.active ? tr('حالة طوارئ نشطة') : tr('المدرسة في وضع آمن')}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) => cx(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isActive ? 'bg-white text-navy-900 shadow' : 'text-navy-200 hover:bg-white/10 hover:text-white',
            )}
          >
            {it.icon}
            <span className="flex-1">{tr(it.label)}</span>
            {it.to === '/cases' && openCases > 0 && <span className="rounded-full bg-danger px-2 text-[11px] font-bold text-white">{openCases}</span>}
            {it.to === '/alerts' && newAlerts > 0 && <span className="rounded-full bg-warn px-2 text-[11px] font-bold text-white">{newAlerts}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="text-[11px] leading-relaxed text-navy-300">{slogan}</p>
        <p className="mt-2 text-[10px] text-navy-400">{tr('نسخة عرض – جميع البيانات والحساسات افتراضية.')}</p>
        <LangToggle dark className="mt-3 sm:hidden" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7fc]">
      <SimulationDriver />
      <aside className="no-print fixed inset-y-0 start-0 z-40 hidden w-72 lg:block">{sidebar}</aside>
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 max-w-[85vw] animate-slideIn">{sidebar}</aside>
        </div>
      )}
      <div className="lg:ms-72">
        <div className="no-print sticky top-0 z-30">
        <EmergencyBanner />
        <header className="border-b border-navy-100/70 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6">
            <button className="rounded-xl p-2 text-navy-700 hover:bg-navy-50 lg:hidden" onClick={() => setMobileOpen(true)} aria-label={tr('القائمة')}><Menu className="h-5 w-5" /></button>
            <div className="lg:hidden"><Logo compact /></div>
            <div className="hidden min-w-0 flex-1 sm:block">
              <p className="truncate text-sm font-bold text-navy-900">{schoolText(school, 'name', lang)}</p>
              <p className="flex items-center gap-2 truncate text-xs text-navy-500"><ShieldCheck className="h-3.5 w-3.5" /> {schoolText(school, 'district', lang)} <DemoBadge /></p>
            </div>
            <div className="flex-1 sm:hidden" />
            {!e.active && <div className="hidden md:block"><EmergencyControls /></div>}
            <LangToggle className="hidden sm:inline-flex" />
            <NotificationsMenu />
            <div className="flex items-center gap-2 rounded-xl bg-navy-50 py-1 pe-1 ps-3">
              <div className="hidden text-start leading-tight sm:block">
                <p className="text-xs font-bold text-navy-900">{n(user)}</p>
                <p className="text-[10px] text-navy-500">{ROLE_LABEL[user.role]}</p>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-800 text-sm font-bold text-white">{n(user).replace(/^(أ\.|م\.|Ms\.|Eng\.)\s*/, '').charAt(0)}</span>
              <button onClick={logout} className="rounded-lg p-1.5 text-navy-500 hover:bg-white hover:text-danger" aria-label={tr('تسجيل الخروج')} title={tr('تسجيل الخروج')}><LogOut className="h-4 w-4" /></button>
            </div>
          </div>
          {!e.active && user.role !== 'teacher' && (
            <div className="border-t border-navy-50 px-4 py-2 md:hidden"><EmergencyControls compact /></div>
          )}
        </header>
        </div>
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
      <Toaster />
      <AlertModal />
    </div>
  );
}
