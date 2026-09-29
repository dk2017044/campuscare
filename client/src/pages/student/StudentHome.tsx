import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  Lock, 
  Wrench, 
  Search, 
  ClipboardList, 
  ShieldCheck, 
  ArrowRight, 
  PhoneCall, 
  Sparkles, 
  CheckCircle2, 
  Radio, 
  MessageSquare, 
  Zap, 
  Droplet, 
  Layers, 
  Wifi,
  KeyRound
} from 'lucide-react';

interface Props {
  onNavigate: (tab: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 350, damping: 25 }
  }
};

export const StudentHome: React.FC<Props> = ({ onNavigate }) => {
  const [quickTrackId, setQuickTrackId] = useState('');
  const [selectedTag, setSelectedTag] = useState('Harassment');

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('track_report');
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 py-4 max-w-6xl mx-auto"
    >
      {/* 21st.dev Style Hero Section */}
      <motion.section variants={itemVariants} className="relative text-center pt-6 pb-4 space-y-4">
        {/* Animated Badge Pill */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 shadow-inner backdrop-blur-md cursor-default"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-medium text-slate-300">Campus Incident & Support Hub</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold">100% Confidential</span>
        </motion.div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
          Safe, rapid resolutions.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-300">
            Built for campus peace of mind.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Report grievances without revealing your identity, request urgent campus repairs, locate lost items, or trigger emergency security dispatch in seconds.
        </p>

        {/* Hero Quick Action Pills */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('report_safely')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-950 font-bold text-xs shadow-lg shadow-white/10 hover:bg-slate-100 transition-all"
          >
            <Lock className="w-3.5 h-3.5 text-slate-900" />
            <span>File Confidential Report</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('emergency')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-900/40 hover:bg-rose-500 transition-all border border-rose-400/30"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-200" />
            <span>Emergency SOS</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('track_report')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/90 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700/80 shadow-sm transition-all"
          >
            <ClipboardList className="w-3.5 h-3.5 text-sky-400" />
            <span>Track Case Status</span>
          </motion.button>
        </div>
      </motion.section>

      {/* 21st.dev Style Bento Grid */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bento 1: Grievance & Harassment Safe Intake (Span 2 cols on desktop) */}
        <motion.div
          whileHover={{ y: -3 }}
          className="md:col-span-2 p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group shadow-lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-campus-500/10 text-campus-400 border border-campus-500/20 text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Identity Exposure</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">HMAC SHA-256 PIN</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Confidential Incident & Grievance Filing
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed max-w-xl">
                File sensitive reports regarding ragging, harassment, academic stress, or hostile conditions. Your roll number or email is never requested or logged.
              </p>
            </div>

            {/* Interactive Category Chips */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">Common Categories:</span>
              <div className="flex flex-wrap gap-2">
                {['Harassment', 'Ragging Prevention', 'Counseling & Mental Health', 'Hostel Welfare', 'Faculty Conduct'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSelectedTag(tag);
                      onNavigate('report_safely');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      selectedTag === tag
                        ? 'bg-campus-600 text-white shadow-sm'
                        : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                No login required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Anonymous 2-way chat
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('report_safely')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-campus-600 hover:bg-campus-500 text-white text-xs font-bold transition-all shadow-sm group-hover:translate-x-0.5"
            >
              <span>Submit Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Bento 2: Emergency SOS Radar Beacon (1 col) */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-6 rounded-3xl bg-gradient-to-b from-rose-950/30 via-slate-900/80 to-slate-950 border border-rose-500/20 hover:border-rose-500/50 transition-all backdrop-blur-xl flex flex-col justify-between shadow-lg relative overflow-hidden group"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
                <span>Instant SOS</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            </div>

            <h3 className="text-lg font-bold text-white">Emergency Dispatch</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Immediate alarm with sound beacon and location broadcast dispatched to Campus Security.
            </p>

            {/* Radar Pulsing Visual */}
            <div className="my-5 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-rose-500/10 animate-ping pointer-events-none" />
                <div className="w-16 h-16 rounded-full bg-rose-500/20 absolute pointer-events-none" />
                <button
                  type="button"
                  onClick={() => onNavigate('emergency')}
                  className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-xl shadow-rose-950/60 hover:scale-105 transition-transform"
                >
                  <AlertTriangle className="w-7 h-7" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('emergency')}
            className="w-full py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md"
          >
            <span>Activate Emergency Alert</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {/* Bento 3: Campus Maintenance & Repairs (1 col) */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/50 transition-all backdrop-blur-xl flex flex-col justify-between shadow-lg group"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
              Campus Maintenance
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Report equipment failure, hostel issues, or facilities defects with photo evidence.
            </p>

            {/* Department Quick Grid */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/40 text-[11px] text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Electrical</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/40 text-[11px] text-slate-300 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Plumbing</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/40 text-[11px] text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Furniture</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/40 text-[11px] text-slate-300 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>IT & Labs</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('maintenance')}
            className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Request Repair</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {/* Bento 4: Lost & Found Community Hub (1 col) */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-teal-500/50 transition-all backdrop-blur-xl flex flex-col justify-between shadow-lg group"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
              Lost & Found Hub
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Misplaced your calculator, keys, or ID card? Search reported findings or list found belongings.
            </p>

            {/* Micro Ticker */}
            <div className="mt-4 space-y-1.5">
              <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/30 text-[11px] text-slate-300 flex items-center justify-between">
                <span>Room 204 Keys</span>
                <span className="text-[10px] text-emerald-400 font-mono">Found in Library</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/30 text-[11px] text-slate-300 flex items-center justify-between">
                <span>Calculus Notebook</span>
                <span className="text-[10px] text-teal-400 font-mono">Canteen Block</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('lost_found')}
            className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Search or List Item</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {/* Bento 5: Instant Live Case Tracker (1 col) */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-campus-500/50 transition-all backdrop-blur-xl flex flex-col justify-between shadow-lg group"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-campus-500/10 text-campus-400 flex items-center justify-center mb-4">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-campus-300 transition-colors">
              Case Status Lookup
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Check live investigation progress and converse with committee officers securely.
            </p>

            <form onSubmit={handleQuickTrack} className="mt-4 space-y-2">
              <input
                type="text"
                placeholder="Case ID (e.g. CC-RSFNA3B)"
                value={quickTrackId}
                onChange={(e) => setQuickTrackId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-campus-500 font-mono"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-campus-600 hover:bg-campus-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Track Resolution</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Encrypted PIN Access</span>
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </motion.div>
      </motion.section>

      {/* Modern Compact Campus Helplines Strip */}
      <motion.section variants={itemVariants} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/70 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <PhoneCall className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-semibold text-white">Campus 24/7 Helplines:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-400 font-mono text-[11px]">
          <div><span className="text-slate-500">Security:</span> <span className="text-rose-400 font-bold">Ext. 911</span></div>
          <div><span className="text-slate-500">Counseling:</span> <span className="text-campus-400 font-bold">Ext. 402</span></div>
          <div><span className="text-slate-500">Facilities:</span> <span className="text-amber-400 font-bold">Ext. 210</span></div>
          <div><span className="text-slate-500">Medical:</span> <span className="text-emerald-400 font-bold">Ext. 108</span></div>
        </div>
      </motion.section>
    </motion.div>
  );
};
