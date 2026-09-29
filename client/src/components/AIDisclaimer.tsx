import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export const AIDisclaimer: React.FC<Props> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 text-slate-300 border border-slate-700 rounded-full text-xs font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-campus-400" />
        <span>Automated Triage • Verified by Campus Staff</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
      <ShieldCheck className="w-4 h-4 text-campus-400 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-white">Automated Incident Routing</span>
        <p className="mt-0.5 text-slate-400 leading-relaxed">
          Reports are automatically prioritized and reviewed by assigned campus committee officers.
        </p>
      </div>
    </div>
  );
};
