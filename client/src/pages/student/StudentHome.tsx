import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Wrench, 
  Search, 
  ArrowRight, 
  PhoneCall
} from 'lucide-react';

interface Props {
  onNavigate: (tab: string) => void;
}

export const StudentHome: React.FC<Props> = ({ onNavigate }) => {
  const [caseIdInput, setCaseIdInput] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (caseIdInput.trim()) {
      onNavigate('track_report');
    }
  };

  const cards = [
    {
      id: 'report_safely',
      title: 'Confidential Report',
      desc: 'Privately report harassment, ragging, or safety concerns.',
      icon: ShieldCheck,
      color: 'text-sky-400',
      borderHover: 'hover:border-sky-400/40',
      glow: 'bg-sky-500/10',
      action: 'File Report'
    },
    {
      id: 'emergency',
      title: 'Emergency SOS',
      desc: 'Instant alert and audible siren to campus security.',
      icon: AlertTriangle,
      color: 'text-rose-400',
      borderHover: 'hover:border-rose-500/40',
      glow: 'bg-rose-500/10',
      badge: '24/7 Fast Dispatch',
      action: 'Trigger SOS'
    },
    {
      id: 'maintenance',
      title: 'Campus Repairs',
      desc: 'Hostel, lab, electrical, or plumbing service requests.',
      icon: Wrench,
      color: 'text-amber-400',
      borderHover: 'hover:border-amber-400/40',
      glow: 'bg-amber-500/10',
      action: 'Request Repair'
    },
    {
      id: 'lost_found',
      title: 'Lost & Found',
      desc: 'Recover misplaced IDs, laptops, keys, or books.',
      icon: Search,
      color: 'text-teal-400',
      borderHover: 'hover:border-teal-400/40',
      glow: 'bg-teal-500/10',
      action: 'Search Items'
    }
  ];

  return (
    <div className="space-y-10 py-6 max-w-4xl mx-auto relative z-10">
      {/* Minimal Hero */}
      <section className="text-center space-y-4 pt-4">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            CampusCare
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Confidential safety, hostel repairs, and instant campus emergency support.
          </p>
        </div>

        {/* Minimal Search & Track Capsule */}
        <div className="max-w-md mx-auto pt-1">
          <form
            onSubmit={handleTrackSubmit}
            className="p-1 rounded-full glass-panel border border-white/10 flex items-center gap-2 group focus-within:border-sky-400/50 transition-all shadow-lg"
          >
            <div className="pl-3 text-slate-500">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="Track case by ID (e.g. CC-4UU76FD)..."
              value={caseIdInput}
              onChange={(e) => setCaseIdInput(e.target.value)}
              className="flex-1 bg-transparent text-white text-xs placeholder:text-slate-500 focus:outline-none py-1.5"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>Track</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          </form>
        </div>
      </section>

      {/* Clean 4-Card Minimal Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -2 }}
              onClick={() => onNavigate(item.id)}
              className={`p-5 rounded-2xl glass-panel-interactive border border-white/10 ${item.borderHover} cursor-pointer flex flex-col justify-between group transition-all`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl ${item.glow} ${item.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/20">
                      {item.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-white group-hover:text-slate-100 transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-300 group-hover:text-white font-medium">
                <span>{item.action}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-slate-400" />
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Minimal Helpline Pill Strip */}
      <section className="p-3.5 rounded-2xl glass-panel border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-medium text-slate-300">Helplines:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span>Security <strong className="text-white font-mono font-normal">Ext 911</strong></span>
          <span className="text-white/10">•</span>
          <span>Welfare <strong className="text-white font-mono font-normal">Ext 402</strong></span>
          <span className="text-white/10">•</span>
          <span>Health <strong className="text-white font-mono font-normal">Ext 108</strong></span>
          <span className="text-white/10">•</span>
          <span>Hostel <strong className="text-white font-mono font-normal">Ext 210</strong></span>
        </div>
      </section>
    </div>
  );
};
