import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { MenuIcon, LogOutIcon } from '../common/Icons';
import { NotificationMenu } from '../notifications';
import { DEMO_STUDENT_ID, DEMO_OWNER_ID } from '../../features/bookings';

interface DashboardHeaderProps {
  onSidebarToggle: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onSidebarToggle }) => {
  const { profile, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
    // AuthContext clears state; AppRoutes/ProtectedRoute redirects to /login
  };

  const notificationUserId =
    profile?.uid || (profile?.role === 'owner' ? DEMO_OWNER_ID : DEMO_STUDENT_ID);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      {/* Left: hamburger (mobile only) */}
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={onSidebarToggle}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 md:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {/* Spacer on desktop (sidebar is always visible) */}
      <div className="hidden md:block" />

      {/* Right: notifications + user info + logout */}
      <div className="flex items-center gap-3">
        <NotificationMenu userId={notificationUserId} />

        {profile && (
          <>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm font-medium text-gray-900">{profile.fullName}</span>
              <Badge status={profile.role} size="sm" />
            </div>
            <div
              title={profile.fullName}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 sm:hidden"
            >
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={isLoading}
          aria-label="Sign out"
          icon={<LogOutIcon className="h-4 w-4" />}
          iconPosition="left"
        >
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
};

