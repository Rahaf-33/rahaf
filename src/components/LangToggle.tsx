import { Languages } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cx } from './ui';

/** Switches the whole interface between Arabic (RTL) and English (LTR). */
export function LangToggle({ dark = false, className }: { dark?: boolean; className?: string }) {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  return (
    <div
      className={cx('inline-flex items-center gap-0.5 rounded-xl p-1 text-xs font-bold', dark ? 'bg-white/10 text-white' : 'bg-navy-50 text-navy-700 ring-1 ring-navy-100', className)}
      role="group"
      aria-label={lang === 'en' ? 'Language' : 'اللغة'}
    >
      <Languages className={cx('mx-1 h-4 w-4', dark ? 'text-navy-300' : 'text-navy-400')} aria-hidden="true" />
      {(['ar', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          lang={l}
          className={cx('rounded-lg px-2.5 py-1 transition', lang === l ? (dark ? 'bg-white text-navy-900' : 'bg-navy-800 text-white shadow-sm') : dark ? 'hover:bg-white/10' : 'hover:bg-white')}
        >
          {l === 'ar' ? 'العربية' : 'English'}
        </button>
      ))}
    </div>
  );
}
