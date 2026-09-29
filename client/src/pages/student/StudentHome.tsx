import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Lock, Wrench, Search, ClipboardList, ShieldCheck, ArrowRight, PhoneCall, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  onNavigate: (tab: string) => void;
}

export const StudentHome: React.FC<Props> = ({ onNavigate }) => {
  const [quickTrackId, setQuickTrackId] = useState('');

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackId.trim()) {
      onNavigate('track_report');
    }
  };

  return (
    <div className="space-y-10 py-6 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900/80 text-white p-8 sm:p-12 border border-slate-800 shadow-xl">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 text-campus-400 border border-slate-700 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-campus-400" />
            <span>100% Confidential • No Login Required</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Campus problems deserve a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-campus-400 to-sky-300">
              safe, simple resolution.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Report safety concerns, request urgent maintenance, locate lost items, or trigger emergency assistance with guaranteed privacy.
          </p>
        </div>
      </section>

      {/* Primary Action Cards (4 Focused Cards - Zero Clutter) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Emergency Alert */}
        <motion.div
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('emergency')}
          className="group relative p-6 rounded-2xl border border-red-500/30 bg-slate-900/90 hover:border-red-500/70 transition-all cursor-pointer shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                Immediate SOS
              </span>
            </div>
            <h2 className="font-bold text-lg text-white group-hover:text-red-400 transition-colors">
              Emergency Alert
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Instant beacon with alert siren dispatched directly to Campus Security & Response Units.
            </p>
          </div>
          <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-red-400">
            <span>Trigger Alert</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* 2. Report Safely */}
        <motion.div
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('report_safely')}
          className="group relative p-6 rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-campus-500/70 transition-all cursor-pointer shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-campus-500/20 text-campus-400 flex items-center justify-center">
                <Lock className="w-5 h-5 text-campus-400" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-campus-500/20 text-campus-300 border border-campus-500/30">
                Confidential
              </span>
            </div>
            <h2 className="font-bold text-lg text-white group-hover:text-campus-400 transition-colors">
              Report Grievance
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Safely file harassment, ragging, counseling, or safety issues. Your identity is never exposed.
            </p>
          </div>
          <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-campus-400">
            <span>File Report</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* 3. Maintenance */}
        <motion.div
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('maintenance')}
          className="group relative p-6 rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-amber-500/70 transition-all cursor-pointer shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-amber-400" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Facilities
              </span>
            </div>
            <h2 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors">
              Campus Repairs
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Report defective fans, lab lights, water seepage, broken furniture, or classroom equipment.
            </p>
          </div>
          <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-amber-400">
            <span>Request Repair</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* 4. Lost & Found */}
        <motion.div
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('lost_found')}
          className="group relative p-6 rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-teal-500/70 transition-all cursor-pointer shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Search className="w-5 h-5 text-teal-400" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Items
              </span>
            </div>
            <h2 className="font-bold text-lg text-white group-hover:text-teal-400 transition-colors">
              Lost & Found
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Search misplaced items or report recovered belongings across campus hostels and departments.
            </p>
          </div>
          <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-teal-400">
            <span>Search Items</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>
      </section>

      {/* Sleek Quick Track Card */}
      <section className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-campus-400 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Track an Existing Case</h3>
            <p className="text-xs text-slate-400">Enter your Case ID to check real-time resolution updates and staff replies.</p>
          </div>
        </div>

        <form onSubmit={handleQuickTrack} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="e.g. CC-RSFNA3B"
            value={quickTrackId}
            onChange={(e) => setQuickTrackId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-campus-500 font-mono w-full sm:w-44"
          />
          <button
            type="submit"
            onClick={() => onNavigate('track_report')}
            className="px-4 py-2 rounded-xl bg-campus-600 hover:bg-campus-500 text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>Track</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </section>

      {/* 3 Simple Pillars (Clean, Human, Zero AI Jargon) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-campus-500/10 text-campus-400 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Zero Identity Exposure</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              No roll numbers or logins required. Report safely without fear of social or academic retaliation.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Private Access PIN</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Only you hold the 6-digit access PIN generated during submission to view progress and message officers.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Direct Department Action</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Incidents are categorized and dispatched directly to the responsible university committee.
            </p>
          </div>
        </div>
      </section>

      {/* Emergency Helplines Strip */}
      <section className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <PhoneCall className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-semibold text-slate-200">Campus Helplines:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-400 font-mono text-[11px]">
          <div><span className="text-slate-500">Security Control:</span> <span className="text-red-400 font-bold">Ext. 911</span></div>
          <div><span className="text-slate-500">Student Counseling:</span> <span className="text-campus-400 font-bold">Ext. 402</span></div>
          <div><span className="text-slate-500">Facilities Maintenance:</span> <span className="text-amber-400 font-bold">Ext. 210</span></div>
          <div><span className="text-slate-500">Campus Medical:</span> <span className="text-emerald-400 font-bold">Ext. 108</span></div>
        </div>
      </section>
    </div>
  );
};
