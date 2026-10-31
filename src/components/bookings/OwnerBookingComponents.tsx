import React, { useState, useEffect } from 'react';
import type { BookingWithQuantity } from '../../features/bookings/bookingTypes';
import { Button, AlertTriangleIcon, CheckCircle2Icon, XIcon, UserIcon, CalendarIcon, PackageIcon } from '../common';
import { BookingStatusBadge } from './BookingStatusBadge';

// ── Approve / Reject Dialog ──────────────────────────────────────────────────

interface ApprovalDialogProps {
  isOpen: boolean;
  booking: BookingWithQuantity | null;
  mode: 'approve' | 'reject';
  onClose: () => void;
  onConfirm: (booking: BookingWithQuantity, remarks: string) => Promise<void>;
  isProcessing?: boolean;
}

interface ApprovalDialogContentProps {
  booking: BookingWithQuantity;
  mode: 'approve' | 'reject';
  onClose: () => void;
  onConfirm: (booking: BookingWithQuantity, remarks: string) => Promise<void>;
  isProcessing: boolean;
}

const ApprovalDialogContent: React.FC<ApprovalDialogContentProps> = ({
  booking,
  mode,
  onClose,
  onConfirm,
  isProcessing,
}) => {
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');

  const handleConfirm = async () => {
    if (mode === 'reject' && !remarks.trim()) {
      setRemarksError('Please provide a reason for rejection.');
      return;
    }
    await onConfirm(booking, remarks.trim());
  };

  function fmtDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* Icon + title */}
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            mode === 'approve'
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
              : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
          }`}
        >
          {mode === 'approve' ? (
            <CheckCircle2Icon className="h-5 w-5" />
          ) : (
            <AlertTriangleIcon className="h-5 w-5" />
          )}
        </div>
        <div>
          <h3 id="approval-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
            {mode === 'approve' ? 'Approve Booking Request?' : 'Reject Booking Request?'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'approve'
              ? 'This will approve the request and reserve the requested inventory units.'
              : 'This will reject the request. No inventory will be affected.'}
          </p>
        </div>
      </div>

      {/* Booking summary */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-xs">
        <div className="flex items-center gap-2 px-3 py-2">
          <UserIcon className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-500">Student</span>
          <span className="ml-auto font-semibold text-slate-800 dark:text-slate-200">
            {booking.userDisplayName}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2">
          <PackageIcon className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-500">Qty</span>
          <span className="ml-auto font-semibold text-slate-800 dark:text-slate-200">
            {booking.requestedQuantity} unit{booking.requestedQuantity !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2">
          <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-500">Period</span>
          <span className="ml-auto font-semibold text-slate-800 dark:text-slate-200">
            {fmtDate(booking.startTime)} → {fmtDate(booking.endTime)}
          </span>
        </div>
      </div>

      {/* Remarks field */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {mode === 'reject' ? 'Rejection Reason ' : 'Optional Note '}
          {mode === 'reject' && <span className="text-rose-500">*</span>}
        </label>
        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => {
            setRemarks(e.target.value);
            setRemarksError('');
          }}
          disabled={isProcessing}
          placeholder={
            mode === 'reject'
              ? 'Explain why this request cannot be approved...'
              : 'Optional message to the student...'
          }
          className={`w-full rounded-lg border py-2 px-3 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 resize-none ${
            remarksError
              ? 'border-rose-500'
              : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
          }`}
        />
        {remarksError && <p className="text-xs text-rose-600">{remarksError}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" size="sm" disabled={isProcessing} onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant={mode === 'approve' ? 'primary' : 'danger'}
          size="sm"
          isLoading={isProcessing}
          onClick={handleConfirm}
        >
          {mode === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
        </Button>
      </div>
    </div>
  );
};

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  isOpen,
  booking,
  mode,
  onClose,
  onConfirm,
  isProcessing = false,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen || !booking) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="approval-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={() => !isProcessing && onClose()}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 dark:border-slate-800 dark:bg-slate-900">
        <ApprovalDialogContent
          key={`${booking.id}-${mode}`}
          booking={booking}
          mode={mode}
          onClose={onClose}
          onConfirm={onConfirm}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
};

// ── Owner Booking Card ────────────────────────────────────────────────────────

interface OwnerBookingCardProps {
  booking: BookingWithQuantity;
  onViewDetails: (booking: BookingWithQuantity) => void;
  onApprove?: (booking: BookingWithQuantity) => void;
  onReject?: (booking: BookingWithQuantity) => void;
  onCheckIn?: (booking: BookingWithQuantity) => void;
  onCheckOut?: (booking: BookingWithQuantity) => void;
}

function fmtDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}

export const OwnerBookingCard: React.FC<OwnerBookingCardProps> = ({
  booking,
  onViewDetails,
  onApprove,
  onReject,
  onCheckIn,
  onCheckOut,
}) => {
  const isOverdue = booking.status === 'checked_in' && new Date(booking.endTime) < new Date();

  return (
    <div className={`rounded-xl border bg-white dark:bg-slate-900 shadow-xs ${
      isOverdue ? 'border-amber-300 dark:border-amber-700' : 'border-slate-200/90 dark:border-slate-800'
    }`}>
      {isOverdue && (
        <div className="flex items-center gap-2 rounded-t-xl bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-b border-amber-200">
          <AlertTriangleIcon className="h-3.5 w-3.5" />
          Overdue — Student has not returned this resource.
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <BookingStatusBadge status={booking.status} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{booking.resourceTitle}</h3>
          </div>
          <span className="shrink-0 font-mono text-3xs text-slate-400 pt-1">{booking.id.toUpperCase().slice(-8)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{booking.userDisplayName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <PackageIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{booking.requestedQuantity} unit{booking.requestedQuantity !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <CalendarIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{fmtDateShort(booking.startTime)} → {fmtDateShort(booking.endTime)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(booking)}>Details</Button>

          {booking.status === 'pending' && (
            <>
              {onApprove && (
                <Button variant="primary" size="sm" onClick={() => onApprove(booking)}>Approve</Button>
              )}
              {onReject && (
                <Button variant="danger" size="sm" onClick={() => onReject(booking)}>Reject</Button>
              )}
            </>
          )}

          {booking.status === 'approved' && onCheckIn && (
            <Button variant="secondary" size="sm" onClick={() => onCheckIn(booking)}>Confirm Checkout</Button>
          )}

          {booking.status === 'checked_in' && onCheckOut && (
            <Button variant="secondary" size="sm" onClick={() => onCheckOut(booking)}>Confirm Return</Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Verification Dialog ────────────────────────────────────────────────────────

interface VerifyBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (reference: string) => Promise<BookingWithQuantity | null>;
  onCheckIn: (booking: BookingWithQuantity) => Promise<void>;
  onCheckOut: (booking: BookingWithQuantity) => Promise<void>;
}

interface VerifyBookingContentProps {
  onVerify: (reference: string) => Promise<BookingWithQuantity | null>;
  onCheckIn: (booking: BookingWithQuantity) => Promise<void>;
  onCheckOut: (booking: BookingWithQuantity) => Promise<void>;
  isSearching: boolean;
  setIsSearching: (val: boolean) => void;
  isActing: boolean;
  setIsActing: (val: boolean) => void;
}

const VerifyBookingContent: React.FC<VerifyBookingContentProps> = ({
  onVerify,
  onCheckIn,
  onCheckOut,
  isSearching,
  setIsSearching,
  isActing,
  setIsActing,
}) => {
  const [reference, setReference] = useState('');
  const [foundBooking, setFoundBooking] = useState<BookingWithQuantity | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSearch = async () => {
    if (!reference.trim()) {
      setError('Please enter a booking reference.');
      return;
    }
    setIsSearching(true);
    setError('');
    setFoundBooking(null);
    setSuccessMessage('');
    try {
      const booking = await onVerify(reference.trim().toLowerCase());
      if (!booking) {
        setError('No booking found with that reference. Please check and try again.');
      } else {
        setFoundBooking(booking);
      }
    } catch {
      setError('Error looking up booking. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckIn = async () => {
    if (!foundBooking) return;
    setIsActing(true);
    try {
      await onCheckIn(foundBooking);
      setSuccessMessage(`✓ Check-out confirmed for ${foundBooking.userDisplayName}.`);
      setFoundBooking({ ...foundBooking, status: 'checked_in' });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setIsActing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!foundBooking) return;
    setIsActing(true);
    try {
      await onCheckOut(foundBooking);
      setSuccessMessage(`✓ Return confirmed for ${foundBooking.userDisplayName}.`);
      setFoundBooking({ ...foundBooking, status: 'completed' });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setIsActing(false);
    }
  };

  function fmtDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  }

  return (
    <div className="p-5 space-y-4">
      <p className="text-xs text-slate-500">
        Enter the booking reference from the student's Booking Pass to confirm checkout or return.
      </p>

      <div className="flex gap-2">
        <input
          autoFocus
          type="text"
          value={reference}
          onChange={(e) => {
            setReference(e.target.value.toLowerCase());
            setError('');
            setFoundBooking(null);
            setSuccessMessage('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSearch();
          }}
          placeholder="e.g. bk-abc123-xyz"
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 py-2 px-3 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          disabled={isSearching}
        />
        <Button variant="primary" size="sm" onClick={handleSearch} isLoading={isSearching}>
          Look Up
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:border-rose-800/60 dark:text-rose-300">
          <AlertTriangleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/60 dark:text-emerald-300">
          <CheckCircle2Icon className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      )}

      {foundBooking && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                {foundBooking.resourceTitle}
              </span>
              <BookingStatusBadge status={foundBooking.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
              <div>
                <span className="text-slate-400">Student:</span>
                <br />
                <strong className="text-slate-800 dark:text-slate-200">
                  {foundBooking.userDisplayName}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Qty:</span>
                <br />
                <strong className="text-slate-800 dark:text-slate-200">
                  {foundBooking.requestedQuantity}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Start:</span>
                <br />
                {fmtDate(foundBooking.startTime)}
              </div>
              <div>
                <span className="text-slate-400">End:</span>
                <br />
                {fmtDate(foundBooking.endTime)}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {foundBooking.status === 'approved' && (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                isLoading={isActing}
                onClick={handleCheckIn}
              >
                Confirm Checkout
              </Button>
            )}
            {foundBooking.status === 'checked_in' && (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                isLoading={isActing}
                onClick={handleCheckOut}
              >
                Confirm Return
              </Button>
            )}
            {(foundBooking.status === 'pending' ||
              foundBooking.status === 'rejected' ||
              foundBooking.status === 'cancelled' ||
              foundBooking.status === 'completed') && (
              <div className="w-full text-center text-xs text-slate-500 py-2">
                No action available for a <strong>{foundBooking.status}</strong> booking.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const VerifyBookingDialog: React.FC<VerifyBookingDialogProps> = ({
  isOpen,
  onClose,
  onVerify,
  onCheckIn,
  onCheckOut,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSearching && !isActing) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSearching, isActing, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={() => !isSearching && !isActing && onClose()}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 id="verify-dialog-title" className="text-sm font-bold text-slate-900 dark:text-white">
            Verify Booking Reference
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSearching || isActing}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-50"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <VerifyBookingContent
          key={isOpen ? 'open' : 'closed'}
          onVerify={onVerify}
          onCheckIn={onCheckIn}
          onCheckOut={onCheckOut}
          isSearching={isSearching}
          setIsSearching={setIsSearching}
          isActing={isActing}
          setIsActing={setIsActing}
        />
      </div>
    </div>
  );
};

