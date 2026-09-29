import React from 'react';
import { Shield, Lock, PhoneCall, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 px-4 sm:px-8 text-slate-600 dark:text-slate-400">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-campus-600" />
              <span className="font-bold text-slate-900 dark:text-white text-base">CampusCare</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm italic">
              “A student should be able to report a problem safely, even when they are afraid to reveal their identity.”
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px] text-slate-600 dark:text-slate-300">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Identity Protection Active by Default</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Campus Helplines
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-red-500" />
                <span className="font-medium text-slate-800 dark:text-slate-200">Campus Security Emergency:</span>
                <span className="font-mono text-red-600 font-semibold">+1 (555) 911-CAMPUS</span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-campus-600" />
                <span className="font-medium text-slate-800 dark:text-slate-200">Student Welfare & Counseling:</span>
                <span className="font-mono text-campus-600">Ext 402 / confidential</span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-medium text-slate-800 dark:text-slate-200">Facilities & Power Dispatch:</span>
                <span className="font-mono text-slate-600">Ext 210</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Privacy Guarantees
            </h4>
            <p className="text-xs leading-relaxed text-slate-500">
              In anonymous mode, no names, phone numbers, roll numbers, or device fingerprints are recorded or shared with normal campus administration. Case access is strictly guarded by your salted private PIN.
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© {new Date().getFullYear()} CampusCare Platform. Privacy-First Campus Incident Triage & Response.</p>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Designed for campus safety & welfare</span>
            <Heart className="w-3 h-3 text-rose-500 inline fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
