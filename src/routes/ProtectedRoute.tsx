
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  allowedRoles?: Array<'student' | 'owner' | 'institution_manager' | 'admin'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
}) => {
  const {
    user,
    profile,
    role,
    accountStatus,
    isLoading,
    isProfileLoading,
    isRegistrationIncomplete,
  } = useAuth();

  // Wait until Firebase authentication and profile checks finish.
  if (isLoading || isProfileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Checking your account...</p>
      </div>
    );
  }

  // User must be signed in.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Incomplete registration must be completed first.
  if (isRegistrationIncomplete || !profile) {
    return <Navigate to="/register" replace />;
  }

  // Only active accounts can access protected pages.
  if (accountStatus !== 'active') {
    return <Navigate to="/login" replace />;
  }

  // Restrict access to the specified roles.
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
