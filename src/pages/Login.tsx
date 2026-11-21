import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldCheck, Radar, BrainCircuit, ClipboardCheck, ScanFace, User as UserIcon, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Logo, LogoMark, useSlogan } from '@/components/Logo';
import { Button, cx, inputCls } from '@/components/ui';
import { LangToggle } from '@/components/LangToggle';
import { homeFor } from '@/lib/nav';
import { useI18n } from '@/i18n';

export default function Login() {
  const signIn = useStore((s) => s.signIn);
  const nav = useNavigate();
  const { tr, isEn } = useI18n();
  const slogan = useSlogan();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!lockUntil) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [lockUntil]);
  const lockedSec = lockUntil ? Math.max(0, Math.ceil((lockUntil - now) / 1000)) : 0;
  useEffect(() => { if (lockUntil && lockedSec === 0) { setLockUntil(null); setError(''); } }, [lockUntil, lockedSec]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) { setError(tr('أدخلي اسم المستخدم وكلمة المرور')); return; }
    setBusy(true);
    setError('');
    const res = await signIn(username, password);
    setBusy(false);
    if (res.ok) {
      const u = useStore.getState().user!;
      nav(homeFor(u.role), { replace: true });
      return;
    }
    setPassword('');
    if (res.error === 'locked') { setLockUntil(res.lockUntil ?? Date.now() + 60_000); setNow(Date.now()); setError(tr('تم إيقاف محاولات الدخول مؤقتًا بسبب تكرار المحاولات الخاطئة.')); }
    else if (res.error === 'crypto') setError(tr('المتصفح لا يدعم التشفير الآمن على هذا الرابط. افتحي المنصة عبر رابط https أو localhost.'));
    else setError(tr('اسم المستخدم أو كلمة المرور غير صحيحة.'));
  };

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
                { i: <ScanFace className="h-5 w-5" />, t: tr('بدون تعرّف على الوجوه') },
              ].map((f) => (
                <div key={f.t} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
                  <span className="text-sky-300">{f.i}</span> {f.t}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-navy-400">{tr('الدخول مقصور على منسوبات المدرسة المصرّح لهن.')}</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[#f4f7fc] px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-start justify-between gap-3">
            <div className="lg:hidden">
              <Logo />
              <p className="mt-3 text-sm font-semibold text-navy-600">{slogan}</p>
            </div>
            <div className="ms-auto"><LangToggle /></div>
          </div>
          <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-navy-800 text-white shadow-card"><Lock className="h-6 w-6" /></span>
          <h2 className="font-display text-3xl font-extrabold text-navy-900">{tr('تسجيل الدخول')}</h2>
          <p className="mt-1 text-sm text-navy-500">{tr('أدخلي اسم المستخدم وكلمة المرور الخاصة بك')}</p>

          <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-navy-900/5" noValidate>
            <label className="block" htmlFor="username">
              <span className="mb-1 block text-xs font-semibold text-navy-700">{tr('اسم المستخدم')}</span>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-navy-400" />
                <input id="username" name="username" className={cx(inputCls, 'ps-9')} value={username} onChange={(e) => setUsername(e.target.value)} dir="ltr" autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus disabled={!!lockUntil} />
              </div>
            </label>
            <label className="block" htmlFor="password">
              <span className="mb-1 block text-xs font-semibold text-navy-700">{tr('كلمة المرور')}</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3 top-2.5 h-4 w-4 text-navy-400" />
                <input id="password" name="password" type={show ? 'text' : 'password'} className={cx(inputCls, 'pe-10 ps-9')} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" autoComplete="current-password" disabled={!!lockUntil} />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute end-2 top-1.5 rounded-lg p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700" aria-label={show ? tr('إخفاء كلمة المرور') : tr('إظهار كلمة المرور')}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            {error && (
              <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-xs text-danger-dark">
                {error}{lockUntil ? ` ${tr('حاولي مرة أخرى بعد {n} ثانية.', { n: lockedSec })}` : ''}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy || !!lockUntil} icon={busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}>
              {busy ? tr('جارٍ التحقق…') : tr('دخول')}
            </Button>
          </form>
          <p className="mt-4 text-center text-[11px] text-navy-400">{tr('نسيتِ كلمة المرور؟ تواصلي مع مديرة النظام لإعادة تعيينها.')}</p>
        </div>
      </div>
    </div>
  );
}
