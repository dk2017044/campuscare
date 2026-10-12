import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { StudentHome } from './pages/student/StudentHome';
import { CommandPalette } from './components/CommandPalette';
import { Role, StaffUser } from './types';
import { CheckCircle2, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { playSuccessChime } from './services/sound';
import { api } from './services/api';
import { parseCurrentLocation, pushRoute, replaceRoute, getTitleForTab } from './services/router';

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
  const initialRoute = parseCurrentLocation();

  const [userRole, setUserRole] = useState<Role>(() => {
    return initialRoute.role;
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
    return initialRoute.tab;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Auto-fill state for Track Report after filing or from URL query (?caseId=...&pin=...)
  const [trackedCaseId, setTrackedCaseId] = useState<string>(() => {
    return initialRoute.params.get('caseId') || '';
  });
  const [trackedPin, setTrackedPin] = useState<string>(() => {
    return initialRoute.params.get('pin') || '';
  });

  // Real-time Network Connectivity & Backend Health Status
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);
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

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedToast(true);
      checkBackendStatus();
      setTimeout(() => setShowReconnectedToast(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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

  // Synchronize browser Back & Forward button clicks
  useEffect(() => {
    // Ensure initial canonical URL matches the loaded route without adding duplicate history
    replaceRoute(currentTab, userRole, trackedCaseId ? { caseId: trackedCaseId, pin: trackedPin } : undefined);

    const handlePopState = () => {
      const resolved = parseCurrentLocation();
      setCurrentTab(resolved.tab);
      setUserRole(resolved.role);
      localStorage.setItem('campuscare_role', resolved.role);
      document.title = getTitleForTab(resolved.tab);

      const cid = resolved.params.get('caseId');
      const pin = resolved.params.get('pin');
      if (cid) setTrackedCaseId(cid);
      if (pin) setTrackedPin(pin);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Unified Navigation Handler: Synchronizes React state, URL bar, and browser history
  const handleNavigate = (tab: string, extraParams?: Record<string, string>, overrideRole?: Role) => {
    let targetRole: Role = overrideRole || userRole;
    if (!overrideRole) {
      if (tab === 'staff_dashboard' || tab.startsWith('staff_')) {
        targetRole = 'staff';
      } else if (tab === 'admin_dashboard' || tab.startsWith('admin_')) {
        targetRole = 'super_admin';
      } else if (tab === 'lost_found') {
        targetRole = userRole === 'staff' ? 'staff' : 'student';
      } else if (
        tab === 'student_home' ||
        tab === 'report_safely' ||
        tab === 'emergency' ||
        tab === 'maintenance' ||
        tab === 'track_report'
      ) {
        targetRole = 'student';
      }
    }

    setUserRole(targetRole);
    localStorage.setItem('campuscare_role', targetRole);
    setCurrentTab(tab);

    pushRoute(tab, targetRole, extraParams);
  };

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
    handleNavigate('track_report', { caseId: publicCaseId, pin: rawPin });
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-900 font-sans selection:bg-[#0066FF] selection:text-white relative">
      {/* Real-time Network & Backend Status Banners */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            key="offline-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2.5 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3 z-50 backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <WifiOff className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>
                <strong>Offline Mode Active:</strong> Internet connection unavailable. Cached modules remain active.
              </span>
            </div>
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.onLine) {
                  setIsOnline(true);
                  checkBackendStatus();
                } else {
                  showToast('Still offline. Please check your network connection.');
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors shrink-0 cursor-pointer text-xs shadow-2xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </motion.div>
        )}

        {showReconnectedToast && (
          <motion.div
            key="reconnected-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 z-50 backdrop-blur-md"
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-medium">
              Internet connection restored. Synchronized with CampusCare Cloud.
            </span>
          </motion.div>
        )}

        {isOnline && backendOffline && (
          <motion.div
            key="backend-offline-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-3 z-50 backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>
                <strong>Local Backend Server (Port 5000) Unreachable:</strong> Start server with <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono text-[11px]">npm run dev</code> or verify API connection.
              </span>
            </div>
            <button
              onClick={checkBackendStatus}
              disabled={isCheckingBackend}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 shrink-0 cursor-pointer text-xs shadow-2xs"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingBackend ? 'animate-spin' : ''}`} />
              <span>{isCheckingBackend ? 'Checking...' : 'Retry'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={(tab) => handleNavigate(tab)}
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
        setCurrentTab={handleNavigate}
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
                      onNavigate={handleNavigate} 
                      onOpenCommand={() => setIsCommandOpen(true)}
                    />
                  )}
                  {currentTab === 'report_safely' && (
                    <ReportSafely onNavigate={handleNavigate} onCaseCreated={handleCaseCreated} />
                  )}
                  {currentTab === 'emergency' && (
                    <EmergencyReport onNavigate={handleNavigate} onCaseCreated={handleCaseCreated} />
                  )}
                  {currentTab === 'maintenance' && (
                    <MaintenanceReport onNavigate={handleNavigate} onCaseCreated={handleCaseCreated} />
                  )}
                  {currentTab === 'lost_found' && (
                    <LostAndFound onNavigate={handleNavigate} onCaseCreated={handleCaseCreated} />
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
                      handleNavigate('admin_staff');
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
                        onNavigateTab={(t) => handleNavigate(t)}
                      />
                    )}
                    {currentTab === 'lost_found' && (
                      <LostAndFound
                        onNavigate={handleNavigate}
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
                        onNavigateTab={(t) => handleNavigate(t)}
                      />
                    )}
                  </>
                )
              )}

              {/* ADMIN PORTAL VIEWS */}
              {userRole === 'super_admin' && (
                <AdminDashboard
                  currentTab={currentTab}
                  onNavigateTab={handleNavigate}
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
