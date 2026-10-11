import React, { useState, useRef, useEffect } from 'react';
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
  Users,
  ChevronDown 
} from 'lucide-react';
import { api } from '../../services/api';
import { VoiceDictaphone } from '../../components/VoiceDictaphone';

interface Props {
  onNavigate: (tab: string) => void;
  onCaseCreated?: (publicCaseId: string, rawPin: string) => void;
}

const CATEGORY_OPTIONS = [
  { label: 'Harassment', type: 'safety', icon: ShieldAlert, badge: 'Safety' },
  { label: 'Bullying / Ragging', type: 'safety', icon: ShieldAlert, badge: 'Safety' },
  { label: 'Unsafe Activity', type: 'safety', icon: ShieldAlert, badge: 'Safety' },
  { label: 'Suspicious Behavior', type: 'safety', icon: ShieldAlert, badge: 'Safety' },
  { label: 'Facility Hazard', type: 'maintenance', icon: Wrench, badge: 'Facilities' },
  { label: 'Hostel Defect', type: 'maintenance', icon: Wrench, badge: 'Facilities' },
  { label: 'Lost Property', type: 'lost_found', icon: Search, badge: 'Lost & Found' },
  { label: 'Welfare Concern', type: 'other', icon: Users, badge: 'Welfare' }
];

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

const STEP_LABELS = ['Issue', 'Location', 'Time', 'Evidence', 'Submit'];

