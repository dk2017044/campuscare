import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export const AIDisclaimer: React.FC<Props> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-full text-xs font-medium">
        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
        <span>AI Suggested Classification — Human Review Required</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-xs text-purple-900 shadow-sm">
      <div className="p-1.5 bg-purple-100 rounded-lg shrink-0">
        <Sparkles className="w-4 h-4 text-purple-700" />
      </div>
      <div>
        <div className="font-semibold text-purple-950 flex items-center gap-1.5">
          <span>AI Suggested Classification — Human Review Required</span>
        </div>
        <p className="mt-0.5 text-purple-800 leading-relaxed">
          AI output is assistive and non-definitive. Authorized campus staff must review AI-generated categorization, severity, and routing before taking institutional action.
        </p>
      </div>
    </div>
  );
};
