import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  bookingService,
  DEMO_STUDENT_ID,
  type MockIncident,
} from '../../features/bookings';
import { useAuth } from '../../hooks';
import {
  Button,
  CheckCircle2Icon,
  PackageIcon,
  PlusIcon,
  RefreshCwIcon,
} from '../../components/common';

const SEVERITY_BADGES: Record<MockIncident['severity'], { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300' },
  critical: { label: 'Critical', className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
};

const STATUS_BADGES: Record<MockIncident['status'], { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
  investigating: { label: 'Under Review', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  resolved: { label: 'Resolved', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  closed: { label: 'Closed', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

export const StudentIncidentsPage: React.FC = () => {
  const { profile } = useAuth();
  const effectiveUserId = profile?.uid || DEMO_STUDENT_ID;

  const [incidents, setIncidents] = useState<MockIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bookingService.getIncidents(effectiveUserId, 150);
      setIncidents(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load incidents.');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        const data = await bookingService.getIncidents(effectiveUserId, 150);
        if (isMounted) setIncidents(data);
      } catch (err: unknown) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Unable to load incidents.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [effectiveUserId]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Reported Incidents & Issues
            </h1>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              {incidents.length} reports
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View status on damage reports, equipment malfunctions, and return issues you reported.
          </p>
        </div>

        <Link to="/student/bookings">
          <Button variant="primary" size="sm" icon={<PlusIcon className="h-4 w-4" />}>
            Report Issue From Bookings
          </Button>
        </Link>
      </div>

      {/* ── Demo Notice ── */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 space-y-1">
        <p className="font-semibold text-slate-800 dark:text-slate-200">
          Incident Reporting Workflow
        </p>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
          Issues can be filed directly from your active or completed bookings on the{' '}
          <Link to="/student/bookings" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
            My Bookings page
          </Link>
          . Lab managers and resource owners receive notification and can review the report.
        </p>
      </div>

      {/* ── Incidents List ── */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center dark:border-rose-900/60 dark:bg-rose-950/30">
          <p className="text-sm font-bold text-rose-800 dark:text-rose-200 mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={loadIncidents} icon={<RefreshCwIcon className="h-4 w-4" />}>
            Retry
          </Button>
        </div>
      ) : incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <CheckCircle2Icon className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No incidents on record</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            You haven&apos;t filed any incident or damage reports. If you experience an issue with borrowed equipment, you can report it from your bookings.
          </p>
          <Link to="/student/bookings">
            <Button variant="outline" size="sm">
              View Active Bookings
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-3xs font-bold uppercase tracking-wider ${SEVERITY_BADGES[inc.severity].className}`}>
                    {SEVERITY_BADGES[inc.severity].label}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-3xs font-semibold ${STATUS_BADGES[inc.status].className}`}>
                    {STATUS_BADGES[inc.status].label}
                  </span>
                  <span className="font-mono text-3xs text-slate-400">{inc.id.toUpperCase()}</span>
                </div>
                <span className="text-3xs text-slate-400">
                  {new Date(inc.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{inc.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{inc.description}</p>
              </div>

              {inc.resourceTitle && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <PackageIcon className="h-3.5 w-3.5 text-slate-400" />
                  <span>Resource: <strong>{inc.resourceTitle}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
