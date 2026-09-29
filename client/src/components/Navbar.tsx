import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, AlertTriangle, Lock, Wrench, Search, ClipboardList, LayoutDashboard, Settings, UserCheck, LogOut, KeyRound, Check, X, UserPlus, Users, Loader2 } from 'lucide-react';
import { Role, StaffUser, Department } from '../types';
import { api } from '../services/api';

interface Props {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: Role;
  setUserRole: (role: Role) => void;
  staffDept: string;
  setStaffDept: (dept: string) => void;
  onResetDemo?: () => void;
  resetting?: boolean;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  staffDept,
  setStaffDept
}) => {
  const [showStaffAuthModal, setShowStaffAuthModal] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(false);

  // Authenticated Staff Profile Name (dynamic, clean default)
  const [staffName, setStaffName] = useState(() => localStorage.getItem('campuscare_staff_name') || '');

  // Dynamic Staff Authentication State
  const [registeredStaff, setRegisteredStaff] = useState<StaffUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffAuthMode, setStaffAuthMode] = useState<'signin' | 'register'>('signin');
  const [staffFormName, setStaffFormName] = useState('');
  const [staffFormEmail, setStaffFormEmail] = useState('');
  const [staffFormDept, setStaffFormDept] = useState('dept-welfare');
  const [staffFormTitle, setStaffFormTitle] = useState('Faculty / Staff Member');
  const [staffAuthLoading, setStaffAuthLoading] = useState(false);
  const [staffAuthError, setStaffAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (showStaffAuthModal) {
      loadStaffModalData();
    }
  }, [showStaffAuthModal]);

  const loadStaffModalData = async () => {
    try {
      const [staffRes, deptsRes] = await Promise.all([
        api.getStaff().catch(() => ({ staff: [] as StaffUser[] })),
        api.getDepartments().catch(() => ({ departments: [] as Department[] }))
      ]);
      setRegisteredStaff(staffRes.staff || []);
      setDepartments(deptsRes.departments || []);
      if (deptsRes.departments && deptsRes.departments.length > 0 && !staffFormDept) {
        setStaffFormDept(deptsRes.departments[0].id);
      }
      // If no staff registered, default to register tab
      if (!staffRes.staff || staffRes.staff.length === 0) {
        setStaffAuthMode('register');
      }
    } catch (e) {
      console.error('Failed to load modal data', e);
    }
  };

  const handleDynamicStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormName.trim() || !staffFormEmail.trim()) {
      setStaffAuthError('Please provide both your name and official institutional email.');
      return;
    }

    try {
      setStaffAuthLoading(true);
      setStaffAuthError(null);
      const res = await api.loginStaff({
        name: staffFormName.trim(),
        email: staffFormEmail.trim().toLowerCase(),
        departmentId: staffFormDept,
        title: staffFormTitle.trim() || 'Staff Officer'
      });

      if (res.success && res.user) {
        applyStaffSession(res.user.name, res.user.departmentId);
      }
    } catch (err: any) {
      setStaffAuthError(err.message || 'Staff authentication failed');
    } finally {
      setStaffAuthLoading(false);
    }
  };

  const applyStaffSession = (name: string, deptId: string) => {
    setStaffName(name);
    localStorage.setItem('campuscare_staff_name', name);
    localStorage.setItem('campuscare_role', 'staff');
    localStorage.setItem('campuscare_dept', deptId);
    setStaffDept(deptId);
    setUserRole('staff');
    setCurrentTab('staff_dashboard');
    setShowStaffAuthModal(false);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123' || adminPassword === 'campuscare2026' || adminPassword.toLowerCase() === 'admin') {
      localStorage.setItem('campuscare_role', 'super_admin');
      setUserRole('super_admin');
      setCurrentTab('admin_dashboard');
      setShowAdminAuthModal(false);
      setAdminPassword('');
      setAdminAuthError(false);
    } else {
      setAdminAuthError(true);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('campuscare_role');
    localStorage.removeItem('campuscare_staff_name');
    setUserRole('student');
    setCurrentTab('student_home');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo */}
          <div
            onClick={() => setCurrentTab(userRole === 'student' ? 'student_home' : userRole === 'staff' ? 'staff_dashboard' : 'admin_dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-campus-600 to-campus-400 flex items-center justify-center text-white shadow-sm shadow-campus-500/30 group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                Campus<span className="text-campus-400">Care</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {userRole === 'student' ? 'Student' : userRole === 'staff' ? 'Staff' : 'Admin'}
              </span>
            </div>
          </div>

          {/* Navigation Links according to Role */}
          <nav className="flex items-center gap-1 sm:gap-1.5 order-3 sm:order-2 w-full sm:w-auto justify-center sm:justify-start">
            {userRole === 'student' ? (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentTab('student_home')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    currentTab === 'student_home' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Home
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('emergency')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    currentTab === 'emergency'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-rose-400 hover:bg-rose-950/30 border border-rose-900/50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Emergency</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('report_safely')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    currentTab === 'report_safely'
                      ? 'bg-campus-600 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Lock className="w-3 h-3 text-campus-400" />
                  <span>Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('maintenance')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    currentTab === 'maintenance' ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Wrench className="w-3 h-3 text-amber-400" />
                  <span>Maintenance</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('lost_found')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    currentTab === 'lost_found' ? 'bg-slate-800 text-teal-300 font-bold border border-slate-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Search className="w-3 h-3 text-teal-400" />
                  <span>Lost & Found</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('track_report')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    currentTab === 'track_report'
                      ? 'bg-campus-500/20 text-campus-300 border border-campus-500/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ClipboardList className="w-3 h-3" />
                  <span>Track</span>
                </button>
              </>
            ) : userRole === 'staff' ? (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentTab('staff_dashboard')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    currentTab === 'staff_dashboard' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Assigned Cases</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('lost_found')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    currentTab === 'lost_found' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Lost & Found Registry</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentTab('admin_dashboard')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  currentTab === 'admin_dashboard' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Overview & Analytics</span>
              </button>
            )}
          </nav>

          {/* 1-Click Multi-Role Switcher (Compact & Modern) */}
          <div className="flex items-center gap-2 order-2 sm:order-3 shrink-0">
            <div className="inline-flex p-0.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => {
                  setUserRole('student');
                  setCurrentTab('student_home');
                  localStorage.setItem('campuscare_role', 'student');
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  userRole === 'student'
                    ? 'bg-campus-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Student
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserRole('staff');
                  setCurrentTab('staff_dashboard');
                  localStorage.setItem('campuscare_role', 'staff');
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  userRole === 'staff'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Staff
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserRole('super_admin');
                  setCurrentTab('admin_dashboard');
                  localStorage.setItem('campuscare_role', 'super_admin');
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  userRole === 'super_admin'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Admin
              </button>
            </div>

            {/* Department selector if in Staff mode */}
            {userRole === 'staff' && (
              <select
                aria-label="Filter Department"
                value={staffDept}
                onChange={(e) => setStaffDept(e.target.value)}
                className="bg-slate-900 text-amber-300 text-xs font-medium px-2 py-1 rounded-lg border border-amber-500/40 focus:outline-none"
              >
                <option value="all">All Depts</option>
                <option value="dept-security">Security</option>
                <option value="dept-welfare">Welfare</option>
                <option value="dept-electrical">Electrical</option>
                <option value="dept-plumbing">Plumbing</option>
                <option value="dept-civil">Civil</option>
                <option value="dept-hostel">Hostel</option>
                <option value="dept-it-labs">IT Labs</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Staff & Faculty Authentication Modal */}
      <AnimatePresence>
        {showStaffAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5"
            >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Staff & Faculty Authorization
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Department officers, faculty mentors, and campus maintenance staff
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStaffAuthModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs if staff profiles already exist */}
            {registeredStaff.length > 0 && (
              <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStaffAuthMode('signin')}
                  className={`flex-1 py-2.5 border-b-2 text-center transition-colors flex items-center justify-center gap-1.5 ${
                    staffAuthMode === 'signin'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Active Staff ({registeredStaff.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStaffAuthMode('register')}
                  className={`flex-1 py-2.5 border-b-2 text-center transition-colors flex items-center justify-center gap-1.5 ${
                    staffAuthMode === 'register'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Onboard New Staff / Teacher</span>
                </button>
              </div>
            )}

            {staffAuthError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
                {staffAuthError}
              </div>
            )}

            {/* Tab 1: Existing Registered Staff Profiles */}
            {staffAuthMode === 'signin' && registeredStaff.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Select your active officer profile to access assigned incident queues:
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {registeredStaff.map((staff) => {
                    const dept = departments.find(d => d.id === staff.departmentId);
                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => applyStaffSession(staff.name, staff.departmentId)}
                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <strong className="text-sm text-slate-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              {staff.name}
                            </strong>
                            <span className="text-xs text-slate-500 block">{staff.title}</span>
                            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium block mt-0.5">
                              {dept ? dept.name : staff.departmentId}
                            </span>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 dark:text-slate-300 transition-colors">
                            Authorize →
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setStaffAuthMode('register')}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    + Register a new faculty or staff member
                  </button>
                </div>
              </div>
            ) : (
              /* Tab 2: Onboard / Sign In New Staff Form */
              <form onSubmit={handleDynamicStaffLogin} className="space-y-3.5 text-xs">
                <p className="text-xs text-slate-500">
                  Enter your official college details to sign in or initialize your departmental officer profile:
                </p>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Full Name & Title *
                  </label>
                  <input
                    type="text"
                    value={staffFormName}
                    onChange={(e) => setStaffFormName(e.target.value)}
                    placeholder="e.g. Prof. Rajesh Sharma or Officer Sunita Rao"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Official College Email *
                  </label>
                  <input
                    type="email"
                    value={staffFormEmail}
                    onChange={(e) => setStaffFormEmail(e.target.value)}
                    placeholder="e.g. r.sharma@campuscare.edu"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Assigned Department *
                    </label>
                    <select
                      aria-label="Assigned Department"
                      value={staffFormDept}
                      onChange={(e) => setStaffFormDept(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Role / Designation
                    </label>
                    <input
                      type="text"
                      value={staffFormTitle}
                      onChange={(e) => setStaffFormTitle(e.target.value)}
                      placeholder="e.g. Faculty Mentor / Counselor"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowStaffAuthModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={staffAuthLoading}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    {staffAuthLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Authorizing...</span>
                      </>
                    ) : (
                      <span>Enter Staff Portal →</span>
                    )}
                  </button>
                </div>
              </form>
            )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Authentication Modal */}
      <AnimatePresence>
        {showAdminAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Super Admin Authentication
                  </h2>
                </div>
                <button
                  onClick={() => setShowAdminAuthModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Enter institution administrative access key to unlock platform configuration and audit logs:
              </p>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Admin Passkey
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminAuthError(false);
                    }}
                    placeholder="Enter passkey (e.g. admin123)"
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    autoFocus
                  />
                  {adminAuthError && (
                    <p className="text-xs text-red-600 mt-1">Invalid administrator key. Try 'admin123' or 'campuscare2026'.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdminAuthModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Authenticate Admin →
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};
