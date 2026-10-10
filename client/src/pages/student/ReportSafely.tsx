import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, MapPin, Upload, CheckCircle, ArrowRight, ArrowLeft, Copy, Check, FileText, AlertCircle, Sparkles, Trash2, ShieldAlert, Wrench, Search, Users } from 'lucide-react';
import { api } from '../../services/api';
import { getCategoryMeta } from '../../components/CategoryBadge';
import { VoiceDictaphone } from '../../components/VoiceDictaphone';

interface Props {
  onNavigate: (tab: string) => void;
  onCaseCreated?: (publicCaseId: string, rawPin: string) => void;
}

const PREDEFINED_LOCATIONS = [
  'Electronics Lab',
  'Main Building',
  'Mechanical Lab',
  'Central Library',
  'Hostel Block A',
  'Hostel Block B',
  'Campus Canteen',
  'Sports Ground',
  'Parking Lot',
  'Other / Unspecified Area'
];

export const ReportSafely: React.FC<Props> = ({ onNavigate, onCaseCreated }) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState('Harassment / Intimidation');
  const [reportType, setReportType] = useState('safety');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Electronics Lab');
  const [customLocationDetail, setCustomLocationDetail] = useState('');
  const [incidentDate, setIncidentDate] = useState('Today');
  const [approxTime, setApproxTime] = useState('Approx. 5:30 PM');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');

  // Evidence upload
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // AI live triage preview
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [triaging, setTriaging] = useState(false);

  // Success dialog
  const [createdCaseData, setCreatedCaseData] = useState<{
    publicCaseId: string;
    rawPin: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const res = await api.uploadEvidence(file);
      if (res.file) {
        setUploadedFiles(prev => [...prev, res.file]);
      }
    } catch (err: any) {
      setError(err.message || 'Evidence upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerAiPreview = async () => {
    if (!description.trim()) return;
    try {
      setTriaging(true);
      const res = await api.requestAITriage({
        text: description,
        location: `${location} ${customLocationDetail}`,
        when: `${incidentDate} ${approxTime}`,
        userCategory: reportType
      });
      setAiPreview(res.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setTriaging(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please provide a description.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fullLocation = customLocationDetail.trim()
        ? `${location} - ${customLocationDetail.trim()}`
        : location;

      const res = await api.createCase({
        reportType,
        category,
        subcategory: category,
        description: description.trim(),
        location: fullLocation,
        incidentDate,
        incidentTime: approxTime,
        isAnonymous,
        reporterName: isAnonymous ? null : reporterName,
        reporterContact: isAnonymous ? null : reporterContact,
        evidence: uploadedFiles
      });

      if (res.success && res.publicCaseId && res.rawPin) {
        setCreatedCaseData({
          publicCaseId: res.publicCaseId,
          rawPin: res.rawPin
        });
        if (onCaseCreated) {
          onCaseCreated(res.publicCaseId, res.rawPin);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
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
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Confidential Report</h1>
            <p className="text-[11px] text-slate-400">Zero-telemetry reporting with private tracking PIN</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-pill text-[11px] text-emerald-300 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Identity Shield Active</span>
        </div>
      </div>

      {/* Sleek Step Indicator */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl glass-panel">
        {[
          { num: 1, label: 'Issue' },
          { num: 2, label: 'Location' },
          { num: 3, label: 'Time' },
          { num: 4, label: 'Evidence' },
          { num: 5, label: 'Submit' }
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => s.num < step && setStep(s.num)}
            className={`flex-1 py-1.5 text-center rounded-lg text-xs font-medium transition-all ${
              step === s.num
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-xs'
                : step > s.num
                ? 'text-sky-300 hover:text-white'
                : 'text-slate-500'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Glass Form Container */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-5">
        {/* STEP 1: WHAT HAPPENED */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2.5">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Harassment', type: 'safety', icon: ShieldAlert },
                  { label: 'Bullying / Ragging', type: 'safety', icon: ShieldAlert },
                  { label: 'Unsafe Activity', type: 'safety', icon: ShieldAlert },
                  { label: 'Suspicious Behavior', type: 'safety', icon: ShieldAlert },
                  { label: 'Facility Hazard', type: 'maintenance', icon: Wrench },
                  { label: 'Hostel Defect', type: 'maintenance', icon: Wrench },
                  { label: 'Lost Property', type: 'lost_found', icon: Search },
                  { label: 'Welfare Concern', type: 'other', icon: Users }
                ].map((item) => {
                  const isSelected = category.toLowerCase().includes(item.label.toLowerCase().slice(0, 8));
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setCategory(item.label);
                        setReportType(item.type);
                      }}
                      className={`p-2.5 text-left rounded-xl border text-xs font-medium transition-all flex flex-col justify-between h-18 cursor-pointer ${
                        isSelected
                          ? 'border-sky-400 bg-sky-500/15 text-white ring-1 ring-sky-400/50 shadow-xs'
                          : 'glass-pill text-slate-300 hover:text-white hover:border-white/15'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-300' : 'text-slate-500'}`} />
                      <span className="line-clamp-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <span className="text-[11px] text-sky-400">Hindi / English Dictation</span>
              </div>

              {/* Multilingual Voice Dictaphone */}
              <div className="mb-2">
                <VoiceDictaphone
                  onTranscript={(text) => {
                    setDescription((prev) => (prev ? `${prev} ${text}` : text));
                  }}
                />
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred... (You may type or use the voice button above)"
                rows={4}
                className="w-full p-3.5 rounded-xl glass-input text-white text-xs placeholder:text-slate-500 resize-none"
              />
            </div>

            {/* AI Assistant Preview Button */}
            <div className="p-3 rounded-xl glass-pill flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Automated Triage</span>
              </div>
              <button
                type="button"
                onClick={triggerAiPreview}
                disabled={triaging || !description.trim()}
                className="text-xs font-medium text-indigo-300 hover:text-white underline disabled:opacity-40 cursor-pointer"
              >
                {triaging ? 'Analyzing...' : 'Test AI Routing'}
              </button>
            </div>

            {aiPreview && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Routing: {aiPreview.suggested_department_name}</span>
                  <span className="font-mono text-sky-300">Priority: {aiPreview.priority_suggestion}</span>
                </div>
                <p className="text-[11px] text-slate-300 italic">"{aiPreview.reasoning}"</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!description.trim()) {
                    setError('Please enter a description.');
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(14,141,231,0.25)]"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: WHERE */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2.5">
                Select Location
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PREDEFINED_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className={`p-2.5 text-xs text-left rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                      location === loc
                        ? 'border-sky-400 bg-sky-500/15 text-white ring-1 ring-sky-400/50'
                        : 'glass-pill text-slate-300 hover:text-white hover:border-white/15'
                    }`}
                  >
                    <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                    <span className="truncate">{loc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Room or Floor Details (Optional)
              </label>
              <input
                type="text"
                value={customLocationDetail}
                onChange={(e) => setCustomLocationDetail(e.target.value)}
                placeholder="e.g. 2nd Floor corridor, near Room 204"
                className="w-full p-3 rounded-xl glass-input text-white text-xs placeholder:text-slate-500"
              />
            </div>

            <div className="flex justify-between pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(14,141,231,0.25)]"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: WHEN */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2.5">
                Approximate Date
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Today', 'Yesterday', 'Earlier This Week', 'Unsure'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setIncidentDate(d)}
                    className={`p-2.5 text-xs text-center rounded-xl border transition-all cursor-pointer ${
                      incidentDate === d
                        ? 'border-sky-400 bg-sky-500/15 text-white ring-1 ring-sky-400/50'
                        : 'glass-pill text-slate-300 hover:text-white hover:border-white/15'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Approximate Time
              </label>
              <input
                type="text"
                value={approxTime}
                onChange={(e) => setApproxTime(e.target.value)}
                placeholder="e.g. Around 5:00 PM or Morning"
                className="w-full p-3 rounded-xl glass-input text-white text-xs placeholder:text-slate-500"
              />
            </div>

            <div className="flex justify-between pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(14,141,231,0.25)]"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: EVIDENCE */}
        {step === 4 && (
          <div className="space-y-5">
            {/* Minimal Drop Zone */}
            <div className="border border-dashed border-white/15 rounded-2xl p-5 text-center hover:border-sky-400/40 transition-colors">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-200">
                Attach screenshots or photos (Optional)
              </p>
              <label className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 glass-panel hover:bg-white/[0.08] text-slate-200 rounded-xl text-xs font-medium cursor-pointer">
                <span>Browse File</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="hidden"
                />
              </label>
              {uploading && <p className="text-xs text-sky-400 mt-2 animate-pulse">Uploading evidence...</p>}
            </div>

            {/* Uploaded List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-1.5">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={file.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-xl glass-pill text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="text-slate-200 truncate">{file.fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(14,141,231,0.25)]"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: PRIVACY & SUBMIT */}
        {step === 5 && (
          <div className="space-y-5">
            {/* Identity Switcher */}
            <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">
                    {isAnonymous ? 'Anonymous Protection: Active' : 'Identified Mode'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isAnonymous ? 'No name or student email recorded.' : 'Name & contact will be attached.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className="text-xs font-medium px-2.5 py-1 rounded-lg glass-pill text-slate-300 hover:text-white cursor-pointer"
              >
                {isAnonymous ? 'Add Identity' : 'Make Anonymous'}
              </button>
            </div>

            {!isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Your Name"
                  className="p-3 rounded-xl glass-input text-white text-xs placeholder:text-slate-500"
                />
                <input
                  type="text"
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  placeholder="Email or Mobile"
                  className="p-3 rounded-xl glass-input text-white text-xs placeholder:text-slate-500"
                />
              </div>
            )}

            {/* Quick Summary Pill */}
            <div className="p-3 rounded-xl glass-pill text-xs space-y-1 text-slate-300">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Category: <strong className="text-white">{category}</strong></span>
                <span>Location: <strong className="text-white">{location}</strong></span>
              </div>
              <p className="text-[11px] text-slate-400 italic line-clamp-1">"{description}"</p>
            </div>

            <div className="flex justify-between pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-[0_0_20px_rgba(14,141,231,0.35)] disabled:opacity-50"
              >
                {loading ? 'Encrypting & Logging...' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {createdCaseData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel bg-slate-900/90 rounded-3xl max-w-md w-full p-6 border border-white/10 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white">Report Safely Logged</h2>
                <p className="text-xs text-slate-400">Save your Case ID and private PIN to track status.</p>
              </div>

              {/* Case ID and PIN Banner */}
              <div className="p-4 rounded-2xl glass-card space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Case ID</span>
                    <div className="text-xl font-mono font-bold text-sky-400">
                      {createdCaseData.publicCaseId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCaseData.publicCaseId, 'id')}
                    className="px-2.5 py-1 rounded-lg glass-pill text-xs text-slate-200 inline-flex items-center gap-1 cursor-pointer hover:bg-white/[0.08]"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Private Access PIN</span>
                    <div className="text-xl font-mono font-bold text-amber-400">
                      {createdCaseData.rawPin}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCaseData.rawPin, 'pin')}
                    className="px-2.5 py-1 rounded-lg glass-pill text-xs text-slate-200 inline-flex items-center gap-1 cursor-pointer hover:bg-white/[0.08]"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('track_report')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs text-center transition-all cursor-pointer shadow-[0_0_15px_rgba(14,141,231,0.25)]"
                >
                  Track Case Now →
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
