import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  bookingService,
  DEMO_STUDENT_ID,
  DEMO_STUDENT_NAME,
  type BookingStatus,
  type BookingWithQuantity,
  type IncidentCategory,
  type MockIncident,
} from '../../features/bookings';
import { useAuth } from '../../hooks';
import {
  Button,
  CalendarIcon,
  CheckCircle2Icon,
  FilterIcon,
  PackageIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from '../../components/common';
import {
  BookingCard,
  BookingDetailsModal,
  BookingPassModal,
  IncidentReportModal,
} from '../../components/bookings';

export const StudentBookingsPage: React.FC = () => {
  const { profile } = useAuth();
  const effectiveUserId = profile?.uid || DEMO_STUDENT_ID;
  const effectiveUserName = profile?.fullName || DEMO_STUDENT_NAME;

  const [bookings, setBookings] = useState<BookingWithQuantity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');

  // Modals
  const [inspectingBooking, setInspectingBooking] = useState<BookingWithQuantity | null>(null);
  const [passBooking, setPassBooking] = useState<BookingWithQuantity | null>(null);
  const [incidentBooking, setIncidentBooking] = useState<BookingWithQuantity | null>(null);
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);

  // Status feedback
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bookingService.getStudentBookings(effectiveUserId, 150);
      setBookings(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        const data = await bookingService.getStudentBookings(effectiveUserId, 150);
        if (isMounted) setBookings(data);
      } catch (err: unknown) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Unable to load bookings.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [effectiveUserId]);

  // Cancel booking
  const handleCancelBooking = async (b: BookingWithQuantity) => {
    if (!window.confirm(`Are you sure you want to cancel your booking for "${b.resourceTitle}"?`)) {
      return;
    }
    try {
      await bookingService.cancelBooking(b.id, effectiveUserId, effectiveUserName, 150);
      setBanner({
        type: 'success',
        message: `Booking for "${b.resourceTitle}" was successfully cancelled.`,
      });
      await loadBookings();
      if (inspectingBooking?.id === b.id) {
        setInspectingBooking(null);
      }
    } catch (err: unknown) {
      setBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to cancel booking.',
      });
    }
  };

  // Check In (student check-out / collection)
  const handleCheckIn = async (b: BookingWithQuantity) => {
    try {
      await bookingService.checkIn(b.id, effectiveUserId, effectiveUserName, 150);
      setBanner({
        type: 'success',
        message: `Checked out "${b.resourceTitle}". Remember to return it by the due date!`,
      });
      await loadBookings();
      if (inspectingBooking?.id === b.id) {
        const updated = await bookingService.getBookingById(b.id, 0);
        setInspectingBooking(updated);
      }
    } catch (err: unknown) {
      setBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to check out.',
      });
    }
  };

  // Return (check-out / completion)
  const handleCheckOut = async (b: BookingWithQuantity) => {
    try {
      await bookingService.checkOut(b.id, effectiveUserId, effectiveUserName, 150);
      setBanner({
        type: 'success',
        message: `Resource "${b.resourceTitle}" returned successfully. Thank you!`,
      });
      await loadBookings();
      if (inspectingBooking?.id === b.id) {
        const updated = await bookingService.getBookingById(b.id, 0);
        setInspectingBooking(updated);
      }
    } catch (err: unknown) {
      setBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to return resource.',
      });
    }
  };

  // Submit incident
  const handleSubmitIncident = async (data: {
    bookingId: string;
    resourceId: string;
    resourceTitle: string;
    category: IncidentCategory;
    title: string;
    description: string;
    severity: MockIncident['severity'];
  }) => {
    setIsSubmittingIncident(true);
    try {
      await bookingService.reportIncident({
        bookingId: data.bookingId,
        resourceId: data.resourceId,
        resourceTitle: data.resourceTitle,
        reportedBy: effectiveUserId,
        reporterName: effectiveUserName,
        category: data.category,
        title: data.title,
        description: data.description,
        severity: data.severity,
      });
      setIncidentBooking(null);
      setBanner({
        type: 'success',
        message: `Incident report "${data.title}" was submitted successfully.`,
      });
    } catch (err: unknown) {
      setBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to submit incident report.',
      });
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  // Filtered list
  const filteredBookings = useMemo(() => {
    let result = bookings;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (b) =>
          b.resourceTitle.toLowerCase().includes(q) ||
          b.purpose.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((b) => b.status === statusFilter);
    }
    return result;
  }, [bookings, searchQuery, statusFilter]);

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
              My Resource Bookings
            </h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {bookings.length} total
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track your equipment requests, view approved passes, and manage checkouts.
          </p>
        </div>

        <Link to="/student/resources">
          <Button variant="primary" size="sm" icon={<PlusIcon className="h-4 w-4" />}>
            Browse & Book Resources
          </Button>
        </Link>
      </div>

      {/* ── Filters & Search Toolbar ── */}
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
              placeholder="Search bookings by resource name, purpose, or ref ID..."
              aria-label="Search bookings"
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

        {/* Status pill tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <FilterIcon className="h-3 w-3" /> Status:
          </span>
          {(
            [
              { value: 'ALL', label: 'All Bookings' },
              { value: 'pending', label: 'Pending Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'checked_in', label: 'Active Checkout' },
              { value: 'completed', label: 'Completed' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'cancelled', label: 'Cancelled' },
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

      {/* ── Bookings Grid / List ── */}
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
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No matching bookings</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            No bookings match your current search or filter criteria.
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
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No bookings yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            You have not requested any campus resources yet. Browse the marketplace to find hardware,
            study pods, or equipment for your projects.
          </p>
          <Link to="/student/resources">
            <Button variant="primary" size="sm" icon={<PlusIcon className="h-4 w-4" />}>
              Explore Marketplace
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredBookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onViewDetails={setInspectingBooking}
              onCancel={handleCancelBooking}
              onViewPass={setPassBooking}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              onReportIncident={setIncidentBooking}
            />
          ))}
        </div>
      )}

      {/* ── Details Modal ── */}
      <BookingDetailsModal
        isOpen={Boolean(inspectingBooking)}
        booking={inspectingBooking}
        onClose={() => setInspectingBooking(null)}
        onCancel={handleCancelBooking}
        onViewPass={setPassBooking}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onReportIncident={setIncidentBooking}
      />

      {/* ── Booking Pass Modal ── */}
      <BookingPassModal
        isOpen={Boolean(passBooking)}
        booking={passBooking}
        studentName={effectiveUserName}
        onClose={() => setPassBooking(null)}
      />

      {/* ── Incident Report Modal ── */}
      <IncidentReportModal
        isOpen={Boolean(incidentBooking)}
        booking={incidentBooking}
        onClose={() => setIncidentBooking(null)}
        onSubmit={handleSubmitIncident}
        isSubmitting={isSubmittingIncident}
      />
    </div>
  );
};
