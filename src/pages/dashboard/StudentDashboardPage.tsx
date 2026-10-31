import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../../components/common/Badge';

export const StudentDashboardPage: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <Badge status="student" size="sm" />
        </div>
        {profile && (
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, <span className="font-medium text-gray-700">{profile.fullName}</span>. Your
            campus resource hub is ready.
          </p>
        )}
      </div>

      {/* Placeholder content cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Upcoming Bookings', note: 'Your confirmed bookings will appear here.' },
          { label: 'Recent Activity', note: 'Recent booking and check-in history.' },
          { label: 'Quick Book', note: 'Browse and book campus resources quickly.' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-1 text-sm font-semibold text-gray-800">{card.label}</h2>
            <p className="text-xs text-gray-400">{card.note}</p>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-600">Coming in Phase 3</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

