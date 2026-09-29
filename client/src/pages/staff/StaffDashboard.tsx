import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Filter, Search, Eye, AlertTriangle, ShieldCheck, UserCheck, RefreshCw, Clock, ArrowUpRight, ShieldAlert, Wrench, Users, ClipboardList, Volume2, VolumeX, Siren, BellRing } from 'lucide-react';
import { api } from '../../services/api';
import { Case, Department } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge, getCategoryMeta } from '../../components/CategoryBadge';
import { StaffCaseDetail } from './StaffCaseDetail';
import { playEmergencySiren, stopEmergencySiren } from '../../services/sound';

interface Props {
  staffDept: string;
  onSelectCase?: (c: Case) => void;
}

export const StaffDashboard: React.FC<Props> = ({ staffDept }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // Real-Time Emergency SOS Siren & Red Strobe Alert State
  const [emergencyAlert, setEmergencyAlert] = useState<Case | null>(null);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const seenEmergencyIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Filters
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDept, setFilterDept] = useState(staffDept || 'all');
  const [filterAnonymous, setFilterAnonymous] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync staffDept changes
  useEffect(() => {
    setFilterDept(staffDept);
  }, [staffDept]);

  // Load data and set up background polling for real-time emergency dispatch
  useEffect(() => {
    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 4000);

    return () => {
      clearInterval(interval);
      stopEmergencySiren();
    };
  }, [filterCategory, filterPriority, filterStatus, filterDept, filterAnonymous]);

  const loadData = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) setLoading(true);
      const [casesRes, deptsRes] = await Promise.all([
        api.getCases({
          category: filterCategory,
          priority: filterPriority,
          status: filterStatus,
          departmentId: filterDept === 'all' ? undefined : filterDept,
          isAnonymous: filterAnonymous === 'all' ? undefined : filterAnonymous,
          role: 'staff'
        }),
        api.getDepartments()
      ]);

      const fetchedCases: Case[] = casesRes.cases || [];
      setCases(fetchedCases);
      setDepartments(deptsRes.departments || []);

      // Check for incoming Critical Emergency reports
      const criticalCases = fetchedCases.filter(
        (c) =>
          c.priority === 'CRITICAL' &&
          (c.status === 'NEW' || c.status === 'AI_TRIAGED')
      );

      if (isInitialLoadRef.current) {
        // Populate existing IDs on initial load so old cases don't re-trigger siren
        criticalCases.forEach((c) => seenEmergencyIdsRef.current.add(c.publicCaseId));
        isInitialLoadRef.current = false;
      } else {
        // Detect newly arrived critical emergency case
        const brandNewCritical = criticalCases.find(
          (c) => !seenEmergencyIdsRef.current.has(c.publicCaseId)
        );

        if (brandNewCritical) {
          seenEmergencyIdsRef.current.add(brandNewCritical.publicCaseId);
          triggerEmergencyNotification(brandNewCritical);
        }
      }
    } catch (e) {
      console.error('Failed to load cases:', e);
    } finally {
      if (showLoadingIndicator) setLoading(false);
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

  // Hackathon Live Demo Preset: Test Siren on Demand
  const handleTriggerTestDemoAlert = () => {
    const testCase: Case = {
      id: `emergency-test-${Date.now()}`,
      publicCaseId: 'CC-EMERGENCY',
      reportType: 'safety',
      category: 'Immediate Danger',
      subcategory: 'Intruder / Threat',
      description: '🚨 LIVE DEMO ALERT: Unidentified trespasser detected near Campus Canteen with immediate security threat.',
      location: 'Main Campus Canteen & Plaza',
      incidentDate: 'Right Now',
      incidentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAnonymous: true,
      priority: 'CRITICAL',
      status: 'NEW',
      assignedDepartmentId: 'dept-security',
      assignedDepartmentName: 'Campus Security & Emergency Response',
      assignedStaffId: null,
      assignedStaffName: null,
      evidence: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: []
    };

    triggerEmergencyNotification(testCase);
  };

  // Top summary KPIs from Section 12
  const newCasesCount = cases.filter(c => c.status === 'NEW' || c.status === 'AI_TRIAGED').length;
  const underReviewCount = cases.filter(c => c.status === 'UNDER_REVIEW' || c.status === 'ASSIGNED').length;
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
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Staff Incident Command Center
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Department Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict role-based access. Reporter identity is masked for anonymous reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Hackathon Preset: Test Siren Button */}
          <button
            type="button"
            onClick={handleTriggerTestDemoAlert}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all hover:scale-105 active:scale-95 animate-pulse"
            title="Demonstrate Real-Time SOS Alert & Audio Siren"
          >
            <Siren className="w-4 h-4 animate-bounce" />
            <span>🚨 Test SOS Siren Alert</span>
          </button>

          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-campus-600' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Institutional Security KPI Cards (Cyber Command Center Aesthetics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* NEW CASES */}
        <motion.div
          whileHover={{ y: -3 }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-b from-blue-950/40 via-slate-900/90 to-slate-900/60 border border-blue-500/30 shadow-lg shadow-blue-950/20 backdrop-blur-md group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">New Intake</span>
            <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-full">
              Action Required
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight drop-shadow-sm">
              {newCasesCount}
            </span>
            <span className="text-xs text-slate-400">Fresh reports</span>
          </div>
          <div className="mt-3 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (newCasesCount / Math.max(1, cases.length)) * 100)}%` }} />
          </div>
        </motion.div>

        {/* UNDER REVIEW */}
        <motion.div
          whileHover={{ y: -3 }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-900/60 border border-amber-500/30 shadow-lg shadow-amber-950/20 backdrop-blur-md group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">Under Review</span>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
              In Progress
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
              {underReviewCount}
            </span>
            <span className="text-xs text-slate-400">Assigned / Active</span>
          </div>
          <div className="mt-3 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (underReviewCount / Math.max(1, cases.length)) * 100)}%` }} />
          </div>
        </motion.div>

        {/* CRITICAL PRIORITY */}
        <motion.div
          whileHover={{ y: -3 }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-b from-red-950/50 via-slate-900/90 to-slate-900/60 border border-red-500/40 shadow-lg shadow-red-950/30 backdrop-blur-md group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/15 rounded-full blur-2xl group-hover:bg-red-600/30 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              Critical SOS
            </span>
            <span className="text-[10px] font-bold text-red-200 bg-red-600/40 border border-red-500/50 px-2 py-0.5 rounded-full animate-pulse">
              Urgent Threat
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-red-400 font-mono tracking-tight">
              {criticalCount}
            </span>
            <span className="text-xs text-red-300/80">Immediate attention</span>
          </div>
          <div className="mt-3 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (criticalCount / Math.max(1, cases.length)) * 100)}%` }} />
          </div>
        </motion.div>

        {/* RESOLVED */}
        <motion.div
          whileHover={{ y: -3 }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-b from-emerald-950/40 via-slate-900/90 to-slate-900/60 border border-emerald-500/30 shadow-lg shadow-emerald-950/20 backdrop-blur-md group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Resolved</span>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Case Closed
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
              {resolvedCount}
            </span>
            <span className="text-xs text-slate-400">Total Solved</span>
          </div>
          <div className="mt-3 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (resolvedCount / Math.max(1, cases.length)) * 100)}%` }} />
          </div>
        </motion.div>
      </div>

      {/* Category Navigation Pills with Motion Layout */}
      <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'all', label: 'All Incidents', count: cases.length, icon: ClipboardList, color: 'text-indigo-600' },
          {
            id: 'safety',
            label: 'Student Safety',
            count: cases.filter(c => c.reportType === 'safety' || c.category.toLowerCase().includes('safety') || c.category.toLowerCase().includes('harass') || c.category.toLowerCase().includes('threat')).length,
            icon: ShieldAlert,
            color: 'text-rose-600'
          },
          {
            id: 'maintenance',
            label: 'Facilities & Repairs',
            count: cases.filter(c => c.reportType === 'maintenance' || c.category.toLowerCase().includes('maint')).length,
            icon: Wrench,
            color: 'text-amber-600'
          },
          {
            id: 'lost_found',
            label: 'Lost & Found',
            count: cases.filter(c => c.reportType === 'lost_found' || c.category.toLowerCase().includes('lost')).length,
            icon: Search,
            color: 'text-teal-600'
          },
          {
            id: 'other',
            label: 'Student Welfare',
            count: cases.filter(c => c.reportType === 'other' || (!['safety', 'maintenance', 'lost_found'].includes(c.reportType) && !c.category.toLowerCase().includes('safety') && !c.category.toLowerCase().includes('maint'))).length,
            icon: Users,
            color: 'text-indigo-600'
          }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = filterCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterCategory(tab.id)}
              className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId="staffCategoryPill"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                />
              )}
              <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar with Modern Glassmorphism */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Case ID, keywords, location, or department..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-700/80 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-campus-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Priority Filter */}
            <select
              aria-label="Filter by Priority"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="p-2 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-200 focus:ring-2 focus:ring-campus-500"
            >
              <option value="all">All Priorities</option>
              <option value="CRITICAL">🔴 Critical</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">⚪ Low</option>
            </select>

            {/* Status Filter */}
            <select
              aria-label="Filter by Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-200 focus:ring-2 focus:ring-campus-500"
            >
              <option value="all">All Statuses</option>
              <option value="NEW">New</option>
              <option value="AI_TRIAGED">AI Triaged</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ACTION_TAKEN">Action Taken</option>
              <option value="RESOLVED">Resolved</option>
              <option value="ESCALATED">Escalated</option>
            </select>

            {/* Anonymous / Identified Filter */}
            <select
              aria-label="Filter by Privacy Type"
              value={filterAnonymous}
              onChange={(e) => setFilterAnonymous(e.target.value)}
              className="p-2 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-200 focus:ring-2 focus:ring-campus-500"
            >
              <option value="all">Privacy: All</option>
              <option value="true">Anonymous Only</option>
              <option value="false">Identified Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Case Table (High-Tech Incident Queue) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-mono">Case ID</th>
                <th className="py-3.5 px-4">Category & Subject</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Reporter Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No cases match the selected category or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const catMeta = getCategoryMeta(c.category || c.reportType);
                  return (
                    <tr
                      key={c.id || c.publicCaseId}
                      onClick={() => setSelectedCase(c)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group border-l-2 border-transparent hover:border-campus-500"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-campus-600 dark:text-campus-400">
                        {c.publicCaseId}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <CategoryBadge category={c.category || c.reportType} sublabel={c.subcategory || c.category} size="sm" />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {c.description}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={c.priority} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {c.assignedDepartmentName || 'Pending'}
                      </td>

                      <td className="py-3.5 px-4">
                        {c.isAnonymous ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Anonymous</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                            <span>Identified</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCase(c);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-campus-50 hover:bg-campus-100 text-campus-700 font-semibold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </motion.button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screen Red Strobe Pulse Border when Critical Emergency is Active */}
      {emergencyAlert && (
        <div className="fixed inset-0 pointer-events-none z-40 border-[10px] border-red-600/80 animate-pulse shadow-[inset_0_0_80px_rgba(239,68,68,0.5)]" />
      )}

      {/* Emergency SOS Pop-up Modal with Siren Audio Controls */}
      <AnimatePresence>
        {emergencyAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border-2 border-red-500 shadow-2xl shadow-red-950/50 space-y-5"
            >
              {/* Alert Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-600 text-white rounded-2xl animate-bounce shadow-lg shadow-red-600/40">
                    <Siren className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
                      Live Security Broadcast
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      🚨 CRITICAL SOS ALERT
                    </h2>
                  </div>
                </div>

                {/* Mute / Unmute Siren Toggle */}
                <button
                  type="button"
                  onClick={isSirenPlaying ? handleMuteSiren : () => { setIsSirenPlaying(true); playEmergencySiren(8); }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isSirenPlaying
                      ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                  title={isSirenPlaying ? 'Mute Siren Sound' : 'Play Siren Sound'}
                >
                  {isSirenPlaying ? (
                    <>
                      <VolumeX className="w-4 h-4 text-amber-700 animate-pulse" />
                      <span>Mute</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Sound</span>
                    </>
                  )}
                </button>
              </div>

              {/* Alert Incident Details */}
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-red-700 dark:text-red-400">
                    Case ID: {emergencyAlert.publicCaseId}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] uppercase">
                    Immediate Danger
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="text-red-600">📍 Location:</span>
                  <span>{emergencyAlert.location || 'Campus Premises'}</span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-red-100 dark:border-red-900/30 leading-relaxed font-medium">
                  "{emergencyAlert.description}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Routing: <strong>Campus Security Command</strong></span>
                  <span>Time: <strong>{emergencyAlert.incidentTime || 'Just Now'}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const target = emergencyAlert;
                    handleDismissEmergency();
                    setSelectedCase(target);
                  }}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all hover:scale-102"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>🚨 Review Case & Dispatch Security</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismissEmergency}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                >
                  Acknowledge & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Case Detail Modal */}
      <AnimatePresence>
        {selectedCase && (
          <StaffCaseDetail
            caseItem={selectedCase}
            departments={departments}
            onClose={() => {
              setSelectedCase(null);
              loadData(true);
            }}
            onCaseUpdated={(updated) => {
              setSelectedCase(updated);
              loadData(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
