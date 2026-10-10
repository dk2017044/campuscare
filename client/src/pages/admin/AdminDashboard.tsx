import React, { useState, useEffect } from 'react';
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
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { SystemStats, Department, AuditLog, StaffUser, Case } from '../../types';
import { StaffCaseDetail } from '../staff/StaffCaseDetail';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge, getCategoryMeta } from '../../components/CategoryBadge';

interface Props {
  currentTab: string;
}

type AdminSubTab = 'queue' | 'analytics' | 'departments' | 'staff' | 'audit';

export const AdminDashboard: React.FC<Props> = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(false);

  // Active view tab
  const [subTab, setSubTab] = useState<AdminSubTab>('queue');

  // Case Filters
  const [searchCaseQuery, setSearchCaseQuery] = useState('');
  const [filterCaseCategory, setFilterCaseCategory] = useState('all');
  const [filterCasePriority, setFilterCasePriority] = useState('all');
  const [filterCaseStatus, setFilterCaseStatus] = useState('all');

  // Modals
  const [showNewDeptModal, setShowNewDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptType, setNewDeptType] = useState('general');
  const [newDeptEmail, setNewDeptEmail] = useState('');
  const [savingDept, setSavingDept] = useState(false);

  const [showNewStaffModal, setShowNewStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffDept, setNewStaffDept] = useState('');
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

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)] animate-pulse" />
              Executive Command
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/25">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time incident oversight, triage telemetry, and campus directory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel text-xs font-medium text-slate-200 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl glass-panel border border-white/10 hover:border-white/20 transition-all">
            <span className="text-[11px] font-medium text-slate-400 block">Total Cases</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-white font-mono">{stats.totalCases}</span>
              <span className="text-[10px] text-sky-400 glass-pill px-2 py-0.5 rounded-full font-mono">Platform</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-white/10 hover:border-white/20 transition-all">
            <span className="text-[11px] font-medium text-slate-400 block">Identity Protected</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">{stats.anonymousPercentage}%</span>
              <span className="text-[10px] text-emerald-300 glass-pill px-2 py-0.5 rounded-full font-mono">{stats.anonymousCount} safe</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-white/10 hover:border-white/20 transition-all">
            <span className="text-[11px] font-medium text-slate-400 block">Avg Resolution</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-indigo-400 font-mono">{stats.averageResolutionHours}h</span>
              <span className="text-[10px] text-indigo-300 glass-pill px-2 py-0.5 rounded-full font-mono">&lt; 6h Target</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-white/10 hover:border-white/20 transition-all">
            <span className="text-[11px] font-medium text-slate-400 block">Critical Alerts</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-rose-400 font-mono">{stats.critical}</span>
              <span className={`text-[10px] glass-pill px-2 py-0.5 rounded-full font-mono ${stats.critical > 0 ? 'text-rose-400 border-rose-500/30' : 'text-slate-400'}`}>
                {stats.critical > 0 ? 'Action Req' : 'Clear'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Segmented Sub-Nav Controls */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-panel border border-white/10 overflow-x-auto">
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
              onClick={() => setSubTab(tab.id as AdminSubTab)}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="adminSubNavIndicator"
                  className="absolute inset-0 bg-white/10 rounded-xl border border-white/15 -z-10 shadow-xs"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                />
              )}
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-slate-500'}`}>
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
          <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Cases', count: cases.length },
                { id: 'safety', label: 'Safety', count: cases.filter(c => c.reportType === 'safety' || c.category.toLowerCase().includes('safety')).length },
                { id: 'maintenance', label: 'Repairs', count: cases.filter(c => c.reportType === 'maintenance' || c.category.toLowerCase().includes('maint')).length },
                { id: 'lost_found', label: 'Lost & Found', count: cases.filter(c => c.reportType === 'lost_found' || c.category.toLowerCase().includes('lost')).length },
                { id: 'other', label: 'Welfare', count: cases.filter(c => c.reportType === 'other').length }
              ].map((cat) => {
                const isSelected = filterCaseCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilterCaseCategory(cat.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30 font-semibold shadow-xs'
                        : 'glass-pill text-slate-400 hover:text-slate-200'
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
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchCaseQuery}
                  onChange={(e) => setSearchCaseQuery(e.target.value)}
                  placeholder="Search ID, keyword, location..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs text-white placeholder:text-slate-500"
                />
              </div>

              <select
                aria-label="Filter Priority"
                value={filterCasePriority}
                onChange={(e) => setFilterCasePriority(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl glass-input text-xs text-slate-300 font-medium"
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
                className="w-full px-3 py-1.5 rounded-xl glass-input text-xs text-slate-300 font-medium"
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
            <div className="p-12 text-center rounded-2xl glass-panel border border-white/10 text-xs text-slate-400 space-y-2">
              <ClipboardList className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="font-medium text-slate-200">No cases match the selected filter</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence mode="popLayout">
                {filteredCases.map((c) => (
                  <motion.div
                    key={c.publicCaseId}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    onClick={() => setSelectedCase(c)}
                    className="p-4 rounded-2xl glass-panel border border-white/10 hover:border-white/25 hover:bg-white/[0.04] transition-all cursor-pointer space-y-2.5 group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-400 glass-pill px-2.5 py-0.5 rounded-lg">
                          {c.publicCaseId}
                        </span>
                        <CategoryBadge category={c.category || c.reportType} size="sm" />
                        <PriorityBadge priority={c.priority} size="sm" />
                        <StatusBadge status={c.status} size="sm" />
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-medium">Student Statement:</span>
                        <span className="text-emerald-400 font-medium">
                          {c.isAnonymous ? '🛡️ Anonymous' : `Identified: ${c.reporterName || 'Student'}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                        "{c.description}"
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs text-slate-400">
                      <div className="flex flex-wrap items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          <span>{c.location || 'Campus'}</span>
                        </span>

                        {c.assignedDepartmentName && (
                          <span className="flex items-center gap-1 text-indigo-300">
                            <Users className="w-3 h-3" />
                            <span>{c.assignedDepartmentName}</span>
                          </span>
                        )}

                        {c.evidence && c.evidence.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-amber-300">
                            <Paperclip className="w-3 h-3" />
                            <span>{c.evidence.length} file(s)</span>
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 text-purple-400 group-hover:text-purple-300 text-xs font-medium ml-auto">
                        <span>Inspect Case</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: ANALYTICS MATRIX */}
      {subTab === 'analytics' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              Category Distribution
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Safety & Harassment', count: stats.byCategory.safety, color: 'bg-rose-500' },
                { label: 'Facilities Maintenance', count: stats.byCategory.maintenance, color: 'bg-amber-500' },
                { label: 'Lost & Found', count: stats.byCategory.lost_found, color: 'bg-teal-500' },
                { label: 'Student Welfare', count: stats.byCategory.other, color: 'bg-indigo-500' }
              ].map((cat) => {
                const pct = stats.totalCases > 0 ? Math.round((cat.count / stats.totalCases) * 100) : 0;
                return (
                  <div key={cat.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{cat.label}</span>
                      <span className="font-mono text-slate-400">{cat.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Priority Severity
            </h3>
            <div className="space-y-3">
              {[
                { label: 'CRITICAL', count: stats.byPriority.CRITICAL, color: 'bg-rose-500' },
                { label: 'HIGH', count: stats.byPriority.HIGH, color: 'bg-orange-500' },
                { label: 'MEDIUM', count: stats.byPriority.MEDIUM, color: 'bg-amber-500' },
                { label: 'LOW', count: stats.byPriority.LOW, color: 'bg-slate-500' }
              ].map((p) => {
                const pct = stats.totalCases > 0 ? Math.round((p.count / stats.totalCases) * 100) : 0;
                return (
                  <div key={p.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{p.label}</span>
                      <span className="font-mono text-slate-400">{p.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full ${p.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Privacy Telemetry
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                <span className="text-[11px] block text-emerald-300 font-medium">Anonymous Submissions</span>
                <span className="text-2xl font-bold font-mono mt-0.5 block">{stats.anonymousCount} / {stats.totalCases}</span>
                <span className="text-[10px] text-emerald-400/80 block mt-1">{stats.anonymousPercentage}% students use identity masking</span>
              </div>
              <div className="p-3 rounded-xl glass-pill text-slate-400 text-[11px] leading-relaxed">
                Client SHA-256 salted PIN tokens. Zero device telemetry or cookies persisted.
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
              <h3 className="text-sm font-semibold text-white">Campus Departments ({departments.length})</h3>
              <p className="text-xs text-slate-400">Customized departments for incident triage and dispatch.</p>
            </div>
            <button
              onClick={() => setShowNewDeptModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-semibold text-xs transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Custom Department</span>
            </button>
          </div>



          {departments.length === 0 ? (
            <div className="p-10 text-center rounded-2xl glass-panel border border-white/10 text-xs text-slate-400 space-y-3">
              <Building2 className="w-10 h-10 text-purple-400/70 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Zero Pre-Designed Departments</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Departments are not hardcoded. Use "+ Create Custom Department" above or click any starter template to dynamically configure your campus organization.
                </p>
              </div>
              <button
                onClick={() => setShowNewDeptModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Department</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-3.5 rounded-xl glass-panel border border-white/10 flex items-center justify-between text-xs group hover:border-white/20 transition-all"
                >
                  <div className="space-y-0.5">
                    <strong className="text-white text-xs block font-semibold">{dept.name}</strong>
                    <span className="text-slate-400 font-mono text-[11px]">{dept.email || 'Internal Dispatch'}</span>
                    <span className="text-[10px] text-purple-300 font-mono capitalize block opacity-70">Type: {dept.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] border border-emerald-500/20 font-mono">
                      Active
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
              <h3 className="text-sm font-semibold text-white">Faculty & Staff Registry ({staffMembers.length})</h3>
              <p className="text-xs text-slate-400">Authenticated staff authorized to review cases.</p>
            </div>
            <button
              onClick={() => setShowNewStaffModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Provision Staff</span>
            </button>
          </div>

          {departments.length === 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
              <span>No campus departments created yet. You need at least one department to assign staff.</span>
              <button
                type="button"
                onClick={() => setSubTab('departments')}
                className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold shrink-0 cursor-pointer"
              >
                Go to Departments →
              </button>
            </div>
          )}

          {staffMembers.length === 0 ? (
            <div className="p-8 text-center rounded-2xl glass-panel border border-white/10 text-xs text-slate-400 space-y-2">
              <Users className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="font-semibold text-slate-200">No staff members enrolled yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {staffMembers.map((staff) => {
                const dept = departments.find(d => d.id === staff.departmentId);
                return (
                  <div
                    key={staff.id}
                    className="p-3.5 rounded-xl glass-panel border border-white/10 flex items-center justify-between text-xs hover:border-white/20 transition-all"
                  >
                    <div className="space-y-0.5">
                      <strong className="text-white text-xs block font-semibold">{staff.name}</strong>
                      <span className="text-slate-400 block text-[11px]">{staff.title}</span>
                      <span className="text-[11px] text-indigo-300 font-medium block">
                        {dept ? dept.name : staff.departmentId}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {staff.email}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteStaff(staff.id, staff.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

      {/* SUB-TAB 5: AUDIT TRAIL */}
      {subTab === 'audit' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Security & Action Audit Logs</h3>
            <span className="text-xs font-mono text-slate-400">Last 50 Events</span>
          </div>

          <div className="glass-panel p-2 rounded-2xl border border-white/10 divide-y divide-white/5 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 px-3 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{log.action.replace(/_/g, ' ')}</span>
                    {log.publicCaseId && (
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded glass-pill text-sky-400">
                        {log.publicCaseId}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Actor: <strong className="text-slate-300">{log.actorName}</strong> ({log.actorId})
                  </p>
                </div>

                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Department Glass Modal */}
      <AnimatePresence>
        {showNewDeptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel bg-slate-900/95 rounded-3xl max-w-md w-full p-6 border border-white/10 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Create Campus Department</h2>
                <button onClick={() => setShowNewDeptModal(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Department Name</label>
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="e.g. Student Welfare & Counseling"
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Type</label>
                  <select
                    aria-label="Department Type"
                    value={newDeptType}
                    onChange={(e) => setNewDeptType(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-slate-200 text-xs"
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
                  <label className="block text-slate-300 mb-1">Dispatch Email</label>
                  <input
                    type="email"
                    value={newDeptEmail}
                    onChange={(e) => setNewDeptEmail(e.target.value)}
                    placeholder="dept@campus.edu"
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewDeptModal(false)}
                    className="flex-1 py-2 rounded-xl glass-pill text-slate-300 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingDept}
                    className="flex-1 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
                  >
                    {savingDept ? 'Saving...' : 'Add Department'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Provision Staff Glass Modal */}
      <AnimatePresence>
        {showNewStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel bg-slate-900/95 rounded-3xl max-w-md w-full p-6 border border-white/10 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Provision Staff Member</h2>
                <button onClick={() => setShowNewStaffModal(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="Prof. Rajiv Nambiar"
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="r.nambiar@campus.edu"
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Department *</label>
                  {departments.length === 0 ? (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                      <span>No departments created yet</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewStaffModal(false);
                          setSubTab('departments');
                        }}
                        className="text-white underline font-semibold cursor-pointer"
                      >
                        + Create Department
                      </button>
                    </div>
                  ) : (
                    <select
                      aria-label="Staff Department"
                      value={newStaffDept}
                      onChange={(e) => setNewStaffDept(e.target.value)}
                      className="w-full p-2.5 rounded-xl glass-input text-slate-200 text-xs"
                      required
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Title / Designation</label>
                  <input
                    type="text"
                    value={newStaffTitle}
                    onChange={(e) => setNewStaffTitle(e.target.value)}
                    placeholder="Faculty Counselor"
                    className="w-full p-2.5 rounded-xl glass-input text-white text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewStaffModal(false)}
                    className="flex-1 py-2 rounded-xl glass-pill text-slate-300 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingStaff}
                    className="flex-1 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    {savingStaff ? 'Saving...' : 'Authorize Staff'}
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
    </div>
  );
};
