import React from 'react';
import type { BookingTimelineEntry } from '../../features/bookings/bookingTypes';
import {
  CheckCircle2Icon,
  ClockIcon,
  AlertTriangleIcon,
  CheckIcon,
  XIcon,
} from '../common/Icons';

function getEventIcon(event: BookingTimelineEntry['event']) {
  switch (event) {
    case 'requested':
      return <ClockIcon className="h-3.5 w-3.5" />;
    case 'approved':
      return <CheckCircle2Icon className="h-3.5 w-3.5" />;
    case 'rejected':
      return <XIcon className="h-3.5 w-3.5" />;
    case 'cancelled':
      return <XIcon className="h-3.5 w-3.5" />;
    case 'checked_in':
      return <CheckIcon className="h-3.5 w-3.5" />;
    case 'completed':
      return <CheckCircle2Icon className="h-3.5 w-3.5" />;
    case 'overdue_flag':
      return <AlertTriangleIcon className="h-3.5 w-3.5" />;
    case 'incident_reported':
      return <AlertTriangleIcon className="h-3.5 w-3.5" />;
    default:
      return <ClockIcon className="h-3.5 w-3.5" />;
  }
}

function getEventColor(event: BookingTimelineEntry['event']): string {
  switch (event) {
    case 'approved':
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400';
    case 'rejected':
    case 'cancelled':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400';
    case 'checked_in':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400';
    case 'overdue_flag':
    case 'incident_reported':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

interface BookingTimelineProps {
  entries: BookingTimelineEntry[];
}

export const BookingTimeline: React.FC<BookingTimelineProps> = ({ entries }) => {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-0">
      {entries.map((entry, idx) => (
        <div key={entry.id} className="flex gap-3">
          {/* Icon + connector line */}
          <div className="flex flex-col items-center">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${getEventColor(entry.event)}`}
            >
              {getEventIcon(entry.event)}
            </div>
            {idx < entries.length - 1 && (
              <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 my-1" />
            )}
          </div>

          {/* Content */}
          <div className={`pb-4 ${idx === entries.length - 1 ? 'pb-0' : ''}`}>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">{entry.label}</p>
            {entry.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {entry.description}
              </p>
            )}
            <p className="text-3xs text-slate-400 mt-1">
              {formatTimestamp(entry.timestamp)} · {entry.performedByName}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

