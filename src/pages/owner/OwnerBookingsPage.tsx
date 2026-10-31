import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  bookingService,
  DEMO_OWNER_ID,
  DEMO_OWNER_NAME,
  type BookingStatus,
  type BookingWithQuantity,
} from '../../features/bookings';
import { useAuth } from '../../hooks';
import {
  Button,
  CalendarIcon,
  CheckCircle2Icon,
  FilterIcon,
  PackageIcon,
  QrCodeIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from '../../components/common';
import {
  ApprovalDialog,
  BookingDetailsModal,
  OwnerBookingCard,
} from '../../components/bookings';

export const OwnerBookingsPage: React.FC = () => {
  const { profile } = useAuth();
  const effectiveOwnerId = profile?.uid || DEMO_OWNER_ID;
  const effectiveOwnerName = profile?.fullName || DEMO_OWNER_NAME;

  const [bookings, setBookings] = useState<BookingWithQuantity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');

  // Modals
  const [inspectingBooking, setInspectingBooking] = useState<BookingWithQuantity | null>(null);
  const [approvalModal, setApprovalModal] = useState<{
    booking: BookingWithQuantity;
    mode: 'approve' | 'reject';
  } | null>(null);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Feedback
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bookingService.getOwnerBookings(effectiveOwnerId, 150);
      setBookings(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load owner bookings.');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveOwnerId]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        const data = await bookingService.getOwnerBookings(effectiveOwnerId, 150);
        if (isMounted) setBookings(data);
      } catch (err: unknown) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Unable to load owner bookings.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [effectiveOwnerId]);

  // Handle Approve / Reject Confirmation
  const handleConfirmApproval = async (b: BookingWithQuantity, remarks: string) => {
    if (!approvalModal) return;
    setIsProcessingApproval(true);
    try {
      if (approvalModal.mode === 'approve') {
        await bookingService.approveBooking(b.id, effectiveOwnerId, effectiveOwnerName, 150);
        setBanner({
          type: 'success',
          message: `Booking request from ${b.userDisplayName} for "${b.resourceTitle}" was approved.`,
        });
      } else {
        await bookingService.rejectBooking(b.id, effectiveOwnerId, effectiveOwnerName, remarks, 150);
        setBanner({
          type: 'success',
          message: `Booking request from ${b.userDisplayName} was rejected.`,
        });
      }
      setApprovalModal(null);
      await loadBookings();
    } catch (err: unknown) {
      setBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Action failed.',
      });
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Confirm Check-out (handover to student)
  const handleConfirmCheckout = async (b: BookingWithQuantity) => {
    try {
      await bookingService.checkIn(b.id, effectiveOwnerId, effectiveOwnerName, 150);
      setBanner({
        type: 'success',
        message: `Checkout confirmed for ${b.userDisplayName} (${b.resourceTitle}).`,
      });
      await loadBookings();
    } catch (err: unknown) {
      setBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Action failed.',
      });
    }
  };

  // Confirm Return (return from student)
  const handleConfirmReturn = async (b: BookingWithQuantity) => {
    try {
      await bookingService.checkOut(b.id, effectiveOwnerId, effectiveOwnerName, 150);
      setBanner({
        type: 'success',
        message: `Return confirmed for ${b.userDisplayName}. Inventory has been restored.`,
      });
      await loadBookings();
    } catch (err: unknown) {
      setBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Action failed.',
      });
    }
  };

  // Filtered
  const filteredBookings = useMemo(() => {
    let result = bookings;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (b) =>
          b.resourceTitle.toLowerCase().includes(q) ||
          b.userDisplayName.toLowerCase().includes(q) ||
          b.purpose.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((b) => b.status === statusFilter);
    }
    return result;
  }, [bookings, searchQuery, statusFilter]);

  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === 'pending').length,
    [bookings]
  );

  const isFiltered = searchQuery.trim().length > 0 || statusFilter !== 'ALL';

  return (
    <div className="space-y-6">
      {/* ── Status Banner ── */}
      {banner && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs animate-in fade-in duration-200 ${
            banner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="h-4 w-4 shrink-0" />
            <span>{banner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="cursor-pointer text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Booking Requests & Loan Management
            </h1>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse">
                {pendingCount} pending review
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review reservation requests, approve equipment allocations, and verify physical checkouts.
          </p>
        </div>

        <Link to="/owner/verify-booking">
          <Button variant="outline" size="sm" icon={<QrCodeIcon className="h-4 w-4" />}>
            Verify Booking Pass
          </Button>
        </Link>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <SearchIcon className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by resource, student name, or ref ID..."
              aria-label="Search requests"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-10 pl-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs md:justify-end">
            <span className="text-slate-500">
              Showing <strong className="text-slate-900 dark:text-white">{filteredBookings.length}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{bookings.length}</strong>
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
              >
                <XIcon className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <FilterIcon className="h-3 w-3" /> Filter:
          </span>
          {(
            [
              { value: 'ALL', label: 'All' },
              { value: 'pending', label: `Pending (${pendingCount})` },
              { value: 'approved', label: 'Approved' },
              { value: 'checked_in', label: 'Active Loans' },
              { value: 'completed', label: 'Completed' },
              { value: 'rejected', label: 'Rejected' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === tab.value
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bookings List ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center dark:border-rose-900/60 dark:bg-rose-950/30"
        >
          <p className="text-sm font-bold text-rose-800 dark:text-rose-200 mb-2">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadBookings}
            icon={<RefreshCwIcon className="h-4 w-4" />}
          >
            Retry Loading
          </Button>
        </div>
      ) : filteredBookings.length === 0 && isFiltered ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <CalendarIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No requests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            No booking requests match your current filter settings.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
          >
            Clear Active Filters
          </Button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <PackageIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No incoming requests</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            There are currently no booking requests for your cataloged resources.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredBookings.map((b) => (
            <OwnerBookingCard
              key={b.id}
              booking={b}
              onViewDetails={setInspectingBooking}
              onApprove={(item) => setApprovalModal({ booking: item, mode: 'approve' })}
              onReject={(item) => setApprovalModal({ booking: item, mode: 'reject' })}
              onCheckIn={handleConfirmCheckout}
              onCheckOut={handleConfirmReturn}
            />
          ))}
        </div>
      )}

      {/* ── Details Modal ── */}
      <BookingDetailsModal
        isOpen={Boolean(inspectingBooking)}
        booking={inspectingBooking}
        onClose={() => setInspectingBooking(null)}
      />

      {/* ── Approve / Reject Dialog ── */}
      <ApprovalDialog
        isOpen={Boolean(approvalModal)}
        booking={approvalModal?.booking ?? null}
        mode={approvalModal?.mode ?? 'approve'}
        onClose={() => setApprovalModal(null)}
        onConfirm={handleConfirmApproval}
        isProcessing={isProcessingApproval}
      />
    </div>
  );
};
