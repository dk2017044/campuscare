import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, Send, Clock, MapPin, MessageSquare, AlertCircle, FileText } from 'lucide-react';
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

  useEffect(() => {
    if (!activeCase) return;
    const interval = setInterval(() => {
      refreshMessages();
    }, 4000);
    return () => clearInterval(interval);
  }, [activeCase, pinInput]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 relative z-10">
      {/* Track Report Login Box */}
      {!activeCase ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm mx-auto glass-panel rounded-3xl p-6 sm:p-7 space-y-5"
        >
          <div className="text-center space-y-1.5">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/20 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-base font-bold text-white tracking-tight">Track Your Case</h1>
            <p className="text-xs text-slate-400">
              Enter the Case ID and 6-digit PIN given when you submitted.
            </p>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                Case ID
              </label>
              <input
                type="text"
                value={caseIdInput}
                onChange={(e) => setCaseIdInput(e.target.value.toUpperCase())}
                placeholder="e.g. CC-7X4P9K2"
                className="w-full p-2.5 font-mono text-xs rounded-xl glass-input text-white uppercase placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                Private PIN
              </label>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="6-digit PIN"
                className="w-full p-2.5 font-mono text-xs rounded-xl glass-input text-white placeholder:text-slate-500 tracking-widest"
              />
            </div>

            <button
              type="button"
              onClick={() => handleLogin()}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_15px_rgba(14,141,231,0.25)] cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Access Case Details →'}
            </button>
          </div>
        </motion.div>
      ) : (
        /* CASE DASHBOARD & ANONYMOUS CHAT */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass-panel">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-mono font-bold text-xs">
                CC
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base font-mono font-bold text-white">
                    {activeCase.publicCaseId}
                  </h1>
                  <CategoryBadge category={activeCase.category || activeCase.reportType} sublabel={activeCase.subcategory || activeCase.category} size="sm" />
                  <StatusBadge status={activeCase.status} />
                  <PriorityBadge priority={activeCase.priority} />
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Routing: <strong className="text-slate-200">{activeCase.assignedDepartmentName || 'Assigned'}</strong>
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
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg glass-pill cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Details & Anonymous Chat */}
            <div className="lg:col-span-2 space-y-5">
              {/* Report Details Card */}
              <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Incident Description
                </span>
                <p className="text-xs text-slate-200 leading-relaxed glass-pill p-3 rounded-xl italic">
                  "{activeCase.description}"
                </p>

                <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{activeCase.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{new Date(activeCase.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {activeCase.evidence && activeCase.evidence.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[11px] text-slate-400 block mb-1.5">Attached Evidence</span>
                    <div className="flex flex-wrap gap-2">
                      {activeCase.evidence.map((ev, i) => (
                        <div
                          key={ev.id || i}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg glass-pill text-xs text-slate-300"
                        >
                          <FileText className="w-3 h-3 text-sky-400" />
                          <span>{ev.fileName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ANONYMOUS TWO-WAY CHAT */}
              <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-sky-400" />
                    <h3 className="font-semibold text-xs text-white">
                      Anonymous Committee Chat
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={refreshMessages}
                    className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>

                {/* Message Bubble List */}
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {messages.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 glass-pill rounded-xl">
                      No messages yet. Send an update below.
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isStudent = m.senderType === 'student';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}
                        >
                          <div className="text-[10px] text-slate-400 mb-0.5 px-1">
                            <span>{isStudent ? 'You (Anonymous)' : m.senderName}</span>
                          </div>
                          <div
                            className={`p-2.5 rounded-2xl text-xs max-w-xs sm:max-w-md leading-relaxed ${
                              isStudent
                                ? 'bg-sky-500 text-slate-950 font-medium rounded-tr-none shadow-xs'
                                : 'glass-pill text-slate-200 rounded-tl-none border border-white/10'
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
                <form onSubmit={handleSendMessage} className="pt-1 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type an anonymous follow-up..."
                    className="flex-1 p-2.5 rounded-xl glass-input text-white text-xs placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={sendingMsg || !newMessage.trim()}
                    className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Case Lifecycle Timeline */}
            <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Case Timeline
              </h3>

              <div className="relative pl-5 space-y-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                {activeCase.timeline && activeCase.timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-sky-400 ring-2 ring-slate-900" />
                    <div className="text-xs">
                      <span className="font-semibold text-white block">
                        {event.title}
                      </span>
                      <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">
                        {event.description}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono mt-1 block">
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
