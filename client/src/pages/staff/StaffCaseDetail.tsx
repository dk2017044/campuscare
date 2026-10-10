import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, ShieldCheck, MapPin, Clock, Sparkles, AlertOctagon, FileText, MessageSquare, Send } from 'lucide-react';
import { Case, Department, CaseMessage } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge } from '../../components/CategoryBadge';

interface Props {
  caseItem: Case;
  departments: Department[];
  onClose: () => void;
  onCaseUpdated: (updated: Case) => void;
  actorName?: string;
}

export const StaffCaseDetail: React.FC<Props> = ({
  caseItem,
  departments,
  onClose,
  onCaseUpdated,
  actorName = 'Staff Officer'
}) => {
  const [currentCase, setCurrentCase] = useState<Case>(caseItem);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [newResponse, setNewResponse] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState(caseItem.assignedDepartmentId || '');
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    loadCaseData();
    const interval = setInterval(() => {
      loadCaseData();
    }, 3500);
    return () => clearInterval(interval);
  }, [caseItem.publicCaseId]);

  const loadCaseData = async () => {
    try {
      const res = await api.getCaseDetails(caseItem.publicCaseId);
      setCurrentCase(res.case);
      setMessages(res.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      const res = await api.updateCaseStatus(currentCase.publicCaseId, newStatus, actorName, `Status updated to ${newStatus}`);
      if (res.case) {
        setCurrentCase(res.case);
        onCaseUpdated(res.case);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDepartmentReassign = async () => {
    if (!selectedDeptId || selectedDeptId === currentCase.assignedDepartmentId) return;
    try {
      const res = await api.assignCase(currentCase.publicCaseId, selectedDeptId, undefined, undefined, actorName);
      if (res.case) {
        setCurrentCase(res.case);
        onCaseUpdated(res.case);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to reassign department');
    }
  };

  const handleEscalate = async () => {
    const reason = prompt('Specify escalation reason:');
    if (!reason) return;

    try {
      setEscalating(true);
      const res = await api.escalateCase(currentCase.publicCaseId, reason, actorName);
      if (res.case) {
        setCurrentCase(res.case);
        onCaseUpdated(res.case);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to escalate');
    } finally {
      setEscalating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResponse.trim()) return;

    try {
      setSending(true);
      const res = await api.sendCaseMessage(currentCase.publicCaseId, {
        message: newResponse.trim(),
        senderType: isInternalNote ? 'staff_internal' : 'staff',
        senderName: actorName,
        visibleToStudent: !isInternalNote
      });

      if (res.success) {
        setMessages(prev => [...prev, res.message]);
        setNewResponse('');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="glass-panel bg-slate-900/95 rounded-3xl max-w-4xl w-full my-auto border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold text-sky-400">
              {currentCase.publicCaseId}
            </span>
            <CategoryBadge category={currentCase.category || currentCase.reportType} size="sm" />
            <PriorityBadge priority={currentCase.priority} size="sm" />
            <StatusBadge status={currentCase.status} size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEscalate}
              disabled={escalating || currentCase.status === 'ESCALATED'}
              className="px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{currentCase.status === 'ESCALATED' ? 'Escalated' : 'Escalate'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl glass-pill text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: Details, AI, Chat */}
            <div className="lg:col-span-2 space-y-4">
              {/* Description Card */}
              <div className="glass-panel rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    <span>{currentCase.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentCase.isAnonymous ? 'Protected Identity' : currentCase.reporterName}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed italic glass-pill p-3 rounded-xl">
                  "{currentCase.description}"
                </p>

                {currentCase.evidence && currentCase.evidence.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {currentCase.evidence.map((ev, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg glass-pill text-[11px] text-slate-300">
                        <FileText className="w-3 h-3 text-sky-400" />
                        <span className="truncate max-w-[140px]">{ev.fileName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Triage Card if present */}
              {currentCase.aiAnalysis && (
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      AI Routing: {currentCase.aiAnalysis.suggested_department_name}
                    </span>
                    <span className="font-mono text-sky-300">
                      {Math.round(currentCase.aiAnalysis.confidence * 100)}% Confidence
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 italic">"{currentCase.aiAnalysis.reasoning}"</p>
                </div>
              )}

              {/* Two-Way Chat */}
              <div className="glass-panel rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    Anonymous Chat Channel ({messages.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] cursor-pointer ${
                        !isInternalNote ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      Reply Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] cursor-pointer ${
                        isInternalNote ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      Internal Note
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {messages.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 glass-pill rounded-xl">
                      No communications yet.
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-xl text-xs space-y-0.5 ${
                          !m.visibleToStudent
                            ? 'bg-amber-500/10 border border-amber-500/25 text-amber-200'
                            : m.senderType === 'student'
                            ? 'bg-sky-500/10 border border-sky-500/25 text-sky-200'
                            : 'glass-pill text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-300">
                            {m.senderName} {!m.visibleToStudent && '(Internal)'}
                          </span>
                          <span className="font-mono text-[9px]">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="leading-snug">{m.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="pt-1 flex gap-2">
                  <input
                    type="text"
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder={isInternalNote ? 'Confidential staff note...' : 'Reply to student...'}
                    className="flex-1 p-2 rounded-xl glass-input text-white text-xs placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newResponse.trim()}
                    className={`px-3 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer disabled:opacity-40 ${
                      isInternalNote
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Controls & Audit */}
            <div className="space-y-4">
              {/* Status Actions */}
              <div className="glass-panel rounded-2xl p-4 space-y-2.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
                  Change Status
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { status: 'UNDER_REVIEW', label: 'Under Review' },
                    { status: 'ACTION_TAKEN', label: 'Action Taken' },
                    { status: 'RESOLVED', label: 'Mark Resolved' }
                  ].map((btn) => (
                    <button
                      key={btn.status}
                      type="button"
                      onClick={() => handleStatusChange(btn.status)}
                      disabled={updatingStatus || currentCase.status === btn.status}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        currentCase.status === btn.status
                          ? 'bg-sky-500 text-slate-950 font-bold shadow-xs'
                          : 'glass-pill text-slate-300 hover:text-white hover:border-white/15'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Reassign Dept */}
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-400 block">Department Routing</span>
                  <div className="flex gap-1.5">
                    <select
                      aria-label="Route Department"
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="flex-1 glass-input text-xs py-1.5 px-2 rounded-xl text-slate-200"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleDepartmentReassign}
                      className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium cursor-pointer"
                    >
                      Route
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Timeline */}
              <div className="glass-panel rounded-2xl p-4 space-y-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
                  Audit Timeline
                </span>
                <div className="relative pl-4 space-y-3 before:absolute before:left-1 before:top-1 before:bottom-1 before:w-0.5 before:bg-white/10 text-xs">
                  {currentCase.timeline && currentCase.timeline.map((ev, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-sky-400" />
                      <strong className="text-white block text-[11px]">{ev.title}</strong>
                      <p className="text-[10px] text-slate-400 leading-snug">{ev.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
