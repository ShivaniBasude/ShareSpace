import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import { MainLayout, DashboardLayout } from '../components/layout';

import {
  LandingPage,
  AboutPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  NotFoundPage,
  StudentMarketplacePage,
} from '../pages';

import { ProtectedRoute } from './ProtectedRoute';
import { StudentDashboardPage } from '../pages/dashboard/StudentDashboardPage';
import { PlaceholderPage } from '../pages/dashboard/PlaceholderPage';

const RoleDashboardRedirect: React.FC = () => {
  const { role } = useAuth();

  switch (role) {
    case 'student':
      return <Navigate to="/student/dashboard" replace />;
    case 'owner':
      return <Navigate to="/owner/dashboard" replace />;
    case 'institution_manager':
      return <Navigate to="/institution/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const UnauthorizedPage: React.FC = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3">
    <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
    <p className="text-gray-600">
      You don&apos;t have permission to access this page.
    </p>
    <a href="/" className="mt-2 text-sm font-medium text-indigo-600 hover:underline">
      Return to home
    </a>
  </div>
);

export const AppRoutes: React.FC = () => (
  <Routes>
    {/* Public pages */}
    <Route path="/" element={<MainLayout />}>
      <Route index element={<LandingPage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>

    {/* Generic authenticated dashboard redirect */}
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<RoleDashboardRedirect />} />
    </Route>

    {/* Student routes */}
    <Route element={<ProtectedRoute allowedRoles={['student']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/student/bookings" element={<PlaceholderPage title="My Bookings" />} />
        <Route path="/student/resources" element={<StudentMarketplacePage />} />
        <Route path="/student/qr-passes" element={<PlaceholderPage title="My QR Passes" />} />
        <Route path="/student/incidents" element={<PlaceholderPage title="Report Incident" />} />
        <Route path="/student/notifications" element={<PlaceholderPage title="Notifications" />} />
        <Route path="/student/profile" element={<PlaceholderPage title="My Profile" />} />
      </Route>
    </Route>

    {/* Resource owner routes */}
    <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/owner/dashboard" element={<PlaceholderPage title="Owner Dashboard" />} />
        <Route path="/owner/resources" element={<PlaceholderPage title="Resource Inventory" />} />
        <Route path="/owner/bookings" element={<PlaceholderPage title="Booking Requests" />} />
        <Route path="/owner/loans" element={<PlaceholderPage title="Active Loans" />} />
        <Route path="/owner/incidents" element={<PlaceholderPage title="Incidents" />} />
        <Route path="/owner/profile" element={<PlaceholderPage title="My Profile" />} />
      </Route>
    </Route>

    {/* Institution manager routes */}
    <Route element={<ProtectedRoute allowedRoles={['institution_manager']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/institution/dashboard" element={<PlaceholderPage title="Institution Overview" />} />
        <Route path="/institution/resources" element={<PlaceholderPage title="Institution Resources" />} />
        <Route path="/institution/users" element={<PlaceholderPage title="Manage Users" />} />
        <Route path="/institution/activity" element={<PlaceholderPage title="Activity Log" />} />
        <Route path="/institution/profile" element={<PlaceholderPage title="My Profile" />} />
      </Route>
    </Route>

    {/* Administrator routes */}
    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="/admin/dashboard" element={<PlaceholderPage title="Admin Dashboard" />} />
        <Route path="/admin/users" element={<PlaceholderPage title="Manage Users" />} />
        <Route path="/admin/roles" element={<PlaceholderPage title="Role Management" />} />
        <Route path="/admin/audit" element={<PlaceholderPage title="Audit Logs" />} />
        <Route path="/admin/settings" element={<PlaceholderPage title="Administration Settings" />} />
        <Route path="/admin/profile" element={<PlaceholderPage title="My Profile" />} />
      </Route>
    </Route>

    {/* Unauthorized access */}
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
  </Routes>
);
