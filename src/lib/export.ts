import { useStore } from '@/store/useStore';
import { bi, textOf, type Text } from '@/i18n/core';

/** true when built for the hosted (sandboxed) demo, where file downloads and printing are blocked */
export const HOSTED = import.meta.env.VITE_HOSTED === '1';

export function downloadFile(name: string, content: string, mime = 'text/plain;charset=utf-8') {
  if (HOSTED) {
    const toast = useStore.getState().toast;
    const ok = () => toast({ title: 'تم نسخ محتوى التقرير', body: bi(`يمكنك لصقه في Excel أو أي محرر نصوص. (تنزيل الملف ${name} متاح عند تشغيل المشروع محليًا)`, `You can paste it into Excel or any text editor. (Downloading ${name} works when running the project locally.)`), level: 'success' });
    const fail = () => toast({ title: 'تعذّر النسخ', body: 'تنزيل الملفات متاح عند تشغيل المشروع على جهازك.', level: 'warning' });
    try {
      navigator.clipboard.writeText(content.replace(/^\uFEFF/, '')).then(ok, fail);
    } catch {
      fail();
    }
    return;
  }
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCSV(rows: (Text | number | undefined | null)[][]): string {
  const lang = useStore.getState().lang;
  const esc = (v: Text | number | undefined | null) => {
    const s = v === undefined || v === null ? '' : typeof v === 'number' ? String(v) : textOf(lang, v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // BOM so Excel opens Arabic correctly
  return '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\n');
}
