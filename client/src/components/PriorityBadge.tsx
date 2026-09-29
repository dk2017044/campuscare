import React from 'react';
import { PriorityLevel } from '../types';
import { AlertTriangle, AlertCircle, ArrowUpCircle, Info } from 'lucide-react';

interface Props {
  priority: PriorityLevel | string;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<Props> = ({ priority, size = 'md' }) => {
  const norm = (priority || 'MEDIUM').toUpperCase();

  let config = {
    label: 'Medium',
    icon: Info,
    bg: 'bg-amber-100 text-amber-900 border-amber-300',
    dot: 'bg-amber-500'
  };

  switch (norm) {
    case 'CRITICAL':
      config = {
        label: 'CRITICAL',
        icon: AlertTriangle,
        bg: 'bg-red-100 text-red-900 border-red-300 font-bold animate-pulse-subtle',
        dot: 'bg-red-600'
      };
      break;
    case 'HIGH':
      config = {
        label: 'High',
        icon: AlertCircle,
        bg: 'bg-orange-100 text-orange-900 border-orange-300 font-semibold',
        dot: 'bg-orange-500'
      };
      break;
    case 'MEDIUM':
      config = {
        label: 'Medium',
        icon: ArrowUpCircle,
        bg: 'bg-amber-100 text-amber-900 border-amber-300',
        dot: 'bg-amber-500'
      };
      break;
    case 'LOW':
      config = {
        label: 'Low',
        icon: Info,
        bg: 'bg-slate-100 text-slate-800 border-slate-300',
        dot: 'bg-slate-400'
      };
      break;
  }

  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : size === 'lg' ? 'px-3 py-1.5 text-sm gap-2' : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span className={`inline-flex items-center rounded-md border ${config.bg} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
};
