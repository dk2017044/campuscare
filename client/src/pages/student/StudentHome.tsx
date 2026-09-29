import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Lock, Wrench, Search, ClipboardList, ShieldCheck, EyeOff, Bot, ArrowRight, MessageSquare, HeartHandshake, Sparkles } from 'lucide-react';

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
    transition: { duration: 0.35, ease: "easeOut" as const }
  }
};

export const StudentHome: React.FC<Props> = ({ onNavigate }) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12 py-6"
    >
      {/* Hero Section */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white p-8 sm:p-14 shadow-2xl border border-slate-800"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.28),rgba(255,255,255,0))]" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-campus-500/10 text-campus-400 border border-campus-500/30 text-xs font-semibold uppercase tracking-wider backdrop-blur-md"
          >
            <Lock className="w-3.5 h-3.5 text-campus-400" />
            <span>Zero-Telemetry Campus Protection Active</span>
          </motion.div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Campus problems deserve a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-campus-300 via-campus-400 to-sky-200">
              safe way to be heard.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Report safety concerns, maintenance issues, and lost items with cryptographic privacy shielding. You control what information you share.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('emergency')}
              className="group relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold text-sm shadow-xl shadow-red-950/50 hover:from-red-500 hover:to-rose-600 transition-all border border-red-500/40"
            >
              <AlertTriangle className="w-4 h-4 text-red-200 group-hover:scale-110 transition-transform" />
              <span>🚨 Emergency Alert</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('report_safely')}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-campus-600 to-sky-600 hover:from-campus-500 hover:to-sky-500 text-white font-bold text-sm shadow-xl shadow-campus-950/40 transition-all border border-campus-400/30"
            >
              <Lock className="w-4 h-4" />
              <span>🔒 Report Safely</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('maintenance')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 shadow-md transition-all"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>🔧 Maintenance</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('lost_found')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 shadow-md transition-all"
            >
              <Search className="w-4 h-4 text-teal-400" />
              <span>🔎 Lost & Found</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('track_report')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 shadow-md transition-all"
            >
              <ClipboardList className="w-4 h-4 text-purple-400" />
              <span>📋 Track My Case</span>
            </motion.button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cryptographic PIN Verification • Salted HMAC-SHA256 • Zero Tracking Cookies</span>
          </div>
        </div>
      </motion.section>

      {/* Category-Wise Campus Support Channels */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Categorized Campus Support Streams
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Select an operational intake channel for immediate AI triage and departmental dispatch:
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start md:self-auto font-mono">
            24/7 AI Triage Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* CATEGORY 1: SAFETY & HARASSMENT */}
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('report_safely')}
            className="group relative p-6 rounded-3xl border border-rose-500/30 bg-gradient-to-b from-rose-950/30 via-slate-900/90 to-slate-950/80 backdrop-blur-xl hover:border-rose-500/70 transition-all cursor-pointer shadow-xl shadow-rose-950/20 hover:shadow-2xl hover:shadow-rose-600/20 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/25 transition-all pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Student Safety
                </span>
                <span className="text-[10px] text-emerald-400 font-bold font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  100% Anonymous
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-white group-hover:text-rose-400 transition-colors">
                Harassment & Safe Intake
              </h3>
              <p className="text-xs text-slate-300/80 mt-2.5 leading-relaxed">
                Confidential incident reporting for stalking, intimidation, ragging, or hostile spots with zero identity exposure.
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-rose-500/20 flex items-center justify-between text-xs font-bold text-rose-400">
              <span>File Safety Report</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </motion.div>

          {/* CATEGORY 2: MAINTENANCE & FACILITIES */}
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('maintenance')}
            className="group relative p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-950/30 via-slate-900/90 to-slate-950/80 backdrop-blur-xl hover:border-amber-500/70 transition-all cursor-pointer shadow-xl shadow-amber-950/20 hover:shadow-2xl hover:shadow-amber-500/20 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/25 transition-all pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Facilities & Repairs
                </span>
                <span className="text-[10px] text-amber-300 font-bold font-mono">Gemini Vision AI</span>
              </div>
              <h3 className="font-extrabold text-lg text-white group-hover:text-amber-400 transition-colors">
                Multimodal Defect Inspection
              </h3>
              <p className="text-xs text-slate-300/80 mt-2.5 leading-relaxed">
                Snap photos of broken fans, flickering lab lights, water leakages, or broken chairs for instant AI diagnostic triage.
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-amber-500/20 flex items-center justify-between text-xs font-bold text-amber-400">
              <span>Report Maintenance</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </motion.div>

          {/* CATEGORY 3: LOST & FOUND */}
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('lost_found')}
            className="group relative p-6 rounded-3xl border border-teal-500/30 bg-gradient-to-b from-teal-950/30 via-slate-900/90 to-slate-950/80 backdrop-blur-xl hover:border-teal-500/70 transition-all cursor-pointer shadow-xl shadow-teal-950/20 hover:shadow-2xl hover:shadow-teal-500/20 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/25 transition-all pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Lost & Found
                </span>
                <span className="text-[10px] text-teal-300 font-bold font-mono">Semantic Match</span>
              </div>
              <h3 className="font-extrabold text-lg text-white group-hover:text-teal-400 transition-colors">
                Intelligent Property Matching
              </h3>
              <p className="text-xs text-slate-300/80 mt-2.5 leading-relaxed">
                AI cross-references lost items with campus found items using category matching, location proximity, and timing.
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-teal-500/20 flex items-center justify-between text-xs font-bold text-teal-400">
              <span>Find & Match Items</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </motion.div>

          {/* CATEGORY 4: STUDENT WELFARE & COUNSELING */}
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('report_safely')}
            className="group relative p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/30 via-slate-900/90 to-slate-950/80 backdrop-blur-xl hover:border-indigo-500/70 transition-all cursor-pointer shadow-xl shadow-indigo-950/20 hover:shadow-2xl hover:shadow-indigo-500/20 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/25 transition-all pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Welfare & Care
                </span>
                <span className="text-[10px] text-indigo-300 font-bold font-mono">Faculty Mentors</span>
              </div>
              <h3 className="font-extrabold text-lg text-white group-hover:text-indigo-400 transition-colors">
                Confidential Counselor Care
              </h3>
              <p className="text-xs text-slate-300/80 mt-2.5 leading-relaxed">
                Reach student welfare committees and counselors anonymously for academic anxiety, mental health, or hostel issues.
              </p>
            </div>
            <div className="mt-5 pt-3.5 border-t border-indigo-500/20 flex items-center justify-between text-xs font-bold text-indigo-400">
              <span>Connect with Counselor</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* How CampusCare Protects You (Step Cards) */}
      <motion.section variants={itemVariants} className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            How CampusCare Protects You
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Engineered so you never have to trade your privacy for your safety.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col items-start"
          >
            <div className="w-12 h-12 rounded-2xl bg-campus-50 dark:bg-campus-950 flex items-center justify-center text-campus-600 dark:text-campus-400 mb-4 shadow-xs">
              <EyeOff className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-campus-600 dark:text-campus-400 uppercase tracking-wider">Step 1</span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">Identity Shielded</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              No roll number or email required. Identifying telemetry is stripped at the network edge.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col items-start"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Step 2</span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">AI-Assisted Triage</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Gemini analyzes incident details, calculates severity, and routes directly to the responsible team.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col items-start"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Step 3</span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">Case ID & PIN</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Cryptographically unique Case ID and 6-digit access PIN let you track progress securely.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            className="p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col items-start"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Step 4</span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">Anonymous 2-Way Chat</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Read staff responses and exchange updates without ever exposing your real identity.
            </p>
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
  );
};
