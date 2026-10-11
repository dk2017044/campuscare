import React from 'react';
import { Shield, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-md py-2.5 sm:py-3.5 px-3 sm:px-6 text-slate-500 text-[11px] relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-center sm:text-left">
        {/* Brand & Privacy Pill */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1 font-bold text-xs sm:text-sm">
            <Shield className="w-3.5 h-3.5 text-[#0066FF]" />
            <span className="text-[#0F172A] font-heading font-bold">Campus</span>
            <span className="text-[#0066FF] font-heading font-bold">Care</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 font-medium">
            <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Confidential &amp; Encrypted</span>
          </div>
        </div>

        {/* Helplines & Copyright */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] text-slate-500 font-medium">
          <span>Security: <strong className="text-slate-800 font-mono font-semibold">Ext 911</strong></span>
          <span>Welfare: <strong className="text-slate-800 font-mono font-semibold">Ext 402</strong></span>
          <span>&copy; {new Date().getFullYear()} CampusCare. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
