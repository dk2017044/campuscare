import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Wrench, 
  Search, 
  ArrowRight, 
  PhoneCall,
  Radio,
  Compass,
  Command,
  Activity
} from 'lucide-react';
import { playTapSound } from '../../services/sound';

interface Props {
  onNavigate: (tab: string) => void;
  onOpenCommand?: () => void;
}

export const StudentHome: React.FC<Props> = ({ onNavigate, onOpenCommand }) => {
  const [caseIdInput, setCaseIdInput] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    if (caseIdInput.trim()) {
      onNavigate('track_report');
    }
  };

  const handleCardClick = (tabId: string) => {
    playTapSound();
    onNavigate(tabId);
  };

  const cards = [
    {
      id: 'report_safely',
      title: 'Confidential Report',
      desc: 'Privately report harassment, ragging, or safety concerns with zero identity tracking.',
      icon: ShieldCheck,
      gradient: 'from-sky-400 to-indigo-600',
      shadowColor: 'shadow-sky-500/25',
      borderHover: 'hover:border-sky-400/40',
      action: 'File Confidential Report',
      tag: '100% Anonymous'
    },
    {
      id: 'emergency',
      title: 'Emergency SOS Beacon',
      desc: 'Instant audio siren and direct priority broadcast to on-duty campus guard patrols.',
      icon: Radio,
      gradient: 'from-rose-500 to-red-600',
      shadowColor: 'shadow-rose-500/30',
      borderHover: 'hover:border-rose-500/40',
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
      borderHover: 'hover:border-amber-400/40',
      action: 'Request Campus Repair',
      tag: 'Hostels & Labs'
    },
    {
      id: 'lost_found',
      title: 'Lost & Found Registry',
      desc: 'Locate misplaced ID cards, laptops, or textbooks across campus collection points.',
      icon: Compass,
      gradient: 'from-teal-400 to-emerald-600',
      shadowColor: 'shadow-teal-500/25',
      borderHover: 'hover:border-teal-400/40',
      action: 'Search Recovered Items',
      tag: 'Campus Radar'
    }
  ];

  return (
    <div className="space-y-10 py-6 max-w-4xl mx-auto relative z-10">
      {/* Editorial Hero Section */}
      <section className="text-center space-y-4 pt-2">
        {/* Luminous Apple-Style Micro Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border border-white/10 text-xs text-slate-300 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="font-medium tracking-wide">Campus Support &amp; Confidential Care</span>
        </div>

        {/* High-Impact Headline */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.1] font-heading">
            Safe. Swift. Confidential.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-300 font-extrabold">
              Campus care, elevated.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-normal leading-relaxed">
            Report safety concerns with complete privacy, request facility repairs, or trigger immediate emergency support.
          </p>
        </div>

        {/* Spotlight Command Bar & Quick Ctrl+K Trigger */}
        <div className="max-w-lg mx-auto pt-2">
          <form
            onSubmit={handleTrackSubmit}
            className="p-1.5 rounded-2xl glass-panel border border-white/15 flex items-center gap-2 group focus-within:border-sky-400/60 shadow-lg transition-all"
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
        </div>
      </section>

      {/* 4-Card Bento Grid (Rock-Solid & High-Performance) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => handleCardClick(item.id)}
              className={`p-6 sm:p-7 rounded-3xl glass-panel-interactive border border-white/10 ${item.borderHover} cursor-pointer flex flex-col justify-between group transition-all relative overflow-hidden`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {/* Vibrant Gradient Squircle Icon */}
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.gradient} ${item.shadowColor} flex items-center justify-center text-white shadow-lg`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {/* Status Tag */}
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
            </div>
          );
        })}
      </section>

      {/* Live Campus Pulse Telemetry Widget */}
      <section className="p-3.5 sm:p-4 rounded-2xl glass-panel border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
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
      </section>

      {/* Refined Helpline Dock */}
      <section className="p-4 sm:p-5 rounded-3xl glass-panel border border-white/10 shadow-lg space-y-3">
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
      </section>
    </div>
  );
};
