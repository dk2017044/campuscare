import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Wrench, 
  Compass, 
  ClipboardList, 
  PhoneCall, 
  X, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { playTapSound } from '../services/sound';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    { id: 'report_safely', title: 'File Confidential Report', category: 'Safety', desc: '100% private grievance submission', icon: ShieldCheck, color: 'text-sky-400' },
    { id: 'emergency', title: 'Trigger Emergency SOS', category: 'Urgent', desc: 'Instant guard dispatch & siren', icon: AlertTriangle, color: 'text-rose-400' },
    { id: 'maintenance', title: 'Campus Repairs & Maintenance', category: 'Services', desc: 'Hostel, electrical & lab repairs', icon: Wrench, color: 'text-amber-400' },
    { id: 'lost_found', title: 'Lost & Found Registry', category: 'Services', desc: 'Search or report misplaced items', icon: Compass, color: 'text-teal-400' },
    { id: 'track_report', title: 'Track Case Status', category: 'Lookup', desc: 'Decrypt status via 6-digit PIN', icon: ClipboardList, color: 'text-indigo-400' }
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.desc.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setQuery('');
          // Handled externally via trigger
        }
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filtered]);

  const handleSelect = (tabId: string) => {
    playTapSound();
    onNavigate(tabId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="w-full max-w-lg glass-card rounded-3xl border border-white/15 overflow-hidden shadow-2xl relative"
          >
            {/* Command Header & Input */}
            <div className="p-3.5 border-b border-white/10 flex items-center gap-3">
              <Search className="w-4 h-4 text-sky-400 shrink-0 ml-1.5" />
              <input
                type="text"
                autoFocus
                placeholder="Search campus actions (e.g. SOS, repairs, report)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="p-2 max-h-72 overflow-y-auto space-y-1">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No matching actions found for "{query}".
                </div>
              ) : (
                filtered.map((action, idx) => {
                  const Icon = action.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleSelect(action.id)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all text-left cursor-pointer ${
                        isSelected 
                          ? 'bg-white/10 border border-white/15 text-white' 
                          : 'text-slate-300 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${action.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-semibold text-white block">
                            {action.title}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {action.desc}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full glass-pill text-slate-400">
                          {action.category}
                        </span>
                        {isSelected && <ArrowRight className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Command Footer */}
            <div className="p-2.5 px-4 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
              <span className="text-sky-400/80">CampusCare Command OS</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
