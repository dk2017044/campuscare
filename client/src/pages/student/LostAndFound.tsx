import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, MapPin, CheckCircle, ArrowRight, Check, Copy, Clock, Filter, Eye, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { LostFoundItem, LostFoundMatch, StaffUser } from '../../types';

interface Props {
  onNavigate: (tab: string) => void;
  onCaseCreated?: (publicCaseId: string, rawPin: string) => void;
  staffUser?: StaffUser | null;
}

export const LostAndFound: React.FC<Props> = ({ onNavigate, onCaseCreated, staffUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'browse' | 'report_lost' | 'report_found'>('browse');
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recentReportResult, setRecentReportResult] = useState<{
    publicCaseId: string;
    rawPin: string;
    potentialMatches: LostFoundMatch[];
  } | null>(null);

  const [copiedId, setCopiedId] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  useEffect(() => {
    loadItems();
  }, [filterType]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await api.getLostFoundItems(filterType);
      setItems(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (type: 'lost' | 'found') => {
    if (!title.trim()) {
      setError('Please provide the item name.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await api.reportLostFound({
        type,
        title: title.trim(),
        itemType: itemType.trim(),
        brand: brand.trim(),
        color: color.trim(),
        location: location.trim(),
        date: date.trim(),
        description: description.trim(),
        contactInfo: contactInfo.trim() || null
      });

      if (res.success) {
        setRecentReportResult({
          publicCaseId: res.publicCaseId,
          rawPin: res.rawPin,
          potentialMatches: res.potentialMatches || []
        });
        if (onCaseCreated) {
          onCaseCreated(res.publicCaseId, res.rawPin);
        }
        setTitle('');
        setItemType('');
        setBrand('');
        setColor('');
        setLocation('');
        setDate('');
        setDescription('');
        setContactInfo('');
        loadItems();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
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

  const matchedPair = useMemo(() => {
    const lostItems = items.filter((i) => i.type === 'lost');
    const foundItems = items.filter((i) => i.type === 'found');
    for (const l of lostItems) {
      for (const f of foundItems) {
        if (l.itemType && f.itemType && l.itemType.trim().toLowerCase() === f.itemType.trim().toLowerCase()) {
          return { lost: l, found: f };
        }
        const lTitle = (l.title || '').trim().toLowerCase();
        const fTitle = (f.title || '').trim().toLowerCase();
        if (lTitle && fTitle && (lTitle.includes(fTitle) || fTitle.includes(lTitle))) {
          return { lost: l, found: f };
        }
      }
    }
    return null;
  }, [items]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 relative z-10">
      {/* Mint Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-[#F0FDF9] border border-[#CCFBEF] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#CCFBEF] text-[#0E9384] border border-[#99F6E0] flex items-center justify-center shadow-xs">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-heading">
              Lost & Found Registry
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Smart automated correlation for misplaced university property
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('report_lost')}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-white border border-[#FED4D1] text-[#B42318] hover:bg-[#FFF0ED] shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Lost</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('report_found')}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-white border border-[#99F6E0] text-[#0E9384] hover:bg-[#E6FAF4] shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Found</span>
          </button>
        </div>

        {staffUser && (
          <div className="w-full pt-3 mt-1 border-t border-[#99F6E0]/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#0E9384] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#0E9384] animate-pulse" />
              <span>
                Staff Officer Jurisdiction: <strong>{staffUser.name}</strong> ({staffUser.departmentName || 'General Staff'})
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[#0E9384] font-bold border border-[#99F6E0]">
              Staff ID: {staffUser.staffId}
            </span>
          </div>
        )}
      </div>

      {/* Sleek Segmented Pill Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-white border border-slate-200/80 shadow-xs max-w-md mx-auto">
        {[
          { id: 'browse', label: `Browse Registry (${items.length})` },
          { id: 'report_lost', label: 'Report Lost Item' },
          { id: 'report_found', label: 'Report Found Item' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveSubTab(tab.id as any);
              setRecentReportResult(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer text-center ${
              activeSubTab === tab.id
                ? 'bg-[#0066FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: BROWSE */}
      {activeSubTab === 'browse' && (
        <div className="space-y-6">
          {/* AI Match Spotlight */}
          {matchedPair && (
            <div className="p-5 rounded-3xl bg-[#F0FDF9] border border-[#99F6E0] space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#0E9384] font-bold">
                  <Sparkles className="w-4 h-4 text-[#0E9384]" />
                  <span>AI Match Correlation Detected</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-[10px] text-[#0E9384] font-bold border border-[#99F6E0] shadow-xs">
                  High Confidence Match
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white border border-[#FED4D1] space-y-1 shadow-xs">
                  <div className="flex justify-between text-[10px] text-[#D92D20] font-bold uppercase">
                    <span>Lost Item</span>
                    <span className="font-mono">{matchedPair.lost.publicCaseId || 'Logged'}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{matchedPair.lost.title}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-[#D92D20]" />
                    <span>{matchedPair.lost.location}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#99F6E0] space-y-1 shadow-xs">
                  <div className="flex justify-between text-[10px] text-[#0E9384] font-bold uppercase">
                    <span>Found Item</span>
                    <span className="font-mono">{matchedPair.found.publicCaseId || 'Logged'}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{matchedPair.found.title}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-[#0E9384]" />
                    <span>{matchedPair.found.location}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Registered Items
            </span>
            <div className="flex items-center gap-1 text-xs bg-white border border-slate-200/80 p-1 rounded-full shadow-xs">
              {(['all', 'lost', 'found'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-full capitalize text-xs font-semibold transition-all cursor-pointer ${
                    filterType === t
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.type === 'lost'
                          ? 'bg-[#FFF0ED] text-[#B42318] border border-[#FED4D1]'
                          : 'bg-[#F0FDF9] text-[#0E9384] border border-[#CCFBEF]'
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px] font-semibold">{item.publicCaseId || 'CC-LOG'}</span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {item.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[140px] font-medium">{item.location}</span>
                  </div>
                  <span className="text-[11px] font-medium">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2 & 3: FORM */}
      {(activeSubTab === 'report_lost' || activeSubTab === 'report_found') && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-heading">
              {activeSubTab === 'report_lost' ? 'Log a Lost Property Item' : 'Log a Found Property Item'}
            </h2>
            <span className="text-xs font-semibold text-[#0E9384] bg-[#F0FDF9] px-2.5 py-1 rounded-full border border-[#CCFBEF]">
              AI Auto-Matcher Enabled
            </span>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Item Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Item title or name"
                className="w-full p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Category</label>
              <input
                type="text"
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                placeholder="Category (Electronics, Cards, Bag)"
                className="w-full p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Color / Finish</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Color or appearance"
                className="w-full p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Campus Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where was it lost or found?"
                className="w-full p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Date Incident Occurred</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Date of incident"
                className="w-full p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Distinctive Marks / Clues</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any distinguishing marks, serials, or details..."
                rows={2}
                className="w-full p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200 focus:bg-white focus:border-[#0066FF] text-slate-900 text-xs placeholder:text-slate-400 resize-none outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleReport(activeSubTab === 'report_lost' ? 'lost' : 'found')}
            disabled={submitting}
            className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 shadow-xs ${
              activeSubTab === 'report_lost'
                ? 'bg-[#D92D20] hover:bg-[#B42318] text-white shadow-md shadow-red-500/20'
                : 'bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-md shadow-blue-500/20'
            }`}
          >
            {submitting ? 'Registering in Index...' : activeSubTab === 'report_lost' ? 'Submit Lost Item Registry →' : 'Submit Found Item Registry →'}
          </button>
        </div>
      )}

      {/* Match Result Modal */}
      <AnimatePresence>
        {recentReportResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl max-w-md w-full p-7 border border-slate-200 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-[#CCFBEF] text-[#0E9384] flex items-center justify-center mx-auto border border-[#99F6E0] shadow-xs">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 font-heading">Item Successfully Registered</h2>
                <p className="text-xs text-slate-500">Indexed in real-time AI cross-match database.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Item Case ID</span>
                    <div className="text-xl font-mono font-bold text-[#0E9384]">
                      {recentReportResult.publicCaseId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(recentReportResult.publicCaseId, 'id')}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 shadow-xs"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Private Tracking PIN</span>
                    <div className="text-xl font-mono font-bold text-amber-700">
                      {recentReportResult.rawPin}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(recentReportResult.rawPin, 'pin')}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 shadow-xs"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {recentReportResult.potentialMatches.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#F0FDF9] border border-[#99F6E0] text-xs text-slate-800 space-y-1 shadow-xs">
                  <span className="font-bold text-[#0E9384] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#0E9384]" />
                    Potential Match Found ({recentReportResult.potentialMatches[0].confidence}%)
                  </span>
                  <p className="text-[11px] text-slate-600">
                    Matches: {recentReportResult.potentialMatches[0].candidateItem.title} at {recentReportResult.potentialMatches[0].candidateItem.location}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRecentReportResult(null);
                    setActiveSubTab('browse');
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-xs text-center cursor-pointer shadow-xs"
                >
                  View in Registry →
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
