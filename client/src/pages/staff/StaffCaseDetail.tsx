import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, MapPin, Clock, AlertTriangle, Send, Sparkles, UserCheck, CheckCircle2, AlertOctagon, FileText, ArrowUpRight, Lock, Eye, MessageSquare } from 'lucide-react';
import { Case, Department, CaseMessage } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge, getCategoryMeta } from '../../components/CategoryBadge';
import { AIDisclaimer } from '../../components/AIDisclaimer';

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
      const res = await api.updateCaseStatus(currentCase.publicCaseId, newStatus, actorName, `Status transitioned to ${newStatus}`);
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
    const reason = prompt('Please specify reason for escalating this case to Leadership / Security Command:');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 15 }}
        transition={{ type: 'spring', damping: 26, stiffness: 360 }}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full my-auto border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-campus-600 text-white font-mono font-bold flex items-center justify-center text-sm shadow-xs">
              CC
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-mono font-extrabold text-slate-900 dark:text-white">
                  {currentCase.publicCaseId}
                </h2>
                <CategoryBadge category={currentCase.category || currentCase.reportType} sublabel={currentCase.subcategory || currentCase.category} size="sm" />
                <StatusBadge status={currentCase.status} />
                <PriorityBadge priority={currentCase.priority} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted on {new Date(currentCase.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEscalate}
              disabled={escalating || currentCase.status === 'ESCALATED'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold text-xs transition-colors disabled:opacity-50"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{currentCase.status === 'ESCALATED' ? 'Escalated' : 'Escalate Case'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Identity Shielding Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Reporter Identity: {currentCase.isAnonymous ? 'Protected Anonymous Reporter' : currentCase.reporterName || 'Identified Student'}
              </span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">
              {currentCase.isAnonymous ? 'Zero PII Disclosed to Staff' : currentCase.reporterContact || 'Contact on File'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Report, AI Analysis, Evidence */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Student's Incident Report
                </span>
                <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed italic bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  "{currentCase.description}"
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-campus-600 shrink-0" />
                    <span>Location: {currentCase.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-campus-600 shrink-0" />
                    <span>Time: {currentCase.incidentDate} - {currentCase.incidentTime}</span>
                  </div>
                </div>
              </div>

              {/* AI Triage Analysis (Section 9 & 13) */}
              <div className="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                      AI Assistive Triage Engine
                    </span>
                  </div>
                  {currentCase.aiAnalysis && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
                      Confidence: {Math.round(currentCase.aiAnalysis.confidence * 100)}%
                    </span>
                  )}
                </div>

                {currentCase.aiAnalysis ? (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-purple-100 dark:border-purple-900">
                        <span className="text-[10px] text-slate-500 block">Category Suggestion</span>
                        <strong className="text-slate-900 dark:text-white">{currentCase.aiAnalysis.subcategory_label || currentCase.aiAnalysis.subcategory}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-purple-100 dark:border-purple-900">
                        <span className="text-[10px] text-slate-500 block">Priority Suggestion</span>
                        <strong className="text-red-700 font-bold">{currentCase.aiAnalysis.priority_suggestion}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-purple-100 dark:border-purple-900">
                        <span className="text-[10px] text-slate-500 block">Suggested Department</span>
                        <strong className="text-slate-900 dark:text-white">{currentCase.aiAnalysis.suggested_department_name}</strong>
                      </div>
                    </div>

                    <p className="text-purple-900 dark:text-purple-300 italic bg-white/60 dark:bg-slate-800/60 p-2.5 rounded-lg border border-purple-100">
                      "{currentCase.aiAnalysis.reasoning}"
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No automated AI analysis attached.</p>
                )}

                <AIDisclaimer />
              </div>

              {/* Secure Evidence Preview */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Secure Evidence Attachments ({currentCase.evidence ? currentCase.evidence.length : 0})
                </span>

                {currentCase.evidence && currentCase.evidence.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentCase.evidence.map((ev, i) => (
                      <div
                        key={ev.id || i}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                            {ev.fileName}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-medium">✓ Sanitized</span>
                        </div>

                        {/* Image Preview if image */}
                        {ev.sanitizedPreviewPath && (
                          <div className="w-full h-36 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden border border-slate-200">
                            <img
                              src={ev.sanitizedPreviewPath}
                              alt="Evidence Preview"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as any).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No evidence files attached with this report.</p>
                )}
              </div>

              {/* Two-Way Anonymous Communication */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-campus-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Two-Way Communication & Case Notes
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Total: {messages.length} messages</span>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl text-xs space-y-1 ${
                        !m.visibleToStudent
                          ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-900'
                          : m.senderType === 'student'
                          ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-blue-900'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold">
                        <span>{m.senderName}</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="leading-relaxed">{m.message}</p>
                      {!m.visibleToStudent && (
                        <span className="text-[10px] text-amber-700 font-bold block pt-1">
                          🔒 Internal Confidential Note (Hidden from Student)
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Send Response or Internal Note */}
                <form onSubmit={handleSendMessage} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-4 text-xs">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="noteType"
                        checked={!isInternalNote}
                        onChange={() => setIsInternalNote(false)}
                        className="text-campus-600 focus:ring-campus-500"
                      />
                      <span className="font-semibold text-slate-700">Send Response to Student</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="noteType"
                        checked={isInternalNote}
                        onChange={() => setIsInternalNote(true)}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-semibold text-amber-800">Add Internal Staff Note (Confidential)</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      placeholder={
                        isInternalNote
                          ? 'Add internal staff comment, investigative note...'
                          : 'Send safe acknowledgment to student tracking channel...'
                      }
                      className="flex-1 p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700"
                    />
                    <button
                      type="submit"
                      disabled={sending || !newResponse.trim()}
                      className={`px-4 py-2.5 rounded-xl text-white font-semibold text-xs shadow-xs transition-colors ${
                        isInternalNote
                          ? 'bg-amber-600 hover:bg-amber-500'
                          : 'bg-campus-600 hover:bg-campus-500'
                      }`}
                    >
                      {sending ? 'Sending...' : isInternalNote ? 'Save Note' : 'Reply'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: Case Controls & Timeline */}
            <div className="space-y-6">
              {/* Lifecycle Actions */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Update Case Status
                </span>

                <div className="space-y-2">
                  {[
                    { status: 'UNDER_REVIEW', label: 'Mark Under Review' },
                    { status: 'ACTION_TAKEN', label: 'Mark Action Taken' },
                    { status: 'RESOLVED', label: 'Mark Case Resolved' }
                  ].map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      onClick={() => handleStatusChange(action.status)}
                      disabled={updatingStatus || currentCase.status === action.status}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-left transition-all ${
                        currentCase.status === action.status
                          ? 'bg-campus-50 text-campus-700 border border-campus-300'
                          : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>

                {/* Department Assignment */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-600 block mb-1.5">
                    Assign / Route Department
                  </span>
                  <div className="flex gap-2">
                    <select
                      aria-label="Assign / Route Department"
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="flex-1 p-2 text-xs rounded-xl border border-slate-300 bg-white"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleDepartmentReassign}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>

              {/* Chronological Timeline */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Action Audit Trail
                </span>

                <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {currentCase.timeline && currentCase.timeline.map((ev, i) => (
                    <div key={i} className="relative text-xs">
                      <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-campus-600" />
                      <strong className="text-slate-800 dark:text-slate-200 block">{ev.title}</strong>
                      <p className="text-[11px] text-slate-500 leading-snug">{ev.description}</p>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        {new Date(ev.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
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
