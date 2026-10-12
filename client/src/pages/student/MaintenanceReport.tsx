import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, Sparkles, Upload, MapPin, CheckCircle, Copy, Check, AlertCircle, Camera, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
  onNavigate: (tab: string) => void;
  onCaseCreated?: (publicCaseId: string, rawPin: string) => void;
}

export const MaintenanceReport: React.FC<Props> = ({ onNavigate, onCaseCreated }) => {
  const [issueType, setIssueType] = useState('');
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
    if (!issueType) {
      setError('Please select a defect category.');
      return;
    }
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

      if (res.success && res.publicCaseId && res.rawPin) {
        setCreatedCase({
          publicCaseId: res.publicCaseId,
          rawPin: res.rawPin
        });
        if (onCaseCreated) {
          onCaseCreated(res.publicCaseId, res.rawPin);
        }
        setIssueType('');
        setLocation('');
        setDescription('');
        setAttachedImage(null);
        setAiAnalysis(null);
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
      {/* Warm Amber Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-6 rounded-3xl bg-[#FFF9EE] border border-[#FEE8B7] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FEE8B7] text-[#B54708] border border-[#FED986] flex items-center justify-center shadow-xs">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-heading">
              Facilities & Campus Services
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Report broken fixtures, electrical sparks, plumbing, or classroom hardware
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#FEE8B7] text-xs text-[#B54708] font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#B54708]" />
          <span>AI Vision Diagnostic Active</span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Select Defect Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                className={`p-3 text-xs text-left rounded-2xl border transition-all cursor-pointer truncate ${
                  issueType === type
                    ? 'border-[#B54708] bg-[#FFF9EE] text-[#B54708] ring-2 ring-amber-500/20 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Location (Building / Room / Floor)
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-[#B54708] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Building, room number, or floor"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 text-xs placeholder:text-slate-400 outline-none transition-all"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Defect Details & Urgency
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the maintenance defect or issue..."
            rows={3}
            className="w-full p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-slate-900 text-xs placeholder:text-slate-400 resize-none outline-none transition-all"
            required
          />
        </div>

        {/* Defect Photo & Gemini Vision */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Attach Defect Photo (AI Vision Auto-Inspection)
          </label>

          {!attachedImage ? (
            <div className="border-2 border-dashed border-slate-200 hover:border-[#B54708] bg-slate-50/50 rounded-3xl p-6 text-center transition-colors">
              <Camera className="w-8 h-8 text-[#B54708] mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-slate-800">
                Snap or upload defect photo
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">AI automatically detects fixture defects</p>
              <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#B54708]" />
                <span>Upload Defect Photo</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
              </label>
              {uploading && <p className="text-xs text-[#B54708] mt-2 font-medium animate-pulse">Uploading photo...</p>}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <Camera className="w-4 h-4 text-[#B54708]" />
                <span className="text-slate-800 font-medium truncate">{attachedImage.fileName}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachedImage(null);
                  setAiAnalysis(null);
                }}
                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {analyzingAi && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 mt-2.5 animate-pulse flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B54708]" />
              <span className="font-medium">Gemini Vision is inspecting photo to auto-categorize defect...</span>
            </div>
          )}

          {aiAnalysis && (
            <div className="mt-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Detected Defect: {aiAnalysis.detectedIssue || aiAnalysis.subcategory}</span>
                <span className="font-mono text-[#B54708]">Priority: {aiAnalysis.priority}</span>
              </div>
              <p className="text-[11px] text-slate-600">Suggested Dept: {aiAnalysis.suggestedDepartment}</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Submitting Request...' : 'Submit Facilities Request →'}
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
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#B54708] flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 font-heading">Maintenance Request Dispatched</h2>
                <p className="text-xs text-slate-500">Your repair ticket has been routed to Facilities & Estate Management.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Service Case ID</span>
                    <div className="text-xl font-mono font-bold text-[#B54708]">
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
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Private PIN</span>
                    <div className="text-xl font-mono font-bold text-slate-800">
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
                Track Service Ticket →
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
