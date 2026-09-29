import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Wrench, 
  Search, 
  ClipboardList, 
  AlertTriangle, 
  ArrowRight, 
  PhoneCall, 
  CheckCircle2, 
  FileText, 
  HelpCircle,
  Clock,
  ShieldCheck
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

  return (
    <div className="space-y-12 py-8 max-w-5xl mx-auto">
      {/* Professional Institutional Hero */}
      <section className="text-center space-y-4 pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-campus-400" />
          <span>Official University Redressal & Support System</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Safe, Confidential, and Accountable <br className="hidden sm:inline" />
          Campus Support.
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Submit confidential grievances, request campus infrastructure maintenance, locate lost property, or access immediate emergency response.
        </p>

        {/* Hero Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('report_safely')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-campus-600 hover:bg-campus-500 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Submit a Report</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('track_report')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
            <span>Track Submission</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('emergency')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-medium text-xs border border-rose-800/60 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Emergency Assistance</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 border-t border-slate-800/60 max-w-xl mx-auto">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            100% Confidential
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            No Mandatory Login
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Direct Committee Routing
          </span>
        </div>
      </section>

      {/* Core Institutional Services Grid (4 Clean, Uniform Cards) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Available Campus Services
          </h2>
          <span className="text-xs text-slate-500">Select a category to begin</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Service 1: Student Grievance & Welfare */}
          <div
            onClick={() => onNavigate('report_safely')}
            className="p-6 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-campus-500/10 text-campus-400 flex items-center justify-center border border-campus-500/20">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white group-hover:text-campus-400 transition-colors">
                  Student Grievances & Welfare
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Confidential reporting for harassment, ragging, counseling, and student welfare concerns. Submissions are reviewed exclusively by appointed committee officers.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-campus-400 font-medium">
              <span>File Confidential Report</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Service 2: Campus Infrastructure & Maintenance */}
          <div
            onClick={() => onNavigate('maintenance')}
            className="p-6 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors">
                  Facilities & Infrastructure Repairs
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Report defective electrical fixtures, plumbing leakages, laboratory hardware faults, or classroom furniture damage directly to Campus Maintenance.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-medium">
              <span>Request Maintenance</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Service 3: Lost & Found Property */}
          <div
            onClick={() => onNavigate('lost_found')}
            className="p-6 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white group-hover:text-teal-400 transition-colors">
                  Lost & Found Repository
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Search university records of found belongings across campus hostels, academic blocks, and libraries, or report misplaced personal items.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-teal-400 font-medium">
              <span>Access Directory</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Service 4: Emergency Assistance */}
          <div
            onClick={() => onNavigate('emergency')}
            className="p-6 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white group-hover:text-rose-400 transition-colors">
                  Emergency Response & Dispatch
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Immediate security notification for active hazards, physical intimidation, or urgent medical incidents. Dispatches alerts directly to Campus Security.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-rose-400 font-medium">
              <span>View Emergency Options</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Case Status Lookup Box */}
      <section className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Track an Existing Case</h3>
            <p className="text-xs text-slate-400">Enter your Public Case ID to review resolution progress and official notes.</p>
          </div>
        </div>

        <form onSubmit={handleTrackSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Case ID (e.g. CC-RSFNA3B)"
            value={caseIdInput}
            onChange={(e) => setCaseIdInput(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-campus-500 font-mono w-full sm:w-52"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-campus-600 hover:bg-campus-500 text-white text-xs font-semibold transition-colors shrink-0"
          >
            Track Status
          </button>
        </form>
      </section>

      {/* Official Campus Contact Directory */}
      <section className="p-5 rounded-xl bg-slate-900/30 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
          <span>Official Campus Helplines & Directory</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-400 text-[11px]">Campus Security Desk</div>
            <div className="text-white font-semibold mt-0.5 font-mono">Ext. 911 / +91-XXX</div>
            <div className="text-[10px] text-slate-500 mt-1">24/7 Rapid Response</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-400 text-[11px]">Student Welfare & Counseling</div>
            <div className="text-white font-semibold mt-0.5 font-mono">Ext. 402</div>
            <div className="text-[10px] text-slate-500 mt-1">Confidential Consultations</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-400 text-[11px]">Campus Health Center</div>
            <div className="text-white font-semibold mt-0.5 font-mono">Ext. 108</div>
            <div className="text-[10px] text-slate-500 mt-1">Medical & First Aid</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-400 text-[11px]">Estate & Maintenance Office</div>
            <div className="text-white font-semibold mt-0.5 font-mono">Ext. 210</div>
            <div className="text-[10px] text-slate-500 mt-1">Civil & Electrical Dispatch</div>
          </div>
        </div>
      </section>
    </div>
  );
};
