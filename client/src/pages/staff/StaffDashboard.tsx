import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShieldAlert, Wrench, RefreshCw, Siren, ClipboardList, ShieldCheck, ChevronRight, VolumeX } from 'lucide-react';
import { api } from '../../services/api';
import { Case, Department } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge } from '../../components/CategoryBadge';
import { StaffCaseDetail } from './StaffCaseDetail';
import { playEmergencySiren, stopEmergencySiren } from '../../services/sound';

interface Props {
  staffDept: string;
}

export const StaffDashboard: React.FC<Props> = ({ staffDept }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

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

  useEffect(() => {
    setFilterDept(staffDept);
  }, [staffDept]);

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 4000);

    return () => {
      clearInterval(interval);
      stopEmergencySiren();
    };
  }, [filterCategory, filterPriority, filterStatus, filterDept]);

  const loadData = async (showIndicator = true) => {
    try {
      if (showIndicator) setLoading(true);
      const [casesRes, deptsRes] = await Promise.all([
        api.getCases({
          category: filterCategory,
          priority: filterPriority,
          status: filterStatus,
          departmentId: filterDept === 'all' ? undefined : filterDept,
          role: 'staff'
        }),
        api.getDepartments()
      ]);

      const fetchedCases: Case[] = casesRes.cases || [];
      setCases(fetchedCases);
      setDepartments(deptsRes.departments || []);

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
      id: `emergency-test-${Date.now()}`,
      publicCaseId: 'CC-ALERT',
      reportType: 'safety',
      category: 'Immediate Danger',
      subcategory: 'Intruder / Threat',
      description: '🚨 LIVE DEMO ALERT: Security threat reported near Campus Canteen.',
      location: 'Campus Canteen Plaza',
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

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6 relative z-10">
      {/* Sleek Emergency Strobe Banner if active */}
      <AnimatePresence>
        {emergencyAlert && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="p-4 rounded-2xl glass-panel border border-rose-500/40 bg-rose-950/40 flex items-center justify-between gap-3 shadow-[0_0_30px_rgba(244,63,94,0.3)]"
          >
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                    Emergency Alert ({emergencyAlert.publicCaseId})
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 font-semibold">
                    {emergencyAlert.location}
                  </span>
                </div>
                <p className="text-xs text-white line-clamp-1 mt-0.5 font-medium">
                  {emergencyAlert.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isSirenPlaying && (
                <button
                  type="button"
                  onClick={handleMuteSiren}
                  className="px-2.5 py-1 rounded-xl glass-pill text-xs text-rose-200 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Mute</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedCase(emergencyAlert);
                  handleDismissEmergency();
                }}
                className="px-3 py-1 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                Inspect
              </button>
              <button
                type="button"
                onClick={handleDismissEmergency}
                className="text-xs text-slate-400 hover:text-white px-2 cursor-pointer"
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
          <h1 className="text-xl font-bold text-white tracking-tight">Staff Incident Queue</h1>
          <p className="text-xs text-slate-400">Department review & encrypted student responses</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerTestDemoAlert}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-medium transition-all cursor-pointer"
          >
            <Siren className="w-3.5 h-3.5 text-rose-400" />
            <span>Test SOS Alert</span>
          </button>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel text-xs text-slate-300 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Minimal Apple Glass KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-2xl glass-panel space-y-1">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">New Intake</span>
          <div className="text-2xl font-mono font-bold text-sky-400">{newCount}</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-2xl glass-panel space-y-1">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">In Progress</span>
          <div className="text-2xl font-mono font-bold text-amber-400">{inProgressCount}</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-2xl glass-panel space-y-1">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Critical SOS</span>
          <div className="text-2xl font-mono font-bold text-rose-400">{criticalCount}</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-2xl glass-panel space-y-1">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Resolved</span>
          <div className="text-2xl font-mono font-bold text-emerald-400">{resolvedCount}</div>
        </motion.div>
      </div>

      {/* Category Pills & Filters */}
      <div className="glass-panel rounded-2xl p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Incidents', count: cases.length, icon: ClipboardList },
            { id: 'safety', label: 'Safety', count: cases.filter(c => c.reportType === 'safety').length, icon: ShieldAlert },
            { id: 'maintenance', label: 'Maintenance', count: cases.filter(c => c.reportType === 'maintenance').length, icon: Wrench }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = filterCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterCategory(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30 font-semibold'
                    : 'text-slate-400 hover:text-white glass-pill'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono text-slate-400">({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Dropdown Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, keyword, location..."
              className="w-full pl-8 pr-3 py-2 rounded-xl glass-input text-white text-xs placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              aria-label="Filter Priority"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="glass-input text-slate-300 text-xs py-2 px-2.5 rounded-xl focus:outline-none"
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
              className="glass-input text-slate-300 text-xs py-2 px-2.5 rounded-xl focus:outline-none"
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

      {/* Minimal Incident Cards List */}
      <div className="space-y-2">
        {filteredCases.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 glass-panel rounded-2xl">
            No incident reports found matching current filters.
          </div>
        ) : (
          filteredCases.map((c) => (
            <motion.div
              whileHover={{ y: -1 }}
              key={c.id || c.publicCaseId}
              onClick={() => setSelectedCase(c)}
              className="p-3.5 rounded-2xl glass-panel-interactive cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start sm:items-center gap-3">
                <span className="font-mono text-xs font-bold text-sky-400 shrink-0">
                  {c.publicCaseId}
                </span>

                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge category={c.category || c.reportType} sublabel={c.subcategory || c.category} size="sm" />
                    <PriorityBadge priority={c.priority} size="sm" />
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1 font-medium">
                    {c.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">{c.assignedDepartmentName || 'Department'}</span>
                  {c.isAnonymous && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 glass-pill px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Anon</span>
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Case Detail Modal */}
      {selectedCase && (
        <StaffCaseDetail
          caseItem={selectedCase}
          departments={departments}
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
