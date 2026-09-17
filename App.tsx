import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { db } from './services/db';
import { isConfigured, getYearMode, getYearDisplayName, getYearUnavailableMessage } from './services/supabase';
import { User, UserRole } from './types';
import { Login } from './views/Login';
import { Landing } from './views/Landing';
import { Layout } from './components/Layout';

// Lazy load heavy views for performance (Code Splitting)
const AdminDashboard = lazy(() => import('./views/Admin').then(m => ({ default: m.AdminDashboard })));
const FacultyDashboard = lazy(() => import('./views/Faculty').then(m => ({ default: m.FacultyDashboard })));
const StudentDashboard = lazy(() => import('./views/Student').then(m => ({ default: m.StudentDashboard })));
const DeveloperDashboard = lazy(() => import('./views/Developer').then(m => ({ default: m.DeveloperDashboard })));
const NotificationsPage = lazy(() => import('./views/Notifications').then(m => ({ default: m.NotificationsPage })));
const BugReport = lazy(() => import('./views/BugReport').then(m => ({ default: m.BugReport })));
const RecycleBin = lazy(() => import('./views/RecycleBin').then(m => ({ default: m.RecycleBin })));
const LegalView = lazy(() => import('./views/Legal').then(m => ({ default: m.LegalView })));

import { Modal, Input, Button, AcropolisLogo } from './components/UI';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Analytics } from '@vercel/analytics/react';
import { ErrorBoundary } from './components/ErrorBoundary';

// Global error handlers for diagnostics
if (typeof window !== 'undefined') {
  window.onerror = (msg, url, lineNo, columnNo, error) => {
    console.error('Fatal error caught:', msg, { url, lineNo, columnNo, error });
    return false; // Let browser handle it too
  };
  window.onunhandledrejection = (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
  };
}

