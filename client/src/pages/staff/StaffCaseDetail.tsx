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
  const [selectedDeptId, setSelectedDeptId] = useState(caseItem.assignedDepartmentId || (departments.length > 0 ? departments[0].id : ''));
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    loadCaseData();
    const interval = setInterval(() => {
      loadCaseData();
    }, 3500);
    return () => clearInterval(interval);
  }, [caseItem.publicCaseId]);

  useEffect(() => {
    if (currentCase.assignedDepartmentId) {
      setSelectedDeptId(currentCase.assignedDepartmentId);
    } else if (departments.length > 0 && !selectedDeptId) {
      setSelectedDeptId(departments[0].id);
    }
  }, [currentCase.assignedDepartmentId, departments]);

  const loadCaseData = async () => {
    try {
      const res = await api.getCaseDetails(caseItem.publicCaseId);
      if (res.case) {
        setCurrentCase(res.case);
        if (res.case.assignedDepartmentId) {
          setSelectedDeptId(res.case.assignedDepartmentId);
        }
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl max-w-4xl w-full my-auto border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold text-[#0066FF] bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
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
              className="px-3 py-1.5 rounded-xl bg-[#FFF1F0] hover:bg-[#FFE4DE] border border-[#FED4D1] text-[#D92D20] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{currentCase.status === 'ESCALATED' ? 'Escalated' : 'Escalate'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Details, AI, Chat */}
            <div className="lg:col-span-2 space-y-4">
              {/* Description Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>{currentCase.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{currentCase.isAnonymous ? 'Protected Identity' : currentCase.reporterName}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed italic bg-white p-3.5 rounded-xl border border-slate-200/70 font-medium">
                  "{currentCase.description}"
                </p>

                {currentCase.evidence && currentCase.evidence.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {currentCase.evidence.map((ev, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-medium">
                        <FileText className="w-3.5 h-3.5 text-[#0066FF]" />
                        <span className="truncate max-w-[140px]">{ev.fileName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Triage Card if present */}
              {currentCase.aiAnalysis && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5 text-[#0066FF]">
                      <Sparkles className="w-4 h-4 text-[#0066FF]" />
                      AI Routing: {currentCase.aiAnalysis.suggested_department_name}
                    </span>
                    <span className="font-mono text-slate-700 font-bold">
                      {Math.round(currentCase.aiAnalysis.confidence * 100)}% Confidence
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 italic">"{currentCase.aiAnalysis.reasoning}"</p>
                </div>
              )}

              {/* Two-Way Chat */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#0066FF]" />
                    Case Dialogue Channel ({messages.length})
                  </span>
                  <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                        !isInternalNote ? 'bg-[#0066FF] text-white' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Reply to Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                        isInternalNote ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Internal Note
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {messages.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200/60 font-medium">
                      No case communications recorded yet.
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl text-xs space-y-0.5 ${
                          !m.visibleToStudent
                            ? 'bg-amber-50 border border-amber-200 text-amber-900'
                            : m.senderType === 'student'
                            ? 'bg-blue-50 border border-blue-200 text-blue-900'
                            : 'bg-white border border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-bold text-slate-800">
                            {m.senderName} {!m.visibleToStudent && '(Confidential Staff Note)'}
                          </span>
                          <span className="font-mono text-[10px]">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="leading-snug font-medium">{m.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span className="flex items-center gap-1.5 truncate">
                    <span>Officer on duty:</span>
                    <strong className="text-slate-800 font-semibold">{actorName}</strong>
                  </span>
                  {isInternalNote && (
                    <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px] shrink-0">
                      🔒 Internal note
                    </span>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="pt-1 flex gap-2">
                  <input
                    type="text"
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder={isInternalNote ? 'Confidential staff note (invisible to student)...' : `Reply to student as ${actorName}...`}
                    className="flex-1 p-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#0066FF] text-slate-900 text-xs placeholder:text-slate-400 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newResponse.trim()}
                    className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer disabled:opacity-40 shadow-xs ${
                      isInternalNote
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-[#0066FF] hover:bg-[#0052CC] text-white'
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
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-600 block">
                  Update Resolution Status
                </span>
                <div className="grid grid-cols-1 gap-2">
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
                      className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        currentCase.status === btn.status
                          ? 'bg-[#0066FF] text-white font-bold shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Reassign Dept */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 block">Department Routing</span>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 truncate max-w-[150px]" title={currentCase.assignedDepartmentName || 'Pending'}>
                      {currentCase.assignedDepartmentName || 'Pending Routing'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      aria-label="Route Department"
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 text-xs py-2 px-2.5 rounded-xl text-slate-800 font-medium outline-none focus:border-[#0066FF]"
                    >
                      {departments.length === 0 ? (
                        <option value="">No departments available</option>
                      ) : (
                        departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} {d.id === currentCase.assignedDepartmentId ? '✓ (Current)' : ''}
                          </option>
                        ))
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={handleDepartmentReassign}
                      disabled={!selectedDeptId || selectedDeptId === currentCase.assignedDepartmentId}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors ${
                        !selectedDeptId || selectedDeptId === currentCase.assignedDepartmentId
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                      }`}
                    >
                      {selectedDeptId === currentCase.assignedDepartmentId ? 'Assigned' : 'Route'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Forward case responsibility to another campus unit or grievance cell.
                  </p>
                </div>
              </div>

              {/* Action Timeline */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-600 block">
                  Audit History
                </span>
                <div className="relative pl-4 space-y-3 before:absolute before:left-1 before:top-1 before:bottom-1 before:w-0.5 before:bg-slate-200 text-xs">
                  {currentCase.timeline && currentCase.timeline.map((ev, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-[#0066FF]" />
                      <strong className="text-slate-900 block text-[11px]">{ev.title}</strong>
                      <p className="text-[10px] text-slate-600 leading-snug">{ev.description}</p>
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
