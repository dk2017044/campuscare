import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, PhoneCall, ShieldAlert, MapPin, Upload, ArrowRight, CheckCircle, Copy, Check } from 'lucide-react';
import { api } from '../../services/api';
import { VoiceDictaphone } from '../../components/VoiceDictaphone';

interface Props {
  onNavigate: (tab: string) => void;
  onCaseCreated?: (publicCaseId: string, rawPin: string) => void;
}

export const EmergencyReport: React.FC<Props> = ({ onNavigate, onCaseCreated }) => {
  const [incidentType, setIncidentType] = useState('Immediate Danger / Threat');
  const [location, setLocation] = useState('Campus Premises');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createdCase, setCreatedCase] = useState<{
    publicCaseId: string;
    rawPin: string;
  } | null>(null);

  const [copiedId, setCopiedId] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide immediate details regarding the emergency.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await api.createCase({
        reportType: 'safety',
        category: 'Immediate Danger',
        subcategory: incidentType,
        description: `🚨 IMMEDIATE DANGER ALERT: ${description}`,
        location,
        incidentDate: 'Right Now',
        incidentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAnonymous: true,
        isEmergency: true
      });

      if (res.success) {
        setCreatedCase({
          publicCaseId: res.publicCaseId,
          rawPin: res.rawPin
        });
        if (onCaseCreated) {
          onCaseCreated(res.publicCaseId, res.rawPin);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Emergency submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'id' | 'pin') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* High Visibility Disclaimer Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-6 sm:p-8 text-white shadow-xl shadow-red-950/20 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
            <AlertTriangle className="w-8 h-8 text-white animate-bounce" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-red-200">Emergency Protocol</span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">🚨 IMMEDIATE DANGER</h1>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/25 border border-white/20 text-xs sm:text-sm leading-relaxed space-y-2">
          <p className="font-semibold text-white">
            “This portal may not provide instant physical emergency response. If you are in immediate personal danger, contact campus security or external emergency services directly:”
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="tel:911"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-red-700 font-bold text-xs shadow-md hover:bg-red-50 transition-colors"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Campus Emergency (Ext 911)</span>
            </a>
            <span className="text-xs text-red-100 font-mono">Local Police: 100 / 911</span>
          </div>
        </div>
      </div>

      {/* Emergency Fast Dispatch Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-md p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Rapid Security Incident Report
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submissions here are flagged <span className="font-bold text-red-600 font-mono">Priority: CRITICAL</span> and routed instantly to the Campus Security Command Center.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Incident Nature
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Physical Threat / Violence',
                'Stalking / Active Following',
                'Suspicious Intruder / Weapon',
                'Medical / Severe Distress'
              ].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setIncidentType(type)}
                  className={`p-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                    incidentType === type
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-800 dark:text-red-200 ring-1 ring-red-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Current Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-red-500 absolute left-3 top-3.5" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Near Electronics Lab entrance, Hostel Block A stairs, Parking lot"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Emergency Description
              </label>
              <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                🎙️ Speak in Hindi or English
              </span>
            </div>

            {/* Voice-to-Text Dictaphone */}
            <div className="mb-2.5">
              <VoiceDictaphone
                isEmergency={true}
                onTranscript={(text) => {
                  setDescription((prev) => (prev ? `${prev} ${text}` : text));
                }}
              />
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is occurring right now, or click 'Live Voice Dictate' above to speak..."
              rows={4}
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              required
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Identity Shield: <strong>ACTIVE</strong> (No name/phone recorded)</span>
            <span className="font-mono text-red-600 font-bold">Auto-Routed: Campus Security</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? 'Transmitting Alert...' : '🚨 Send Critical Alert Now'}
          </button>
        </form>
      </div>

      {/* Post Submission Success */}
      <AnimatePresence>
        {createdCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-red-300 dark:border-red-900 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Critical Alert Broadcasted
                </h2>
                <p className="text-xs text-slate-500">
                  Routed to Campus Security Command. Status: CRITICAL PRIORITY.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Case ID</span>
                    <div className="text-xl font-mono font-bold text-campus-400">{createdCase.publicCaseId}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCase.publicCaseId, 'id')}
                    className="px-2.5 py-1 rounded bg-slate-800 text-xs font-medium"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Private PIN</span>
                    <div className="text-xl font-mono font-bold text-amber-400">{createdCase.rawPin}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCase.rawPin, 'pin')}
                    className="px-2.5 py-1 rounded bg-slate-800 text-xs font-medium"
                  >
                    {copiedPin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('track_report')}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm text-center shadow-md transition-colors"
                >
                  Track Alert Responses →
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedCase(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
