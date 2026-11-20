import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, GraduationCap, HardHat, Lock, Settings2, ShieldCheck, Radar, BrainCircuit, ClipboardCheck, EyeOff, User as UserIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { DEMO_USERS } from '@/data/seed';
import { Logo, LogoMark, useSlogan } from '@/components/Logo';
import { Button, cx, inputCls } from '@/components/ui';
import { LangToggle } from '@/components/LangToggle';
import { homeFor } from '@/lib/nav';
import { useI18n } from '@/i18n';
import type { Role } from '@/types';

const ROLE_ICON: Record<Role, JSX.Element> = {
  principal: <Crown className="h-5 w-5" />, teacher: <GraduationCap className="h-5 w-5" />, safety: <HardHat className="h-5 w-5" />, admin: <Settings2 className="h-5 w-5" />,
};
const ROLE_DESC: Record<Role, string> = {
  principal: 'لوحة القيادة وإدارة الطوارئ والتقارير',
  teacher: 'تأكيد حضور وسلامة طالبات الفصل',
  safety: 'الإنذارات والرصد ومركز الحالات',
  admin: 'إعدادات المدرسة والحساسات والمستخدمين',
};
const USERNAMES: Record<Role, string> = { principal: 'principal', teacher: 'teacher', safety: 'safety', admin: 'admin' };

export default function Login() {
  const login = useStore((s) => s.login);
  const nav = useNavigate();
  const { tr, n, isEn } = useI18n();
  const slogan = useSlogan();
  const [role, setRole] = useState<Role>('principal');
  const [username, setUsername] = useState('principal');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');

  const choose = (r: Role) => { setRole(r); setUsername(USERNAMES[r]); setPassword('demo1234'); setError(''); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = DEMO_USERS.find((u) => USERNAMES[u.role] === username.trim().toLowerCase());
    if (!user || password !== 'demo1234') { setError(tr('بيانات الدخول غير صحيحة. استخدمي أحد الحسابات التجريبية (كلمة المرور: demo1234).')); return; }
    login(user);
    nav(homeFor(user.role), { replace: true });
  };
  const shortTitle = (u: (typeof DEMO_USERS)[number]) => n(u, 'title').split(' – ')[0];

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-navy-950 text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(42,120,214,.45),transparent_55%),radial-gradient(circle_at_10%_90%,rgba(18,161,80,.25),transparent_45%)]" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden="true">
          <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#fff" strokeWidth="1" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo dark />
          <div className="max-w-xl">
            <div className="relative mb-10 h-44 w-44">
              <span className="absolute inset-0 rounded-full border border-brand/40 animate-ping" style={{ animationDuration: '3s' }} />
              <span className="absolute inset-6 rounded-full border border-brand/30" />
              <span className="absolute inset-12 rounded-full border border-brand/20" />
              <LogoMark className="absolute inset-10 h-24 w-24" />
            </div>
            <h1 className="font-display text-5xl font-black leading-tight">
              <span dir="ltr" className="tracking-[0.15em]">ISTIBAQ</span> {isEn ? '' : '| استباق'}
            </h1>
            <p className="mt-4 text-2xl font-bold text-sky-200">{slogan}</p>
            <p className="mt-4 max-w-lg leading-relaxed text-navy-200">
              {tr('منصة ذكية تستقبل الإنذارات وتحلل نوع الخطر، وتعرض التعليمات المعتمدة، وتفعّل الرصد المؤقت عند الطوارئ فقط، ثم تطابق أعداد الإخلاء مع سجلات الحضور وتأكيد المعلمات لتحديد من لم يُتحقق من سلامتها.')}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
              {[
                { i: <BrainCircuit className="h-5 w-5" />, t: tr('تحليل ذكي للإنذارات') },
                { i: <Radar className="h-5 w-5" />, t: tr('رصد مؤقت عند الطوارئ فقط') },
                { i: <ClipboardCheck className="h-5 w-5" />, t: tr('حصر بالاسم وليس بالعدد') },
                { i: <EyeOff className="h-5 w-5" />, t: tr('بدون تعرّف على الوجوه') },
              ].map((f) => (
                <div key={f.t} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
                  <span className="text-sky-300">{f.i}</span> {f.t}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-navy-400">{tr('نسخة عرض لهاكاثون – جميع البيانات والحساسات والكاميرات افتراضية ولا يوجد اتصال بأي جهة رسمية.')}</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[#f4f7fc] px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="lg:hidden">
              <Logo />
              <p className="mt-3 text-sm font-semibold text-navy-600">{slogan}</p>
            </div>
            <div className="ms-auto"><LangToggle /></div>
          </div>
          <h2 className="font-display text-3xl font-extrabold text-navy-900">{tr('تسجيل الدخول')}</h2>
          <p className="mt-1 text-sm text-navy-500">{tr('اختاري الدور للدخول بحساب تجريبي')}</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {DEMO_USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => choose(u.role)}
                className={cx('rounded-2xl p-3 text-start ring-1 transition', role === u.role ? 'bg-navy-800 text-white ring-navy-800 shadow-card' : 'bg-white text-navy-800 ring-navy-100 hover:ring-navy-300')}
              >
                <span className={cx('mb-2 grid h-9 w-9 place-items-center rounded-xl', role === u.role ? 'bg-white/15' : 'bg-navy-50 text-navy-700')}>{ROLE_ICON[u.role]}</span>
                <p className="text-sm font-bold">{shortTitle(u)}</p>
                <p className={cx('mt-0.5 text-[11px] leading-snug', role === u.role ? 'text-navy-200' : 'text-navy-500')}>{tr(ROLE_DESC[u.role])}</p>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-navy-900/5">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-navy-700">{tr('اسم المستخدم')}</span>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-navy-400" />
                <input id="username" className={cx(inputCls, 'ps-9')} value={username} onChange={(e) => setUsername(e.target.value)} dir="ltr" autoComplete="username" />
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-navy-700">{tr('كلمة المرور')}</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-navy-400" />
                <input id="password" type="password" className={cx(inputCls, 'ps-9')} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" autoComplete="current-password" />
              </div>
            </label>
            {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-xs text-danger-dark">{error}</p>}
            <Button type="submit" size="lg" className="w-full" icon={<ShieldCheck className="h-5 w-5" />}>
              {tr('دخول بصفة {role}', { role: shortTitle(DEMO_USERS.find((u) => u.role === role)!) })}
            </Button>
            <p className="text-center text-[11px] text-navy-400">{tr('حسابات تجريبية: principal / teacher / safety / admin — كلمة المرور: demo1234')}</p>
          </form>
        </div>
      </div>
    </div>
  );
}
