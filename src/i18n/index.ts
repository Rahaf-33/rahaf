import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { pick, textOf, translate, type Lang, type Params, type Text } from './core';

export * from './core';

export const getLang = (): Lang => useStore.getState().lang;

export function useI18n() {
  const lang = useStore((s) => s.lang);
  return {
    lang,
    isEn: lang === 'en',
    dir: (lang === 'en' ? 'ltr' : 'rtl') as 'ltr' | 'rtl',
    tr: (ar: string, params?: Params) => translate(lang, ar, params),
    tx: (text: Text | undefined | null) => textOf(lang, text),
    n: <T extends object>(obj: T | undefined | null, field: keyof T & string = 'name' as keyof T & string) => pick(lang, obj, field),
  };
}

/** Keeps <html dir/lang> in sync with the selected language. */
export function useDocumentLang() {
  const lang = useStore((s) => s.lang);
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('lang', lang);
    el.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
    document.title = lang === 'en' ? 'ISTIBAQ | Emergency Response' : 'ISTIBAQ | استباق';
  }, [lang]);
}

/** Translate outside React components (uses the current language at call time). */
export const trNow = (ar: string, params?: Params) => translate(getLang(), ar, params);
