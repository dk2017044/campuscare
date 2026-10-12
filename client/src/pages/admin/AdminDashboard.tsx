import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldAlert,
  Users,
  ClipboardList,
  RefreshCw,
  Trash2,
  UserPlus,
  Search,
  ArrowRight,
  Clock,
  MapPin,
  Paperclip,
  Wrench,
  Building2,
  BarChart3,
  Plus,
  X,
  Lock,
  ChevronRight,
  Activity,
  FileText,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  ChevronDown,
  AlertCircle,
  Bell,
  BellRing,
  CheckCircle2,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { api } from '../../services/api';
import { playAdminNewCaseAlert } from '../../services/sound';
import { sendDesktopNotification, requestNotificationPermission, getNotificationPermission, isNotificationSupported } from '../../services/notifications';
import { SystemStats, Department, AuditLog, StaffUser, Case } from '../../types';
import { StaffCaseDetail } from '../staff/StaffCaseDetail';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge, getCategoryMeta } from '../../components/CategoryBadge';
import { JioSkeletonLoader } from '../../components/JioSkeletonLoader';

interface Props {
  currentTab?: string;
  onNavigateTab?: (tab: string) => void;
  isAdminAuthenticated?: boolean;
  onAdminAuthChange?: (auth: boolean) => void;
}

type AdminSubTab = 'queue' | 'analytics' | 'departments' | 'staff' | 'audit';

