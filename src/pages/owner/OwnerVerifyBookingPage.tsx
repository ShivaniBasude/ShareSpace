import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  bookingService,
  DEMO_OWNER_ID,
  DEMO_OWNER_NAME,
  type BookingWithQuantity,
} from '../../features/bookings';
import { useAuth } from '../../hooks';
import {
  Button,
  CheckCircle2Icon,
  ChevronLeftIcon,
  InfoIcon,
  PackageIcon,
  QrCodeIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserIcon,
} from '../../components/common';
import { BookingStatusBadge } from '../../components/bookings';

export const OwnerVerifyBookingPage: React.FC = () => {
  const { profile } = useAuth();
  const effectiveOwnerId = profile?.uid || DEMO_OWNER_ID;
  const effectiveOwnerName = profile?.fullName || DEMO_OWNER_NAME;

  const [reference, setReference] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundBooking, setFoundBooking] = useState<BookingWithQuantity | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      setError('Please enter a booking reference code.');
      return;
    }
    setIsSearching(true);
    setError(null);
    setFoundBooking(null);
    setActionSuccess(null);

    try {
      const b = await bookingService.verifyBookingReference(reference.trim(), 200);
      if (!b) {
        setError(`No booking found matching reference "${reference.trim().toUpperCase()}". Please verify the code and try again.`);
      } else {
        setFoundBooking(b);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmCheckout = async () => {
    if (!foundBooking) return;
    setIsProcessing(true);
    setError(null);
    try {
      await bookingService.checkIn(foundBooking.id, effectiveOwnerId, effectiveOwnerName, 200);
      setActionSuccess(`✓ Check-out confirmed for ${foundBooking.userDisplayName}. Resource is now marked active.`);
      const updated = await bookingService.getBookingById(foundBooking.id, 0);
      setFoundBooking(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to confirm checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!foundBooking) return;
    setIsProcessing(true);
    setError(null);
    try {
      await bookingService.checkOut(foundBooking.id, effectiveOwnerId, effectiveOwnerName, 200);
      setActionSuccess(`✓ Return confirmed for ${foundBooking.userDisplayName}. Inventory has been restored.`);
      const updated = await bookingService.getBookingById(foundBooking.id, 0);
      setFoundBooking(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to confirm return.');
    } finally {
      setIsProcessing(false);
    }
  };

  function fmtDate(iso: string): string {
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ── Breadcrumb / Back ── */}
      <div>
        <Link
          to="/owner/bookings"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4" /> Back to Booking Requests
        </Link>
      </div>

      {/* ── Header ── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <QrCodeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Verify Booking Pass
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Scan or enter a student&apos;s Booking Pass reference to verify eligibility and confirm handover or return.
        </p>
      </div>

      {/* ── Governance & Demo Notice ── */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 space-y-1">
        <div className="flex items-center gap-2 font-bold">
          <InfoIcon className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Demo Verification Flow</span>
        </div>
        <p className="leading-relaxed text-amber-800 dark:text-amber-300">
          This verification flow operates on session mock data. Hardware QR scanning and cryptographic pass validation will be linked in future phases.
        </p>
      </div>

      {/* ── Reference Input Card ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <form onSubmit={handleLookup} className="space-y-3">
          <label htmlFor="ref-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Booking Reference ID
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <SearchIcon className="h-4 w-4" />
              </div>
              <input
                id="ref-input"
                type="text"
                value={reference}
                onChange={(e) => {
                  setReference(e.target.value);
                  setError(null);
                  setActionSuccess(null);
                }}
                placeholder="e.g. bk-001 or bk-002"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-10 text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" isLoading={isSearching}>
              Verify
            </Button>
          </div>
          <p className="text-3xs text-slate-400">
            Try demo references: <code className="font-mono text-indigo-600 dark:text-indigo-400">bk-001</code> (approved),{' '}
            <code className="font-mono text-indigo-600 dark:text-indigo-400">bk-005</code> (checked out), or{' '}
            <code className="font-mono text-indigo-600 dark:text-indigo-400">bk-002</code> (pending).
          </p>
        </form>

        {/* Error message */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Action success message */}
        {actionSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2Icon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* ── Verified Booking Card ── */}
      {foundBooking && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookingStatusBadge status={foundBooking.status} />
                <span className="font-mono text-xs font-bold text-slate-400">
                  {foundBooking.id.toUpperCase()}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {foundBooking.resourceTitle}
              </h2>
            </div>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {foundBooking.resourceCategory}
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <UserIcon className="h-3.5 w-3.5" />
                <span>Student</span>
              </div>
              <p className="font-bold text-slate-900 dark:text-white">{foundBooking.userDisplayName}</p>
              <p className="text-3xs text-slate-400 mt-0.5">{foundBooking.userEmail}</p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <PackageIcon className="h-3.5 w-3.5" />
                <span>Allocated Units</span>
              </div>
              <p className="font-bold text-slate-900 dark:text-white">
                {foundBooking.requestedQuantity} unit{foundBooking.requestedQuantity !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40 col-span-2">
              <span className="text-slate-400">Reservation Period:</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {fmtDate(foundBooking.startTime)} → {fmtDate(foundBooking.endTime)}
              </p>
            </div>
          </div>

          {/* Verification Status Banner */}
          {foundBooking.status === 'approved' && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
              <ShieldCheckIcon className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <strong>Valid for Checkout:</strong> This request is approved and units are reserved. You can confirm physical handover to the student.
              </div>
            </div>
          )}

          {foundBooking.status === 'checked_in' && (
            <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/60 p-4 text-xs text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200">
              <CheckCircle2Icon className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" />
              <div>
                <strong>Currently Checked Out:</strong> This resource is with the student. You can confirm return and restore the inventory.
              </div>
            </div>
          )}

          {foundBooking.status === 'completed' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 text-center">
              This booking has already been returned and completed. No further action needed.
            </div>
          )}

          {foundBooking.status === 'pending' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
              This request is still pending review. Please approve it first from your{' '}
              <Link to="/owner/bookings" className="font-bold underline">
                Booking Requests page
              </Link>
              .
            </div>
          )}

          {/* Verification Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {foundBooking.status === 'approved' && (
              <Button
                variant="primary"
                size="md"
                isLoading={isProcessing}
                onClick={handleConfirmCheckout}
              >
                Confirm Physical Checkout
              </Button>
            )}

            {foundBooking.status === 'checked_in' && (
              <Button
                variant="primary"
                size="md"
                isLoading={isProcessing}
                onClick={handleConfirmReturn}
              >
                Confirm Return & Restore Stock
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFoundBooking(null);
                setReference('');
                setActionSuccess(null);
              }}
            >
              Verify Another Pass
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

