import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, MapPin, CheckCircle, ArrowRight, Check, Copy, Clock, Filter, Eye } from 'lucide-react';
import { api } from '../../services/api';
import { LostFoundItem, LostFoundMatch } from '../../types';

interface Props {
  onNavigate: (tab: string) => void;
  onCaseCreated?: (publicCaseId: string, rawPin: string) => void;
}

export const LostAndFound: React.FC<Props> = ({ onNavigate, onCaseCreated }) => {
  const [activeSubTab, setActiveSubTab] = useState<'browse' | 'report_lost' | 'report_found'>('browse');
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState('Calculator');
  const [brand, setBrand] = useState('Casio');
  const [color, setColor] = useState('Black');
  const [location, setLocation] = useState('Electronics Lab');
  const [date, setDate] = useState('Today');
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
        itemType,
        brand,
        color,
        location,
        date,
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
    const lostItems = items.filter(i => i.type === 'lost');
    const foundItems = items.filter(i => i.type === 'found');
    for (const l of lostItems) {
      for (const f of foundItems) {
        const lWords = `${l.title} ${l.itemType || ''}`.toLowerCase();
        const fWords = `${f.title} ${f.itemType || ''}`.toLowerCase();
        if (lWords.includes('calculator') && fWords.includes('calculator')) {
          return { lost: l, found: f };
        }
      }
    }
    return null;
  }, [items]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 relative z-10">
      {/* Minimal Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Lost & Found Registry</h1>
            <p className="text-[11px] text-slate-400">Smart correlation for misplaced campus property</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('report_lost')}
            className="text-xs font-medium px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
          >
            + Report Lost
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('report_found')}
            className="text-xs font-medium px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition-all cursor-pointer"
          >
            + Report Found
          </button>
        </div>
      </div>

      {/* Sleek Segmented Glass Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl glass-panel">
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
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-teal-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: BROWSE */}
      {activeSubTab === 'browse' && (
        <div className="space-y-5">
          {/* AI Match Spotlight if detected */}
          {matchedPair && (
            <div className="p-4 rounded-2xl glass-panel border border-teal-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-teal-300 font-semibold">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>AI Match Correlation Detected</span>
                </div>
                <span className="px-2 py-0.5 rounded-full glass-pill text-[10px] text-teal-300 font-mono">
                  High Confidence
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl glass-pill space-y-1">
                  <div className="flex justify-between text-[10px] text-rose-400 font-semibold">
                    <span>LOST REPORT</span>
                    <span className="font-mono">{matchedPair.lost.publicCaseId || 'Logged'}</span>
                  </div>
                  <h4 className="font-semibold text-white">{matchedPair.lost.title}</h4>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>{matchedPair.lost.location}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl glass-pill space-y-1">
                  <div className="flex justify-between text-[10px] text-teal-400 font-semibold">
                    <span>FOUND REPORT</span>
                    <span className="font-mono">{matchedPair.found.publicCaseId || 'Logged'}</span>
                  </div>
                  <h4 className="font-semibold text-white">{matchedPair.found.title}</h4>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3 text-teal-400" />
                    <span>{matchedPair.found.location}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Filtered Registry</span>
            <div className="flex items-center gap-1 text-xs">
              {(['all', 'lost', 'found'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-lg capitalize text-xs font-medium transition-all cursor-pointer ${
                    filterType === t
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl glass-panel-interactive flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.type === 'lost'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                          : 'bg-teal-500/15 text-teal-300 border border-teal-500/20'
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">{item.publicCaseId || 'CC-LOG'}</span>
                  </div>

                  <h4 className="font-semibold text-sm text-white">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {item.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-teal-400" />
                    <span className="truncate max-w-[130px]">{item.location}</span>
                  </div>
                  <span className="text-[11px]">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2 & 3: FORM */}
      {(activeSubTab === 'report_lost' || activeSubTab === 'report_found') && (
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {activeSubTab === 'report_lost' ? 'Log Lost Item' : 'Log Found Item'}
            </h2>
            <span className="text-[11px] text-slate-400">Automatic matching active</span>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Item Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Casio fx-991EX Scientific Calculator"
                className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Item Type</label>
              <input
                type="text"
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                placeholder="Calculator, Wallet, ID Card, Keys, etc."
                className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Black, Silver, Blue, etc."
                className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Campus Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Electronics Lab, Library, etc."
                className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Date</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Today, Yesterday"
                className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder:text-slate-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Description / Marks</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Distinctive marks, stickers, model..."
                rows={2}
                className="w-full p-2.5 rounded-xl glass-input text-white text-xs placeholder:text-slate-500 resize-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleReport(activeSubTab === 'report_lost' ? 'lost' : 'found')}
            disabled={submitting}
            className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 ${
              activeSubTab === 'report_lost'
                ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.3)]'
            }`}
          >
            {submitting ? 'Registering...' : activeSubTab === 'report_lost' ? 'Submit Lost Item' : 'Submit Found Item'}
          </button>
        </div>
      )}

      {/* Match Result Modal */}
      <AnimatePresence>
        {recentReportResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel bg-slate-900/90 rounded-3xl max-w-md w-full p-6 border border-white/10 shadow-2xl space-y-4"
            >
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/20">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white">Item Registered</h2>
                <p className="text-xs text-slate-400">Added to the AI matching index.</p>
              </div>

              <div className="p-4 rounded-2xl glass-card space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Case ID</span>
                    <div className="text-xl font-mono font-bold text-teal-400">
                      {recentReportResult.publicCaseId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(recentReportResult.publicCaseId, 'id')}
                    className="px-2.5 py-1 rounded-lg glass-pill text-xs text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">PIN</span>
                    <div className="text-xl font-mono font-bold text-amber-400">
                      {recentReportResult.rawPin}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(recentReportResult.rawPin, 'pin')}
                    className="px-2.5 py-1 rounded-lg glass-pill text-xs text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {recentReportResult.potentialMatches.length > 0 && (
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-xs text-teal-200 space-y-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    Match Found ({recentReportResult.potentialMatches[0].confidence}%)
                  </span>
                  <p className="text-[11px] text-slate-300">
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
                  className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs text-center cursor-pointer shadow-[0_0_15px_rgba(20,184,166,0.25)]"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
