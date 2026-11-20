import { EN } from './en';

export type Lang = 'ar' | 'en';
/** Bilingual text produced at runtime (logs, notifications, cases…). Plain strings are looked up in the dictionary. */
export type Text = string | { ar: string; en: string };

export const bi = (ar: string, en: string): Text => ({ ar, en });

export type Params = Record<string, string | number | undefined>;

function interpolate(s: string, params?: Params) {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (params[k] === undefined ? '' : String(params[k])));
}

export function translate(lang: Lang, ar: string, params?: Params): string {
  if (lang === 'en') {
    const en = EN[ar];
    if (en !== undefined) return interpolate(en, params);
  }
  return interpolate(ar, params);
}

export function textOf(lang: Lang, t: Text | undefined | null): string {
  if (t === undefined || t === null) return '';
  if (typeof t === 'string') return lang === 'en' ? EN[t] ?? t : t;
  return lang === 'en' ? t.en : t.ar;
}

/** Both language variants of a Text, so it can be embedded in another bilingual message. */
export const both = (t: Text | undefined | null) => ({ ar: textOf('ar', t), en: textOf('en', t) });

/** Bilingual name of an entity that has name / nameEn. */
export const N = (x?: { name: string; nameEn?: string } | null) => ({ ar: x?.name ?? '', en: x?.nameEn || x?.name || '' });

/** Pick the English variant of a data field when available (name → nameEn). */
export function pick<T extends object>(lang: Lang, obj: T | undefined | null, field: keyof T & string): string {
  if (!obj) return '';
  const o = obj as Record<string, unknown>;
  if (lang === 'en') {
    const en = o[`${field}En`];
    if (typeof en === 'string' && en) return en;
  }
  return String(o[field] ?? '');
}
