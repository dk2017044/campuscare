import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, Sparkles, Upload, MapPin, CheckCircle, Copy, Check, AlertCircle, Camera, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
  onNavigate: (tab: string) => void;
  onCaseCreated?: (publicCaseId: string, rawPin: string) => void;
}

export const MaintenanceReport: React.FC<Props> = ({ onNavigate, onCaseCreated }) => {
  const [issueType, setIssueType] = useState('Broken Fan');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [attachedImage, setAttachedImage] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);

  const [createdCase, setCreatedCase] = useState<{
    publicCaseId: string;
    rawPin: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const res = await api.uploadEvidence(file);
      setAttachedImage(res.file);

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          setAnalyzingAi(true);
          const rawBase64 = (reader.result as string).split(',')[1];
          const aiRes = await api.classifyMaintenance(
            description || 'Campus maintenance inspection',
            file.name,
            rawBase64,
            file.type
          );
          if (aiRes && aiRes.analysis) {
            setAiAnalysis(aiRes.analysis);
            if (aiRes.analysis.subcategory) {
              setIssueType(aiRes.analysis.subcategory);
            }
          }
        } catch (visionErr) {
          console.error('Vision analysis error:', visionErr);
        } finally {
          setAnalyzingAi(false);
        }
      };
      reader.readAsDataURL(file);

    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description of the issue.');
      return;
    }
    if (!location.trim()) {
      setError('Please provide the building or room location.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await api.createCase({
        reportType: 'maintenance',
        category: 'Maintenance',
        subcategory: issueType,
        description: `[Maintenance Defect]: ${description}`,
        location,
        incidentDate: 'Today',
        incidentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAnonymous: true,
        evidence: attachedImage ? [attachedImage] : []
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
      setError(err.message || 'Failed to submit report');
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
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6 relative z-10">
      {/* Minimal Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Facilities Maintenance</h1>
            <p className="text-[11px] text-slate-400">Report broken fixtures, plumbing, or classroom hardware</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-pill text-[11px] text-amber-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Vision Diagnostic</span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Glass Form */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-7 space-y-5">
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Defect Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              'Broken Fan',
              'Lighting Fault',
              'Electrical Spark',
              'Water Leakage',
              'Desk / Chair',
              'Projector / AV',
              'Lab Hardware',
              'Cleanliness'
            ].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setIssueType(type)}
                className={`p-2.5 text-xs text-left rounded-xl border transition-all cursor-pointer truncate ${
                  issueType === type
                    ? 'border-amber-400 bg-amber-500/15 text-white ring-1 ring-amber-400/50'
                    : 'glass-pill text-slate-300 hover:text-white hover:border-white/15'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Location (Room / Floor)
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Building - Room 304, Electronics Lab 2"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-white text-xs placeholder:text-slate-500"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Defect Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what is defective or making noise..."
            rows={3}
            className="w-full p-3 rounded-xl glass-input text-white text-xs placeholder:text-slate-500 resize-none"
            required
          />
        </div>

        {/* Defect Photo & Gemini Vision */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Attach Defect Photo (AI Diagnosis)
          </label>

          {!attachedImage ? (
            <div className="border border-dashed border-white/15 rounded-2xl p-5 text-center hover:border-amber-400/40 transition-colors">
              <Camera className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-slate-200">
                Snap or upload defect photo
              </p>
              <label className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 glass-panel hover:bg-white/[0.08] text-slate-200 rounded-xl text-xs font-medium cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload Image</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
              </label>
              {uploading && <p className="text-xs text-amber-400 mt-2 animate-pulse">Uploading...</p>}
            </div>
          ) : (
            <div className="p-3 rounded-xl glass-pill flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="text-slate-200 truncate">{attachedImage.fileName}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachedImage(null);
                  setAiAnalysis(null);
                }}
                className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {analyzingAi && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mt-2 animate-pulse flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini Vision inspecting image...</span>
            </div>
          )}

          {aiAnalysis && (
            <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Issue: {aiAnalysis.detectedIssue || aiAnalysis.subcategory}</span>
                <span className="font-mono text-amber-400">Priority: {aiAnalysis.priority}</span>
              </div>
              <p className="text-[11px] text-slate-300">Department: {aiAnalysis.suggestedDepartment}</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Maintenance Request'}
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
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white">Maintenance Logged</h2>
                <p className="text-xs text-slate-400">Request dispatched to campus facilities.</p>
              </div>

              <div className="p-4 rounded-2xl glass-card space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Case ID</span>
                    <div className="text-xl font-mono font-bold text-amber-400">
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
                    <div className="text-xl font-mono font-bold text-sky-400">
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
