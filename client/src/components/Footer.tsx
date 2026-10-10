import React from 'react';
import { Shield, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-md py-6 px-4 sm:px-8 text-slate-500 text-xs relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Privacy Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <Shield className="w-4 h-4 text-[#0066FF]" />
            <span className="text-[#0F172A] font-heading font-bold">Campus</span>
            <span className="text-[#0066FF] font-heading font-bold">Care</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Confidential &amp; Encrypted Protection</span>
          </div>
        </div>

        {/* Helplines & Copyright */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-medium">
          <span>Security: <strong className="text-slate-800 font-mono font-semibold">Ext 911</strong></span>
          <span>Welfare: <strong className="text-slate-800 font-mono font-semibold">Ext 402</strong></span>
          <span>&copy; {new Date().getFullYear()} CampusCare. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
