import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, Send, Clock, MapPin, MessageSquare, AlertCircle, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
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

  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCaseId && initialPin) {
      handleLogin(initialCaseId, initialPin);
    }
  }, [initialCaseId, initialPin]);

  const handleLogin = async (idToUse?: string, pinToUse?: string) => {
    const cid = (idToUse || caseIdInput).trim().toUpperCase();
    const pin = (pinToUse || pinInput).trim();

    if (!cid || !pin) {
      setError('Please enter both Case ID and 6-digit PIN.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.verifyCasePin(cid, pin);
      setActiveCase(res.case);
      setMessages(res.messages || []);
    } catch (err: any) {
      setError(err.message || 'Invalid Case ID or PIN.');
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
        setMsgError(null);
      }
    } catch (err: any) {
      setMsgError(err.message || 'Failed to send message');
      setTimeout(() => setMsgError(null), 4000);
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

  useEffect(() => {
    if (!activeCase) return;
    const interval = setInterval(() => {
      refreshMessages();
    }, 4000);
    return () => clearInterval(interval);
  }, [activeCase, pinInput]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 relative z-10">
      {/* Track Report Login Box */}
      {!activeCase ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-md p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] border border-blue-100 flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-heading">
              Track Your Case
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Enter the Case ID and confidential 6-digit PIN given when your report was logged.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Public Case ID
              </label>
              <input
                type="text"
                value={caseIdInput}
                onChange={(e) => setCaseIdInput(e.target.value.toUpperCase())}
                placeholder="Enter Case ID"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="w-full min-h-[44px] p-3.5 font-mono text-sm font-bold rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Private Access PIN
              </label>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="6-digit PIN"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                className="w-full min-h-[44px] p-3.5 font-mono text-sm font-bold rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 placeholder:text-slate-400 tracking-widest outline-none transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => handleLogin()}
              disabled={loading}
              className="w-full min-h-[44px] py-3.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authenticating Case...' : 'Access Real-Time Status →'}
            </button>
          </div>
        </motion.div>
      ) : (
        /* CASE DASHBOARD & ANONYMOUS CHAT */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0066FF] border border-blue-100 flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                CC
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-mono font-bold text-slate-900">
                    {activeCase.publicCaseId}
                  </h1>
                  <CategoryBadge category={activeCase.category || activeCase.reportType} sublabel={activeCase.subcategory || activeCase.category} size="sm" />
                  <StatusBadge status={activeCase.status} />
                  <PriorityBadge priority={activeCase.priority} />
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  Assigned Team: <strong className="text-slate-800">{activeCase.assignedDepartmentName || 'Assigned Officer'}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveCase(null);
                  setCaseIdInput('');
                  setPinInput('');
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer shadow-xs"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Details & Anonymous Chat */}
            <div className="lg:col-span-2 space-y-6">
              {/* Report Details Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Incident Description
                </span>
                <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 border border-slate-200/70 p-4 rounded-2xl italic font-medium">
                  "{activeCase.description}"
                </p>

                <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                    <span>{activeCase.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                    <span>{new Date(activeCase.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {activeCase.evidence && activeCase.evidence.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 block mb-2">Attached Evidence</span>
                    <div className="flex flex-wrap gap-2">
                      {activeCase.evidence.map((ev, i) => (
                        <div
                          key={ev.id || i}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#0066FF]" />
                          <span>{ev.fileName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ANONYMOUS TWO-WAY CHAT */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#0066FF]" />
                    <h3 className="font-bold text-sm text-slate-900 font-heading">
                      Confidential Dialogue Channel
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={refreshMessages}
                    className="text-xs font-semibold text-[#0066FF] hover:underline cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>

                {/* Message Bubble List */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {messages.length === 0 ? (
                    <div className="p-5 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200/60 rounded-2xl">
                      No follow-up messages yet. You can post anonymous questions or additional context below.
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isStudent = m.senderType === 'student';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}
                        >
                          <div className="text-[10px] text-slate-400 mb-1 px-1 font-semibold">
                            <span>{isStudent ? 'You (Anonymous Reporter)' : m.senderName}</span>
                          </div>
                          <div
                            className={`p-3.5 rounded-2xl text-xs max-w-xs sm:max-w-md leading-relaxed ${
                              isStudent
                                ? 'bg-[#0066FF] text-white font-medium rounded-tr-none shadow-xs'
                                : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
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
                    placeholder="Type an anonymous follow-up note..."
                    className="flex-1 p-3 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs placeholder:text-slate-400 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={sendingMsg || !newMessage.trim()}
                    className="px-5 py-3 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
                {msgError && (
                  <p className="text-[11px] text-rose-500 font-medium px-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{msgError}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Case Lifecycle Timeline */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-5 shadow-sm h-fit">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Case Activity Timeline
              </h3>

              <div className="relative pl-5 space-y-6 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {activeCase.timeline && activeCase.timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-[#0066FF] ring-4 ring-blue-50" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">
                        {event.title}
                      </span>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">
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
          </div>
        </motion.div>
      )}
    </div>
  );
};
