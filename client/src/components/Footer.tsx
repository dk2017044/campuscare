import React from 'react';
import { Shield, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-white/5 bg-[#090d16]/70 backdrop-blur-xl py-6 px-4 sm:px-8 text-slate-400 text-xs relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Privacy Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-white text-sm">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>CampusCare</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-300">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Confidential &amp; Encrypted</span>
          </div>
        </div>

        {/* Helplines & Copyright (WCAG AA Compliant Contrast Ratio > 7:1) */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
          <span>Security: <strong className="text-white font-mono font-medium">Ext 911</strong></span>
          <span>Welfare: <strong className="text-white font-mono font-medium">Ext 402</strong></span>
          <span>&copy; {new Date().getFullYear()} CampusCare</span>
        </div>
      </div>
    </footer>
  );
};
