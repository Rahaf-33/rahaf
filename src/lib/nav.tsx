import {
  LayoutDashboard, Siren, BrainCircuit, Map, Radar, ClipboardCheck, UserRoundCheck, LifeBuoy, FileBarChart2, History, Settings,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { Role } from '@/types';

export interface NavItem { to: string; label: string; icon: ReactNode; roles: Role[] }
const ALL: Role[] = ['principal', 'teacher', 'safety', 'admin'];
const MGMT: Role[] = ['principal', 'safety', 'admin'];

export const NAV: NavItem[] = [
  { to: '/', label: 'لوحة التحكم', icon: <LayoutDashboard className="h-5 w-5" />, roles: MGMT },
  { to: '/alerts', label: 'مركز الإنذارات', icon: <Siren className="h-5 w-5" />, roles: ALL },
  { to: '/ai', label: 'محرك الذكاء الاصطناعي', icon: <BrainCircuit className="h-5 w-5" />, roles: MGMT },
  { to: '/map', label: 'خريطة المدرسة', icon: <Map className="h-5 w-5" />, roles: ALL },
  { to: '/monitoring', label: 'الرصد الذكي', icon: <Radar className="h-5 w-5" />, roles: MGMT },
  { to: '/accountability', label: 'حصر الطالبات', icon: <ClipboardCheck className="h-5 w-5" />, roles: MGMT },
  { to: '/teacher', label: 'لوحة المعلمة', icon: <UserRoundCheck className="h-5 w-5" />, roles: ['teacher', 'principal', 'admin'] },
  { to: '/cases', label: 'مركز الحالات', icon: <LifeBuoy className="h-5 w-5" />, roles: MGMT },
  { to: '/reports', label: 'التقارير', icon: <FileBarChart2 className="h-5 w-5" />, roles: MGMT },
  { to: '/timeline', label: 'السجل الزمني', icon: <History className="h-5 w-5" />, roles: MGMT },
  { to: '/settings', label: 'الإعدادات', icon: <Settings className="h-5 w-5" />, roles: ['admin', 'principal'] },
];

export const homeFor = (r: Role) => (r === 'teacher' ? '/teacher' : '/');
export const canAccess = (path: string, role: Role) => NAV.find((n) => n.to === path)?.roles.includes(role) ?? false;
