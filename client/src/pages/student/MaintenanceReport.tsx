import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, Sparkles, Upload, MapPin, CheckCircle, Copy, Check, AlertCircle, Camera, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
  onNavigate: (tab: string) => void;
  onCaseCreated?: (publicCaseId: string, rawPin: string) => void;
}

export const MaintenanceReport: React.FC<Props> = ({ onNavigate, onCaseCreated }) => {
  const [issueType, setIssueType] = useState('Broken Fan / Ceiling Fixture');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [attachedImage, setAttachedImage] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Classification analysis result from Gemini 3.5 Flash Vision
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);

  // Result dialog
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

      // Upload file to server vault
      const res = await api.uploadEvidence(file);
      setAttachedImage(res.file);

      // Read image as base64 for Gemini 3.5 Flash Multimodal Vision
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
      setError('Please provide a description of the maintenance issue.');
      return;
    }
    if (!location.trim()) {
      setError('Please provide the building, room, or campus location.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await api.createCase({
        reportType: 'maintenance',
        category: 'Maintenance',
        subcategory: issueType,
        description: description.trim(),
        location: location.trim(),
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
      setError(err.message || 'Submission failed');
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
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white shadow-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-400/30">
            <Wrench className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Campus Maintenance & Repairs</h1>
            <p className="text-xs text-amber-200 mt-0.5">
              Submit electrical, plumbing, lab equipment, furniture, or classroom repair requests.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs border border-amber-400/30 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini Vision Active</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Issue Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              'Broken Fan / Ceiling Fixture',
              'Broken Light / Lighting',
              'Electrical Spark / Switch',
              'Water Leakage / Plumbing',
              'Damaged Furniture / Desk',
              'Classroom Projector / AV',
              'Lab Equipment Defect',
              'Sanitation / Cleanliness'
            ].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setIssueType(type)}
                className={`p-3 text-xs text-left rounded-xl border transition-all font-medium ${
                  issueType === type
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold ring-1 ring-amber-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Campus Location & Room / Block
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-amber-600 absolute left-3 top-3.5" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Building - Room 304, Electronics Lab Workstation 3, Hostel Block B Floor 1"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Problem Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what is broken, abnormal sounds, water leaking, sparks, or hazards..."
            rows={4}
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            required
          />
        </div>

        {/* Real Photo Upload & Multimodal Gemini Vision Inspection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Upload Defect Photo (AI Vision Analysis)
          </label>

          {!attachedImage ? (
            <div className="border-2 border-dashed border-amber-300 dark:border-amber-900 rounded-2xl p-6 text-center bg-amber-50/30 dark:bg-amber-950/20">
              <Camera className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Attach a photo of the defect
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Gemini Multimodal Vision will inspect the image in real-time, assess the damage, and determine priority.
              </p>
              <label className="mt-3.5 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
              </label>
              {uploading && <p className="text-xs text-amber-700 mt-2 animate-pulse">Uploading and sanitizing image...</p>}
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-300">
                    <img
                      src={attachedImage.sanitizedPreviewPath}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                      {attachedImage.fileName}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium">✓ Securely attached to work order</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAttachedImage(null);
                    setAiAnalysis(null);
                  }}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Gemini 3.5 Flash Multimodal Vision Output */}
              {analyzingAi ? (
                <div className="p-4 bg-purple-50 rounded-xl text-xs text-purple-700 flex items-center gap-2.5 animate-pulse border border-purple-200">
                  <Sparkles className="w-4 h-4 animate-spin text-purple-600 shrink-0" />
                  <span>Google Gemini Multimodal Vision inspecting image pixels...</span>
                </div>
              ) : aiAnalysis ? (
                <div className="p-4 rounded-xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Gemini Vision Inspection Report
                    </span>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-900 font-bold">
                      Confidence: {Math.round(aiAnalysis.confidence * 100)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-purple-100 dark:border-purple-900">
                      <span className="text-slate-500 block text-[10px]">Detected Defect</span>
                      <strong className="text-slate-800 dark:text-slate-200 block truncate">{aiAnalysis.subcategory || issueType}</strong>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-purple-100 dark:border-purple-900">
                      <span className="text-slate-500 block text-[10px]">Assessed Priority</span>
                      <strong className="text-amber-700 font-bold block">{aiAnalysis.priority}</strong>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-purple-100 dark:border-purple-900 col-span-2 sm:col-span-1">
                      <span className="text-slate-500 block text-[10px]">Assigned Team</span>
                      <strong className="text-slate-800 dark:text-slate-200 block truncate">{aiAnalysis.suggestedDepartment}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-purple-800 dark:text-purple-300 italic bg-white/60 dark:bg-slate-800/60 p-2 rounded border border-purple-100">
                    "{aiAnalysis.detectedIssue}"
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Identity Shield: <strong>ACTIVE</strong> (Anonymous)</span>
          <span>Cryptographic PIN Generated Upon Submit</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
        >
          {loading ? 'Submitting Work Order...' : '🔧 Submit Maintenance Request'}
        </button>
      </form>

      {/* Post Submission Modal */}
      <AnimatePresence>
        {createdCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-amber-300 dark:border-amber-900 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Work Order Created
                </h2>
                <p className="text-xs text-slate-500">
                  Routed to the designated facilities maintenance department.
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

              <button
                type="button"
                onClick={() => onNavigate('track_report')}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm text-center shadow-md transition-colors"
              >
                Track Maintenance Work Order →
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
