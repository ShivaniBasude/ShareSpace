import React from 'react';
import type { BookingWithQuantity } from '../../features/bookings/bookingTypes';
import { Button } from '../common/Button';
import {
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  MapPinIcon,
  PackageIcon,
  XIcon,
} from '../common/Icons';
import { BookingStatusBadge } from './BookingStatusBadge';

interface BookingCardProps {
  booking: BookingWithQuantity;
  onViewDetails: (booking: BookingWithQuantity) => void;
  onCancel?: (booking: BookingWithQuantity) => void;
  onViewPass?: (booking: BookingWithQuantity) => void;
  onCheckIn?: (booking: BookingWithQuantity) => void;
  onCheckOut?: (booking: BookingWithQuantity) => void;
  onReportIncident?: (booking: BookingWithQuantity) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function isOverdue(booking: BookingWithQuantity): boolean {
  return (
    booking.status === 'checked_in' && new Date(booking.endTime) < new Date()
  );
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onViewDetails,
  onCancel,
  onViewPass,
  onCheckIn,
  onCheckOut,
  onReportIncident,
}) => {
  const overdue = isOverdue(booking);
  const canCancel = booking.status === 'pending' || booking.status === 'approved';
  const canViewPass = booking.status === 'approved' || booking.status === 'checked_in';
  const canCheckIn = booking.status === 'approved';
  const canCheckOut = booking.status === 'checked_in';
  const canReport = booking.status === 'checked_in' || booking.status === 'completed';

  return (
    <div
      className={`rounded-xl border bg-white dark:bg-slate-900 shadow-xs transition-colors ${
        overdue
          ? 'border-amber-300 dark:border-amber-700'
          : 'border-slate-200/90 dark:border-slate-800'
      }`}
    >
      {/* Overdue banner */}
      {overdue && (
        <div className="flex items-center gap-2 rounded-t-xl bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-b border-amber-200 dark:border-amber-800">
          <ClockIcon className="h-3.5 w-3.5" />
          Overdue — Please return this resource as soon as possible.
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <BookingStatusBadge status={booking.status} />
              <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-3xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                {booking.resourceCategory}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
              {booking.resourceTitle}
            </h3>
          </div>
          <span className="shrink-0 font-mono text-3xs text-slate-400 dark:text-slate-500 pt-1">
            {booking.id.toUpperCase().slice(-8)}
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <PackageIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{booking.requestedQuantity} unit{booking.requestedQuantity !== 1 ? 's' : ''} requested</span>
          </div>
          {booking.resourceLocation && (
            <div className="flex items-center gap-1.5 col-span-2">
              <MapPinIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="line-clamp-1">{booking.resourceLocation}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{formatDate(booking.startTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">→</span>
            <span>{formatDate(booking.endTime)}</span>
          </div>
        </div>

        {/* Rejection reason */}
        {booking.status === 'rejected' && booking.remarks && (
          <div className="rounded-lg bg-rose-50 border border-rose-200/80 p-2.5 text-xs text-rose-700 dark:bg-rose-950/30 dark:border-rose-800/60 dark:text-rose-300">
            <strong>Reason:</strong> {booking.remarks}
          </div>
        )}

        {/* Check-in time for active */}
        {booking.status === 'checked_in' && booking.checkInTime && (
          <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400">
            <CheckCircle2Icon className="h-3.5 w-3.5" />
            <span>Checked out {new Date(booking.checkInTime).toLocaleDateString()}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(booking)}>
            View Details
          </Button>

          {canViewPass && onViewPass && (
            <Button variant="secondary" size="sm" onClick={() => onViewPass(booking)}>
              Booking Pass
            </Button>
          )}

          {canCheckIn && onCheckIn && (
            <Button variant="primary" size="sm" onClick={() => onCheckIn(booking)}>
              Check Out
            </Button>
          )}

          {canCheckOut && onCheckOut && (
            <Button variant="primary" size="sm" onClick={() => onCheckOut(booking)}>
              Return Resource
            </Button>
          )}

          {canReport && onReportIncident && (
            <Button variant="ghost" size="sm" onClick={() => onReportIncident(booking)}>
              Report Issue
            </Button>
          )}

          {canCancel && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(booking)}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
            >
              <XIcon className="h-3.5 w-3.5" />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

