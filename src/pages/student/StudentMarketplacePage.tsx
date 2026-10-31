import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Resource,
  ResourceAvailabilityStatus,
  ResourceCategory,
} from '../../../packages/shared/src/types';
import {
  ResourceFilters,
  ResourceGrid,
  ResourceDetailsModal,
} from '../../components/resources';
import { resourceService } from '../../features/resources';
import { useAuth } from '../../hooks';
import { SparklesIcon } from '../../components/common';

export const StudentMarketplacePage: React.FC = () => {
  const { profile } = useAuth();

  // ── Data & Fetch State ──
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filter States ──
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'ALL'>('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState<
    ResourceAvailabilityStatus | 'ALL'
  >('ALL');
  const [selectedResourceType, setSelectedResourceType] = useState<string | 'ALL'>('ALL');

  // ── Modal State ──
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Load all resources on mount
  const loadResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await resourceService.getResources(undefined, 300);
      setAllResources(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to connect to campus inventory. Please check your network connection.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchResources = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await resourceService.getResources(undefined, 300);

        if (isMounted) {
          setAllResources(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : 'Unable to connect to campus inventory. Please check your network connection.';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchResources();

    return () => {
      isMounted = false;
    };
  }, []);

  // Distinct resource types across all resources for the type filter
  const distinctResourceTypes = useMemo(() => {
    return resourceService.getDistinctResourceTypes(allResources);
  }, [allResources]);

  // Combined client-side filtering (Search + Category + Availability + Type)
  const filteredResources = useMemo(() => {
    let result = allResources;

    // Search query filter (title, description, resourceType, location)
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.resourceType.toLowerCase().includes(q) ||
          (r.location && r.location.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter((r) => r.category === selectedCategory);
    }

    // Availability status filter
    if (selectedAvailability !== 'ALL') {
      result = result.filter((r) => r.availabilityStatus === selectedAvailability);
    }

    // Resource type filter
    if (selectedResourceType !== 'ALL') {
      result = result.filter((r) => r.resourceType === selectedResourceType);
    }

    return result;
  }, [allResources, searchQuery, selectedCategory, selectedAvailability, selectedResourceType]);

  // Clear all filters handler
  const handleClearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedAvailability('ALL');
    setSelectedResourceType('ALL');
  }, []);

  // Modal open/close handlers
  const handleOpenDetails = useCallback((resource: Resource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsModalOpen(false);
    setSelectedResource(null);
  }, []);

  const isFiltered =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'ALL' ||
    selectedAvailability !== 'ALL' ||
    selectedResourceType !== 'ALL';

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Campus Resource Marketplace
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live Inventory
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Browse, discover, and reserve campus laboratories, research hardware, study pods, and
            academic equipment
            {profile?.institutionId ? ` at ${profile.institutionId}` : ''}.
          </p>
        </div>

        {/* Phase 3 Advisory Badge */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-indigo-200/80 bg-indigo-50/60 px-3 py-1.5 text-xs text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
          <SparklesIcon className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>Interactive Booking & QR Passes activate in Phase 3</span>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <ResourceFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedAvailability={selectedAvailability}
        onAvailabilityChange={setSelectedAvailability}
        selectedResourceType={selectedResourceType}
        onResourceTypeChange={setSelectedResourceType}
        availableResourceTypes={distinctResourceTypes}
        onClearAll={handleClearAllFilters}
        totalCount={allResources.length}
        filteredCount={filteredResources.length}
      />

      {/* ── Resource Grid & Status Views ── */}
      <ResourceGrid
        resources={filteredResources}
        isLoading={isLoading}
        error={error}
        isFiltered={isFiltered}
        onResetFilters={handleClearAllFilters}
        onRetry={loadResources}
        onSelectResource={handleOpenDetails}
      />

      {/* ── Resource Details Modal ── */}
      <ResourceDetailsModal
        resource={selectedResource}
        isOpen={isModalOpen}
        onClose={handleCloseDetails}
      />
    </div>
  );
};

