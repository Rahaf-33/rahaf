import { useState } from 'react';
import { History, Download, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Badge, Button, Card, cx, Empty, inputCls, PageHeader } from '@/components/ui';
import { formatDate, formatTime } from '@/lib/labels';
import { downloadFile, toCSV } from '@/lib/export';
import type { LogCategory, LogEntry } from '@/types';
import { useI18n } from '@/i18n';

const CAT: Record<LogCategory, string> = {
  alert: 'إنذار', emergency: 'طوارئ', sensor: 'حساسات', teacher: 'معلمات', zone: 'مناطق', case: 'حالات', system: 'النظام', notification: 'إشعارات', manual: 'تعديل يدوي',
};
const LEVEL: Record<LogEntry['level'], { l: string; c: string; dot: string }> = {
  info: { l: 'معلومة', c: 'bg-navy-50 text-navy-700 ring-navy-200', dot: 'bg-brand' },
  success: { l: 'نجاح', c: 'bg-safe-soft text-safe-dark ring-safe/30', dot: 'bg-safe' },
  warning: { l: 'تحذير', c: 'bg-warn-soft text-warn-dark ring-warn/30', dot: 'bg-warn' },
  critical: { l: 'حرج', c: 'bg-danger-soft text-danger-dark ring-danger/30', dot: 'bg-danger' },
};

export default function Timeline() {
  const { tr, tx } = useI18n();
  const logs = useStore((s) => s.logs);
  const [cat, setCat] = useState<LogCategory | 'all'>('all');
  const [level, setLevel] = useState<LogEntry['level'] | 'all'>('all');
  const [q, setQ] = useState('');
  const list = logs.filter((l) => (cat === 'all' || l.category === cat) && (level === 'all' || l.level === level) && (!q || tx(l.message).includes(q) || tx(l.actor).includes(q)));

  const exportCSV = () => downloadFile(`istibaq-log-${Date.now()}.csv`, toCSV([[tr('التاريخ'), tr('الوقت'), tr('الفئة'), tr('المستوى'), tr('المنفذ'), tr('الحدث')], ...list.map((l) => [formatDate(l.at), formatTime(l.at), tr(CAT[l.category]), tr(LEVEL[l.level].l), l.actor, l.message])]), 'text/csv;charset=utf-8');

  return (
    <div>
      <PageHeader title={tr('السجل الزمني')} icon={<History className="h-6 w-6" />} subtitle={tr('توثيق كل إجراء وتغيير حالة في المنصة مع الوقت والمنفذ')} actions={<Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={exportCSV} disabled={!list.length}>{tr('تصدير')}</Button>} />
      <Card padded={false}>
        <div className="grid grid-cols-1 gap-2 border-b border-navy-50 p-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-2.5 h-4 w-4 text-navy-300" />
            <input className={cx(inputCls, 'ps-8')} placeholder={tr('بحث في الأحداث أو المنفذ')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value as LogCategory | 'all')}>
            <option value="all">{tr('كل الفئات')}</option>
            {(Object.keys(CAT) as LogCategory[]).map((k) => <option key={k} value={k}>{tr(CAT[k])}</option>)}
          </select>
          <select className={inputCls} value={level} onChange={(e) => setLevel(e.target.value as LogEntry['level'] | 'all')}>
            <option value="all">{tr('كل المستويات')}</option>
            {(Object.keys(LEVEL) as LogEntry['level'][]).map((k) => <option key={k} value={k}>{tr(LEVEL[k].l)}</option>)}
          </select>
        </div>
        {list.length === 0 ? <Empty icon={<History className="h-6 w-6" />} title={tr('لا توجد أحداث')} body={tr('ستظهر هنا جميع الإجراءات: الإنذارات، التفعيل، تأكيدات المعلمات، تحديثات الحساسات والحالات.')} /> : (
          <ol className="divide-y divide-navy-50">
            {list.map((l) => (
              <li key={l.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                <div className="w-20 shrink-0 text-end font-mono text-xs text-navy-500" dir="ltr">{formatTime(l.at)}</div>
                <span className={cx('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', LEVEL[l.level].dot)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-navy-900">{tx(l.message)}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                    <Badge>{tr(CAT[l.category])}</Badge>
                    <Badge className={LEVEL[l.level].c}>{tr(LEVEL[l.level].l)}</Badge>
                    <span className="text-navy-400">{tx(l.actor)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
