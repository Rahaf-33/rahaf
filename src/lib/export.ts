import { useStore } from '@/store/useStore';

/** true when built for the hosted (sandboxed) demo, where file downloads and printing are blocked */
export const HOSTED = import.meta.env.VITE_HOSTED === '1';

export function downloadFile(name: string, content: string, mime = 'text/plain;charset=utf-8') {
  if (HOSTED) {
    const toast = useStore.getState().toast;
    const ok = () => toast({ title: 'تم نسخ محتوى التقرير', body: `يمكنك لصقه في Excel أو أي محرر نصوص. (تنزيل الملف ${name} متاح عند تشغيل المشروع محليًا)`, level: 'success' });
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

export function toCSV(rows: (string | number | undefined | null)[][]): string {
  const esc = (v: string | number | undefined | null) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // BOM so Excel opens Arabic correctly
  return '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\n');
}
