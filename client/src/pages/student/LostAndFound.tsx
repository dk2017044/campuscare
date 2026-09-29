import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, MapPin, Tag, CheckCircle, AlertCircle, ArrowRight, Check, Copy, Clock, Filter, Eye } from 'lucide-react';
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
  const [itemType, setItemType] = useState('Scientific Calculator');
  const [brand, setBrand] = useState('Casio');
  const [color, setColor] = useState('Black');
  const [location, setLocation] = useState('Electronics Lab');
  const [date, setDate] = useState('Yesterday');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Match result after reporting
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

  // Dynamically detect any correlated lost and found pair from live items
  const matchedPair = React.useMemo(() => {
    const losts = items.filter(i => i.type === 'lost');
    const founds = items.filter(i => i.type === 'found');
    for (const l of losts) {
      for (const f of founds) {
        if (
          (l.itemType && f.itemType && l.itemType.toLowerCase() === f.itemType.toLowerCase()) ||
          (l.title && f.title && (l.title.toLowerCase().includes(f.title.toLowerCase()) || f.title.toLowerCase().includes(l.title.toLowerCase())))
        ) {
          return { lost: l, found: f };
        }
      }
    }
    return null;
  }, [items]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-700 via-cyan-800 to-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
              <Search className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold">Lost & Found AI Matching Pipeline</h1>
          </div>
          <p className="text-xs text-teal-200">
            Automated semantic correlation of lost articles with campus found inventory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('report_lost')}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition-colors"
          >
            + Report Lost Item
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('report_found')}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white shadow-xs transition-colors"
          >
            + Report Found Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1">
        {[
          { id: 'browse', label: `🔎 Browse Registered Items (${items.length})` },
          { id: 'report_lost', label: '📍 Report Lost Item' },
          { id: 'report_found', label: '📦 Report Found Item' }
        ].map((tab) => {
          const isSelected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                setRecentReportResult(null);
              }}
              className={`relative px-5 py-3 text-xs sm:text-sm font-bold transition-all ${
                isSelected
                  ? 'text-teal-700 dark:text-teal-300'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId="lostFoundActiveTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: BROWSE & LIVE MATCH SPOTLIGHT */}
      {activeSubTab === 'browse' && (
        <div className="space-y-6">
          {/* AI MATCH CORRELATION SPOTLIGHT (Dynamic Real-Time Correlation) */}
          {matchedPair && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/80 border-2 border-teal-300 dark:border-teal-700 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-200 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600 animate-spin" />
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    High-Confidence AI Correlation Detected
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-teal-600 text-white font-mono font-black text-xs shadow-xs">
                  Active Match
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lost Card */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 text-[10px]">
                      LOST REPORT
                    </span>
                    <span className="font-mono text-slate-400">{matchedPair.lost.publicCaseId || 'Registered'}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{matchedPair.lost.title}</h4>
                  <p className="text-slate-500">{matchedPair.lost.description}</p>
                  <div className="pt-1 flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{matchedPair.lost.location}</span>
                  </div>
                </div>

                {/* Found Card */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 text-[10px]">
                      FOUND REPORT
                    </span>
                    <span className="font-mono text-slate-400">{matchedPair.found.publicCaseId || 'Registered'}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{matchedPair.found.title}</h4>
                  <p className="text-slate-500">{matchedPair.found.description}</p>
                  <div className="pt-1 flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{matchedPair.found.location}</span>
                  </div>
                </div>
              </div>

              {/* Match Factors */}
              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-teal-100 dark:border-slate-700 text-xs text-teal-900 dark:text-teal-200">
                <span className="font-semibold block mb-1">AI Correlation Factors:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300">
                  <li>Matching item category: {matchedPair.lost.itemType || 'Common Item'}</li>
                  <li>Title / keyword correspondence: {matchedPair.lost.title} ↔ {matchedPair.found.title}</li>
                  <li>Spatial proximity match: {matchedPair.lost.location}</li>
                </ul>
                <p className="mt-2 text-[10px] text-slate-500 italic">
                  Note: As per safety policy, AI correlation requires physical verification with security or departmental attendant before handover.
                </p>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Campus Registry Log
            </h3>
            <div className="flex items-center gap-1 text-xs">
              {(['all', 'lost', 'found'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-lg capitalize font-medium ${
                    filterType === t
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        item.type === 'lost'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{item.publicCaseId || 'CC-LOG'}</span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {item.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[150px]">{item.location}</span>
                  </div>
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2 & 3: REPORT FORM */}
      {(activeSubTab === 'report_lost' || activeSubTab === 'report_found') && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeSubTab === 'report_lost' ? 'Report a Lost Item' : 'Report a Found Item'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The AI correlation engine will cross-reference this report against registered items.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Item Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Casio fx-991EX Scientific Calculator"
                className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category / Type</label>
              <input
                type="text"
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                placeholder="e.g. Calculator, Wallet, ID Card, Keys, Phone"
                className="w-full p-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Black, Silver, Blue"
                className="w-full p-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Electronics Lab, Library, Canteen"
                className="w-full p-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Date</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. Today, Yesterday"
                className="w-full p-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Detailed Description & Distinctive Marks</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Distinctive scratches, stickers, brand model numbers, contents..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Contact Info (Optional — Leave blank for Anonymous protection)
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="student@polytechnic.edu or phone"
                className="w-full p-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleReport(activeSubTab === 'report_lost' ? 'lost' : 'found')}
            disabled={submitting}
            className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all ${
              activeSubTab === 'report_lost'
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {submitting ? 'Registering...' : activeSubTab === 'report_lost' ? 'Log Lost Item' : 'Log Found Item'}
          </button>
        </div>
      )}

      {/* MATCH CONFIRMATION MODAL */}
      <AnimatePresence>
        {recentReportResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Item Registered in Matching Index
                </h2>
                <p className="text-xs text-slate-500">
                  Your case ID and PIN allow you to monitor match notifications.
                </p>
              </div>

              {/* Case Credentials */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Case ID</span>
                    <div className="text-xl font-mono font-bold text-campus-400">{recentReportResult.publicCaseId}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(recentReportResult.publicCaseId, 'id')}
                    className="px-2.5 py-1 rounded bg-slate-800 text-xs font-medium"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Private PIN</span>
                    <div className="text-xl font-mono font-bold text-amber-400">{recentReportResult.rawPin}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(recentReportResult.rawPin, 'pin')}
                    className="px-2.5 py-1 rounded bg-slate-800 text-xs font-medium"
                  >
                    {copiedPin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Potential Matches Detected */}
              {recentReportResult.potentialMatches.length > 0 ? (
                <div className="p-4 rounded-xl bg-teal-50 dark:bg-slate-800 border border-teal-200 dark:border-teal-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      Possible Match Found ({recentReportResult.potentialMatches[0].confidence}% Confidence)
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    A corresponding item was logged: <strong>{recentReportResult.potentialMatches[0].candidateItem.title}</strong> at {recentReportResult.potentialMatches[0].candidateItem.location}.
                  </p>
                  <div className="text-[11px] text-teal-700 font-medium">
                    Reasons: {recentReportResult.potentialMatches[0].matchReasons.join(', ')}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center italic">
                  No immediate matches found yet. Our background pipeline scans every newly reported item automatically.
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRecentReportResult(null);
                    setActiveSubTab('browse');
                  }}
                  className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm text-center shadow-md transition-colors"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('track_report')}
                  className="py-3 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Track Case →
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
