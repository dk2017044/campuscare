import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, PhoneCall, Volume2, VolumeX, ShieldAlert, CheckCircle, Copy, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { VoiceDictaphone } from '../../components/VoiceDictaphone';
import { playEmergencySiren, stopEmergencySiren } from '../../services/sound';

interface Props {
  onNavigate: (tab: string) => void;
  onCaseCreated?: (publicCaseId: string, rawPin: string) => void;
}

export const EmergencyReport: React.FC<Props> = ({ onNavigate, onCaseCreated }) => {
  const [incidentType, setIncidentType] = useState('Immediate Threat');
  const [location, setLocation] = useState('');
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

      if (res.success && res.publicCaseId && res.rawPin) {
        setCreatedCase({
          publicCaseId: res.publicCaseId,
          rawPin: res.rawPin
        });
        if (onCaseCreated) {
          onCaseCreated(res.publicCaseId, res.rawPin);
        }
        setLocation('');
        setDescription('');
      }
    } catch (err: any) {
      setError(err.message || 'Alert failed. Please call Campus Security directly.');
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
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6 relative z-10">
      {/* Urgent Coral Banner */}
      <div className="rounded-3xl bg-[#FFF1F0] border border-[#FED4D1] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FEE4E2] text-[#D92D20] border border-[#FDA29B] flex items-center justify-center animate-pulse shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight font-heading">
                Emergency SOS Beacon
              </h1>
              <p className="text-xs text-[#D92D20] font-medium">
                Direct critical priority transmission to Campus Security & Quick Response Team
              </p>
            </div>
          </div>

          {/* Test Siren Button */}
          <button
            type="button"
            onClick={toggleSiren}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              sirenPlaying
                ? 'bg-[#D92D20] text-white animate-bounce shadow-md shadow-red-500/30'
                : 'bg-white border border-[#FED4D1] text-[#D92D20] hover:bg-[#FFE4DE]'
            }`}
          >
            {sirenPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{sirenPlaying ? 'Stop Siren' : 'Test Siren'}</span>
          </button>
        </div>

        {/* Quick Dial Helplines */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#FED4D1]/80 text-xs">
          <a
            href="tel:911"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-[#D92D20] border border-[#FED4D1] text-xs font-semibold shadow-xs"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#D92D20]" />
            <span>Campus Security: Ext 911</span>
          </a>
          <span className="text-xs font-medium text-slate-600 bg-white/70 px-2.5 py-1 rounded-lg border border-[#FED4D1]/50 font-mono">
            Police: 100
          </span>
          <span className="text-xs font-medium text-slate-600 bg-white/70 px-2.5 py-1 rounded-lg border border-[#FED4D1]/50 font-mono">
            Medical: 108
          </span>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-5 shadow-sm">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2.5">
            Emergency Nature
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {['Immediate Threat', 'Physical Violence', 'Fire or Severe Hazard', 'Medical Distress'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setIncidentType(t)}
                className={`p-3 rounded-2xl border text-xs font-medium text-left transition-all cursor-pointer ${
                  incidentType === t
                    ? 'border-[#D92D20] bg-[#FFF1F0] text-[#D92D20] ring-2 ring-red-500/20 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Current Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Campus location or landmark"
            className="w-full p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#D92D20] focus:ring-2 focus:ring-[#D92D20]/20 text-slate-900 text-xs placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Immediate Details
            </label>
            <span className="text-[11px] font-semibold text-[#D92D20]">Speak or Type</span>
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
            placeholder="Briefly describe the emergency..."
            rows={3}
            className="w-full p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#D92D20] focus:ring-2 focus:ring-[#D92D20]/20 text-slate-900 text-xs placeholder:text-slate-400 resize-none outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-[#D92D20] hover:bg-[#B42318] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-red-500/20 cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Transmitting Alert...' : '🚨 Dispatch Emergency Beacon Now'}
        </button>
      </form>

      {/* Success Modal */}
      <AnimatePresence>
        {createdCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl max-w-md w-full p-7 border border-slate-200 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#D92D20] flex items-center justify-center mx-auto border border-red-200 shadow-xs">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 font-heading">Emergency Alert Dispatched</h2>
                <p className="text-xs text-[#D92D20] font-medium">Critical case transmitted to Campus Security Command.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Emergency Case ID</span>
                    <div className="text-xl font-mono font-bold text-[#D92D20]">
                      {createdCase.publicCaseId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCase.publicCaseId, 'id')}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 shadow-xs"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Secret Tracking PIN</span>
                    <div className="text-xl font-mono font-bold text-amber-700">
                      {createdCase.rawPin}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCase.rawPin, 'pin')}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 shadow-xs"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('track_report')}
                className="w-full py-3 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-xs text-center cursor-pointer shadow-xs"
              >
                Track Emergency Status →
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
