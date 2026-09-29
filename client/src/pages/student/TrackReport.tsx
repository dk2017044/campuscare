import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, Search, Send, Clock, MapPin, Eye, CheckCircle2, AlertTriangle, ArrowRight, MessageSquare, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { Case, CaseMessage } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CategoryBadge } from '../../components/CategoryBadge';

interface Props {
  initialCaseId?: string;
  initialPin?: string;
}

export const TrackReport: React.FC<Props> = ({ initialCaseId = '', initialPin = '' }) => {
  const [caseIdInput, setCaseIdInput] = useState(initialCaseId);
  const [pinInput, setPinInput] = useState(initialPin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active authenticated case
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Auto-login if props provided
  useEffect(() => {
    if (initialCaseId && initialPin) {
      handleLogin(initialCaseId, initialPin);
    }
  }, [initialCaseId, initialPin]);


  const handleLogin = async (idToUse?: string, pinToUse?: string) => {
    const cid = (idToUse || caseIdInput).trim().toUpperCase();
    const pin = (pinToUse || pinInput).trim();

    if (!cid || !pin) {
      setError('Both Case ID and Private PIN are required to access your case.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.verifyCasePin(cid, pin);
      setActiveCase(res.case);
      setMessages(res.messages || []);
    } catch (err: any) {
      setError(err.message || 'Invalid Case ID or PIN. Access denied.');
      setActiveCase(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || !newMessage.trim()) return;

    try {
      setSendingMsg(true);
      const res = await api.sendCaseMessage(activeCase.publicCaseId, {
        message: newMessage.trim(),
        senderType: 'student',
        senderName: 'Anonymous Reporter',
        pin: pinInput.trim()
      });

      if (res.success) {
        setMessages(prev => [...prev, res.message]);
        setNewMessage('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const refreshMessages = async () => {
    if (!activeCase) return;
    try {
      const res = await api.getCaseMessages(activeCase.publicCaseId, pinInput.trim());
      setMessages(res.messages || []);
    } catch (e) {
      console.error(e);
    }
  };
  // Active live auto-refresh polling every 3.5 seconds for instant two-way chat
  useEffect(() => {
    if (!activeCase) return;
    const interval = setInterval(() => {
      refreshMessages();
    }, 3500);
    return () => clearInterval(interval);
  }, [activeCase, pinInput]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Track Report Login Box */}
      {!activeCase ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 sm:p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-campus-50 dark:bg-campus-950 text-campus-600 dark:text-campus-400 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Track My Report</h1>
            <p className="text-xs text-slate-500">
              Enter your cryptographically assigned Case ID and private PIN to access your encrypted updates.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Case ID
              </label>
              <input
                type="text"
                value={caseIdInput}
                onChange={(e) => setCaseIdInput(e.target.value.toUpperCase())}
                placeholder="e.g. CC-A1B2C3D"
                className="w-full p-3 font-mono font-bold tracking-wider rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-campus-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Private PIN / Access Code
              </label>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter 6-digit Private PIN"
                className="w-full p-3 font-mono font-bold tracking-widest rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-campus-500 focus:outline-none"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => handleLogin()}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-campus-600 hover:bg-campus-500 text-white font-bold text-sm shadow-md shadow-campus-600/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Access Case Safely →'}
            </motion.button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Confidential Case Key</span>
            Your Case ID and PIN were shown when you submitted your report. If you filed via another device, retrieve your receipt to authenticate.
          </div>
        </motion.div>
      ) : (
        /* CASE DASHBOARD & ANONYMOUS CHAT */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-campus-50 dark:bg-campus-950 flex items-center justify-center text-campus-600 font-mono font-bold text-sm">
                CC
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-mono font-extrabold text-slate-900 dark:text-white">
                    {activeCase.publicCaseId}
                  </h1>
                  <CategoryBadge category={activeCase.category || activeCase.reportType} sublabel={activeCase.subcategory || activeCase.category} size="sm" />
                  <StatusBadge status={activeCase.status} />
                  <PriorityBadge priority={activeCase.priority} />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>Routing: <strong>{activeCase.assignedDepartmentName || 'Pending Triage'}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Identity Shield: ON</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveCase(null);
                  setCaseIdInput('');
                  setPinInput('');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Case Overview, Timeline, and Anonymous Messaging */}
            <div className="lg:col-span-2 space-y-6">
              {/* Report Details Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Original Report Description
                </h3>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                  "{activeCase.description}"
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-campus-600 shrink-0" />
                    <span>Location: {activeCase.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-campus-600 shrink-0" />
                    <span>Reported: {new Date(activeCase.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Evidence Attachments */}
                {activeCase.evidence && activeCase.evidence.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-600 block mb-2">Attached Evidence</span>
                    <div className="flex flex-wrap gap-2">
                      {activeCase.evidence.map((ev, i) => (
                        <div
                          key={ev.id || i}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <FileText className="w-4 h-4 text-campus-600" />
                          <span className="font-medium text-slate-800 dark:text-slate-200">{ev.fileName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ANONYMOUS TWO-WAY CHAT (Section 7) */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-campus-600" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Anonymous Follow-Up Channel
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={refreshMessages}
                    className="text-xs font-medium text-campus-600 hover:underline"
                  >
                    Refresh Messages
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Send updates, additional information, or ask questions. The staff sees your message linked to Case <strong>{activeCase.publicCaseId}</strong> without knowing your identity.
                </p>

                {/* Message Bubble List */}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {messages.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      No follow-up messages yet. You can send an update below.
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isStudent = m.senderType === 'student';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                            <span className="font-bold">{isStudent ? 'You (Anonymous)' : m.senderName}</span>
                            <span>•</span>
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div
                            className={`p-3.5 rounded-2xl text-xs max-w-sm sm:max-w-md leading-relaxed ${
                              isStudent
                                ? 'bg-campus-600 text-white rounded-tr-none'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-600'
                            }`}
                          >
                            {m.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Send Message Form */}
                <form onSubmit={handleSendMessage} className="pt-2 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Send an anonymous update to the assigned team..."
                    className="flex-1 p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-campus-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingMsg || !newMessage.trim()}
                    className="px-5 py-3 rounded-xl bg-campus-600 hover:bg-campus-500 text-white font-semibold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Case Lifecycle Timeline */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Case Lifecycle Timeline
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                  {activeCase.timeline && activeCase.timeline.map((event, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-campus-600 ring-4 ring-white dark:ring-slate-800" />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {event.title}
                        </span>
                        <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">
                          {event.description}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          {new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety notice reminder */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Privacy Protocol Applied</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  No staff member can query your IP, name, or account from this conversation. Continue checking back with your PIN for further resolution updates.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
