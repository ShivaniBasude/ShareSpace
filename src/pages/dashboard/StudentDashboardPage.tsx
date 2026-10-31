import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Badge,
  Button,
  CalendarIcon,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CheckCircle2Icon,
  ChevronRightIcon,
  ClockIcon,
  FolderIcon,
  PackageIcon,
  QrCodeIcon,
} from '../../components/common';
import {
  bookingService,
  DEMO_STUDENT_ID,
  type BookingWithQuantity,
} from '../../features/bookings';
import { BookingStatusBadge } from '../../components/bookings';

export const StudentDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const effectiveUserId = profile?.uid || DEMO_STUDENT_ID;

  const [bookings, setBookings] = useState<BookingWithQuantity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBookings = async () => {
      try {
        const data = await bookingService.getStudentBookings(effectiveUserId, 100);
        if (isMounted) setBookings(data);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void fetchBookings();
    return () => {
      isMounted = false;
    };
  }, [effectiveUserId]);

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;
  const activeCount = bookings.filter((b) => b.status === 'checked_in').length;
  const upcomingReturns = bookings
    .filter((b) => b.status === 'checked_in')
    .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());

  const recentActivity = [...bookings]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  function fmtDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Student Resource Hub
            </h1>
            <Badge status="student" size="sm" />
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Welcome back,{' '}
            <strong className="text-slate-900 dark:text-white">
              {profile?.fullName || 'Campus Student'}
            </strong>
            . Track your reservations, generate passes, and discover campus resources.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/student/bookings">
            <Button variant="outline" size="sm" icon={<CalendarIcon className="h-4 w-4" />}>
              My Bookings
            </Button>
          </Link>
          <Link to="/student/resources">
            <Button variant="primary" size="sm" icon={<FolderIcon className="h-4 w-4" />}>
              Browse Resources
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Metric Summary Cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Active Checkouts */}
          <Card className="p-5 border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                Active Checkouts
              </span>
              <PackageIcon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                {activeCount}
              </span>
              <span className="text-xs text-slate-500">in use</span>
            </div>
            <p className="mt-2 text-3xs text-slate-400">Resources currently checked out</p>
          </Card>

          {/* Approved Bookings */}
          <Card className="p-5 border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Approved Passes
              </span>
              <QrCodeIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {approvedCount}
              </span>
              <span className="text-xs text-slate-500">ready to collect</span>
            </div>
            <p className="mt-2 text-3xs text-slate-400">Approved and ready for physical checkout</p>
          </Card>

          {/* Pending Review */}
          <Card className="p-5 border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Pending Approval
              </span>
              <ClockIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {pendingCount}
              </span>
              <span className="text-xs text-slate-500">requests</span>
            </div>
            <p className="mt-2 text-3xs text-slate-400">Awaiting department owner review</p>
          </Card>

          {/* Total Lifetime Bookings */}
          <Card className="p-5 border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Total Bookings
              </span>
              <CalendarIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {bookings.length}
              </span>
              <span className="text-xs text-slate-500">lifetime</span>
            </div>
            <p className="mt-2 text-3xs text-slate-400">Overall campus resource reservations</p>
          </Card>
        </div>
      )}

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Recent Activity & Active Checkouts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Booking Activity
            </h2>
            <Link
              to="/student/bookings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View All Bookings <ChevronRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentActivity.length === 0 && !isLoading ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 dark:border-slate-800">
              <PackageIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No booking requests yet
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Explore campus labs and equipment to get started.
              </p>
              <Link to="/student/resources">
                <Button variant="primary" size="sm">
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BookingStatusBadge status={b.status} />
                      <span className="font-mono text-3xs text-slate-400">
                        {b.id.toUpperCase().slice(-8)}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {b.resourceTitle}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {b.requestedQuantity} unit(s) · {fmtDate(b.startTime)} → {fmtDate(b.endTime)}
                    </p>
                  </div>

                  <Link to="/student/bookings">
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Returns & Quick Actions */}
        <div className="space-y-6">
          {/* Upcoming Returns Widget */}
          <Card className="border-slate-200/80 dark:border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Upcoming Returns</CardTitle>
                <span className="rounded-md bg-sky-50 px-2 py-0.5 text-3xs font-semibold text-sky-700 dark:bg-sky-950/50 dark:text-sky-400">
                  {upcomingReturns.length} active
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {upcomingReturns.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No active loans due for return.</p>
              ) : (
                <ul className="space-y-3">
                  {upcomingReturns.map((loan) => (
                    <li key={loan.id} className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800/60 space-y-1">
                      <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {loan.resourceTitle}
                      </p>
                      <div className="flex items-center justify-between text-3xs text-slate-500">
                        <span>Due: {fmtDate(loan.endTime)}</span>
                        <Link to="/student/bookings" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                          Return →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Quick Shortcuts */}
          <Card className="border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40">
            <CardContent className="p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Quick Actions
              </span>
              <div className="flex flex-col gap-2">
                <Link to="/student/resources">
                  <Button variant="outline" size="sm" fullWidth icon={<FolderIcon className="h-4 w-4" />}>
                    Explore Available Gear
                  </Button>
                </Link>
                <Link to="/student/bookings">
                  <Button variant="secondary" size="sm" fullWidth icon={<QrCodeIcon className="h-4 w-4" />}>
                    View My Booking Passes
                  </Button>
                </Link>
                <Link to="/student/incidents">
                  <Button variant="ghost" size="sm" fullWidth icon={<CheckCircle2Icon className="h-4 w-4" />}>
                    Report Issue / Incident
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