export const AdminDashboard: React.FC<Props> = ({
  currentTab = 'admin_queue',
  onNavigateTab,
  isAdminAuthenticated: propIsAdminAuth,
  onAdminAuthChange
}) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(false);

  // Real-Time New Case Notification State for Super Admin (Only notifies when NEW case arrives)
  const seenCaseIdsRef = useRef<Set<string>>(new Set());
  const isInitialCasesLoadRef = useRef<boolean>(true);
  const [newCaseAlert, setNewCaseAlert] = useState<Case | null>(null);
  const [desktopPerm, setDesktopPerm] = useState<NotificationPermission>(() => getNotificationPermission());

  const getSubTabFromTab = (tab?: string): AdminSubTab => {
    if (tab === 'admin_analytics') return 'analytics';
    if (tab === 'admin_departments') return 'departments';
    if (tab === 'admin_staff') return 'staff';
    if (tab === 'admin_audit') return 'audit';
    return 'queue';
  };

  // Active view tab synced with Navbar tab
  const [subTab, setSubTab] = useState<AdminSubTab>(() => getSubTabFromTab(currentTab));

  useEffect(() => {
    setSubTab(getSubTabFromTab(currentTab));
  }, [currentTab]);

  // Case Filters
  const [searchCaseQuery, setSearchCaseQuery] = useState('');
  const [filterCaseCategory, setFilterCaseCategory] = useState('all');
  const [filterCasePriority, setFilterCasePriority] = useState('all');
  const [filterCaseStatus, setFilterCaseStatus] = useState('all');
  const [expandedCaseIds, setExpandedCaseIds] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState<string | null>(null);

  // Audit Trail 3 Portal Categories State ('all' | 'student' | 'staff' | 'admin')
  const [auditPortalFilter, setAuditPortalFilter] = useState<'all' | 'student' | 'staff' | 'admin'>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  const getLogPortal = (log: AuditLog): 'student' | 'staff' | 'admin' => {
    if (log.portal) return log.portal;
    const act = (log.action || '').toUpperCase();
    const actorId = (log.actorId || '').toLowerCase();
    const actorName = (log.actorName || '').toLowerCase();

    if (
      actorId.includes('admin') ||
      actorName.includes('admin') ||
      act.startsWith('ADMIN_') ||
      act.includes('DEPARTMENT_') ||
      act.includes('STAFF_ACCOUNT_') ||
      act.includes('STAFF_PROVISIONED') ||
      act.includes('CASE_DELETED') ||
      act.includes('ALL_CASES_')
    ) {
      return 'admin';
    }

    if (
      actorId.includes('staff') ||
      actorName.includes('staff') ||
      actorName.includes('officer') ||
      act.includes('STATUS_UPDATED') ||
      act.includes('CASE_ASSIGNED') ||
      act.includes('CASE_ESCALATED') ||
      act.includes('INTERNAL_NOTE') ||
      act.startsWith('STAFF_')
    ) {
      return 'staff';
    }

    return 'student';
  };

  const toggleExpandCase = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedCaseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Modals
  const [showNewDeptModal, setShowNewDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptType, setNewDeptType] = useState('general');
  const [newDeptEmail, setNewDeptEmail] = useState('');
  const [savingDept, setSavingDept] = useState(false);

  const [showNewStaffModal, setShowNewStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffId, setNewStaffId] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffDept, setNewStaffDept] = useState('');
  const [newStaffFieldScope, setNewStaffFieldScope] = useState('all');
  const [savingStaff, setSavingStaff] = useState(false);

  // Admin Login Authentication Gate (Clean empty defaults)
  const [internalAdminAuth, setInternalAdminAuth] = useState<boolean>(() => {
    return localStorage.getItem('campuscare_admin_auth') === 'true';
  });
  const isAdminAuthenticated = propIsAdminAuth !== undefined ? propIsAdminAuth : internalAdminAuth;
  const setIsAdminAuthenticated = (val: boolean) => {
    setInternalAdminAuth(val);
    if (onAdminAuthChange) onAdminAuthChange(val);
  };
  const [adminLoginUser, setAdminLoginUser] = useState('');
  const [adminLoginPass, setAdminLoginPass] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  // Admin Change Password Modal State
  const [showAdminChangePasswordModal, setShowAdminChangePasswordModal] = useState(false);
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminPasswordChangeError, setAdminPasswordChangeError] = useState<string | null>(null);
  const [adminPasswordChangeSuccess, setAdminPasswordChangeSuccess] = useState<string | null>(null);

  // Progressive On-Demand Queue Loading
  const [queueDisplayLimit, setQueueDisplayLimit] = useState(5);
  const [isLoadingMoreQueue, setIsLoadingMoreQueue] = useState(false);

  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);
  const [isSavingAdminPassword, setIsSavingAdminPassword] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminLoginUser.trim() || !adminLoginPass.trim()) {
      setAdminLoginError('Please enter Administrator Username and Password.');
      return;
    }

    try {
      setIsAdminLoggingIn(true);
      setAdminLoginError(null);
      await api.loginAdmin({
        username: adminLoginUser.trim(),
        password: adminLoginPass.trim()
      });
      setIsAdminAuthenticated(true);
      localStorage.setItem('campuscare_admin_auth', 'true');
    } catch (err: any) {
      setAdminLoginError(err.message || 'Invalid Administrator credentials.');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPasswordChangeError(null);
    setAdminPasswordChangeSuccess(null);
    if (!adminCurrentPassword.trim()) {
      setAdminPasswordChangeError('Current password is required.');
      return;
    }
    if (!adminNewPassword || adminNewPassword.length < 6) {
      setAdminPasswordChangeError('New password must be at least 6 characters long.');
      return;
    }
    if (adminNewPassword !== adminConfirmPassword) {
      setAdminPasswordChangeError('New passwords do not match.');
      return;
    }
    try {
      setIsSavingAdminPassword(true);
      await api.changeAdminPassword({
        currentPassword: adminCurrentPassword,
        newPassword: adminNewPassword
      });
      setAdminPasswordChangeSuccess('Admin password changed successfully in database!');
      setTimeout(() => {
        setShowAdminChangePasswordModal(false);
        setAdminCurrentPassword('');
        setAdminNewPassword('');
        setAdminConfirmPassword('');
        setAdminPasswordChangeSuccess(null);
      }, 1200);
    } catch (err: any) {
      setAdminPasswordChangeError(err.message || 'Failed to update administrator password.');
    } finally {
      setIsSavingAdminPassword(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('campuscare_admin_auth');
    setIsAdminAuthenticated(false);
  };

  const handleDeleteCase = async (publicCaseId: string) => {
    if (!window.confirm(`Permanently delete case record ${publicCaseId}?`)) return;
    try {
      await api.deleteCase(publicCaseId);
      setCases(prev => prev.filter(c => c.publicCaseId !== publicCaseId));
    } catch (e: any) {
      alert(e.message || 'Failed to delete case');
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadAdminData();
    }
  }, [isAdminAuthenticated]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [statsRes, deptsRes, staffRes, auditRes, casesRes] = await Promise.all([
        api.getStats(),
        api.getDepartments(),
        api.getStaff().catch(() => ({ staff: [] })),
        api.getAuditLogs(50),
        api.getCases({ role: 'super_admin' }).catch(() => ({ cases: [] }))
      ]);
      setStats(statsRes.stats);
      setDepartments(deptsRes.departments || []);
      setStaffMembers(staffRes.staff || []);
      setAuditLogs(auditRes.logs || []);
      const fetchedCases = casesRes.cases || [];
      setCases(fetchedCases);
      if (isInitialCasesLoadRef.current) {
        fetchedCases.forEach((c: Case) => seenCaseIdsRef.current.add(c.publicCaseId));
        isInitialCasesLoadRef.current = false;
      }
      if (deptsRes.departments && deptsRes.departments.length > 0 && !newStaffDept) {
        setNewStaffDept(deptsRes.departments[0].id);
      }
    } catch (e: any) {
      console.error(e);
      setLoadError(e.message || 'Unable to sync live administration data. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time polling for brand NEW incoming cases only (Admin requirement: "admin me jab new case aaye tab sirf notification aaye")
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        const casesRes = await api.getCases({ role: 'super_admin' }).catch(() => null);
        if (!casesRes || !casesRes.cases) return;

        const fetchedCases: Case[] = casesRes.cases;

        if (isInitialCasesLoadRef.current) {
          fetchedCases.forEach(c => seenCaseIdsRef.current.add(c.publicCaseId));
          isInitialCasesLoadRef.current = false;
          return;
        }

        // Strictly detect brand new cases that were not in our seen list
        const brandNewCases = fetchedCases.filter(c => !seenCaseIdsRef.current.has(c.publicCaseId));

        if (brandNewCases.length > 0) {
          brandNewCases.forEach(c => seenCaseIdsRef.current.add(c.publicCaseId));
          const latestCase = brandNewCases[0];

          // Trigger audio & notifications for Admin exclusively on NEW case
          playAdminNewCaseAlert();
          setNewCaseAlert(latestCase);

          sendDesktopNotification({
            title: `🚨 New Case #${latestCase.publicCaseId} Logged`,
            body: `${latestCase.category || latestCase.reportType} (${latestCase.priority}) - ${latestCase.description.slice(0, 80)}`
          });

          // Live update queue & stats counters
          setCases(fetchedCases);
          api.getStats().then(s => setStats(s.stats)).catch(() => {});
        }
      } catch (e) {
        // silent background poll fail
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAdminAuthenticated]);

  const handleRequestDesktopAlerts = async () => {
    const perm = await requestNotificationPermission();
    setDesktopPerm(perm);
    if (perm === 'granted') {
      playAdminNewCaseAlert();
      sendDesktopNotification({
        title: 'Admin Alerts Activated',
        body: 'You will receive immediate alerts whenever a new incident case is logged.'
      });
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      setSavingDept(true);
      await api.createDepartment({
        name: newDeptName.trim(),
        type: newDeptType,
        email: newDeptEmail.trim() || undefined
      });
      setNewDeptName('');
      setNewDeptEmail('');
      setShowNewDeptModal(false);
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Failed to create department');
    } finally {
      setSavingDept(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffId.trim() || !newStaffPassword.trim()) {
      alert('Staff Full Name, Staff Login ID, and Password are required.');
      return;
    }

    try {
      setSavingStaff(true);
      await api.createStaff({
        name: newStaffName.trim(),
        staffId: newStaffId.trim().toUpperCase(),
        email: newStaffEmail.trim() || undefined,
        password: newStaffPassword.trim(),
        departmentId: newStaffDept || (departments.length > 0 ? departments[0].id : ''),
        fieldScope: newStaffFieldScope,
        title: 'Staff Officer'
      });
      alert(`Staff Account provisioned successfully!\n\nName: ${newStaffName.trim()}\nStaff ID: ${newStaffId.trim().toUpperCase()}\nPassword: ${newStaffPassword.trim()}\nField Jurisdiction: ${newStaffFieldScope === 'all' ? 'All Unit Incidents' : newStaffFieldScope}`);
      setNewStaffName('');
      setNewStaffId('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      setNewStaffFieldScope('all');
      setShowNewStaffModal(false);
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Failed to register staff member');
    } finally {
      setSavingStaff(false);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Remove staff member "${name}"?`)) return;
    try {
      await api.deleteStaff(id);
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Failed to remove staff');
    }
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Remove department "${name}"?`)) return;
    try {
      await api.deleteDepartment(id);
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Failed to remove department');
    }
  };

  const filteredCases = cases.filter(c => {
    if (filterCaseCategory !== 'all' && c.reportType !== filterCaseCategory && !c.category.toLowerCase().includes(filterCaseCategory.toLowerCase())) {
      return false;
    }
    if (filterCasePriority !== 'all' && c.priority.toUpperCase() !== filterCasePriority.toUpperCase()) {
      return false;
    }
    if (filterCaseStatus !== 'all' && c.status.toUpperCase() !== filterCaseStatus.toUpperCase()) {
      return false;
    }
    if (searchCaseQuery.trim()) {
      const q = searchCaseQuery.toLowerCase();
      return (
        c.publicCaseId.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        (c.reporterName && c.reporterName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-[#0066FF] flex items-center justify-center mx-auto shadow-xs">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-heading">
              Executive Administration
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Secure oversight portal for University Proctors & Command
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Admin User ID</label>
              <input
                type="text"
                value={adminLoginUser}
                onChange={(e) => setAdminLoginUser(e.target.value)}
                placeholder="Enter Admin User ID"
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs font-medium outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Admin Password</label>
              <input
                type="password"
                value={adminLoginPass}
                onChange={(e) => setAdminLoginPass(e.target.value)}
                placeholder="Enter Admin Password"
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs font-medium outline-none"
                required
              />
            </div>

            {adminLoginError && (
              <p className="text-xs text-rose-600 font-semibold p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                {adminLoginError}
              </p>
            )}

            <button
              type="submit"
              disabled={isAdminLoggingIn}
              className="w-full py-3.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {isAdminLoggingIn ? 'Authenticating Administrator...' : 'Sign In as Administrator →'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0066FF] shadow-xs animate-pulse" />
              Executive Command & Oversight
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0066FF] border border-blue-200">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Campus-wide incident oversight, real-time telemetry, and department directory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isNotificationSupported() && desktopPerm !== 'granted' && (
            <button
              type="button"
              onClick={handleRequestDesktopAlerts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-semibold text-[#0066FF] transition-all cursor-pointer shadow-2xs"
              title="Enable desktop notifications when new cases are reported"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enable New-Case Alerts</span>
            </button>
          )}

          {desktopPerm === 'granted' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 shadow-2xs">
              <BellRing className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">New-Case Alerts Active</span>
            </span>
          )}

          <button
            onClick={loadAdminData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin text-[#0066FF]' : ''}`} />
            <span className="hidden sm:inline">Sync Live Data</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdminCurrentPassword('');
              setAdminNewPassword('');
              setAdminConfirmPassword('');
              setAdminPasswordChangeError(null);
              setAdminPasswordChangeSuccess(null);
              setShowAdminChangePasswordModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs"
            title="Change Administrator Password"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-600" />
            <span>Change Password</span>
          </button>

          <button
            onClick={handleAdminLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-xs transition-all cursor-pointer"
            title="Log out of Admin Console"
          >
            <Lock className="w-3.5 h-3.5 text-rose-600" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Live Data Connection Error Banner */}
      {loadError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-medium">{loadError}</span>
          </div>
          <button
            onClick={loadAdminData}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Aggregate Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-5 rounded-3xl bg-[#F0F7FF] border border-[#DCEBFF] shadow-xs">
            <span className="text-[11px] font-bold text-[#0066FF] uppercase tracking-wider block">Total Cases</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-slate-900 font-mono">{stats.totalCases}</span>
              <span className="text-[10px] text-[#0066FF] bg-white border border-blue-200 px-2 py-0.5 rounded-full font-mono font-semibold shadow-2xs">Platform</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#F0FDF9] border border-[#CCFBEF] shadow-xs">
            <span className="text-[11px] font-bold text-[#0E9384] uppercase tracking-wider block">Identity Protected</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-slate-900 font-mono">{stats.anonymousPercentage}%</span>
              <span className="text-[10px] text-[#0E9384] bg-white border border-teal-200 px-2 py-0.5 rounded-full font-mono font-semibold shadow-2xs">{stats.anonymousCount} safe</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#FFF9EE] border border-[#FEE8B7] shadow-xs">
            <span className="text-[11px] font-bold text-[#B54708] uppercase tracking-wider block">Avg Resolution</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-slate-900 font-mono">{stats.averageResolutionHours}h</span>
              <span className="text-[10px] text-[#B54708] bg-white border border-amber-200 px-2 py-0.5 rounded-full font-mono font-semibold shadow-2xs">&lt; 6h Target</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#FFF1F0] border border-[#FED4D1] shadow-xs">
            <span className="text-[11px] font-bold text-[#D92D20] uppercase tracking-wider block">Critical Alerts</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-slate-900 font-mono">{stats.critical}</span>
              <span className={`text-[10px] bg-white px-2 py-0.5 rounded-full font-mono font-semibold shadow-2xs ${stats.critical > 0 ? 'text-[#D92D20] border border-red-200' : 'text-slate-500 border border-slate-200'}`}>
                {stats.critical > 0 ? 'Action Req' : 'Clear'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Segmented Sub-Nav Controls */}
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-white border border-slate-200/80 shadow-xs overflow-x-auto">
        {[
          { id: 'queue', label: 'Incidents Queue', icon: ClipboardList, count: cases.length },
          { id: 'analytics', label: 'Analytics Matrix', icon: BarChart3 },
          { id: 'departments', label: 'Departments', icon: Building2, count: departments.length },
          { id: 'staff', label: 'Faculty & Staff', icon: Users, count: staffMembers.length },
          { id: 'audit', label: 'Audit Trail', icon: FileText, count: auditLogs.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSubTab(tab.id as AdminSubTab);
                if (onNavigateTab) {
                  onNavigateTab('admin_' + tab.id);
                }
              }}
              className={`relative px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive ? 'bg-[#0066FF] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: INCIDENTS QUEUE */}
      {subTab === 'queue' && (
        <div className="space-y-4">
          {/* Quick Category Filters & Search */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Cases', count: cases.length },
                { id: 'safety', label: 'Safety & Harassment', count: cases.filter(c => c.reportType === 'safety' || c.category.toLowerCase().includes('safety')).length },
                { id: 'maintenance', label: 'Facilities', count: cases.filter(c => c.reportType === 'maintenance' || c.category.toLowerCase().includes('maint')).length },
                { id: 'lost_found', label: 'Lost & Found', count: cases.filter(c => c.reportType === 'lost_found' || c.category.toLowerCase().includes('lost')).length },
                { id: 'other', label: 'Student Welfare', count: cases.filter(c => c.reportType === 'other').length }
              ].map((cat) => {
                const isSelected = filterCaseCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilterCaseCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="ml-1.5 text-[10px] opacity-75 font-mono">({cat.count})</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchCaseQuery}
                  onChange={(e) => setSearchCaseQuery(e.target.value)}
                  placeholder="Search ID, keyword, location..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>

              <select
                aria-label="Filter Priority"
                value={filterCasePriority}
                onChange={(e) => setFilterCasePriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium outline-none focus:border-[#0066FF]"
              >
                <option value="all">All Priorities</option>
                <option value="CRITICAL">🔴 Critical Only</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">⚪ Low</option>
              </select>

              <select
                aria-label="Filter Status"
                value={filterCaseStatus}
                onChange={(e) => setFilterCaseStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium outline-none focus:border-[#0066FF]"
              >
                <option value="all">All Statuses</option>
                <option value="NEW">New Submissions</option>
                <option value="AI_TRIAGED">AI Triaged</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ACTION_TAKEN">Action Taken</option>
                <option value="RESOLVED">Resolved</option>
                <option value="ESCALATED">Escalated</option>
              </select>
            </div>
          </div>

          {/* Cases List */}
          {filteredCases.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/80 text-xs text-slate-400 space-y-2 shadow-xs">
              <ClipboardList className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-700">No cases match the selected filter</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence mode="popLayout">
                {filteredCases.slice(0, queueDisplayLimit).map((c) => (
                  <motion.div
                    key={c.publicCaseId}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    onClick={() => setSelectedCase(c)}
                    className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer space-y-2 group w-full max-w-full overflow-hidden break-words"
                  >
                    {/* Primary Header: ID, Badges, Date */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 w-full min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className="font-mono text-xs font-bold text-[#0066FF] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md shrink-0">
                          {c.publicCaseId}
                        </span>
                        <CategoryBadge category={c.category || c.reportType} size="sm" />
                        <PriorityBadge priority={c.priority} size="sm" />
                        <StatusBadge status={c.status} size="sm" />
                      </div>

                      <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 font-mono font-medium shrink-0">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Compact One-Line Snippet */}
                    <div className="flex items-center justify-between gap-2 text-xs w-full min-w-0">
                      <p className="text-slate-800 line-clamp-1 font-medium flex-1 min-w-0 truncate">
                        "{c.description}"
                      </p>
                      <span className="text-[10px] text-emerald-700 font-semibold shrink-0">
                        {c.isAnonymous ? '🛡️ Anon' : `${c.reporterName || 'Identified'}`}
                      </span>
                    </div>

                    {/* Secondary Details (Expandable Section) */}
                    <AnimatePresence>
                      {expandedCaseIds.has(c.publicCaseId) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-1.5 border-t border-slate-100 space-y-2 text-xs overflow-hidden w-full min-w-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-800 space-y-1 w-full min-w-0 break-words">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Full Statement:</span>
                            <p className="leading-relaxed break-words">"{c.description}"</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 min-w-0">
                            <span className="flex items-center gap-1 font-medium min-w-0">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="truncate max-w-[200px] sm:max-w-none">{c.location || 'Campus'}</span>
                            </span>

                            {c.assignedDepartmentName && (
                              <span className="flex items-center gap-1 font-medium min-w-0">
                                <Users className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                                <span className="truncate max-w-[200px] sm:max-w-none">{c.assignedDepartmentName}</span>
                              </span>
                            )}

                            {c.evidence && c.evidence.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-medium shrink-0">
                                <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                                <span>{c.evidence.length} file(s) attached</span>
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between pt-1 text-xs w-full min-w-0">
                      <button
                        type="button"
                        onClick={(e) => toggleExpandCase(e, c.publicCaseId)}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedCaseIds.has(c.publicCaseId) ? 'rotate-180' : ''}`} />
                        <span>{expandedCaseIds.has(c.publicCaseId) ? 'Hide details' : 'More details'}</span>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCase(c.publicCaseId);
                          }}
                          title="Delete Case Record"
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="inline-flex items-center gap-1 text-[#0066FF] text-[11px] font-semibold group-hover:underline">
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredCases.length > queueDisplayLimit && (
                <div className="pt-2 space-y-3">
                  {isLoadingMoreQueue && <JioSkeletonLoader count={2} />}
                  <div className="text-center">
                    <button
                      type="button"
                      disabled={isLoadingMoreQueue}
                      onClick={() => {
                        setIsLoadingMoreQueue(true);
                        setTimeout(() => {
                          setQueueDisplayLimit(prev => prev + 5);
                          setIsLoadingMoreQueue(false);
                        }, 400);
                      }}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-all hover:border-slate-300"
                    >
                      <span>Load More Incidents ({filteredCases.length - queueDisplayLimit} more)</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: ANALYTICS MATRIX */}
      {subTab === 'analytics' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0066FF]" />
              Category Distribution
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Safety & Harassment', count: stats.byCategory.safety, color: 'bg-rose-500' },
                { label: 'Facilities Maintenance', count: stats.byCategory.maintenance, color: 'bg-amber-500' },
                { label: 'Lost & Found', count: stats.byCategory.lost_found, color: 'bg-teal-500' },
                { label: 'Student Welfare', count: stats.byCategory.other, color: 'bg-blue-500' }
              ].map((cat) => {
                const pct = stats.totalCases > 0 ? Math.round((cat.count / stats.totalCases) * 100) : 0;
                return (
                  <div key={cat.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 font-medium">{cat.label}</span>
                      <span className="font-mono text-slate-500 font-semibold">{cat.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Priority Severity
            </h3>
            <div className="space-y-3">
              {[
                { label: 'CRITICAL', count: stats.byPriority.CRITICAL, color: 'bg-[#D92D20]' },
                { label: 'HIGH', count: stats.byPriority.HIGH, color: 'bg-orange-500' },
                { label: 'MEDIUM', count: stats.byPriority.MEDIUM, color: 'bg-amber-500' },
                { label: 'LOW', count: stats.byPriority.LOW, color: 'bg-slate-400' }
              ].map((p) => {
                const pct = stats.totalCases > 0 ? Math.round((p.count / stats.totalCases) * 100) : 0;
                return (
                  <div key={p.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 font-medium">{p.label}</span>
                      <span className="font-mono text-slate-500 font-semibold">{p.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${p.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Privacy Telemetry
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-[#F0FDF9] border border-[#CCFBEF] text-[#0E9384]">
                <span className="text-[11px] block font-bold uppercase tracking-wider">Anonymous Submissions</span>
                <span className="text-3xl font-bold font-mono mt-1 block text-slate-900">{stats.anonymousCount} / {stats.totalCases}</span>
                <span className="text-xs font-medium block mt-1">{stats.anonymousPercentage}% students use identity protection</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                Protected by SHA-256 salted PIN tokens. Zero device telemetry or cookies persisted.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DEPARTMENTS */}
      {subTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-slate-900 font-heading">Campus Departments ({departments.length})</h3>
              <p className="text-xs text-slate-500">Configured departments for incident triage and resolution routing.</p>
            </div>
            <button
              onClick={() => setShowNewDeptModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Department</span>
            </button>
          </div>

          {departments.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-white border border-slate-200/80 text-xs text-slate-500 space-y-3 shadow-xs">
              <Building2 className="w-10 h-10 text-[#0066FF]/70 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">Zero Custom Departments</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Add campus departments for incident routing and triage.
                </p>
              </div>
              <button
                onClick={() => setShowNewDeptModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Department</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between text-xs group hover:border-slate-300 shadow-xs transition-all w-full max-w-full overflow-hidden break-words min-w-0"
                >
                  <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                    <strong className="text-slate-900 text-sm block font-bold truncate">{dept.name}</strong>
                    <span className="text-slate-500 font-mono text-[11px] truncate block">{dept.email || 'Internal Dispatch'}</span>
                    <span className="text-[10px] text-[#0066FF] font-mono capitalize block font-semibold truncate">Type: {dept.type}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] border border-emerald-200 font-mono font-bold">
                      Active
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title={`Remove ${dept.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: STAFF & FACULTY */}
      {subTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-slate-900 font-heading">Faculty & Staff Registry ({staffMembers.length})</h3>
              <p className="text-xs text-slate-500">Authenticated staff members authorized to review campus cases.</p>
            </div>
            <button
              onClick={() => setShowNewStaffModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Enroll Staff Member</span>
            </button>
          </div>

          {departments.length === 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
              <span className="font-medium">No campus departments created yet. You need at least one department to assign staff.</span>
              <button
                type="button"
                onClick={() => setSubTab('departments')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-semibold shrink-0 cursor-pointer shadow-xs"
              >
                Go to Departments →
              </button>
            </div>
          )}

          {staffMembers.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-white border border-slate-200/80 text-xs text-slate-500 space-y-3 shadow-xs">
              <Users className="w-9 h-9 text-slate-400 mx-auto" />
              <div>
                <p className="font-bold text-slate-800 text-sm">Zero staff members registered yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Register staff members to handle assigned student reports.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewStaffModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066FF] text-white font-semibold text-xs shadow-xs cursor-pointer hover:bg-[#0052CC]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add First Staff Member</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {staffMembers.map((staff) => {
                const dept = departments.find(d => d.id === staff.departmentId);
                return (
                  <div
                    key={staff.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 flex items-start justify-between text-xs hover:border-slate-300 shadow-xs transition-all w-full max-w-full overflow-hidden break-words min-w-0"
                  >
                    <div className="space-y-1 min-w-0 flex-1 pr-2">
                      <strong className="text-slate-900 text-sm block font-bold truncate">{staff.name}</strong>
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#0066FF] border border-blue-200 shrink-0">
                          ID: {staff.staffId}
                        </span>
                        <span className="text-[11px] text-slate-700 font-semibold block truncate max-w-[140px]">
                          {dept ? dept.name : (staff.departmentName || staff.departmentId)}
                        </span>
                      </div>
                      <span className="text-slate-500 block text-[11px] font-medium truncate">{staff.title}</span>
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5 min-w-0">
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                          Scope: {staff.fieldScope === 'all' ? 'All Unit Incidents' : staff.fieldScope || 'all'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        {staff.email}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteStaff(staff.id, staff.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Remove staff officer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: AUDIT TRAIL (Categorized into 3 Portals: Student, Staff, Admin) */}
      {subTab === 'audit' && (() => {
        const studentCount = auditLogs.filter(l => getLogPortal(l) === 'student').length;
        const staffCount = auditLogs.filter(l => getLogPortal(l) === 'staff').length;
        const adminCount = auditLogs.filter(l => getLogPortal(l) === 'admin').length;

        const filteredLogs = auditLogs.filter(log => {
          const p = getLogPortal(log);
          if (auditPortalFilter !== 'all' && p !== auditPortalFilter) return false;
          if (auditSearchQuery.trim()) {
            const q = auditSearchQuery.toLowerCase();
            const matchAction = log.action.toLowerCase().includes(q);
            const matchActor = log.actorName.toLowerCase().includes(q) || log.actorId.toLowerCase().includes(q);
            const matchCase = log.publicCaseId?.toLowerCase().includes(q);
            const matchDetails = log.details?.toLowerCase().includes(q);
            return matchAction || matchActor || matchCase || matchDetails;
          }
          return true;
        });

        return (
          <div className="space-y-4">
            {/* Header & Meta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                  <span>Portal Activity Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Track and verify actions segregated across Student, Staff, and Executive Admin portals.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 self-start sm:self-auto font-semibold">
                Total Events: {auditLogs.length}
              </span>
            </div>

            {/* 3 Portal Category KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category 1: Student / Public Portal */}
              <button
                type="button"
                onClick={() => setAuditPortalFilter(auditPortalFilter === 'student' ? 'all' : 'student')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                  auditPortalFilter === 'student'
                    ? 'bg-blue-50/90 border-[#0066FF] ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200/80 hover:border-blue-200 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0066FF] flex items-center justify-center font-bold text-xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-lg font-bold text-slate-900">{studentCount}</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-bold text-slate-900 block font-heading">
                    1. Student Portal
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Case submissions, emergency SOS & follow-ups
                  </p>
                </div>
              </button>

              {/* Category 2: Staff / Officer Portal */}
              <button
                type="button"
                onClick={() => setAuditPortalFilter(auditPortalFilter === 'staff' ? 'all' : 'staff')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                  auditPortalFilter === 'staff'
                    ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200/80 hover:border-amber-200 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-lg font-bold text-slate-900">{staffCount}</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-bold text-slate-900 block font-heading">
                    2. Staff Portal
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Resolution progression, escalations & department routing
                  </p>
                </div>
              </button>

              {/* Category 3: Admin / Executive Portal */}
              <button
                type="button"
                onClick={() => setAuditPortalFilter(auditPortalFilter === 'admin' ? 'all' : 'admin')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                  auditPortalFilter === 'admin'
                    ? 'bg-purple-50/90 border-purple-500 ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200/80 hover:border-purple-200 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-lg font-bold text-slate-900">{adminCount}</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-bold text-slate-900 block font-heading">
                    3. Admin Portal
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Staff account provisioning, departments & security
                  </p>
                </div>
              </button>
            </div>

            {/* Filter Pills and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Portals', count: auditLogs.length },
                  { id: 'student', label: '🎓 Student Portal', count: studentCount },
                  { id: 'staff', label: '🛡️ Staff Portal', count: staffCount },
                  { id: 'admin', label: '⚡ Admin Portal', count: adminCount }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setAuditPortalFilter(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      auditPortalFilter === cat.id
                        ? 'bg-[#0066FF] text-white shadow-xs font-bold'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      auditPortalFilter === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  placeholder="Filter by action or actor..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#0066FF]"
                />
              </div>
            </div>

            {/* Audit Logs List */}
            <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 max-h-[480px] overflow-y-auto shadow-xs">
              {filteredLogs.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400 space-y-1.5">
                  <FileText className="w-7 h-7 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">No audit events match this portal filter</p>
                  <p className="text-[11px] text-slate-400">Try selecting "All Portals" or clearing your search term.</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const p = getLogPortal(log);
                  const isStudent = p === 'student';
                  const isStaff = p === 'staff';
                  const isAdmin = p === 'admin';

                  return (
                    <div key={log.id} className="p-3.5 sm:p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Portal Category Badge */}
                          <span className={`inline-flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded-md border shrink-0 ${
                            isStudent
                              ? 'bg-blue-50 text-[#0066FF] border-blue-200'
                              : isStaff
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {isStudent && <GraduationCap className="w-3 h-3" />}
                            {isStaff && <Briefcase className="w-3 h-3" />}
                            {isAdmin && <Shield className="w-3 h-3" />}
                            <span>
                              {isStudent ? 'Student Portal' : isStaff ? 'Staff Portal' : 'Admin Portal'}
                            </span>
                          </span>

                          {/* Action Name */}
                          <span className="font-bold text-slate-900 font-mono text-[11px]">
                            {log.action.replace(/_/g, ' ')}
                          </span>

                          {/* Case Reference if present */}
                          {log.publicCaseId && (
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-bold shrink-0">
                              #{log.publicCaseId}
                            </span>
                          )}
                        </div>

                        {/* Actor & Details Context */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                          <span>
                            Actor: <strong className="text-slate-800 font-semibold">{log.actorName}</strong>{' '}
                            <span className="text-slate-400 font-mono">({log.actorId})</span>
                          </span>

                          {log.details && (
                            <span className="text-slate-600 truncate max-w-sm">
                              • {log.details}
                            </span>
                          )}

                          {log.metadata?.newStatus && (
                            <span className="text-emerald-700 font-medium">
                              • Status → <strong className="font-mono">{log.metadata.newStatus}</strong>
                            </span>
                          )}

                          {log.metadata?.departmentName && (
                            <span className="text-blue-700 font-medium">
                              • Routed to {log.metadata.departmentName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="text-[10px] font-mono text-slate-400 shrink-0 font-medium flex items-center gap-1 sm:self-center">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span>
                          {new Date(log.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* Add Department Modal */}
      <AnimatePresence>
        {showNewDeptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-7 border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 font-heading">Create Campus Department</h2>
                <button onClick={() => setShowNewDeptModal(false)} className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDepartment} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department Name</label>
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="Department Name"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Type</label>
                  <select
                    aria-label="Department Type"
                    value={newDeptType}
                    onChange={(e) => setNewDeptType(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none font-medium"
                  >
                    <option value="safety">Safety & Security</option>
                    <option value="welfare">Student Welfare / Counseling</option>
                    <option value="maintenance">Facilities / Maintenance</option>
                    <option value="hostel">Hostel Administration</option>
                    <option value="it">IT & Infrastructure</option>
                    <option value="general">General Campus Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Dispatch Email</label>
                  <input
                    type="email"
                    value={newDeptEmail}
                    onChange={(e) => setNewDeptEmail(e.target.value)}
                    placeholder="dept@campus.edu"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewDeptModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingDept}
                    className="flex-1 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
                  >
                    {savingDept ? 'Saving...' : 'Add Department'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Provision Staff Modal */}
      <AnimatePresence>
        {showNewStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-7 border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 font-heading">Provision Staff Member</h2>
                <button onClick={() => setShowNewStaffModal(false)} className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 font-semibold">Staff Login ID *</label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={newStaffId}
                        onChange={(e) => setNewStaffId(e.target.value)}
                        placeholder="Staff Login ID"
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs outline-none font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 font-semibold">Login Password *</label>
                    </div>
                    <div className="relative">
                      <input
                        type={showStaffPassword ? 'text' : 'password'}
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                        placeholder="Create staff password"
                        className="w-full pl-3 pr-9 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs outline-none font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPassword(!showStaffPassword)}
                        className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showStaffPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Department *</label>
                  {departments.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                      <span className="font-medium">No departments created yet</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewStaffModal(false);
                          setSubTab('departments');
                        }}
                        className="text-[#0066FF] underline font-bold cursor-pointer"
                      >
                        + Create Department
                      </button>
                    </div>
                  ) : (
                    <select
                      aria-label="Staff Department"
                      value={newStaffDept}
                      onChange={(e) => setNewStaffDept(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none font-medium"
                      required
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Field Scope / Category Jurisdiction *</label>
                  <select
                    aria-label="Field Scope"
                    value={newStaffFieldScope}
                    onChange={(e) => setNewStaffFieldScope(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs outline-none font-medium"
                  >
                    <option value="all">All Department Cases (Full Scope)</option>
                    <option value="safety">Student Safety, Anti-Ragging & Harassment</option>
                    <option value="maintenance">Facilities, Electrical & Plumbing</option>
                    <option value="hostel">Hostel Administration & Mess</option>
                    <option value="it">IT Infrastructure & Labs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="Official email (optional)"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewStaffModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingStaff}
                    className="flex-1 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
                  >
                    {savingStaff ? 'Saving...' : 'Authorize Staff'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Change Password Modal */}
      <AnimatePresence>
        {showAdminChangePasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-[#0066FF]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 font-heading">Change Admin Password</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminChangePasswordModal(false);
                    setAdminPasswordChangeError(null);
                    setAdminPasswordChangeSuccess(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleChangeAdminPassword} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={adminCurrentPassword}
                    onChange={(e) => setAdminCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-[#0066FF] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">New Password (Min 6 chars)</label>
                  <input
                    type="password"
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-[#0066FF] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-[#0066FF] outline-none"
                    required
                  />
                </div>

                {adminPasswordChangeError && (
                  <p className="text-[11px] text-rose-600 font-semibold p-2 rounded-lg bg-rose-50 border border-rose-200">
                    {adminPasswordChangeError}
                  </p>
                )}

                {adminPasswordChangeSuccess && (
                  <p className="text-[11px] text-emerald-700 font-semibold p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    {adminPasswordChangeSuccess}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminChangePasswordModal(false);
                      setAdminPasswordChangeError(null);
                      setAdminPasswordChangeSuccess(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Case Details Drawer / Modal */}
      {selectedCase && (
        <StaffCaseDetail
          caseItem={selectedCase}
          departments={departments}
          actorName="Super Admin"
          onClose={() => setSelectedCase(null)}
          onCaseUpdated={(updated) => {
            setCases(prev => prev.map(c => c.publicCaseId === updated.publicCaseId ? updated : c));
            setSelectedCase(updated);
            loadAdminData();
          }}
        />
      )}

      {/* Floating Live Alert for Brand New Case (Admin Only) */}
      <AnimatePresence>
        {newCaseAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 max-w-md w-full bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-blue-500/40 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0066FF] text-white flex items-center justify-center shrink-0 shadow-md">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      New Incident Reported
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md">
                      {newCaseAlert.publicCaseId}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-heading mt-0.5">
                    {newCaseAlert.category || newCaseAlert.reportType}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewCaseAlert(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 font-medium">
              "{newCaseAlert.description}"
            </p>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{newCaseAlert.location || 'Campus'}</span>
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setNewCaseAlert(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCase(newCaseAlert);
                    setNewCaseAlert(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Inspect Case</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
