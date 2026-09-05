import React from 'react';

export type StatusVariant = 
  | 'active' 
  | 'draft' 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'completed' 
  | 'paid' 
  | 'finalized' 
  | 'processing'
  | 'failed' 
  | 'inactive' 
  | 'expired' 
  | 'present' 
  | 'late' 
  | 'absent' 
  | 'on_leave'
  | 'incomplete'
  | 'info'
  | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: 'xs' | 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, { bg: string; text: string; border: string; dot: string }> = {
  active: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  },
  approved: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  },
  completed: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  },
  paid: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  },
  finalized: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-600'
  },
  present: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  },
  draft: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  },
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500'
  },
  late: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500'
  },
  processing: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500 animate-pulse'
  },
  info: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500'
  },
  on_leave: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500'
  },
  rejected: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500'
  },
  failed: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500'
  },
  absent: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500'
  },
  incomplete: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500'
  },
  expired: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  },
  inactive: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  },
  neutral: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  }
};

const resolveVariant = (statusText: string): StatusVariant => {
  const normalized = (statusText || '').toLowerCase().replace(/[\s-_]+/g, '_');
  if (['active', 'approved', 'completed', 'paid', 'present'].includes(normalized)) return 'active';
  if (['draft'].includes(normalized)) return 'draft';
  if (['pending', 'to_approve', 'in_progress', 'late'].includes(normalized)) return 'pending';
  if (['finalized', 'validated'].includes(normalized)) return 'finalized';
  if (['processing', 'generating'].includes(normalized)) return 'processing';
  if (['rejected', 'refused', 'failed', 'absent', 'incomplete', 'error'].includes(normalized)) return 'rejected';
  if (['on_leave', 'leave'].includes(normalized)) return 'on_leave';
  if (['inactive', 'expired', 'archived', 'closed'].includes(normalized)) return 'inactive';
  return 'neutral';
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  size = 'sm',
  showDot = true,
  className = ''
}) => {
  const chosenVariant = variant || resolveVariant(status);
  const style = variantStyles[chosenVariant] || variantStyles.neutral;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs font-semibold'
  }[size];

  const dotSize = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2'
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${style.bg} ${style.text} ${style.border} ${sizeClasses} ${className}`}
    >
      {showDot && <span className={`rounded-full shrink-0 ${style.dot} ${dotSize}`} />}
      <span className="capitalize">{status}</span>
    </span>
  );
};
