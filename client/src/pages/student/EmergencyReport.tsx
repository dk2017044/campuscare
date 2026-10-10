import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, PhoneCall, Volume2, VolumeX, ShieldAlert, CheckCircle, Copy, Check } from 'lucide-react';
import { api } from '../../services/api';
import { VoiceDictaphone } from '../../components/VoiceDictaphone';
import { playEmergencySiren, stopEmergencySiren } from '../../services/sound';

interface Props {
  onNavigate: (tab: string) => void;
  onCaseCreated?: (publicCaseId: string, rawPin: string) => void;
}

export const EmergencyReport: React.FC<Props> = ({ onNavigate, onCaseCreated }) => {
  const [incidentType, setIncidentType] = useState('Immediate Threat');
  const [location, setLocation] = useState('Campus Premises');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sirenPlaying, setSirenPlaying] = useState(false);

  const [createdCase, setCreatedCase] = useState<{
    publicCaseId: string;
    rawPin: string;
  } | null>(null);

  const [copiedId, setCopiedId] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const toggleSiren = () => {
    if (sirenPlaying) {
      stopEmergencySiren();
      setSirenPlaying(false);
    } else {
      playEmergencySiren(8);
      setSirenPlaying(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide quick details regarding the emergency.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Play emergency siren to signal alert
      playEmergencySiren(6);
      setSirenPlaying(true);

      const res = await api.createCase({
        reportType: 'safety',
        category: 'Immediate Danger',
        subcategory: incidentType,
        description: `🚨 EMERGENCY ALERT: ${description}`,
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
    <div className="max-w-xl mx-auto py-6 px-4 space-y-6 relative z-10">
      {/* Minimal Urgent Glass Banner */}
      <div className="rounded-3xl glass-panel border border-rose-500/30 p-5 bg-rose-950/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Emergency SOS Beacon</h1>
              <p className="text-[11px] text-rose-300">Direct critical alert to Campus Security</p>
            </div>
          </div>

          {/* Test Siren Button */}
          <button
            type="button"
            onClick={toggleSiren}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              sirenPlaying
                ? 'bg-rose-500 text-white animate-bounce shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                : 'glass-pill text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            {sirenPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{sirenPlaying ? 'Stop Siren' : 'Test Siren'}</span>
          </button>
        </div>

        {/* Quick Dial Helplines */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-500/20 text-xs">
          <a
            href="tel:911"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-[11px] font-semibold"
          >
            <PhoneCall className="w-3 h-3 text-rose-400" />
            <span>Campus Security: Ext 911</span>
          </a>
          <span className="text-[11px] text-slate-400 font-mono">Police: 100</span>
        </div>
      </div>

      {/* Main Glass Form */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Emergency Nature
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['Immediate Threat', 'Physical Violence', 'Fire or Severe Hazard', 'Medical Distress'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setIncidentType(t)}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                  incidentType === t
                    ? 'border-rose-500 bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40'
                    : 'glass-pill text-slate-300 hover:text-white hover:border-white/15'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Current Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Near Library stairs, Hostel Block A Ground floor"
            className="w-full p-3 rounded-xl glass-input text-white text-xs placeholder:text-slate-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Immediate Details
            </label>
            <span className="text-[11px] text-rose-400">Speak or Type</span>
          </div>

          <div className="mb-2">
            <VoiceDictaphone
              isEmergency
              onTranscript={(text) => {
                setDescription((prev) => (prev ? `${prev} ${text}` : text));
              }}
            />
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly state what is happening right now..."
            rows={3}
            className="w-full p-3 rounded-xl glass-input text-white text-xs placeholder:text-slate-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(244,63,94,0.4)] cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Transmitting Alert...' : '🚨 Dispatch Emergency Beacon'}
        </button>
      </form>

      {/* Success Modal */}
      <AnimatePresence>
        {createdCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel bg-slate-900/90 rounded-3xl max-w-md w-full p-6 border border-white/10 shadow-2xl space-y-4"
            >
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white">Emergency Dispatched</h2>
                <p className="text-xs text-rose-300">Case routed to Campus Security Command.</p>
              </div>

              <div className="p-4 rounded-2xl glass-card space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Emergency Case ID</span>
                    <div className="text-xl font-mono font-bold text-rose-400">
                      {createdCase.publicCaseId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCase.publicCaseId, 'id')}
                    className="px-2.5 py-1 rounded-lg glass-pill text-xs text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Secret PIN</span>
                    <div className="text-xl font-mono font-bold text-amber-400">
                      {createdCase.rawPin}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCase.rawPin, 'pin')}
                    className="px-2.5 py-1 rounded-lg glass-pill text-xs text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('track_report')}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs text-center cursor-pointer shadow-[0_0_15px_rgba(14,141,231,0.25)]"
              >
                Track Status →
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
