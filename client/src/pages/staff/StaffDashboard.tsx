import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShieldAlert, Wrench, RefreshCw, Siren, ClipboardList, ShieldCheck, ChevronRight, VolumeX, LogOut, UserCheck, ChevronDown, MapPin, Paperclip, Clock, KeyRound, X } from 'lucide-react';
import { api } from '../../services/api';
import { Case, Department, StaffUser } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge } from '../../components/CategoryBadge';
import { JioSkeletonLoader } from '../../components/JioSkeletonLoader';
import { StaffCaseDetail } from './StaffCaseDetail';
import { StaffLogin } from './StaffLogin';
import { playEmergencySiren, stopEmergencySiren } from '../../services/sound';

interface Props {
  staffDept: string;
  onNavigateTab?: (tab: string) => void;
}

export const StaffDashboard: React.FC<Props> = ({ staffDept, onNavigateTab }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffUser[]>([]);
  const [activeStaffUser, setActiveStaffUser] = useState<StaffUser | null>(() => {
    const saved = localStorage.getItem('campuscare_staff_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // Staff Change Password Modal State
  const [showStaffChangePasswordModal, setShowStaffChangePasswordModal] = useState(false);
  const [staffCurrentPassword, setStaffCurrentPassword] = useState('');
  const [staffNewPassword, setStaffNewPassword] = useState('');
  const [staffConfirmPassword, setStaffConfirmPassword] = useState('');
  const [staffPasswordChangeError, setStaffPasswordChangeError] = useState<string | null>(null);
  const [staffPasswordChangeSuccess, setStaffPasswordChangeSuccess] = useState<string | null>(null);
  const [savingStaffPassword, setSavingStaffPassword] = useState(false);

  // Progressive On-Demand Loading State for Staff Incidents
  const [staffDisplayLimit, setStaffDisplayLimit] = useState(5);
  const [isLoadingMoreStaff, setIsLoadingMoreStaff] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('campuscare_staff_session');
    setActiveStaffUser(null);
  };

  const handleChangeStaffPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffPasswordChangeError(null);
    setStaffPasswordChangeSuccess(null);
    if (!activeStaffUser) return;
    if (!staffNewPassword || staffNewPassword.length < 4) {
      setStaffPasswordChangeError('New password must be at least 4 characters long.');
      return;
    }
    if (staffNewPassword !== staffConfirmPassword) {
      setStaffPasswordChangeError('New passwords do not match.');
      return;
    }
    try {
      setSavingStaffPassword(true);
      await api.changeStaffPassword({
        staffId: activeStaffUser.staffId,
        oldPassword: staffCurrentPassword,
        newPassword: staffNewPassword
      });
      setStaffPasswordChangeSuccess('Password updated successfully!');
      setTimeout(() => {
        setShowStaffChangePasswordModal(false);
        setStaffCurrentPassword('');
        setStaffNewPassword('');
        setStaffConfirmPassword('');
        setStaffPasswordChangeSuccess(null);
      }, 1200);
    } catch (err: any) {
      setStaffPasswordChangeError(err.message || 'Failed to update password.');
    } finally {
      setSavingStaffPassword(false);
    }
  };

  // Real-Time Emergency SOS Siren State
  const [emergencyAlert, setEmergencyAlert] = useState<Case | null>(null);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const seenEmergencyIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Filters
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDept, setFilterDept] = useState(staffDept || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStaffCaseIds, setExpandedStaffCaseIds] = useState<Set<string>>(new Set());

  const toggleExpandStaffCase = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedStaffCaseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setFilterDept(staffDept);
  }, [staffDept]);

  useEffect(() => {
    setStaffDisplayLimit(5);
  }, [filterCategory, filterPriority, filterStatus, filterDept, searchQuery]);

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 4000);

    return () => {
      clearInterval(interval);
      stopEmergencySiren();
    };
  }, [filterCategory, filterPriority, filterStatus, filterDept, activeStaffUser]);

  const loadData = async (showIndicator = true) => {
    try {
      if (showIndicator) setLoading(true);
      const assignedDept = activeStaffUser?.departmentId || (filterDept === 'all' ? undefined : filterDept);
      const assignedScope = activeStaffUser?.fieldScope && activeStaffUser.fieldScope !== 'all' ? activeStaffUser.fieldScope : undefined;
      
      const [casesRes, deptsRes, staffRes] = await Promise.all([
        api.getCases({
          category: filterCategory,
          priority: filterPriority,
          status: filterStatus,
          departmentId: assignedDept,
          fieldScope: assignedScope,
          role: 'staff'
        }),
        api.getDepartments(),
        api.getStaff().catch(() => ({ staff: [] }))
      ]);

      const fetchedCases: Case[] = casesRes.cases || [];
      const fetchedStaff: StaffUser[] = staffRes.staff || [];
      setCases(fetchedCases);
      setDepartments(deptsRes.departments || []);
      setStaffMembers(fetchedStaff);

      const criticalCases = fetchedCases.filter(
        (c) => c.priority === 'CRITICAL' && (c.status === 'NEW' || c.status === 'AI_TRIAGED')
      );

      if (isInitialLoadRef.current) {
        criticalCases.forEach((c) => seenEmergencyIdsRef.current.add(c.publicCaseId));
        isInitialLoadRef.current = false;
      } else {
        const brandNewCritical = criticalCases.find(
          (c) => !seenEmergencyIdsRef.current.has(c.publicCaseId)
        );
        if (brandNewCritical) {
          seenEmergencyIdsRef.current.add(brandNewCritical.publicCaseId);
          triggerEmergencyNotification(brandNewCritical);
        }
      }
    } catch (e) {
      console.error('Failed to load queue:', e);
    } finally {
      if (showIndicator) setLoading(false);
    }
  };

  const triggerEmergencyNotification = (criticalCase: Case) => {
    setEmergencyAlert(criticalCase);
    setIsSirenPlaying(true);
    playEmergencySiren(8);
  };

  const handleMuteSiren = () => {
    stopEmergencySiren();
    setIsSirenPlaying(false);
  };

  const handleDismissEmergency = () => {
    stopEmergencySiren();
    setIsSirenPlaying(false);
    setEmergencyAlert(null);
  };

  const handleTriggerTestDemoAlert = () => {
    const testCase: Case = {
      id: 'test-emergency-' + Date.now(),
      publicCaseId: 'EMERGENCY-' + Math.floor(1000 + Math.random() * 9000),
      reportType: 'safety',
      category: 'Immediate Danger',
      subcategory: 'Armed Threat / Security Alert',
      description: 'SECURITY DRILL: Immediate panic button triggered in Campus East Wing.',
      location: 'Main Administrative Quad',
      incidentDate: 'Right Now',
      incidentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAnonymous: true,
      priority: 'CRITICAL',
      status: 'NEW',
      assignedDepartmentId: 'dept-security',
      assignedDepartmentName: 'Campus Security',
      assignedStaffId: null,
      assignedStaffName: null,
      evidence: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: []
    };
    triggerEmergencyNotification(testCase);
  };

  const newCount = cases.filter(c => c.status === 'NEW' || c.status === 'AI_TRIAGED').length;
  const inProgressCount = cases.filter(c => c.status === 'UNDER_REVIEW' || c.status === 'ASSIGNED').length;
  const criticalCount = cases.filter(c => c.priority === 'CRITICAL').length;
  const resolvedCount = cases.filter(c => c.status === 'RESOLVED').length;

  const filteredCases = cases.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.publicCaseId.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q)
    );
  });

  if (!activeStaffUser) {
    return (
      <StaffLogin
        onLoginSuccess={(user) => {
          setActiveStaffUser(user);
          loadData(true);
        }}
        onNavigateToAdmin={() => {
          if (onNavigateTab) onNavigateTab('admin_staff');
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6 relative z-10">
      {/* Sleek Emergency Strobe Banner if active */}
      <AnimatePresence>
        {emergencyAlert && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="p-5 rounded-3xl bg-[#FFF1F0] border border-[#FED4D1] flex flex-wrap items-center justify-between gap-3 shadow-md shadow-red-500/10"
          >
            <div className="flex items-center gap-3.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#D92D20] animate-ping shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#D92D20] uppercase tracking-wider font-mono">
                    Emergency Alert ({emergencyAlert.publicCaseId})
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white text-[#D92D20] font-bold border border-[#FED4D1]">
                    {emergencyAlert.location}
                  </span>
                </div>
                <p className="text-xs text-slate-800 line-clamp-1 mt-1 font-semibold">
                  {emergencyAlert.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isSirenPlaying && (
                <button
                  type="button"
                  onClick={handleMuteSiren}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#FED4D1] text-xs font-semibold text-[#D92D20] hover:bg-[#FFE4DE] inline-flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Mute Siren</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedCase(emergencyAlert);
                  handleDismissEmergency();
                }}
                className="px-4 py-1.5 rounded-xl bg-[#D92D20] hover:bg-[#B42318] text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                Inspect Alert
              </button>
              <button
                type="button"
                onClick={handleDismissEmergency}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 cursor-pointer font-medium"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-heading">
            Staff Incident Queue
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Authorized committee review, status updates, and encrypted student replies
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Authenticated Staff Officer Profile Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white border border-slate-200/90 text-xs shadow-xs">
            <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200 text-[#0066FF] flex items-center justify-center font-bold text-xs shrink-0">
              {activeStaffUser.name.charAt(0)}
            </div>
            <div className="space-y-0.5 text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 leading-tight">{activeStaffUser.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-50 text-[#0066FF] rounded font-semibold border border-blue-100">
                  {activeStaffUser.staffId}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">
                {activeStaffUser.title} {activeStaffUser.departmentName ? `• ${activeStaffUser.departmentName}` : ''}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setStaffCurrentPassword('');
              setStaffNewPassword('');
              setStaffConfirmPassword('');
              setStaffPasswordChangeError(null);
              setStaffPasswordChangeSuccess(null);
              setShowStaffChangePasswordModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-2xs"
            title="Change Staff Password"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Change Password</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-2xs"
            title="Log out of Staff Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerTestDemoAlert}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFF1F0] hover:bg-[#FFE4DE] text-[#D92D20] border border-[#FED4D1] text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <Siren className="w-3.5 h-3.5 text-[#D92D20]" />
            <span>Test SOS Alert</span>
          </button>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin text-[#0066FF]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Officer Scope & Jurisdiction Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/90 border border-blue-200/80 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            🔒
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wider font-mono">
                Assigned Officer Jurisdiction
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100/90 text-blue-700 font-bold border border-blue-200">
                RBAC Enforced
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-0.5 font-medium">
              Assigned Department: <strong className="text-slate-900">{activeStaffUser.departmentName || 'All Units'}</strong>
              {activeStaffUser.fieldScope && activeStaffUser.fieldScope !== 'all' && (
                <> • Field Scope: <strong className="text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded text-[11px] font-semibold">{activeStaffUser.fieldScope}</strong></>
              )}
            </p>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-blue-700 bg-white/90 px-3 py-1.5 rounded-xl border border-blue-200/70 shadow-2xs">
          Cross-Department Access Blocked
        </div>
      </div>

      {/* Bento Pastel KPI Cards - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <motion.div whileHover={{ y: -2 }} className="p-3.5 sm:p-4 rounded-2xl bg-[#F0F7FF] border border-[#DCEBFF] space-y-0.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#0066FF] uppercase tracking-wider">New Intake</span>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900">{newCount}</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-3.5 sm:p-4 rounded-2xl bg-[#FFF9EE] border border-[#FEE8B7] space-y-0.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#B54708] uppercase tracking-wider">In Progress</span>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900">{inProgressCount}</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-3.5 sm:p-4 rounded-2xl bg-[#FFF1F0] border border-[#FED4D1] space-y-0.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#D92D20] uppercase tracking-wider">Critical SOS</span>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900">{criticalCount}</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-3.5 sm:p-4 rounded-2xl bg-[#F0FDF9] border border-[#CCFBEF] space-y-0.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#0E9384] uppercase tracking-wider">Resolved</span>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900">{resolvedCount}</div>
        </motion.div>
      </div>

      {/* Category Pills & Filters */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-3 sm:p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Incidents', count: cases.length, icon: ClipboardList },
            { id: 'safety', label: 'Safety & Welfare', count: cases.filter(c => c.reportType === 'safety').length, icon: ShieldAlert },
            { id: 'maintenance', label: 'Facilities', count: cases.filter(c => c.reportType === 'maintenance').length, icon: Wrench }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = filterCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterCategory(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0066FF] text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Dropdown Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Case ID, keyword, location..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              aria-label="Filter Priority"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs py-2 px-3 rounded-xl focus:border-[#0066FF] outline-none font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              aria-label="Filter Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs py-2 px-3 rounded-xl focus:border-[#0066FF] outline-none font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="NEW">New</option>
              <option value="AI_TRIAGED">Triaged</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="UNDER_REVIEW">Review</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incident Cards List - Compact & Expandable */}
      <div className="space-y-2">
        {filteredCases.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white border border-slate-200/80 rounded-2xl font-medium">
            No incident reports found matching current filters.
          </div>
        ) : (
          filteredCases.slice(0, staffDisplayLimit).map((c) => (
            <motion.div
              whileHover={{ y: -1 }}
              key={c.id || c.publicCaseId}
              onClick={() => setSelectedCase(c)}
              className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer space-y-2 group w-full max-w-full overflow-hidden break-words"
            >
              {/* Primary Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 w-full min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <span className="font-mono text-xs font-bold text-[#0066FF] shrink-0 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {c.publicCaseId}
                  </span>
                  <CategoryBadge category={c.category || c.reportType} sublabel={c.subcategory || c.category} size="sm" />
                  <PriorityBadge priority={c.priority} size="sm" />
                  <StatusBadge status={c.status} size="sm" />
                </div>

                <div className="flex items-center gap-2 text-xs shrink-0">
                  <span className="text-[11px] text-slate-500 font-medium hidden xs:inline truncate max-w-[150px]">{c.assignedDepartmentName || 'Department'}</span>
                  {c.isAnonymous ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Anon</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                      {c.reporterName || 'Identified'}
                    </span>
                  )}
                </div>
              </div>

              {/* Compact 1-liner description */}
              <p className="text-xs text-slate-700 line-clamp-1 font-medium w-full min-w-0 truncate">
                "{c.description}"
              </p>

              {/* Secondary Details (Expandable Section) */}
              <AnimatePresence>
                {expandedStaffCaseIds.has(c.publicCaseId) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 border-t border-slate-100 space-y-1.5 text-xs overflow-hidden w-full min-w-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-800 w-full min-w-0 break-words">
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Statement:</span>
                      <p className="leading-relaxed mt-0.5 break-words">"{c.description}"</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-0.5 min-w-0">
                      <span className="flex items-center gap-1 font-medium min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate max-w-[180px] sm:max-w-none">{c.location || 'Campus'}</span>
                      </span>

                      <span className="flex items-center gap-1 font-medium text-slate-500 shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{c.incidentDate || 'Recent'} ({c.incidentTime || 'Time not specified'})</span>
                      </span>

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

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-1 text-xs w-full min-w-0">
                <button
                  type="button"
                  onClick={(e) => toggleExpandStaffCase(e, c.publicCaseId)}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedStaffCaseIds.has(c.publicCaseId) ? 'rotate-180' : ''}`} />
                  <span>{expandedStaffCaseIds.has(c.publicCaseId) ? 'Hide details' : 'More details'}</span>
                </button>

                <span className="inline-flex items-center gap-1 text-[#0066FF] text-[11px] font-semibold group-hover:underline">
                  <span>Review Case</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </motion.div>
          ))
        )}

        {filteredCases.length > staffDisplayLimit && (
          <div className="pt-2 space-y-3">
            {isLoadingMoreStaff && <JioSkeletonLoader count={2} />}
            <div className="text-center">
              <button
                type="button"
                disabled={isLoadingMoreStaff}
                onClick={() => {
                  setIsLoadingMoreStaff(true);
                  setTimeout(() => {
                    setStaffDisplayLimit(prev => prev + 5);
                    setIsLoadingMoreStaff(false);
                  }, 400);
                }}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-all hover:border-slate-300"
              >
                <span>Load More Incidents ({filteredCases.length - staffDisplayLimit} more)</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Staff Password Modal */}
      <AnimatePresence>
        {showStaffChangePasswordModal && (
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
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 font-heading">Change Password</h3>
                    <p className="text-[10px] text-slate-500 font-mono">{activeStaffUser?.staffId}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowStaffChangePasswordModal(false);
                    setStaffPasswordChangeError(null);
                    setStaffPasswordChangeSuccess(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleChangeStaffPassword} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={staffCurrentPassword}
                    onChange={(e) => setStaffCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-[#0066FF] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">New Password (Min 4 chars)</label>
                  <input
                    type="password"
                    value={staffNewPassword}
                    onChange={(e) => setStaffNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-[#0066FF] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={staffConfirmPassword}
                    onChange={(e) => setStaffConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-[#0066FF] outline-none"
                    required
                  />
                </div>

                {staffPasswordChangeError && (
                  <p className="text-[11px] text-rose-600 font-semibold p-2 rounded-lg bg-rose-50 border border-rose-200">
                    {staffPasswordChangeError}
                  </p>
                )}

                {staffPasswordChangeSuccess && (
                  <p className="text-[11px] text-emerald-700 font-semibold p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    {staffPasswordChangeSuccess}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStaffChangePasswordModal(false);
                      setStaffPasswordChangeError(null);
                      setStaffPasswordChangeSuccess(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingStaffPassword}
                    className="flex-1 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {savingStaffPassword ? 'Updating...' : 'Save Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Case Detail Modal */}
      {selectedCase && (
        <StaffCaseDetail
          caseItem={selectedCase}
          departments={departments}
          actorName={activeStaffUser ? `${activeStaffUser.name} (${activeStaffUser.title})` : 'Duty Staff Officer'}
          staffDeptId={activeStaffUser.departmentId}
          onClose={() => setSelectedCase(null)}
          onCaseUpdated={(updated) => {
            setSelectedCase(updated);
            loadData(false);
          }}
        />
      )}
    </div>
  );
};
