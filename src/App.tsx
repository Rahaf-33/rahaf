import { HashRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useStore } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { canAccess, homeFor } from '@/lib/nav';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Alerts from '@/pages/Alerts';
import AIEngine from '@/pages/AIEngine';
import MapPage from '@/pages/MapPage';
import Monitoring from '@/pages/Monitoring';
import Accountability from '@/pages/Accountability';
import TeacherPanel from '@/pages/TeacherPanel';
import Cases from '@/pages/Cases';
import Reports from '@/pages/Reports';
import Timeline from '@/pages/Timeline';
import Settings from '@/pages/Settings';

function Guard({ path, children }: { path: string; children: ReactNode }) {
  const user = useStore((s) => s.user);
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (!canAccess(path, user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <>{children}</>;
}

const Router = import.meta.env.VITE_HOSTED === '1' ? MemoryRouter : HashRouter;

export default function App() {
  const user = useStore((s) => s.user);
  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={homeFor(user.role)} replace /> : <Login />} />
        <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Guard path="/"><Dashboard /></Guard>} />
          <Route path="/alerts" element={<Guard path="/alerts"><Alerts /></Guard>} />
          <Route path="/ai" element={<Guard path="/ai"><AIEngine /></Guard>} />
          <Route path="/map" element={<Guard path="/map"><MapPage /></Guard>} />
          <Route path="/monitoring" element={<Guard path="/monitoring"><Monitoring /></Guard>} />
          <Route path="/accountability" element={<Guard path="/accountability"><Accountability /></Guard>} />
          <Route path="/teacher" element={<Guard path="/teacher"><TeacherPanel /></Guard>} />
          <Route path="/cases" element={<Guard path="/cases"><Cases /></Guard>} />
          <Route path="/reports" element={<Guard path="/reports"><Reports /></Guard>} />
          <Route path="/timeline" element={<Guard path="/timeline"><Timeline /></Guard>} />
          <Route path="/settings" element={<Guard path="/settings"><Settings /></Guard>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