export const ReportSafely: React.FC<Props> = ({ onNavigate, onCaseCreated }) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState('Harassment');
  const [reportType, setReportType] = useState('safety');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const catDropdownRef = useRef<HTMLDivElement>(null);

  const [location, setLocation] = useState('Electronics Lab');
  const [customLocationDetail, setCustomLocationDetail] = useState('');
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [locSearch, setLocSearch] = useState('');
  const locDropdownRef = useRef<HTMLDivElement>(null);

  const [aiCollapsibleOpen, setAiCollapsibleOpen] = useState(false);

  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('Today');
  const [approxTime, setApproxTime] = useState('Approx. 5:30 PM');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [emailCheckMessage, setEmailCheckMessage] = useState<string>('');

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (locDropdownRef.current && !locDropdownRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  const handleVerifyContactEmail = async (contactVal: string) => {
    if (!contactVal || !contactVal.includes('@')) {
      setEmailCheckStatus('idle');
      setEmailCheckMessage('');
      return;
    }
    try {
      setEmailCheckStatus('checking');
      setEmailCheckMessage('Checking mail server (Free DNS MX check)...');
      const res = await api.verifyEmail(contactVal.trim());
      if (res.isValid) {
        setEmailCheckStatus('valid');
        setEmailCheckMessage(
          res.details?.isGmail 
            ? '✓ Valid Google Gmail address' 
            : `✓ Active mail server found (${res.details?.domain})`
        );
      } else {
        setEmailCheckStatus('invalid');
        setEmailCheckMessage(`⚠️ ${res.error || 'Invalid email address'}`);
      }
    } catch {
      setEmailCheckStatus('idle');
      setEmailCheckMessage('');
    }
  };

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

  const selectedCategoryObj =
    CATEGORY_OPTIONS.find((c) => c.label.toLowerCase() === category.toLowerCase()) ||
    CATEGORY_OPTIONS.find((c) => category.toLowerCase().includes(c.label.toLowerCase().slice(0, 6))) ||
    CATEGORY_OPTIONS[0];
  const SelectedCatIcon = selectedCategoryObj.icon;

  const filteredCategories = CATEGORY_OPTIONS.filter((c) =>
    c.label.toLowerCase().includes(catSearch.toLowerCase()) ||
    c.badge.toLowerCase().includes(catSearch.toLowerCase())
  );

  const filteredLocations = PREDEFINED_LOCATIONS.filter((l) =>
    l.toLowerCase().includes(locSearch.toLowerCase())
  );

  return (
    <div className="max-w-xl mx-auto py-3 sm:py-6 px-3 sm:px-4 space-y-3 sm:space-y-4 relative z-10">
      {/* Header Banner - Compact & Mobile-Friendly */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-[#0066FF] border border-blue-100 flex items-center justify-center shadow-2xs shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-heading leading-tight">
              Confidential Report
            </h1>
            <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
              Encrypted reporting with private PIN tracking
            </p>
          </div>
        </div>

        <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] sm:text-[11px] text-emerald-700 font-medium shadow-2xs shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Shield Active</span>
        </div>
      </div>

      {/* Progress Steps: Mobile Progress Bar vs Desktop Stepper */}
      {/* Mobile: Step X of 5 with Progress Bar */}
      <div className="sm:hidden bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#0066FF]">Step {step} of 5</span>
          <span className="text-slate-600 font-semibold">{STEP_LABELS[step - 1]}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0066FF] rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: Compact 5-Step Stepper */}
      <div className="hidden sm:flex items-center gap-1 p-1 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        {STEP_LABELS.map((label, idx) => {
          const num = idx + 1;
          return (
            <button
              key={num}
              type="button"
              onClick={() => num < step && setStep(num)}
              className={`flex-1 py-1.5 text-center rounded-xl text-xs font-medium transition-all ${
                step === num
                  ? 'bg-[#0066FF] text-white font-semibold shadow-2xs'
                  : step > num
                  ? 'text-[#0066FF] hover:bg-blue-50 font-medium cursor-pointer'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              {num}. {label}
            </button>
          );
        })}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-6 space-y-4 shadow-xs">
        {/* STEP 1: ISSUE / WHAT HAPPENED */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Searchable Concern Category Dropdown */}
            <div className="space-y-1.5" ref={catDropdownRef}>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Concern Category
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/70 border border-slate-200/90 hover:bg-white hover:border-[#0066FF]/70 text-slate-900 text-xs font-medium transition-all cursor-pointer shadow-2xs focus:ring-2 focus:ring-[#0066FF]/20"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0066FF] shrink-0">
                      <SelectedCatIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-slate-900 truncate">{selectedCategoryObj.label}</span>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                      {selectedCategoryObj.badge}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {categoryDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-1.5 max-h-72 flex flex-col"
                    >
                      {/* Search box inside dropdown */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={catSearch}
                          onChange={(e) => setCatSearch(e.target.value)}
                          placeholder="Search category..."
                          autoFocus
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0066FF] focus:bg-white"
                        />
                      </div>

                      <div className="overflow-y-auto space-y-0.5 max-h-52 pr-1">
                        {filteredCategories.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400 font-medium">
                            No matching category found
                          </div>
                        ) : (
                          filteredCategories.map((item) => {
                            const isSelected = category.toLowerCase().includes(item.label.toLowerCase().slice(0, 8));
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => {
                                  setCategory(item.label);
                                  setReportType(item.type);
                                  setCategoryDropdownOpen(false);
                                  setCatSearch('');
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                                  isSelected
                                    ? 'bg-blue-50 text-[#0066FF] font-semibold'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#0066FF]' : 'text-slate-400'}`} />
                                  <span className="truncate">{item.label}</span>
                                  <span className="text-[10px] text-slate-400">({item.badge})</span>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Description & Voice Dictation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Detailed Description
                </label>
                <span className="text-[10px] sm:text-[11px] font-medium text-[#0066FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  Multilingual Voice Enabled
                </span>
              </div>

              {/* Multilingual Voice Dictaphone with Collapsible Prompts */}
              <VoiceDictaphone
                onTranscript={(text) => {
                  setDescription((prev) => (prev ? `${prev} ${text}` : text));
                }}
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred with as much detail as possible... (You may type or use voice dictation)"
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 text-xs placeholder:text-slate-400 resize-none transition-all outline-none"
              />
            </div>

            {/* Collapsible Smart AI Triage & Routing */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setAiCollapsibleOpen((prev) => !prev)}
                className="w-full p-2.5 sm:p-3 flex items-center justify-between text-slate-700 font-semibold cursor-pointer hover:bg-blue-50/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0066FF]" />
                  <span>Smart AI Triage &amp; Routing</span>
                  {aiPreview && (
                    <span className="text-[10px] font-semibold text-[#0066FF] bg-blue-100 px-2 py-0.5 rounded-full">
                      Analyzed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[#0066FF] text-[11px] font-medium">
                  <span>{aiCollapsibleOpen ? 'Hide' : 'Preview Routing'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${aiCollapsibleOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {aiCollapsibleOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 pt-0 border-t border-blue-100 space-y-2 overflow-hidden"
                  >
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-slate-500">Auto-routes to department &amp; priority</span>
                      <button
                        type="button"
                        onClick={triggerAiPreview}
                        disabled={triaging || !description.trim()}
                        className="text-xs font-semibold px-3 py-1 bg-white border border-blue-200 text-[#0066FF] rounded-lg hover:bg-blue-50 disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        {triaging ? 'Analyzing with AI...' : 'Run AI Analysis →'}
                      </button>
                    </div>

                    {aiPreview && (
                      <div className="p-3 rounded-xl bg-white border border-blue-200 text-xs text-slate-800 space-y-1 shadow-2xs">
                        <div className="flex justify-between font-semibold">
                          <span className="text-[#0066FF]">Assigned Dept: {aiPreview.suggested_department_name}</span>
                          <span className="font-mono text-slate-700 font-bold">Priority: {aiPreview.priority_suggestion}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic">"{aiPreview.reasoning}"</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-end pt-1">
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-xs"
              >
                <span>Continue to Location</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: WHERE / LOCATION */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Searchable Compact Location Dropdown */}
            <div className="space-y-1.5" ref={locDropdownRef}>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Campus Location
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLocationDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/70 border border-slate-200/90 hover:bg-white hover:border-[#0066FF]/70 text-slate-900 text-xs font-medium transition-all cursor-pointer shadow-2xs focus:ring-2 focus:ring-[#0066FF]/20"
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-4 h-4 text-[#0066FF] shrink-0" />
                    <span className="font-semibold text-slate-900 truncate">{location}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${locationDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {locationDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-1.5 max-h-72 flex flex-col"
                    >
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={locSearch}
                          onChange={(e) => setLocSearch(e.target.value)}
                          placeholder="Search campus location..."
                          autoFocus
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0066FF] focus:bg-white"
                        />
                      </div>

                      <div className="overflow-y-auto space-y-0.5 max-h-52 pr-1">
                        {filteredLocations.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400 font-medium">
                            No matching location found
                          </div>
                        ) : (
                          filteredLocations.map((loc) => {
                            const isSelected = location === loc;
                            return (
                              <button
                                key={loc}
                                type="button"
                                onClick={() => {
                                  setLocation(loc);
                                  setLocationDropdownOpen(false);
                                  setLocSearch('');
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                                  isSelected
                                    ? 'bg-blue-50 text-[#0066FF] font-semibold'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#0066FF]' : 'text-slate-400'}`} />
                                  <span className="truncate">{loc}</span>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Specific Room or Landmark (Optional)
              </label>
              <input
                type="text"
                value={customLocationDetail}
                onChange={(e) => setCustomLocationDetail(e.target.value)}
                placeholder="e.g. 2nd Floor corridor, near Room 204 or Stairwell B"
                className="w-full p-2.5 sm:p-3 rounded-xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 text-xs placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-xs"
              >
                <span>Continue to Time</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: WHEN / TIME */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Approximate Date
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Today', 'Yesterday', 'Earlier This Week', 'Unsure'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setIncidentDate(d)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-center cursor-pointer ${
                      incidentDate === d
                        ? 'border-[#0066FF] bg-blue-50 text-[#0066FF] ring-1 ring-blue-500/20 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Approximate Time
              </label>
              <input
                type="text"
                value={approxTime}
                onChange={(e) => setApproxTime(e.target.value)}
                placeholder="e.g. Around 5:30 PM, During lunch break, or Late evening"
                className="w-full p-2.5 sm:p-3 rounded-xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 text-xs placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-xs"
              >
                <span>Continue to Evidence</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: EVIDENCE */}
        {step === 4 && (
          <div className="space-y-4">
            {/* Clean Drop Zone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-[#0066FF] bg-slate-50/50 rounded-2xl p-4 sm:p-5 text-center transition-colors">
              <Upload className="w-7 h-7 text-[#0066FF] mx-auto mb-1.5 opacity-80" />
              <p className="text-xs font-semibold text-slate-800">
                Attach Screenshots, Photos, or Documents (Optional)
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP, or PDF up to 10MB</p>
              <label className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer">
                <span>Choose File to Upload</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="hidden"
                />
              </label>
              {uploading && <p className="text-xs text-[#0066FF] mt-1.5 font-medium animate-pulse">Uploading securely...</p>}
            </div>

            {/* Uploaded List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-1.5">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={file.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
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

            <div className="flex justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1 px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-xs"
              >
                <span>Continue to Submit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: PRIVACY & SUBMIT */}
        {step === 5 && (
          <div className="space-y-4">
            {/* Identity Switcher */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {isAnonymous ? 'Anonymous Mode: Active' : 'Identified Mode'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAnonymous ? 'Zero personal data logged.' : 'Name & contact attached for follow-up.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 cursor-pointer shadow-2xs shrink-0"
              >
                {isAnonymous ? 'Add Identity' : 'Make Anonymous'}
              </button>
            </div>

            {!isAnonymous && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Your Name (Optional)"
                    className="p-2.5 sm:p-3 rounded-xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs placeholder:text-slate-400 outline-none"
                  />
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={reporterContact}
                      onChange={(e) => {
                        setReporterContact(e.target.value);
                        if (emailCheckStatus !== 'idle') {
                          setEmailCheckStatus('idle');
                          setEmailCheckMessage('');
                        }
                      }}
                      onBlur={() => handleVerifyContactEmail(reporterContact)}
                      placeholder="Student Email or Phone Number"
                      className={`w-full p-2.5 sm:p-3 rounded-xl bg-slate-50/60 border text-slate-900 text-xs placeholder:text-slate-400 outline-none transition-all ${
                        emailCheckStatus === 'valid'
                          ? 'border-emerald-500 bg-emerald-50/20'
                          : emailCheckStatus === 'invalid'
                          ? 'border-rose-400 bg-rose-50/30'
                          : 'border-slate-200 focus:bg-white focus:border-[#0066FF]'
                      }`}
                    />
                    {emailCheckMessage && (
                      <p className={`text-[10px] font-medium px-1 flex items-center gap-1 ${
                        emailCheckStatus === 'valid' 
                          ? 'text-emerald-700' 
                          : emailCheckStatus === 'invalid' 
                          ? 'text-rose-600' 
                          : 'text-slate-500'
                      }`}>
                        {emailCheckStatus === 'checking' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping inline-block" />}
                        {emailCheckMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Summary Pill */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Category: <strong className="text-slate-900">{category}</strong></span>
                <span>Location: <strong className="text-slate-900">{location}</strong></span>
              </div>
              <p className="text-[11px] text-slate-600 italic line-clamp-2">"{description}"</p>
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-1 px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
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
