import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Wrench, 
  Search, 
  ArrowRight, 
  FileText, 
  Siren, 
  Lock, 
  Clock, 
  Users
} from 'lucide-react';
import { playTapSound } from '../../services/sound';

interface Props {
  onNavigate: (tab: string) => void;
  onOpenCommand?: () => void;
}

export const StudentHome: React.FC<Props> = ({ onNavigate }) => {
  const [caseIdInput, setCaseIdInput] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    if (caseIdInput.trim()) {
      onNavigate('track_report');
    }
  };

  const handleNavigate = (tabId: string) => {
    playTapSound();
    onNavigate(tabId);
  };

  const cards = [
    {
      id: 'report_safely',
      title: 'Confidential Reporting',
      desc: 'Report harassment, ragging, or safety concerns privately.',
      icon: Shield,
      cardBg: 'bg-[#F0F7FF] border-[#D0E5FF] hover:border-[#B2D5FF]',
      iconBg: 'bg-[#0066FF] text-white',
      arrowColor: 'text-[#0066FF]',
      watermarkIcon: Shield,
      watermarkColor: 'text-blue-500/10'
    },
    {
      id: 'maintenance',
      title: 'Repairs & Facilities',
      desc: 'Request repairs for fans, lights, plumbing or classroom facilities.',
      icon: Wrench,
      cardBg: 'bg-[#FFF9EE] border-[#FFE8BD] hover:border-[#FFD994]',
      iconBg: 'bg-[#F59E0B] text-white',
      arrowColor: 'text-[#F59E0B]',
      watermarkIcon: Wrench,
      watermarkColor: 'text-amber-500/10'
    },
    {
      id: 'lost_found',
      title: 'Lost & Found',
      desc: 'Search for lost items or report something you found.',
      icon: Search,
      cardBg: 'bg-[#F0FDF9] border-[#CCFBEF] hover:border-[#99F6E4]',
      iconBg: 'bg-[#0D9488] text-white',
      arrowColor: 'text-[#0D9488]',
      watermarkIcon: Search,
      watermarkColor: 'text-teal-500/10'
    },
    {
      id: 'emergency',
      title: 'Emergency Support',
      desc: 'Get quick access to campus emergency resources.',
      icon: Siren,
      cardBg: 'bg-[#FFF1F0] border-[#FFE0DE] hover:border-[#FFC7C3]',
      iconBg: 'bg-[#EF4444] text-white',
      arrowColor: 'text-[#EF4444]',
      watermarkIcon: Siren,
      watermarkColor: 'text-rose-500/10'
    }
  ];

  return (
    <div className="space-y-10 py-8 max-w-6xl mx-auto relative z-10 px-2 sm:px-4">
      {/* Editorial Hero Section */}
      <section className="text-center space-y-5 pt-4 max-w-3xl mx-auto">
        {/* Brand Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-heading leading-tight">
            <span className="text-[#0F172A]">Campus</span>
            <span className="text-[#0066FF]">Care</span>
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            A safer, more supportive campus for everyone.
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto font-normal leading-relaxed">
            Report concerns, request facility support, find lost items, or get emergency help — all in one place.
          </p>
        </div>

        {/* 2 Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          {/* Blue Button: Report a Concern */}
          <button
            type="button"
            onClick={() => handleNavigate('report_safely')}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#0066FF] hover:bg-[#0052cc] text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <FileText className="w-4 h-4" />
            <span>Report a Concern</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Peach/Coral Button: Emergency SOS */}
          <button
            type="button"
            onClick={() => handleNavigate('emergency')}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#FFF0ED] hover:bg-[#FFE4DF] text-[#B42318] text-sm font-semibold border border-[#FECDCA] shadow-xs hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Siren className="w-4 h-4 animate-pulse text-[#B42318]" />
            <span>Emergency SOS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Floating Track Your Case Search Bar */}
      <section className="max-w-2xl mx-auto">
        <form
          onSubmit={handleTrackSubmit}
          className="p-2 sm:p-2.5 rounded-full bg-white border border-slate-200/80 shadow-lg shadow-slate-200/50 flex items-center gap-3 transition-all focus-within:border-blue-400 focus-within:shadow-xl"
        >
          {/* Magnifying Glass Icon Circle */}
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 ml-1">
            <Search className="w-4 h-4" />
          </div>

          {/* Label + Input Column */}
          <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
            <label className="text-[11px] font-semibold text-slate-600 leading-tight">
              Track your case
            </label>
            <input
              type="text"
              placeholder="Enter Case ID"
              value={caseIdInput}
              onChange={(e) => setCaseIdInput(e.target.value)}
              className="w-full bg-transparent text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none py-0.5"
            />
          </div>

          {/* Track Case Submit Button */}
          <button
            type="submit"
            className="px-5 sm:px-6 py-3 rounded-full bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shrink-0 shadow-md shadow-blue-500/20 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Track Case</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </section>

      {/* 4 Bento Service Cards (Pastel Tinted with Watermarks) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const WatermarkIcon = card.watermarkIcon;
          return (
            <div
              key={card.id}
              onClick={() => handleNavigate(card.id)}
              className={`p-6 rounded-3xl border ${card.cardBg} cursor-pointer flex flex-col justify-between group transition-all relative overflow-hidden shadow-xs hover:shadow-md transform hover:-translate-y-1`}
            >
              {/* Background Faint Watermark Icon */}
              <div className={`absolute -bottom-6 -right-6 pointer-events-none ${card.watermarkColor} transition-transform group-hover:scale-110`}>
                <WatermarkIcon className="w-36 h-36" />
              </div>

              {/* Card Header & Content */}
              <div className="space-y-4 relative z-10">
                {/* Squircle Icon */}
                <div className={`w-10 h-10 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {card.desc}
                  </p>
                </div>
              </div>

              {/* Bottom Circle Arrow Button */}
              <div className="mt-6 pt-2 relative z-10">
                <div className={`w-8 h-8 rounded-full bg-white border border-slate-200/60 shadow-xs flex items-center justify-center ${card.arrowColor} group-hover:translate-x-1 transition-transform`}>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Bottom Trust Banner (3 Columns) */}
      <section className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 gap-4 sm:gap-6">
          {/* Pillar 1: Privacy */}
          <div className="flex items-center gap-3.5 pt-2 md:pt-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-heading">
                Your reports are private
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                We protect your identity and data.
              </p>
            </div>
          </div>

          {/* Pillar 2: Real-time Status */}
          <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:pl-6">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-heading">
                Track status in real time
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Get updates at every step.
              </p>
            </div>
          </div>

          {/* Pillar 3: Safer Campus Together */}
          <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:pl-6">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-heading">
                A safer campus together
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Students, staff and administration.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
