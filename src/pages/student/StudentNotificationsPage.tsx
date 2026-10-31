import React, { useState, useEffect, useCallback } from 'react';
import {
  notificationService,
  DEMO_STUDENT_ID,
  type MockNotification,
} from '../../features/bookings';
import { useAuth } from '../../hooks';
import {
  BellIcon,
  Button,
  CheckCircle2Icon,
} from '../../components/common';

function fmtDate(iso: string): string {
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

export const StudentNotificationsPage: React.FC = () => {
  const { profile } = useAuth();
  const effectiveUserId = profile?.uid || DEMO_STUDENT_ID;

  const [notifications, setNotifications] = useState<MockNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications(effectiveUserId, 100);
      setNotifications(data);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        const data = await notificationService.getNotifications(effectiveUserId, 100);
        if (isMounted) setNotifications(data);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [effectiveUserId]);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(effectiveUserId, 100);
    await loadNotifications();
  };

  const handleMarkRead = async (id: string) => {
    await notificationService.markAsRead(id, 50);
    await loadNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Notifications & Alerts
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Booking updates, approval decisions, and return reminder alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <BellIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No notifications yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            When you request resources or receive status updates, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => { if (!n.read) void handleMarkRead(n.id); }}
              className={`flex items-start gap-3 rounded-xl border p-4 transition-colors cursor-pointer ${
                !n.read
                  ? 'border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/40 dark:bg-indigo-950/20'
                  : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <CheckCircle2Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</h3>
                  <span className="text-3xs text-slate-400 shrink-0">{fmtDate(n.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
              </div>
              {!n.read && (
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" aria-label="Unread" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
