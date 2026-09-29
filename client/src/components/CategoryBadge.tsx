import React from 'react';
import { ShieldAlert, Wrench, Search, Users, HeartHandshake, AlertCircle } from 'lucide-react';

export type CategoryType = 'safety' | 'maintenance' | 'lost_found' | 'welfare' | 'other' | string;

interface Props {
  category: CategoryType;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const getCategoryMeta = (rawCat: string = '') => {
  const c = rawCat.toLowerCase();
  if (c.includes('safety') || c.includes('harass') || c.includes('bully') || c.includes('stalk') || c.includes('danger') || c.includes('threat')) {
    return {
      type: 'safety',
      label: 'Student Safety',
      icon: ShieldAlert,
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800/70',
      dot: 'bg-rose-500',
      glow: 'shadow-rose-500/10',
      accentColor: '#f43f5e',
      borderLeft: 'border-l-rose-500'
    };
  }
  if (c.includes('maint') || c.includes('repair') || c.includes('electric') || c.includes('plumb') || c.includes('civil') || c.includes('fixture')) {
    return {
      type: 'maintenance',
      label: 'Facilities & Repairs',
      icon: Wrench,
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/70',
      dot: 'bg-amber-500',
      glow: 'shadow-amber-500/10',
      accentColor: '#f59e0b',
      borderLeft: 'border-l-amber-500'
    };
  }
  if (c.includes('lost') || c.includes('found')) {
    return {
      type: 'lost_found',
      label: 'Lost & Found',
      icon: Search,
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      text: 'text-teal-800 dark:text-teal-300',
      border: 'border-teal-200 dark:border-teal-800/70',
      dot: 'bg-teal-500',
      glow: 'shadow-teal-500/10',
      accentColor: '#14b8a6',
      borderLeft: 'border-l-teal-500'
    };
  }
  return {
    type: 'welfare',
    label: 'Student Welfare',
    icon: Users,
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-800 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800/70',
    dot: 'bg-indigo-500',
    glow: 'shadow-indigo-500/10',
    accentColor: '#6366f1',
    borderLeft: 'border-l-indigo-500'
  };
};

export const CategoryBadge: React.FC<Props> = ({
  category,
  sublabel,
  size = 'md',
  showIcon = true
}) => {
  const meta = getCategoryMeta(category);
  const Icon = meta.icon;

  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : size === 'lg'
      ? 'px-3 py-1.5 text-xs gap-1.5'
      : 'px-2.5 py-1 text-[11px] gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-lg border ${meta.bg} ${meta.text} ${meta.border} ${sizeClass} transition-colors`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{sublabel || meta.label}</span>
    </span>
  );
};
