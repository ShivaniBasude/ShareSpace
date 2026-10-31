import React, { useEffect } from 'react';
import type { BookingWithQuantity } from '../../features/bookings/bookingTypes';
import {
  Button,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  MapPinIcon,
  PackageIcon,
  ShieldCheckIcon,
  UserIcon,
  XIcon,
} from '../common';
import { BookingStatusBadge } from './BookingStatusBadge';
import { BookingTimeline } from './BookingTimeline';

interface BookingDetailsModalProps {
  isOpen: boolean;
  booking: BookingWithQuantity | null;
  onClose: () => void;
  onCancel?: (booking: BookingWithQuantity) => void;
  onViewPass?: (booking: BookingWithQuantity) => void;
  onCheckIn?: (booking: BookingWithQuantity) => void;
  onCheckOut?: (booking: BookingWithQuantity) => void;
  onReportIncident?: (booking: BookingWithQuantity) => void;
}

function fmtDt(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  isOpen,
  booking,
  onClose,
  onCancel,
  onViewPass,
  onCheckIn,
  onCheckOut,
  onReportIncident,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const canCancel = booking.status === 'pending' || booking.status === 'approved';
  const canViewPass = booking.status === 'approved' || booking.status === 'checked_in';
  const canCheckIn = booking.status === 'approved';
  const canCheckOut = booking.status === 'checked_in';
  const canReport = booking.status === 'checked_in' || booking.status === 'completed';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bk-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BookingStatusBadge status={booking.status} />
            <span className="text-xs text-slate-500 font-mono">REF: {booking.id.toUpperCase()}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <h2 id="bk-detail-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {booking.resourceTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{booking.resourceCategory}</p>
          </div>

          {/* Key details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <PackageIcon className="h-3.5 w-3.5 text-indigo-500" />
                Quantity
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {booking.requestedQuantity} unit{booking.requestedQuantity !== 1 ? 's' : ''}
              </p>
            </div>

            {booking.resourceLocation && (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <MapPinIcon className="h-3.5 w-3.5 text-indigo-500" />
                  Location
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{booking.resourceLocation}</p>
              </div>
            )}

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <CalendarIcon className="h-3.5 w-3.5 text-indigo-500" />
                Start Date
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{fmtDate(booking.startTime)}</p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <CalendarIcon className="h-3.5 w-3.5 text-indigo-500" />
                End Date
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{fmtDate(booking.endTime)}</p>
            </div>

            {booking.ownerName && (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <UserIcon className="h-3.5 w-3.5 text-indigo-500" />
                  Resource Owner
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{booking.ownerName}</p>
              </div>
            )}

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <ClockIcon className="h-3.5 w-3.5 text-indigo-500" />
                Submitted
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{fmtDt(booking.createdAt)}</p>
            </div>
          </div>

          {/* Check-in/out times */}
          {(booking.checkInTime || booking.checkOutTime) && (
            <div className="rounded-xl border border-sky-200/80 bg-sky-50/60 p-4 dark:border-sky-800/60 dark:bg-sky-950/30 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                Checkout Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {booking.checkInTime && (
                  <div>
                    <span className="text-slate-500">Checked Out:</span>
                    <p className="font-semibold text-slate-900 dark:text-white">{fmtDt(booking.checkInTime)}</p>
                  </div>
                )}
                {booking.checkOutTime && (
                  <div>
                    <span className="text-slate-500">Returned:</span>
                    <p className="font-semibold text-slate-900 dark:text-white">{fmtDt(booking.checkOutTime)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Purpose */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Purpose</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{booking.purpose}</p>
          </div>

          {/* Rejection reason */}
          {booking.status === 'rejected' && booking.remarks && (
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/60 p-4 dark:border-rose-800/60 dark:bg-rose-950/30">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 mb-1.5">
                <ShieldCheckIcon className="h-4 w-4" />
                Rejection Reason
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300">{booking.remarks}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Booking History</h4>
            <BookingTimeline entries={booking.timeline} />
          </div>

          {/* Check-in info */}
          {booking.status === 'approved' && (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4 dark:border-emerald-800/60 dark:bg-emerald-950/30 flex items-start gap-3">
              <CheckCircle2Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-300">
                <strong>Ready for checkout!</strong> Your booking is approved. Go to the resource location on {fmtDate(booking.startTime)} and use your Booking Pass to check out.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {canReport && onReportIncident && (
            <Button variant="ghost" size="sm" onClick={() => onReportIncident(booking)}>
              Report Issue
            </Button>
          )}
          {canCancel && onCancel && (
            <Button variant="danger" size="sm" onClick={() => onCancel(booking)}>
              Cancel Booking
            </Button>
          )}
          {canViewPass && onViewPass && (
            <Button variant="secondary" size="sm" onClick={() => onViewPass(booking)}>
              View Pass
            </Button>
          )}
          {canCheckIn && onCheckIn && (
            <Button variant="primary" size="sm" onClick={() => onCheckIn(booking)}>
              Check Out Resource
            </Button>
          )}
          {canCheckOut && onCheckOut && (
            <Button variant="primary" size="sm" onClick={() => onCheckOut(booking)}>
              Return Resource
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

