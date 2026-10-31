import React from 'react';
import type { ResourceStatus, BookingStatus, UserRole, ResourceCategory } from '../../types';

export type BadgeTone = 'emerald' | 'amber' | 'rose' | 'indigo' | 'sky' | 'slate';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: ResourceStatus | BookingStatus | UserRole | ResourceCategory | string;
  tone?: BadgeTone;
  size?: 'sm' | 'md';
}

const toneStyles: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
  sky: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
  slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

function resolveToneFromStatus(status?: string): BadgeTone {
  if (!status) return 'slate';
  const s = status.toLowerCase();
  if (['available', 'approved', 'completed', 'student'].includes(s)) return 'emerald';
  if (['pending', 'reserved', 'investigating'].includes(s)) return 'amber';
  if (['maintenance', 'rejected', 'cancelled', 'decommissioned', 'critical', 'high'].includes(s)) return 'rose';
  if (['admin', 'faculty', 'hall', 'lab'].includes(s)) return 'indigo';
  if (['checked_in', 'security', 'equipment'].includes(s)) return 'sky';
  return 'slate';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  status,
  tone,
  size = 'md',
  className = '',
  ...props
}) => {
  const resolvedTone = tone || resolveToneFromStatus(status);
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide select-none font-sans ${toneStyles[resolvedTone]} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {children || status}
    </span>
  );
};

