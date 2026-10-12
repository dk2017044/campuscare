import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { StudentHome } from './pages/student/StudentHome';
import { CommandPalette } from './components/CommandPalette';
import { Role, StaffUser } from './types';
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { playSuccessChime } from './services/sound';
import { api } from './services/api';

// Code-Splitting: Lazy load secondary heavy dashboards & pages to maximize Lighthouse Performance & eliminate FCP delay
const ReportSafely = lazy(() => import('./pages/student/ReportSafely').then(m => ({ default: m.ReportSafely })));
const EmergencyReport = lazy(() => import('./pages/student/EmergencyReport').then(m => ({ default: m.EmergencyReport })));
const MaintenanceReport = lazy(() => import('./pages/student/MaintenanceReport').then(m => ({ default: m.MaintenanceReport })));
const LostAndFound = lazy(() => import('./pages/student/LostAndFound').then(m => ({ default: m.LostAndFound })));
const TrackReport = lazy(() => import('./pages/student/TrackReport').then(m => ({ default: m.TrackReport })));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard').then(m => ({ default: m.StaffDashboard })));
const StaffLogin = lazy(() => import('./pages/staff/StaffLogin').then(m => ({ default: m.StaffLogin })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

export function App() {
  const [userRole, setUserRole] = useState<Role>(() => {
    return (localStorage.getItem('campuscare_role') as Role) || 'student';
  });

  const [activeStaffUser, setActiveStaffUser] = useState<StaffUser | null>(() => {
    const saved = localStorage.getItem('campuscare_staff_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('campuscare_admin_auth') === 'true';
  });

  const [staffDept, setStaffDept] = useState<string>(() => {
    return localStorage.getItem('campuscare_dept') || 'all';
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    const savedRole = localStorage.getItem('campuscare_role');
    if (savedRole === 'staff') return 'staff_dashboard';
    if (savedRole === 'super_admin') return 'admin_queue';
    return 'student_home';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Auto-fill state for Track Report after filing
  const [trackedCaseId, setTrackedCaseId] = useState<string>('');
  const [trackedPin, setTrackedPin] = useState<string>('');

  // Local/Network Backend Health Status
  const [backendOffline, setBackendOffline] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);

  const checkBackendStatus = async () => {
    try {
      setIsCheckingBackend(true);
      await api.checkHealth();
      setBackendOffline(false);
    } catch {
      const isLocal = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocal) {
        setBackendOffline(true);
      }
    } finally {
      setIsCheckingBackend(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
  }, []);

  // Global Ctrl+K / ⌘K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    playSuccessChime();
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleCaseCreated = (publicCaseId: string, rawPin: string) => {
    setTrackedCaseId(publicCaseId);
    setTrackedPin(rawPin);
    showToast(`Case ${publicCaseId} logged safely. Private PIN generated.`);
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-900 font-sans selection:bg-[#0066FF] selection:text-white relative">
      {/* Backend Offline Indicator Banner */}
      <AnimatePresence>
        {backendOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-3 z-50 backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                <strong>Backend Server Not Running (Port 5000):</strong> Run <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono text-[11px]">run.bat</code> or <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono text-[11px]">cd server && npm run dev</code> to connect the local database.
              </span>
            </div>
            <button
              onClick={checkBackendStatus}
              disabled={isCheckingBackend}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 shrink-0 cursor-pointer text-xs"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingBackend ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={(tab) => {
          if (tab === 'staff_dashboard') setUserRole('staff');
          if (tab === 'admin_dashboard' || tab.startsWith('admin_')) setUserRole('super_admin');
          setCurrentTab(tab);
        }}
      />

      {/* Toast Notification with Motion */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 text-xs font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Navigation with Institutional Role Authentication */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={setUserRole}
        staffDept={staffDept}
        setStaffDept={setStaffDept}
        activeStaffUser={activeStaffUser}
        isAdminAuthenticated={isAdminAuthenticated}
        onOpenCommand={() => setIsCommandOpen(true)}
      />

      {/* Main Page Body with Motion Page Transitions */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <Suspense
          fallback={
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
              <p className="text-xs font-mono tracking-widest uppercase text-slate-500">Loading module...</p>
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${userRole}-${currentTab}-${activeStaffUser ? 'logged' : 'anon'}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {/* STUDENT PORTAL VIEWS */}
              {userRole === 'student' && (
                <>
                  {currentTab === 'student_home' && (
                    <StudentHome 
                      onNavigate={setCurrentTab} 
                      onOpenCommand={() => setIsCommandOpen(true)}
                    />
                  )}
                  {currentTab === 'report_safely' && (
                    <ReportSafely onNavigate={setCurrentTab} onCaseCreated={handleCaseCreated} />
                  )}
                  {currentTab === 'emergency' && (
                    <EmergencyReport onNavigate={setCurrentTab} onCaseCreated={handleCaseCreated} />
                  )}
                  {currentTab === 'maintenance' && (
                    <MaintenanceReport onNavigate={setCurrentTab} onCaseCreated={handleCaseCreated} />
                  )}
                  {currentTab === 'lost_found' && (
                    <LostAndFound onNavigate={setCurrentTab} onCaseCreated={handleCaseCreated} />
                  )}
                  {currentTab === 'track_report' && (
                    <TrackReport initialCaseId={trackedCaseId} initialPin={trackedPin} />
                  )}
                </>
              )}

              {/* STAFF PORTAL VIEWS (100% Protected Behind Staff Login) */}
              {userRole === 'staff' && (
                !activeStaffUser ? (
                  <StaffLogin
                    onLoginSuccess={(user) => {
                      setActiveStaffUser(user);
                      localStorage.setItem('campuscare_staff_session', JSON.stringify(user));
                    }}
                    onNavigateToAdmin={() => {
                      setUserRole('super_admin');
                      setCurrentTab('admin_staff');
                    }}
                  />
                ) : (
                  <>
                    {currentTab === 'staff_dashboard' && (
                      <StaffDashboard
                        staffDept={staffDept}
                        activeStaffUser={activeStaffUser}
                        onStaffLogout={() => {
                          setActiveStaffUser(null);
                          localStorage.removeItem('campuscare_staff_session');
                        }}
                        onNavigateTab={(t) => {
                          if (t.startsWith('admin_') || t === 'admin_dashboard') {
                            setUserRole('super_admin');
                            localStorage.setItem('campuscare_role', 'super_admin');
                          }
                          setCurrentTab(t);
                        }}
                      />
                    )}
                    {currentTab === 'lost_found' && (
                      <LostAndFound
                        onNavigate={setCurrentTab}
                        staffUser={activeStaffUser}
                      />
                    )}
                    {currentTab !== 'staff_dashboard' && currentTab !== 'lost_found' && (
                      <StaffDashboard
                        staffDept={staffDept}
                        activeStaffUser={activeStaffUser}
                        onStaffLogout={() => {
                          setActiveStaffUser(null);
                          localStorage.removeItem('campuscare_staff_session');
                        }}
                        onNavigateTab={(t) => {
                          if (t.startsWith('admin_') || t === 'admin_dashboard') {
                            setUserRole('super_admin');
                            localStorage.setItem('campuscare_role', 'super_admin');
                          }
                          setCurrentTab(t);
                        }}
                      />
                    )}
                  </>
                )
              )}

              {/* ADMIN PORTAL VIEWS */}
              {userRole === 'super_admin' && (
                <AdminDashboard
                  currentTab={currentTab}
                  onNavigateTab={setCurrentTab}
                  isAdminAuthenticated={isAdminAuthenticated}
                  onAdminAuthChange={setIsAdminAuthenticated}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
