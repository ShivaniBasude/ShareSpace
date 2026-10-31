import React from 'react';
import { NavLink } from 'react-router-dom';
import type { UserRole } from '../../types';
import {
  LogoIcon,
  CalendarIcon,
  UsersIcon,
  LayersIcon,
  ShieldCheckIcon,
  HomeIcon,
  UserIcon,
  FolderIcon,
  BookmarkIcon,
  QrCodeIcon,
  AlertTriangleIcon,
  BellIcon,
  ClipboardListIcon,
  ActivityIcon,
  KeyIcon,
  SettingsIcon,
} from '../common/Icons';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navigation: Record<UserRole, NavItem[]> = {
  student: [
    { label: 'Dashboard', path: '/student/dashboard', icon: <HomeIcon /> },
    { label: 'My Bookings', path: '/student/bookings', icon: <CalendarIcon /> },
    { label: 'Browse Resources', path: '/student/resources', icon: <FolderIcon /> },
    { label: 'My QR Passes', path: '/student/qr-passes', icon: <QrCodeIcon /> },
    { label: 'Report Incident', path: '/student/incidents', icon: <AlertTriangleIcon /> },
    { label: 'Notifications', path: '/student/notifications', icon: <BellIcon /> },
    { label: 'Profile', path: '/student/profile', icon: <UserIcon /> },
  ],
  owner: [
    { label: 'Dashboard', path: '/owner/dashboard', icon: <HomeIcon /> },
    { label: 'Resource Inventory', path: '/owner/resources', icon: <LayersIcon /> },
    { label: 'Booking Requests', path: '/owner/bookings', icon: <BookmarkIcon /> },
    { label: 'Active Loans', path: '/owner/loans', icon: <ClipboardListIcon /> },
    { label: 'Verify Booking Pass', path: '/owner/verify-booking', icon: <QrCodeIcon /> },
    { label: 'Incidents', path: '/owner/incidents', icon: <AlertTriangleIcon /> },
    { label: 'Profile', path: '/owner/profile', icon: <UserIcon /> },
  ],
  institution_manager: [
    { label: 'Overview', path: '/institution/dashboard', icon: <HomeIcon /> },
    { label: 'Resources', path: '/institution/resources', icon: <FolderIcon /> },
    { label: 'Users', path: '/institution/users', icon: <UsersIcon /> },
    { label: 'Activity Log', path: '/institution/activity', icon: <ActivityIcon /> },
    { label: 'Profile', path: '/institution/profile', icon: <UserIcon /> },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <HomeIcon /> },
    { label: 'Users', path: '/admin/users', icon: <UsersIcon /> },
    { label: 'Role Management', path: '/admin/roles', icon: <KeyIcon /> },
    { label: 'Audit Logs', path: '/admin/audit', icon: <ShieldCheckIcon /> },
    { label: 'Settings', path: '/admin/settings', icon: <SettingsIcon /> },
    { label: 'Profile', path: '/admin/profile', icon: <UserIcon /> },
  ],
};

const roleLabel: Record<UserRole, string> = {
  student: 'Student',
  owner: 'Resource Owner',
  institution_manager: 'Institution Manager',
  admin: 'Administrator',
};

interface DashboardSidebarProps {
  role: UserRole;
  /** Called after a nav link is clicked — used to close mobile overlay. */
  onNavigate?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ role, onNavigate }) => {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <LogoIcon className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold tracking-tight text-gray-900">ShareSpace</span>
      </div>

      {/* Role badge */}
      <div className="border-b border-gray-100 px-6 py-3">
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          {roleLabel[role]}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Workspace
        </p>
        <ul className="space-y-0.5">
          {navigation[role].map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <span className="shrink-0">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-gray-100 px-6 py-3">
        <p className="text-xs text-gray-400">ShareSpace · Campus Resource Sharing</p>
      </div>
    </aside>
  );
};
