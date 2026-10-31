import React, { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';

/**
 * DashboardLayout
 *
 * Provides the responsive shell for all authenticated dashboard pages:
 * - Fixed sidebar on md+ screens
 * - Slide-over sidebar with backdrop overlay on mobile
 * - Persistent header with user info and logout
 * - <Outlet /> for nested route content
 */
export const DashboardLayout: React.FC = () => {
  const { role } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Close mobile sidebar on window resize to md+
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setSidebarOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Escape key closes the mobile sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Fallback: role should always be defined when inside ProtectedRoute
if (!role) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-600">Loading your dashboard...</p>
    </div>
  );
}

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Desktop sidebar (always visible on md+) ─────────────────────── */}
      <div className="hidden md:flex md:shrink-0">
        <DashboardSidebar role={role} />
      </div>

      {/* ── Mobile sidebar overlay ───────────────────────────────────────── */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={closeSidebar}
          />
          {/* Slide-over panel */}
          <div className="fixed inset-y-0 left-0 z-30 flex md:hidden">
            <DashboardSidebar role={role} onNavigate={closeSidebar} />
          </div>
        </>
      )}

      {/* ── Main content column ──────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader onSidebarToggle={openSidebar} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

