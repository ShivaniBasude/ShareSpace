import React from 'react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

/**
 * Reusable placeholder for routes that will be fully implemented in Phase 3+.
 * Shows a clear "planned feature" notice rather than a blank page.
 */
export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description = 'This feature is planned for an upcoming phase. Check back soon.',
}) => (
  <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    </div>
    <h1 className="mb-2 text-2xl font-bold text-gray-900">{title}</h1>
    <p className="max-w-sm text-sm text-gray-500">{description}</p>
    <span className="mt-4 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
      Planned Feature — Phase 3
    </span>
  </div>
);

