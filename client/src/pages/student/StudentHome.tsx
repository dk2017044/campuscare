import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Wrench, 
  Search, 
  ArrowRight, 
  PhoneCall,
  Sparkles,
  Lock,
  Radio,
  Compass,
  Command,
  Activity
} from 'lucide-react';
import { TiltCard } from '../../components/TiltCard';
import { useScrambleText } from '../../hooks/useScrambleText';
import { playTapSound } from '../../services/sound';

interface Props {
  onNavigate: (tab: string) => void;
  onOpenCommand?: () => void;
}

export const StudentHome: React.FC<Props> = ({ onNavigate, onOpenCommand }) => {
  const [caseIdInput, setCaseIdInput] = useState('');
  const badgeScramble = useScrambleText('CAMPUSCARE // CONFIDENTIAL ENCLAVE', 300);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    if (caseIdInput.trim()) {
      onNavigate('track_report');
    }
  };

  const cards = [
    {
      id: 'report_safely',
      title: 'Confidential Report',
      desc: 'Privately report harassment, ragging, or safety concerns with zero device fingerprinting.',
      icon: ShieldCheck,
      gradient: 'from-sky-400 to-indigo-600',
      shadowColor: 'shadow-sky-500/25',
      glowColor: 'bg-sky-500/15',
      glowRgba: 'rgba(56, 189, 248, 0.22)',
      borderHover: 'hover:border-sky-400/50',
      action: 'File Confidential Report',
      tag: '100% Anonymous'
    },
    {
      id: 'emergency',
      title: 'Emergency SOS Beacon',
      desc: 'Instant audio siren and real-time priority broadcast to on-duty campus guard patrols.',
      icon: Radio,
      gradient: 'from-rose-500 to-red-600',
      shadowColor: 'shadow-rose-500/30',
      glowColor: 'bg-rose-500/20',
      glowRgba: 'rgba(244, 63, 94, 0.25)',
      borderHover: 'hover:border-rose-500/50',
      action: 'Trigger Emergency Alert',
      tag: '24/7 Guard Dispatch',
      isPulse: true
    },
    {
      id: 'maintenance',
      title: 'Repairs & Maintenance',
      desc: 'Submit rapid service requests for lab computers, AC faults, desks, or hostel plumbing.',
      icon: Wrench,
      gradient: 'from-amber-400 to-orange-600',
      shadowColor: 'shadow-amber-500/25',
      glowColor: 'bg-amber-500/15',
      glowRgba: 'rgba(245, 158, 11, 0.22)',
      borderHover: 'hover:border-amber-400/50',
      action: 'Request Campus Repair',
      tag: 'Hostels & Labs'
    },
    {
      id: 'lost_found',
      title: 'Lost & Found Registry',
      desc: 'Locate misplaced ID cards, laptops, or textbooks across campus security checkpoints.',
      icon: Compass,
      gradient: 'from-teal-400 to-emerald-600',
      shadowColor: 'shadow-teal-500/25',
      glowColor: 'bg-teal-500/15',
      glowRgba: 'rgba(20, 184, 166, 0.22)',
      borderHover: 'hover:border-teal-400/50',
      action: 'Search Recovered Items',
      tag: 'Campus Radar'
    }
  ];

  return (
    <div className="space-y-12 py-8 max-w-4xl mx-auto relative z-10">
      {/* Editorial Hero Section */}
      <section className="text-center space-y-5 pt-2">
        {/* Luminous Apple-Style Micro Badge with Sci-Fi Decryption */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full glass-pill border border-white/10 text-xs text-slate-300 shadow-lg shadow-sky-500/5 backdrop-blur-xl"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
          <span className="font-mono text-[11px] tracking-wider text-slate-300">
            {badgeScramble}
          </span>
        </motion.div>

        {/* High-Impact Headline */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="space-y-3"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08] font-heading">
            Safe. Swift. Confidential.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-300 font-extrabold">
              Campus care, elevated.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-normal leading-relaxed">
            Report safety concerns with complete privacy, request facility repairs, or trigger immediate emergency support.
          </p>
        </motion.div>

        {/* Spotlight Command Bar & Quick Ctrl+K Trigger */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          className="max-w-lg mx-auto pt-2"
        >
          <form
            onSubmit={handleTrackSubmit}
            className="p-1.5 rounded-2xl glass-panel border border-white/15 flex items-center gap-2.5 group focus-within:border-sky-400/60 focus-within:shadow-[0_0_30px_rgba(56,189,248,0.25)] transition-all shadow-xl"
          >
            <div 
              onClick={onOpenCommand}
              className="pl-3.5 text-slate-400 flex items-center cursor-pointer group-focus-within:text-sky-400 transition-colors"
              title="Click or press Ctrl+K"
            >
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Track report by Case ID (e.g. CC-4UU76FD)..."
              value={caseIdInput}
              onChange={(e) => setCaseIdInput(e.target.value)}
              className="flex-1 bg-transparent text-white text-xs sm:text-sm placeholder:text-slate-500 font-normal focus:outline-none py-1.5"
            />
            {onOpenCommand && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onOpenCommand();
                }}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl glass-pill text-[11px] font-mono text-slate-400 hover:text-white cursor-pointer transition-colors"
                title="Open Command Palette"
              >
                <Command className="w-3 h-3 text-sky-400" />
                <span>K</span>
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md shadow-sky-500/20 flex items-center gap-1.5 shrink-0"
            >
              <span>Track</span>
              <span className="text-[10px] font-mono opacity-70">↵</span>
            </button>
          </form>
        </motion.div>
      </section>

      {/* Bespoke 4-Card Bento Grid with 3D Parallax & Cursor Spotlight */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + index * 0.08, ease: 'easeOut' }}
              className="w-full flex"
            >
              <TiltCard
                glowColor={item.glowRgba}
                onClick={() => onNavigate(item.id)}
                className={`p-6 sm:p-7 rounded-3xl glass-panel-interactive border border-white/10 ${item.borderHover} h-full flex flex-col justify-between group shadow-lg w-full`}
              >
                {/* Luminous Specular Ambient Light Orb */}
                <div className={`absolute top-0 right-0 w-44 h-44 ${item.glowColor} rounded-full blur-3xl pointer-events-none -z-10 group-hover:scale-125 transition-transform duration-500`} />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    {/* Vibrant Gradient Squircle Icon with 3D Depth */}
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.gradient} ${item.shadowColor} flex items-center justify-center text-white shadow-lg`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    {/* Chic Status Tag */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium glass-pill border border-white/10 text-slate-300">
                      {item.isPulse && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                      )}
                      <span>{item.tag}</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-slate-100 transition-colors font-heading">
                      {item.title}
                    </h2>
                    <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Action Link Footer */}
                <div className="mt-6 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-300 font-medium group-hover:text-white transition-colors">
                  <span>{item.action}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-300 group-hover:translate-x-1.5 transition-all" />
                </div>
              </TiltCard>
            </motion.div>
          );
        })}
      </section>

      {/* Live Campus Pulse Telemetry Widget */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="p-3.5 sm:p-4 rounded-2xl glass-panel border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-semibold text-white font-mono text-[11px]">CAMPUS PULSE:</span>
          <span className="text-slate-400 text-xs">Security Units Active &amp; Patrolling</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span>Latency: <strong className="text-sky-300">&lt;2s</strong></span>
          <span className="text-white/20">•</span>
          <span>Zero-Telemetry: <strong className="text-emerald-300">Active</strong></span>
          <span className="text-white/20">•</span>
          <span>Response: <strong className="text-amber-300">24/7</strong></span>
        </div>
      </motion.section>

      {/* Refined Helpline Dock */}
      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="p-4 sm:p-5 rounded-3xl glass-panel border border-white/10 shadow-lg space-y-3"
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-white">24/7 Campus Emergency Lines</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Monitored</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {[
            { label: 'Security Patrol', ext: 'Ext 911', highlight: 'text-rose-400' },
            { label: 'Welfare & Care', ext: 'Ext 402', highlight: 'text-sky-400' },
            { label: 'Health Clinic', ext: 'Ext 108', highlight: 'text-emerald-400' },
            { label: 'Facilities Desk', ext: 'Ext 210', highlight: 'text-amber-400' }
          ].map((item) => (
            <div
              key={item.label}
              className="p-2.5 rounded-2xl glass-pill flex items-center justify-between hover:bg-white/10 transition-colors"
            >
              <div>
                <span className="text-[10px] text-slate-400 block">{item.label}</span>
                <span className="text-xs font-mono font-bold text-white block mt-0.5">{item.ext}</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${item.highlight} opacity-80`} />
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
};
