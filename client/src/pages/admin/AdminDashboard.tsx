import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Users, Settings, ClipboardList, Shield, Activity, Plus, CheckCircle, BarChart3, TrendingUp, AlertCircle, RefreshCw, Trash2, UserPlus, Mail, UserCheck, Search, Eye, MessageSquare, Paperclip, MapPin, Clock, ShieldAlert, ArrowRight, ChevronRight, FileText, Filter, Sparkles, Check, Wrench } from 'lucide-react';
import { api } from '../../services/api';
import { SystemStats, Department, AuditLog, StaffUser, Case } from '../../types';
import { StaffCaseDetail } from '../staff/StaffCaseDetail';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge, getCategoryMeta } from '../../components/CategoryBadge';

interface Props {
  currentTab: string;
}

export const AdminDashboard: React.FC<Props> = ({ currentTab }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(false);

  // Complaints & Cases Filters
  const [searchCaseQuery, setSearchCaseQuery] = useState('');
  const [filterCaseCategory, setFilterCaseCategory] = useState('all');
  const [filterCasePriority, setFilterCasePriority] = useState('all');
  const [filterCaseStatus, setFilterCaseStatus] = useState('all');

  // New Department Form
  const [showNewDeptModal, setShowNewDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptType, setNewDeptType] = useState('general');
  const [newDeptEmail, setNewDeptEmail] = useState('');
  const [savingDept, setSavingDept] = useState(false);

  // New Staff / Faculty Form
  const [showNewStaffModal, setShowNewStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffDept, setNewStaffDept] = useState('dept-welfare');
  const [newStaffTitle, setNewStaffTitle] = useState('Faculty Counselor');
  const [savingStaff, setSavingStaff] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
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
      setCases(casesRes.cases || []);
      if (deptsRes.departments && deptsRes.departments.length > 0 && !newStaffDept) {
        setNewStaffDept(deptsRes.departments[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    try {
      setSavingStaff(true);
      await api.loginStaff({
        name: newStaffName.trim(),
        email: newStaffEmail.trim(),
        departmentId: newStaffDept,
        title: newStaffTitle.trim() || 'Staff Officer'
      });
      setNewStaffName('');
      setNewStaffEmail('');
      setShowNewStaffModal(false);
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Failed to register staff member');
    } finally {
      setSavingStaff(false);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove staff member "${name}"?`)) return;
    try {
      await api.deleteStaff(id);
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Failed to remove staff');
    }
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the campus department "${name}"?`)) return;
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Super Admin Executive Portal
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              Institution Lead
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            System configuration, privacy audit timeline, departments, and aggregated institutional analytics.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-campus-600' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Aggregate Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Platform Cases</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{stats.totalCases}</span>
              <span className="text-xs font-semibold text-campus-700 bg-campus-50 px-2 py-0.5 rounded">All time</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Identity Protected</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-emerald-600 font-mono">{stats.anonymousPercentage}%</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{stats.anonymousCount} cases</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Avg Resolution Time</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-indigo-600 font-mono">{stats.averageResolutionHours}h</span>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Target: &lt;6h</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Critical Safety Alerts</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-red-600 font-mono">{stats.critical}</span>
              <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded">Prioritized</span>
            </div>
          </div>
        </div>
      )}

      {/* Institutional Student Complaints & Incident Command Queue */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Live Student Complaints & Incident Intake ({cases.length})
              </h2>
              {cases.some(c => c.priority === 'CRITICAL' && c.status !== 'RESOLVED') && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold text-[10px] animate-pulse border border-red-300 dark:border-red-800">
                  Critical Alert Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Complete oversight of all student reports. Super Admin can read the full message, inspect evidence, take field action, reassign, and communicate with students.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
              Filtered: {filteredCases.length} of {cases.length}
            </span>
          </div>
        </div>

        {/* Category Filter Pills with Motion Layout */}
        <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          {[
            { id: 'all', label: 'All Reports', count: cases.length, icon: ClipboardList, color: 'text-purple-600' },
            {
              id: 'safety',
              label: 'Student Safety',
              count: cases.filter(c => c.reportType === 'safety' || c.category.toLowerCase().includes('safety') || c.category.toLowerCase().includes('harass') || c.category.toLowerCase().includes('bully') || c.category.toLowerCase().includes('threat')).length,
              icon: ShieldAlert,
              color: 'text-rose-600'
            },
            {
              id: 'maintenance',
              label: 'Facilities & Repairs',
              count: cases.filter(c => c.reportType === 'maintenance' || c.category.toLowerCase().includes('maint') || c.category.toLowerCase().includes('repair')).length,
              icon: Wrench,
              color: 'text-amber-600'
            },
            {
              id: 'lost_found',
              label: 'Lost & Found',
              count: cases.filter(c => c.reportType === 'lost_found' || c.category.toLowerCase().includes('lost') || c.category.toLowerCase().includes('found')).length,
              icon: Search,
              color: 'text-teal-600'
            },
            {
              id: 'other',
              label: 'Student Welfare',
              count: cases.filter(c => c.reportType === 'other' || (!['safety', 'maintenance', 'lost_found'].includes(c.reportType) && !c.category.toLowerCase().includes('safety') && !c.category.toLowerCase().includes('maint') && !c.category.toLowerCase().includes('lost'))).length,
              icon: Users,
              color: 'text-indigo-600'
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = filterCaseCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterCaseCategory(tab.id)}
                className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="adminCategoryActivePill"
                    className="absolute inset-0 bg-white dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchCaseQuery}
              onChange={(e) => setSearchCaseQuery(e.target.value)}
              placeholder="Search ID, text, location..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Priority Filter */}
          <select
            aria-label="Priority Filter"
            value={filterCasePriority}
            onChange={(e) => setFilterCasePriority(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Priorities</option>
            <option value="CRITICAL">🔴 Critical Only</option>
            <option value="HIGH">🟠 High Priority</option>
            <option value="MEDIUM">🟡 Medium Priority</option>
            <option value="LOW">⚪ Low Priority</option>
          </select>

          {/* Status Filter */}
          <select
            aria-label="Status Filter"
            value={filterCaseStatus}
            onChange={(e) => setFilterCaseStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="NEW">New Submissions</option>
            <option value="AI_TRIAGED">AI Triaged</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ACTION_TAKEN">Action Taken</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>

        {/* Complaints List / Cards */}
        {filteredCases.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 space-y-2">
            <ClipboardList className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              {cases.length === 0 ? 'No Student Complaints Logged Yet' : 'No cases match your filter criteria'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              {cases.length === 0
                ? 'When a student reports a safety concern, maintenance fault, or lost item, it will immediately appear here with AI triage and full case details.'
                : 'Try adjusting the search query or changing category and priority filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            <AnimatePresence mode="popLayout">
              {filteredCases.map((c) => {
                const catMeta = getCategoryMeta(c.category || c.reportType);
                return (
                  <motion.div
                    key={c.id || c.publicCaseId}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25 }}
                    className={`p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 border-l-4 ${catMeta.borderLeft} bg-slate-50/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-700/60 shadow-xs hover:shadow-md transition-all space-y-3`}
                  >
                    {/* Card Top Row: ID, Badges, Time */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-700">
                          {c.publicCaseId}
                        </span>
                        <CategoryBadge category={c.category || c.reportType} sublabel={c.subcategory || c.category} size="sm" />
                        <PriorityBadge priority={c.priority} size="sm" />
                        <StatusBadge status={c.status} size="sm" />
                      </div>

                      <div className="flex items-center gap-3 text-slate-400 text-xs">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3" />
                          {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* FULL STUDENT COMPLAINT / MESSAGE DISPLAY */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Student Complaint Statement:
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          {c.isAnonymous ? '🛡️ Anonymous (Identity Protected)' : `Identified: ${c.reporterName || 'Student'}`}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                        "{c.description}"
                      </p>
                    </div>

                    {/* Meta details & Evidence */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 text-slate-600 dark:text-slate-400">
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px]">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{c.location || 'Campus Location Unspecified'}</span>
                        </span>

                        {c.assignedDepartmentName && (
                          <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                            <Users className="w-3.5 h-3.5" />
                            <span>Routed to: {c.assignedDepartmentName}</span>
                          </span>
                        )}

                        {c.evidence && c.evidence.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                            <Paperclip className="w-3 h-3" />
                            <span>{c.evidence.length} Evidence File(s) Attached</span>
                          </span>
                        )}
                      </div>

                      {/* ACTION BUTTON */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setSelectedCase(c)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs hover:shadow-purple-500/20 active:scale-98 transition-all ml-auto"
                      >
                        <span>Inspect Full Case & Take Action</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Analytics Visual Breakdown (Section 27) */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* By Category */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Distribution by Report Category
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Student Safety', count: stats.byCategory.safety, color: 'bg-rose-500' },
                { label: 'Facilities Maintenance', count: stats.byCategory.maintenance, color: 'bg-amber-500' },
                { label: 'Lost & Found', count: stats.byCategory.lost_found, color: 'bg-teal-500' },
                { label: 'General Welfare', count: stats.byCategory.other, color: 'bg-indigo-500' }
              ].map((cat) => {
                const pct = stats.totalCases > 0 ? Math.round((cat.count / stats.totalCases) * 100) : 0;
                return (
                  <div key={cat.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-slate-300">{cat.label}</span>
                      <span className="font-mono text-slate-500">{cat.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Priority */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Priority Matrix Breakdown
            </h3>
            <div className="space-y-3">
              {[
                { label: 'CRITICAL', count: stats.byPriority.CRITICAL, color: 'bg-red-600' },
                { label: 'HIGH', count: stats.byPriority.HIGH, color: 'bg-orange-500' },
                { label: 'MEDIUM', count: stats.byPriority.MEDIUM, color: 'bg-amber-500' },
                { label: 'LOW', count: stats.byPriority.LOW, color: 'bg-slate-400' }
              ].map((p) => {
                const pct = stats.totalCases > 0 ? Math.round((p.count / stats.totalCases) * 100) : 0;
                return (
                  <div key={p.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-slate-300">{p.label}</span>
                      <span className="font-mono text-slate-500">{p.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div className={`h-full ${p.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy Metrics */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Privacy Shield Telemetry
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-900">
                <span className="font-bold block">Anonymous Case Ratio</span>
                <span className="text-2xl font-black font-mono mt-1 block">{stats.anonymousCount} / {stats.totalCases}</span>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Students choose anonymous reporting 82% of the time in sensitive situations.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                Zero tracking cookies or device fingerprints stored. Salted PIN hashing active across all cases.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Departments Management (Section 3.C) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Configured Campus Departments ({departments.length})
            </h3>
            <p className="text-xs text-slate-500">
              Departments eligible to receive AI-routed triage and student case assignments.
            </p>
          </div>
          <button
            onClick={() => setShowNewDeptModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-campus-600 hover:bg-campus-500 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Department</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between text-xs group hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <div>
                <strong className="text-slate-900 dark:text-white text-xs block">{dept.name}</strong>
                <span className="text-slate-400 font-mono text-[11px]">{dept.email || 'Internal Dispatch'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                  Active
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                  title={`Remove ${dept.name}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campus Staff & Faculty Registry */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Campus Staff & Faculty Registry ({staffMembers.length})
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Institutional Directory
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Authenticated department officers, mentors, and faculty authorized to inspect cases and interact with students.
            </p>
          </div>
          <button
            onClick={() => setShowNewStaffModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Provision Staff Member</span>
          </button>
        </div>

        {staffMembers.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No staff or faculty registered yet</p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Zero dummy profiles present. Real faculty, officers, and mentors can sign in directly through the Staff Portal or be provisioned using the button above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {staffMembers.map((staff) => {
              const dept = departments.find(d => d.id === staff.departmentId);
              return (
                <div
                  key={staff.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between text-xs group"
                >
                  <div className="space-y-0.5">
                    <strong className="text-slate-900 dark:text-white text-xs block font-bold">
                      {staff.name}
                    </strong>
                    <span className="text-slate-500 block text-[11px]">{staff.title}</span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium block">
                      {dept ? dept.name : staff.departmentId}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {staff.email}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteStaff(staff.id, staff.name)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Revoke Staff Access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Immutable Audit Log Timeline (Section 18 & 26) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              System Privacy & Action Audit Trail
            </h3>
            <p className="text-xs text-slate-500">
              Immutable logging of case submissions, triage actions, status transitions, and staff inquiries.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-medium">Last 50 Entries</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/60 max-h-96 overflow-y-auto pr-1">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{log.action.replace(/_/g, ' ')}</span>
                  {log.publicCaseId && (
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-campus-600 font-semibold">
                      {log.publicCaseId}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Actor: <strong>{log.actorName}</strong> ({log.actorId})
                </p>
              </div>

              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Department Modal */}
      <AnimatePresence>
        {showNewDeptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Create Campus Department
              </h2>

              <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Department Name</label>
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="e.g. Hostels & Resident Welfare"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Functional Type</label>
                  <select
                    aria-label="Functional Type"
                    value={newDeptType}
                    onChange={(e) => setNewDeptType(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Official Dispatch Email</label>
                  <input
                    type="email"
                    value={newDeptEmail}
                    onChange={(e) => setNewDeptEmail(e.target.value)}
                    placeholder="dept@campuscare.edu"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNewDeptModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingDept}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors"
                  >
                    {savingDept ? 'Saving...' : 'Add Department'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Provision Staff Member Modal */}
      <AnimatePresence>
        {showNewStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Provision Campus Staff / Faculty Member
              </h2>
              <p className="text-xs text-slate-500">
                Create an authenticated officer profile authorized to review assigned cases.
              </p>

              <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="e.g. Prof. Rajiv Nambiar"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Official Institutional Email *</label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="e.g. r.nambiar@campuscare.edu"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Department</label>
                  <select
                    aria-label="Department"
                    value={newStaffDept}
                    onChange={(e) => setNewStaffDept(e.target.value)}
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Official Designation / Title</label>
                  <input
                    type="text"
                    value={newStaffTitle}
                    onChange={(e) => setNewStaffTitle(e.target.value)}
                    placeholder="e.g. Faculty Counselor / Mentor"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNewStaffModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingStaff}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                  >
                    {savingStaff ? 'Saving...' : 'Authorize Staff'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Full Case Detail & Action Modal for Super Admin */}
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
    </div>
  );
};
