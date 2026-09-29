import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, MapPin, Calendar, Upload, CheckCircle, ArrowRight, ArrowLeft, Copy, Check, FileText, AlertCircle, Sparkles, Mic, Trash2, ShieldAlert, Wrench, Search, Users } from 'lucide-react';
import { api } from '../../services/api';
import { AIDisclaimer } from '../../components/AIDisclaimer';
import { CategoryBadge, getCategoryMeta } from '../../components/CategoryBadge';
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
  'Sports Ground & Playground',
  'Student Parking Lot',
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

  // Voice recording simulation
  const [isListening, setIsListening] = useState(false);

  // Evidence upload
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // AI live triage preview
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [triaging, setTriaging] = useState(false);

  // Success dialog after submission
  const [createdCaseData, setCreatedCaseData] = useState<{
    publicCaseId: string;
    rawPin: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 10MB
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

  const handleVoiceToggle = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech-to-text is not supported in this browser. Please type your description.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please provide a description of the incident.');
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
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Intro Banner */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-campus-900 to-slate-900 text-white shadow-lg border border-campus-800">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-campus-500/20 text-campus-400 border border-campus-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Report Safely</h1>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Identity Shield: ON</span>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              “You can report a problem without sharing your identity with normal campus staff. You will receive a Case ID and private PIN to track your report.”
            </p>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span className={step >= 1 ? 'text-campus-600' : ''}>1. What happened?</span>
          <span className={step >= 2 ? 'text-campus-600' : ''}>2. Where?</span>
          <span className={step >= 3 ? 'text-campus-600' : ''}>3. When?</span>
          <span className={step >= 4 ? 'text-campus-600' : ''}>4. Evidence</span>
          <span className={step >= 5 ? 'text-campus-600' : ''}>5. Privacy & Submit</span>
        </div>
        <div className="mt-2 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-campus-600 transition-all duration-300 rounded-full"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
        {/* STEP 1: WHAT HAPPENED */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Step 1 — What happened?</h2>
              <p className="text-xs text-slate-500 mt-1">
                Describe the situation clearly. You do not need to identify yourself.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Report Category (Select Primary Domain)
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  Domain: <span className="text-campus-600 font-bold capitalize">{reportType.replace('_', ' ')}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {[
                  { label: 'Harassment / Intimidation', type: 'safety', icon: ShieldAlert, tag: 'Safety' },
                  { label: 'Bullying / Hazing', type: 'safety', icon: ShieldAlert, tag: 'Safety' },
                  { label: 'Stalking / Unsafe Activity', type: 'safety', icon: ShieldAlert, tag: 'Safety' },
                  { label: 'Suspicious Behavior', type: 'safety', icon: ShieldAlert, tag: 'Safety' },
                  { label: 'Maintenance / Hazard', type: 'maintenance', icon: Wrench, tag: 'Facilities' },
                  { label: 'Hostel / Lab Defect', type: 'maintenance', icon: Wrench, tag: 'Facilities' },
                  { label: 'Lost Personal Property', type: 'lost_found', icon: Search, tag: 'Lost & Found' },
                  { label: 'Student Welfare Issue', type: 'other', icon: Users, tag: 'Welfare' }
                ].map((item) => {
                  const isSelected = category === item.label;
                  const catMeta = getCategoryMeta(item.type);
                  const Icon = item.icon;
                  return (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setCategory(item.label);
                        setReportType(item.type);
                      }}
                      className={`p-3 text-left rounded-xl border transition-all relative flex flex-col justify-between h-20 ${
                        isSelected
                          ? `border-l-4 ${catMeta.borderLeft} bg-white dark:bg-slate-800 shadow-sm ring-2 ring-campus-500/50`
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${catMeta.bg} ${catMeta.text}`}>
                          {item.tag}
                        </span>
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? catMeta.text : 'text-slate-400'}`} />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {item.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Incident Description
                </label>
                <span className="text-[11px] font-semibold text-campus-600 dark:text-campus-400">
                  🎙️ Speak in Hindi or English
                </span>
              </div>

              {/* Multilingual Voice Dictation */}
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
                placeholder="Example: A student has repeatedly been following me near the laboratory after class and making threats... (Or use the Voice Dictate tool above)"
                rows={5}
                className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-campus-500 focus:outline-none"
              />
            </div>

            {/* AI Assistant Live Feedback Button */}
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>AI Pre-Triage Assistant</span>
                </div>
                <button
                  type="button"
                  onClick={triggerAiPreview}
                  disabled={triaging || !description.trim()}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 underline disabled:opacity-50"
                >
                  {triaging ? 'Analyzing...' : 'Test AI Categorization'}
                </button>
              </div>

              {aiPreview ? (
                <div className="space-y-2 text-xs text-purple-950 bg-white/80 p-3 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Suggested Department: {aiPreview.suggested_department_name}</span>
                    <span className="font-mono text-purple-700 font-bold">Priority: {aiPreview.priority_suggestion}</span>
                  </div>
                  <p className="text-slate-600 italic">"{aiPreview.reasoning}"</p>
                </div>
              ) : (
                <p className="text-[11px] text-purple-700">
                  Our server-side AI model will automatically analyze your report to suggest priority and route it to the right department.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  if (!description.trim()) {
                    setError('Please enter a description before proceeding.');
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-campus-600 hover:bg-campus-500 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                <span>Continue to Location</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: WHERE */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Step 2 — Where did this happen?</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select from predefined campus facilities. Exact GPS coordinates are never required.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Campus Location
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PREDEFINED_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className={`p-3 text-xs text-left rounded-xl border transition-all font-medium ${
                      location === loc
                        ? 'border-campus-600 bg-campus-50 text-campus-900 font-semibold ring-1 ring-campus-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-campus-600 shrink-0" />
                      <span>{loc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Specific Area / Floor / Room Detail (Optional)
              </label>
              <input
                type="text"
                value={customLocationDetail}
                onChange={(e) => setCustomLocationDetail(e.target.value)}
                placeholder="e.g. Floor 2 Corridor, near exit staircase or Room 304"
                className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-campus-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-campus-600 hover:bg-campus-500 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                <span>Continue to Time</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: WHEN */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Step 3 — When did this happen?</h2>
              <p className="text-xs text-slate-500 mt-1">
                Provide an approximate timeframe. "I don't know" is acceptable if uncertain.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Date
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Today', 'Yesterday', 'Earlier This Week', 'I don\'t know'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setIncidentDate(d)}
                    className={`p-3 text-xs text-center rounded-xl border transition-all font-medium ${
                      incidentDate === d
                        ? 'border-campus-600 bg-campus-50 text-campus-900 font-semibold ring-1 ring-campus-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Approximate Time
              </label>
              <input
                type="text"
                value={approxTime}
                onChange={(e) => setApproxTime(e.target.value)}
                placeholder="e.g. Approx. 5:30 PM, Morning Break, or Unsure"
                className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-campus-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-campus-600 hover:bg-campus-500 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                <span>Continue to Evidence</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: EVIDENCE */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Step 4 — Attach Evidence (Optional)</h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload relevant screenshots, photos, or documents. Uploaded files are strictly access-controlled.
              </p>
            </div>

            {/* Legal Notice */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <div className="font-semibold flex items-center gap-1.5 text-amber-950 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Evidence Guidelines</span>
              </div>
              Only upload evidence that you are legally permitted to share and that is relevant to the report. Do not upload unauthorized private media. All metadata is stripped upon ingestion.
            </div>

            {/* Upload Zone */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-campus-500 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Click to browse or drag evidence files here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supported: PNG, JPG, WEBP, PDF (Max 10MB)
              </p>
              <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer">
                <span>Browse Files</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="hidden"
                />
              </label>
              {uploading && <p className="text-xs text-campus-600 mt-2 animate-pulse">Encrypting and uploading evidence...</p>}
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">Attached Evidence</h4>
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={file.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-campus-600 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{file.fileName}</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        ({file.sizeBytes ? `${Math.round(file.sizeBytes / 1024)} KB` : 'Attached'})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-rose-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-campus-600 hover:bg-campus-500 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                <span>Continue to Privacy</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: PRIVACY & SUBMIT */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Step 5 — Identity & Final Review</h2>
              <p className="text-xs text-slate-500 mt-1">
                Confirm your identity protection preference before lodging the report.
              </p>
            </div>

            {/* Identity Protection Status Box */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isAnonymous
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isAnonymous ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {isAnonymous ? 'Identity Protection: ON' : 'Identified Reporting Selected'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {isAnonymous
                        ? 'No personal details are collected or linked to this case.'
                        : 'Your contact details will be shared with the investigating department.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-white transition-colors"
                >
                  {isAnonymous ? 'Switch to Identified' : 'Enable Identity Shield'}
                </button>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email / Phone</label>
                    <input
                      type="text"
                      value={reporterContact}
                      onChange={(e) => setReporterContact(e.target.value)}
                      placeholder="student@polytechnic.edu"
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Report Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Submission Summary
              </h4>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                <div><span className="font-medium">Category:</span> {category}</div>
                <div><span className="font-medium">Location:</span> {location} {customLocationDetail && `(${customLocationDetail})`}</div>
                <div><span className="font-medium">When:</span> {incidentDate} - {approxTime}</div>
                <div><span className="font-medium">Evidence:</span> {uploadedFiles.length} file(s) attached</div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 italic line-clamp-2">
                "{description}"
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3 bg-campus-600 hover:bg-campus-500 text-white rounded-xl font-bold text-sm shadow-md shadow-campus-600/20 disabled:opacity-50 transition-all"
              >
                {loading ? 'Submitting & Encrypting...' : '🔒 Submit Report Safely'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* POST-SUBMISSION CASE ID + PIN MODAL */}
      <AnimatePresence>
        {createdCaseData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Report Submitted Safely
                </h2>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your report has been encrypted and received. Identity protection is active.
                </p>
              </div>

              {/* Case ID and PIN Banner */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Your Case ID</span>
                    <div className="text-2xl font-mono font-extrabold text-campus-400 tracking-wider">
                      {createdCaseData.publicCaseId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCaseData.publicCaseId, 'id')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1 transition-colors"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Private Access PIN</span>
                    <div className="text-2xl font-mono font-extrabold text-amber-400 tracking-wider">
                      {createdCaseData.rawPin}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCaseData.rawPin, 'pin')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1 transition-colors"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
                  </button>
                </div>
              </div>

              {/* Warning Message */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">⚠️ Save these details now.</span> They are strictly required to track your report and receive responses. Because no personal email or phone was recorded, lost PINs cannot be recovered.
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('track_report');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-campus-600 hover:bg-campus-500 text-white font-bold text-sm text-center shadow-md shadow-campus-600/30 transition-all"
                >
                  Track This Report Now →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 transition-colors"
                >
                  Print / Save Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
