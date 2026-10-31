import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Resource } from '../../../packages/shared/src/types';
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
  PackageIcon,
  PlusIcon,
  QrCodeIcon,
  ShieldCheckIcon,
} from '../../components/common';
import {
  ResourceDetailsModal,
  ResourceFormModal,
} from '../../components/resources';
import {
  resourceService,
  DEMO_OWNER_ID,
  type CreateResourceInput,
  type OwnerActivityLog,
  type OwnerResourceStats,
  type UpdateResourceInput,
} from '../../features/resources';
import {
  bookingService,
  type BookingWithQuantity,
} from '../../features/bookings';
import { useAuth } from '../../hooks';

export const OwnerDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const effectiveOwnerId = profile?.uid || DEMO_OWNER_ID;

  const [stats, setStats] = useState<OwnerResourceStats | null>(null);
  const [recentResources, setRecentResources] = useState<Resource[]>([]);
  const [activities, setActivities] = useState<OwnerActivityLog[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<BookingWithQuantity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const refreshDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsData, resourcesData, activityData, bookingsData] = await Promise.all([
        resourceService.getOwnerResourceStats(effectiveOwnerId),
        resourceService.getOwnerResources(effectiveOwnerId, undefined, 0),
        resourceService.getOwnerRecentActivity(effectiveOwnerId),
        bookingService.getOwnerBookings(effectiveOwnerId, 0),
      ]);

      setStats(statsData);
      setRecentResources(resourcesData.slice(0, 4));
      setActivities(activityData);
      setOwnerBookings(bookingsData);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveOwnerId]);

  // Initial load without synchronous setState in effect
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const [statsData, resourcesData, activityData, bookingsData] = await Promise.all([
          resourceService.getOwnerResourceStats(effectiveOwnerId),
          resourceService.getOwnerResources(effectiveOwnerId, undefined, 0),
          resourceService.getOwnerRecentActivity(effectiveOwnerId),
          bookingService.getOwnerBookings(effectiveOwnerId, 0),
        ]);

        if (isMounted) {
          setStats(statsData);
          setRecentResources(resourcesData.slice(0, 4));
          setActivities(activityData);
          setOwnerBookings(bookingsData);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [effectiveOwnerId]);

  const pendingBookings = ownerBookings.filter((b) => b.status === 'pending');
  const activeBookings = ownerBookings.filter((b) => b.status === 'checked_in');
  const overdueBookings = activeBookings.filter((b) => new Date(b.endTime) < new Date());

  // Handle resource creation from Dashboard shortcut
  const handleCreateResource = async (data: CreateResourceInput | UpdateResourceInput) => {
    setIsSubmitting(true);
    try {
      await resourceService.createResource(data as CreateResourceInput, {
        ownerId: effectiveOwnerId,
        institutionId: profile?.institutionId,
      });
      setIsFormOpen(false);
      setBannerMessage(`Resource "${data.title}" was successfully created and listed.`);
      await refreshDashboardData();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Banner alert ── */}
      {bannerMessage && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 animate-in fade-in duration-200 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 cursor-pointer text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Welcome Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Resource Owner Dashboard
            </h1>
            <Badge status="owner" size="sm" />
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Welcome back,{' '}
            <strong className="text-slate-900 dark:text-white">
              {profile?.fullName || 'Campus Owner'}
            </strong>
            . Manage resource inventories, configure reservation rules, and review asset statuses
            {profile?.department ? ` for ${profile.department}` : ''}.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/owner/verify-booking">
            <Button variant="outline" size="sm" icon={<QrCodeIcon className="h-4 w-4" />}>
              Verify Pass
            </Button>
          </Link>
          <Link to="/owner/bookings">
            <Button variant="secondary" size="sm" icon={<CalendarIcon className="h-4 w-4" />}>
              Bookings {pendingBookings.length > 0 && `(${pendingBookings.length})`}
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsFormOpen(true)}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Add Resource
          </Button>
        </div>
      </div>

      {/* ── Pending Requests Alert Banner ── */}
      {pendingBookings.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              You have <strong>{pendingBookings.length}</strong> pending booking request(s) waiting for your review.
            </span>
          </div>
          <Link
            to="/owner/bookings"
            className="font-bold underline text-amber-800 dark:text-amber-300 hover:text-amber-900"
          >
            Review Requests →
          </Link>
        </div>
      )}

      {/* ── Overdue Alert Banner ── */}
      {overdueBookings.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 shrink-0 text-rose-600" />
            <span>
              <strong>{overdueBookings.length}</strong> active checkout(s) are past their scheduled return date.
            </span>
          </div>
          <Link
            to="/owner/bookings"
            className="font-bold underline text-rose-800 dark:text-rose-300 hover:text-rose-900"
          >
            View Overdue →
          </Link>
        </div>
      )}

      {/* ── Summary Stats Cards (Dynamic Mock Calculations) ── */}
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
          {/* Total Managed */}
          <Card className="p-5 border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider">Total Managed</span>
              <PackageIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.totalCount ?? 0}
              </span>
              <span className="text-xs text-slate-500">
                ({stats?.totalInventoryUnits ?? 0} total units)
              </span>
            </div>
            <p className="mt-2 text-2xs text-slate-400">Total cataloged assets under your supervision</p>
          </Card>

          {/* Available Now */}
          <Card className="p-5 border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Available In Stock
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats?.availableCount ?? 0}
              </span>
              <span className="text-xs text-slate-500">
                ({stats?.availableUnits ?? 0} ready to book)
              </span>
            </div>
            <p className="mt-2 text-2xs text-slate-400">Assets currently ready for instant reservation</p>
          </Card>

          {/* Reserved */}
          <Card className="p-5 border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Active Loans / Reserved
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats?.reservedCount ?? 0}
              </span>
              <span className="text-xs text-slate-500">resources</span>
            </div>
            <p className="mt-2 text-2xs text-slate-400">Currently reserved or allocated for use</p>
          </Card>

          {/* Unavailable / Maintenance */}
          <Card className="p-5 border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Deactivated / Service
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {stats?.unavailableCount ?? 0}
              </span>
              <span className="text-xs text-slate-500">offline</span>
            </div>
            <p className="mt-2 text-2xs text-slate-400">Deactivated or under maintenance check</p>
          </Card>
        </div>
      )}

      {/* ── Main Content Grid: Recent Inventory & Activity Log ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Quick Inventory Snapshot */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Managed Inventory Snapshot
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {stats?.totalCount ?? 0}
              </span>
            </div>

            <Link
              to="/owner/resources"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Manage All Resources <ChevronRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentResources.length === 0 && !isLoading ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 dark:border-slate-800">
              <PackageIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No resources cataloged yet
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Get started by listing your first department space, tool, or equipment.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsFormOpen(true)}
                icon={<PlusIcon className="h-4 w-4" />}
              >
                Add Your First Resource
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentResources.map((res) => (
                <div
                  key={res.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-3xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {res.category}
                      </span>
                      <span className="font-mono text-3xs font-semibold text-slate-500">
                        {res.resourceType}
                      </span>
                      <Badge status={res.availabilityStatus} size="sm">
                        {res.availabilityStatus}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {res.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-1">
                      {res.location || 'Location unassigned'} ·{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {res.availableQuantity} of {res.quantity} available
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedResource(res);
                        setIsDetailsOpen(true);
                      }}
                    >
                      Inspect
                    </Button>
                    <Link to="/owner/resources">
                      <Button variant="secondary" size="sm">
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Activity Log & Governance */}
        <div className="space-y-6">
          {/* Incoming Booking Requests */}
          <Card className="border-slate-200/80 dark:border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Pending Booking Requests</CardTitle>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-3xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                  {pendingBookings.length} pending
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {pendingBookings.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No pending booking requests.</p>
              ) : (
                <div className="space-y-3">
                  {pendingBookings.slice(0, 3).map((req) => (
                    <div
                      key={req.id}
                      className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800/60 space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                        <span className="line-clamp-1">{req.resourceTitle}</span>
                        <span className="text-3xs font-mono text-slate-400">
                          {req.requestedQuantity} unit(s)
                        </span>
                      </div>
                      <p className="text-3xs text-slate-500">From: {req.userDisplayName}</p>
                      <div className="flex justify-end pt-1">
                        <Link
                          to="/owner/bookings"
                          className="text-3xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Review Request →
                        </Link>
                      </div>
                    </div>
                  ))}
                  <Link
                    to="/owner/bookings"
                    className="block text-center text-xs font-semibold text-indigo-600 hover:underline pt-1"
                  >
                    Manage All Requests ({pendingBookings.length})
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Demonstration Activity Log */}
          <Card className="border-slate-200/80 dark:border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Recent Activity Log</CardTitle>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-3xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                  Demo Data
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <ul className="space-y-3.5">
                {activities.map((act) => (
                  <li key={act.id} className="flex items-start gap-2.5 text-xs">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      <ClockIcon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {act.action}
                      </p>
                      <p className="text-2xs text-slate-500 line-clamp-1">{act.resourceTitle}</p>
                      <span className="text-3xs text-slate-400">{act.timestamp}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Owner Governance Policy Box */}
          <Card className="border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40">
            <CardContent className="p-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <ShieldCheckIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Owner Responsibilities</span>
              </div>
              <ul className="space-y-1.5 text-2xs leading-relaxed text-slate-500 dark:text-slate-400">
                <li>• Verify physical returns and perform damage inspections after each booking.</li>
                <li>• Deactivate equipment immediately if maintenance or calibration is required.</li>
                <li>• Keep technical specs updated to ensure student project safety compliance.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Form Modal (Create Resource) ── */}
      <ResourceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateResource}
        isSubmitting={isSubmitting}
      />

      {/* ── Inspect Details Modal ── */}
      <ResourceDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        resource={selectedResource}
      />
    </div>
  );
};
