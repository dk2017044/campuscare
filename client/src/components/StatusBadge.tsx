import React from 'react';
import { CaseStatus } from '../types';
import { Clock, Cpu, UserCheck, Eye, CheckCircle2, AlertOctagon, RefreshCw, FileText } from 'lucide-react';

interface Props {
  status: CaseStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let config = {
    label: 'Under Review',
    icon: Eye,
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60'
  };

  switch (normalized) {
    case 'NEW':
      config = {
        label: 'New Report',
        icon: FileText,
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800/60'
      };
      break;
    case 'AI_TRIAGED':
      config = {
        label: 'AI Triaged',
        icon: Cpu,
        bg: 'bg-purple-50 dark:bg-purple-950/40',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800/60'
      };
      break;
    case 'ASSIGNED':
      config = {
        label: 'Assigned to Staff',
        icon: UserCheck,
        bg: 'bg-indigo-50 dark:bg-indigo-950/40',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800/60'
      };
      break;
    case 'UNDER_REVIEW':
      config = {
        label: 'Under Review',
        icon: Eye,
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/60'
      };
      break;
    case 'ACTION_TAKEN':
      config = {
        label: 'Action Taken',
        icon: Clock,
        bg: 'bg-cyan-50 dark:bg-cyan-950/40',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-200 dark:border-cyan-800/60'
      };
      break;
    case 'RESOLVED':
      config = {
        label: 'Resolved',
        icon: CheckCircle2,
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/60'
      };
      break;
    case 'ESCALATED':
      config = {
        label: '🚨 Escalated',
        icon: AlertOctagon,
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/60'
      };
      break;
    case 'MATCHING':
      config = {
        label: 'Matching Active',
        icon: RefreshCw,
        bg: 'bg-teal-50 dark:bg-teal-950/40',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800/60'
      };
      break;
  }

  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : size === 'lg' ? 'px-3.5 py-1.5 text-sm gap-2' : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
};
