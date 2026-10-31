import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { MockNotification } from '../../features/bookings/bookingTypes';
import { notificationService } from '../../features/bookings/bookingService';
import { BellIcon, CheckCircle2Icon, XIcon } from '../common/Icons';
import { Button } from '../common/Button';

function fmtRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch { return ''; }
}

function typeColor(type: MockNotification['type']): string {
  switch (type) {
    case 'approval': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';
    case 'booking': return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400';
    case 'incident': return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400';
    default: return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
  }
}

interface NotificationMenuProps {
  userId: string;
}

export const NotificationMenu: React.FC<NotificationMenuProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<MockNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(() => {
    let isMounted = true;
    notificationService
      .getNotifications(userId, 0)
      .then((notifs) => {
        if (isMounted) {
          setNotifications(notifs);
          setUnreadCount(notifs.filter((n) => !n.read).length);
        }
      })
      .catch(() => {
        /* no-op */
      });
    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    const cleanup = loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [loadNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(userId, 0);
    loadNotifications();
  };

  const handleMarkRead = async (id: string) => {
    await notificationService.markAsRead(id, 0);
    loadNotifications();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-white text-3xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-80 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Close"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <BellIcon className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${!n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}
                  onClick={() => { if (!n.read) void handleMarkRead(n.id); }}
                >
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${typeColor(n.type)}`}>
                    {n.type === 'approval' ? <CheckCircle2Icon className="h-3.5 w-3.5" /> : <BellIcon className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">{n.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-3xs text-slate-400 mt-1">{fmtRelative(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-label="Unread" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5">
              <Button variant="ghost" size="sm" fullWidth onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

