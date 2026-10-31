import React from 'react';
import type { Resource } from '../../../packages/shared/src/types';
import {
  AlertTriangleIcon,
  Button,
  PackageIcon,
  RefreshCwIcon,
  SearchIcon,
} from '../common';
import { ResourceCard } from './ResourceCard';

export interface ResourceGridProps {
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
  isFiltered: boolean;
  onResetFilters: () => void;
  onRetry?: () => void;
  onSelectResource: (resource: Resource) => void;
}

export const ResourceGrid: React.FC<ResourceGridProps> = ({
  resources,
  isLoading,
  error,
  isFiltered,
  onResetFilters,
  onRetry,
  onSelectResource,
}) => {
  // ── 1. Loading State (Skeleton Cards) ──
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        role="status"
        aria-label="Loading resources"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white p-0 shadow-xs dark:border-slate-800 dark:bg-slate-900 animate-pulse"
          >
            {/* Media Skeleton */}
            <div className="aspect-16/10 w-full bg-slate-200 dark:bg-slate-800" />

            {/* Body Skeleton */}
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-14 rounded-md bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-5 w-3/4 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-4/5 rounded-md bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="pt-2">
                <div className="h-8 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── 2. Error State ──
  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center dark:border-rose-900/60 dark:bg-rose-950/30 md:p-12"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
          <AlertTriangleIcon className="h-7 w-7" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
          Failed to load campus resources
        </h3>
        <p className="mb-6 max-w-md text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {error}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            icon={<RefreshCwIcon className="h-4 w-4" />}
          >
            Retry Connection
          </Button>
        )}
      </div>
    );
  }

  // ── 3. No Search Results State (when filters active) ──
  if (resources.length === 0 && isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/60 md:p-12">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          <SearchIcon className="h-7 w-7" />
        </div>
        <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
          No matching resources found
        </h3>
        <p className="mb-6 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          We couldn&apos;t find any resources matching your current search terms or filter criteria. Try
          broadening your search or clearing active filters.
        </p>
        <Button variant="primary" size="sm" onClick={onResetFilters}>
          Reset All Filters
        </Button>
      </div>
    );
  }

  // ── 4. Empty State (when zero resources in system) ──
  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/60 md:p-12">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <PackageIcon className="h-7 w-7" />
        </div>
        <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
          No resources listed yet
        </h3>
        <p className="max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          There are currently no resources published in the campus inventory. Check back soon or
          contact your institution manager.
        </p>
      </div>
    );
  }

  // ── 5. Normal Populated State ──
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          onSelect={onSelectResource}
        />
      ))}
    </div>
  );
};

