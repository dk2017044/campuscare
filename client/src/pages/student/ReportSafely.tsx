import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  ShieldCheck, 
  MapPin, 
  Upload, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Copy, 
  Check, 
  FileText, 
  AlertCircle, 
  Sparkles, 
  Trash2, 
  ShieldAlert, 
  Wrench, 
  Search, 
  Users 
} from 'lucide-react';
import { api } from '../../services/api';
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
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 relative z-10">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] border border-blue-100 flex items-center justify-center shadow-xs">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-heading">
              Confidential Report
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Zero-telemetry encrypted reporting with private PIN tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Identity Shield Active</span>
        </div>
      </div>

      {/* Sleek Step Indicator Pill Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        {[
          { num: 1, label: '1. Issue' },
          { num: 2, label: '2. Location' },
          { num: 3, label: '3. Time' },
          { num: 4, label: '4. Evidence' },
          { num: 5, label: '5. Submit' }
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => s.num < step && setStep(s.num)}
            className={`flex-1 py-2 text-center rounded-xl text-xs font-medium transition-all ${
              step === s.num
                ? 'bg-[#0066FF] text-white font-semibold shadow-xs'
                : step > s.num
                ? 'text-[#0066FF] hover:bg-blue-50 font-medium cursor-pointer'
                : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
        {/* STEP 1: WHAT HAPPENED */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Select Concern Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                      className={`p-3 text-left rounded-2xl border text-xs font-medium transition-all flex flex-col justify-between h-20 cursor-pointer ${
                        isSelected
                          ? 'border-[#0066FF] bg-blue-50 text-[#0066FF] ring-2 ring-blue-500/20 font-semibold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#0066FF]' : 'text-slate-400'}`} />
                      <span className="line-clamp-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Detailed Description
                </label>
                <span className="text-[11px] font-medium text-[#0066FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  Multilingual Voice Enabled
                </span>
              </div>

              {/* Multilingual Voice Dictaphone */}
              <div className="mb-2.5">
                <VoiceDictaphone
                  onTranscript={(text) => {
                    setDescription((prev) => (prev ? `${prev} ${text}` : text));
                  }}
                />
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred with as much detail as possible... (You may type or use voice dictation)"
                rows={4}
                className="w-full p-4 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 text-xs placeholder:text-slate-400 resize-none transition-all outline-none"
              />
            </div>

            {/* AI Assistant Preview Button */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Sparkles className="w-4 h-4 text-[#0066FF]" />
                <span>Smart AI Triage & Routing</span>
              </div>
              <button
                type="button"
                onClick={triggerAiPreview}
                disabled={triaging || !description.trim()}
                className="text-xs font-semibold text-[#0066FF] hover:underline disabled:opacity-40 cursor-pointer"
              >
                {triaging ? 'Analyzing with AI...' : 'Preview AI Routing →'}
              </button>
            </div>

            {aiPreview && (
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-slate-800 space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-[#0066FF]">Assigned Dept: {aiPreview.suggested_department_name}</span>
                  <span className="font-mono text-slate-700 font-bold">Priority: {aiPreview.priority_suggestion}</span>
                </div>
                <p className="text-[11px] text-slate-600 italic">"{aiPreview.reasoning}"</p>
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
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-xs"
              >
                <span>Continue to Location</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: WHERE */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Select Campus Location
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PREDEFINED_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className={`p-3 text-xs text-left rounded-2xl border transition-all cursor-pointer flex items-center gap-2 ${
                      location === loc
                        ? 'border-[#0066FF] bg-blue-50 text-[#0066FF] ring-2 ring-blue-500/20 font-semibold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${location === loc ? 'text-[#0066FF]' : 'text-slate-400'}`} />
                    <span className="truncate">{loc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Specific Room or Landmark (Optional)
              </label>
              <input
                type="text"
                value={customLocationDetail}
                onChange={(e) => setCustomLocationDetail(e.target.value)}
                placeholder="e.g. 2nd Floor corridor, near Room 204 or Stairwell B"
                className="w-full p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 text-xs placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-xs"
              >
                <span>Continue to Time</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: WHEN */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Approximate Date
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {['Today', 'Yesterday', 'Earlier This Week', 'Unsure'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setIncidentDate(d)}
                    className={`p-3 text-xs text-center rounded-2xl border transition-all cursor-pointer ${
                      incidentDate === d
                        ? 'border-[#0066FF] bg-blue-50 text-[#0066FF] ring-2 ring-blue-500/20 font-semibold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Approximate Time
              </label>
              <input
                type="text"
                value={approxTime}
                onChange={(e) => setApproxTime(e.target.value)}
                placeholder="e.g. Around 5:30 PM, During lunch break, or Late evening"
                className="w-full p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 text-xs placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-xs"
              >
                <span>Continue to Evidence</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: EVIDENCE */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Clean Drop Zone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-[#0066FF] bg-slate-50/50 rounded-3xl p-6 text-center transition-colors">
              <Upload className="w-8 h-8 text-[#0066FF] mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-slate-800">
                Attach Screenshots, Photos, or Documents (Optional)
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP, or PDF up to 10MB</p>
              <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs cursor-pointer">
                <span>Choose File to Upload</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="hidden"
                />
              </label>
              {uploading && <p className="text-xs text-[#0066FF] mt-2 font-medium animate-pulse">Uploading securely...</p>}
            </div>

            {/* Uploaded List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={file.id || idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-[#0066FF] shrink-0" />
                      <span className="text-slate-800 font-medium truncate">{file.fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-xs"
              >
                <span>Continue to Privacy & Submit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: PRIVACY & SUBMIT */}
        {step === 5 && (
          <div className="space-y-6">
            {/* Identity Switcher */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {isAnonymous ? 'Anonymous Protection: Active' : 'Identified Mode'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAnonymous ? 'No identity or student email is logged.' : 'Your name & contact will be attached for direct follow-up.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 cursor-pointer shadow-xs"
              >
                {isAnonymous ? 'Add Identity' : 'Make Anonymous'}
              </button>
            </div>

            {!isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Your Name (Optional)"
                  className="p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs placeholder:text-slate-400 outline-none"
                />
                <input
                  type="text"
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  placeholder="Email or Phone Number"
                  className="p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs placeholder:text-slate-400 outline-none"
                />
              </div>
            )}

            {/* Quick Summary Pill */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Category: <strong className="text-slate-900">{category}</strong></span>
                <span>Location: <strong className="text-slate-900">{location}</strong></span>
              </div>
              <p className="text-[11px] text-slate-600 italic line-clamp-2">"{description}"</p>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-7 py-3 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {loading ? 'Encrypting & Logging...' : 'Submit Confidential Report →'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {createdCaseData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-md w-full p-7 border border-slate-200 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 font-heading">Report Safely Logged</h2>
                <p className="text-xs text-slate-500">Save your Case ID and private PIN to track real-time resolution.</p>
              </div>

              {/* Case ID and PIN Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Public Case ID</span>
                    <div className="text-xl font-mono font-bold text-[#0066FF]">
                      {createdCaseData.publicCaseId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCaseData.publicCaseId, 'id')}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 shadow-xs"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Private Access PIN</span>
                    <div className="text-xl font-mono font-bold text-amber-700">
                      {createdCaseData.rawPin}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCaseData.rawPin, 'pin')}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 shadow-xs"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('track_report')}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-xs text-center transition-all cursor-pointer shadow-xs"
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