const PageTransition = ({ children, className = "h-full w-full" }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const App: React.FC = () => {
  if (!isConfigured) {
    const yearMode = getYearMode();
    const displayName = getYearDisplayName(yearMode);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center max-w-md w-full border border-slate-100">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">{displayName} Coming Soon</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            {getYearUnavailableMessage(yearMode)}
          </p>
          <button 
            onClick={() => { localStorage.removeItem('acro_year_mode'); window.location.reload(); }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Select Another Year
          </button>
        </div>
      </div>
    );
  }

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Settings / Password Change State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [settingsLoading, setSettingsLoading] = useState(false);


  useEffect(() => {
    const handleChunkError = (e: any) => {
      const msg = e.message || '';
      if (msg.toLowerCase().includes('chunkloaderror') || msg.toLowerCase().includes('loading chunk')) {
        const lastReload = localStorage.getItem('last_chunk_error_reload');
        const now = Date.now();

        // If we reloaded less than 10 seconds ago, don't loop, try a harder fix
        if (lastReload && now - parseInt(lastReload) < 10000) {
          console.error("Persistent chunk error. Attempting storage clear.");
          sessionStorage.clear();
          localStorage.removeItem('last_chunk_error_reload');
        } else {
          localStorage.setItem('last_chunk_error_reload', now.toString());
          // Force a hard reload from server
          window.location.href = window.location.origin + window.location.pathname + '?v=' + now;
        }
      }
    };
    window.addEventListener('error', handleChunkError);
    return () => window.removeEventListener('error', handleChunkError);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const u = await db.getCurrentUser();
        setUser(u);
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await db.logout();
    sessionStorage.removeItem('login_intent');
    setUser(null);
  };

  const handleChangePassword = async () => {
    if (passForm.new !== passForm.confirm) {
      alert("New passwords do not match.");
      return;
    }
    if (passForm.new.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    if (!window.confirm("Are you sure you want to change your password?")) return;
    setSettingsLoading(true);
    try {
      await db.changePassword(passForm.current, passForm.new);
      alert("Password changed successfully.");
      setIsSettingsOpen(false);
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const getDashboardPath = (role: UserRole) => {
    const intent = sessionStorage.getItem('login_intent');
    if (intent === 'COORDINATOR' && role === UserRole.FACULTY) return '/coordinator';

    switch (role) {
      case UserRole.ADMIN: return '/admin';
      case UserRole.FACULTY: return '/faculty';
      case UserRole.STUDENT: return '/student';
      case UserRole.DEVELOPER: return '/developer';
      default: return '/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-pulse mb-16">
          <AcropolisLogo className="h-32 w-32" />
        </div>
        <div className="h-1 w-48 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 animate-progress w-full"></div>
        </div>
        <style>{`
          @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-progress {
            animation: progress 1.5s infinite linear;
          }
        `}</style>
      </div>
    );
  }

  // Helper to wrap dashboards with Layout
  const DashboardLayout = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <PageTransition>
      <Layout
        user={user!}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
        title={title}
      >
        <Suspense fallback={
          <div className="p-12 flex flex-col items-center justify-center min-h-[50vh]">
            <div className="animate-pulse mb-6 opacity-20">
               <AcropolisLogo className="h-16 w-16" />
            </div>
            <div className="h-1 w-24 bg-slate-50 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-600/30 animate-progress w-full"></div>
            </div>
          </div>
        }>
          {children}
        </Suspense>
      </Layout>
    </PageTransition>
  );

  return (
    <ErrorBoundary>
      <AnimatePresence>
        <Routes location={location} key={location.pathname.split('/')[1] || '/'}>
          <Route path="/login" element={
            user ? <Navigate to={getDashboardPath(user.role)} replace /> : <PageTransition><Login onLogin={handleLogin} /></PageTransition>
          } />

        <Route path="/admin/*" element={
          <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN]}>
            <DashboardLayout title="Administrator Portal">
              <Routes>
                <Route path="students/:branchId/:batchId/:studentId" element={<AdminDashboard />} />
                <Route path="students/:branchId/:batchId" element={<AdminDashboard />} />
                <Route path="students/:branchId" element={<AdminDashboard />} />
                <Route path="students" element={<AdminDashboard />} />
                <Route path="faculty/:subtab" element={<AdminDashboard />} />
                <Route path="faculty" element={<Navigate to="/admin/faculty/subjects" replace />} />
                <Route path="monitor" element={<AdminDashboard />} />
                <Route path="archived" element={<AdminDashboard />} />
                <Route path="reports" element={<AdminDashboard />} />
                <Route path="system" element={<AdminDashboard />} />
                <Route path="notifications" element={<NotificationsPage user={user!} />} />
                <Route path="recycle-bin" element={<RecycleBin branchId="ALL" metaData={{}} user={user!} />} />
                <Route path="legal" element={<LegalView />} />
                <Route path="report" element={<BugReport />} />
                <Route path="*" element={<Navigate to="/admin/students" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/faculty/*" element={
          <ProtectedRoute user={user} allowedRoles={[UserRole.FACULTY]}>
            <DashboardLayout title="Faculty Dashboard">
              <Routes>
                <Route path="mark/:branchId/:subjectId" element={<FacultyDashboard user={user!} />} />
                <Route path="mark/:branchId" element={<FacultyDashboard user={user!} />} />
                <Route path="mark" element={<FacultyDashboard user={user!} />} />
                <Route path="history/:branchId/:subjectId" element={<FacultyDashboard user={user!} />} />
                <Route path="history/:branchId" element={<FacultyDashboard user={user!} />} />
                <Route path="history" element={<FacultyDashboard user={user!} />} />
                <Route path="marks/:branchId/:subjectId" element={<FacultyDashboard user={user!} />} />
                <Route path="marks/:branchId" element={<FacultyDashboard user={user!} />} />
                <Route path="marks" element={<FacultyDashboard user={user!} />} />
                <Route path="coordinator" element={<FacultyDashboard user={user!} />} />
                <Route path="notifications" element={<NotificationsPage user={user!} />} />
                <Route path="recycle-bin" element={<RecycleBin branchId="ALL" metaData={{}} user={user!} />} />
                <Route path="legal" element={<LegalView />} />
                <Route path="report" element={<BugReport />} />
                <Route path="*" element={<Navigate to="/faculty/mark" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/coordinator/*" element={
          <ProtectedRoute user={user} allowedRoles={[UserRole.FACULTY]}>
            <DashboardLayout title="Class Coordinator Dashboard">
              <Routes>
                <Route path="notifications" element={<NotificationsPage user={user!} />} />
                <Route path="recycle-bin" element={<RecycleBin branchId="ALL" metaData={{}} user={user!} />} />
                <Route path="legal" element={<LegalView />} />
                <Route path="report" element={<BugReport />} />
                <Route path="*" element={<FacultyDashboard user={user!} forceCoordinatorView={true} />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/student/*" element={
          <ProtectedRoute user={user} allowedRoles={[UserRole.STUDENT]}>
            <DashboardLayout title="Student Portal">
              <Routes>
                <Route path="dashboard" element={<StudentDashboard user={user!} />} />
                <Route path="notifications" element={<NotificationsPage user={user!} />} />
                <Route path="legal" element={<LegalView />} />
                <Route path="report" element={<BugReport />} />
                <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/developer/*" element={
          <ProtectedRoute user={user} allowedRoles={[UserRole.DEVELOPER]}>
            <DashboardLayout title="Developer Console">
              <Routes>
                <Route path="dashboard" element={<DeveloperDashboard user={user!} />} />
                <Route path="logs" element={<DeveloperDashboard user={user!} />} />
                <Route path="database" element={<DeveloperDashboard user={user!} />} />
                <Route path="settings" element={<DeveloperDashboard user={user!} />} />
                <Route path="notifications" element={<NotificationsPage user={user!} />} />
                <Route path="recycle-bin" element={<RecycleBin branchId="ALL" metaData={{}} user={user!} />} />
                <Route path="legal" element={<LegalView />} />
                <Route path="report" element={<BugReport />} />
                <Route path="*" element={<Navigate to="/developer/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/report-bug" element={
          user ? (
            <DashboardLayout title="Feedback & Support">
              <BugReport />
            </DashboardLayout>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/" element={user ? <Navigate to={getDashboardPath(user.role)} replace /> : <PageTransition><Landing /></PageTransition>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AnimatePresence>

      {/* Vercel Analytics */}
      <Analytics />

      {/* Global Settings Modal - Only render if not student and user is logged in */}
      {user && user.role !== UserRole.STUDENT && (
        <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Change Password">
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-800 border-b border-slate-100 pb-2">Change Password</h4>
            <Input
              label="Current Password"
              type="password"
              value={passForm.current}
              onChange={e => setPassForm({ ...passForm, current: e.target.value })}
            />
            <Input
              label="New Password"
              type="password"
              value={passForm.new}
              onChange={e => setPassForm({ ...passForm, new: e.target.value })}
              placeholder="Min 6 characters"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={passForm.confirm}
              onChange={e => setPassForm({ ...passForm, confirm: e.target.value })}
            />
            <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setIsSettingsOpen(false)} disabled={settingsLoading}>Cancel</Button>
              <Button onClick={handleChangePassword} disabled={!passForm.current || !passForm.new || settingsLoading}>
                {settingsLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ErrorBoundary>
  );
};

export default App;
