import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  type Resource,
  type ResourceAvailabilityStatus,
  ResourceCategory,
} from '../../../packages/shared/src/types';
import {
  Button,
  CheckCircle2Icon,
  FilterIcon,
  PackageIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from '../../components/common';
import {
  OwnerResourceCard,
  ResourceDeactivateDialog,
  ResourceDetailsModal,
  ResourceFormModal,
} from '../../components/resources';
import {
  resourceService,
  DEMO_OWNER_ID,
  type CreateResourceInput,
  type UpdateResourceInput,
} from '../../features/resources';
import { useAuth } from '../../hooks';

export const OwnerResourcesPage: React.FC = () => {
  const { profile } = useAuth();
  const effectiveOwnerId = profile?.uid || DEMO_OWNER_ID;

  // Resources state
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'ALL'>('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState<
    ResourceAvailabilityStatus | 'ALL'
  >('ALL');

  // Modal controls
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [inspectingResource, setInspectingResource] = useState<Resource | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deactivatingResource, setDeactivatingResource] = useState<Resource | null>(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success / Status feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Refresh resources explicitly (for event handlers)
  const refreshResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await resourceService.getOwnerResources(effectiveOwnerId, undefined, 200);
      setResources(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Unable to load owner resource inventory.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [effectiveOwnerId]);

  // Initial load without synchronous setState in effect
  useEffect(() => {
    let isMounted = true;

    const fetchInitial = async () => {
      try {
        const data = await resourceService.getOwnerResources(effectiveOwnerId, undefined, 200);
        if (isMounted) {
          setResources(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Unable to load owner resource inventory.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchInitial();

    return () => {
      isMounted = false;
    };
  }, [effectiveOwnerId]);

  // Combined client-side filtering
  const filteredResources = useMemo(() => {
    let result = resources;

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

    if (selectedCategory !== 'ALL') {
      result = result.filter((r) => r.category === selectedCategory);
    }

    if (selectedAvailability !== 'ALL') {
      result = result.filter((r) => r.availabilityStatus === selectedAvailability);
    }

    return result;
  }, [resources, searchQuery, selectedCategory, selectedAvailability]);

  // Handle Create or Update Resource
  const handleFormSubmit = async (data: CreateResourceInput | UpdateResourceInput) => {
    setIsSubmitting(true);
    try {
      if (editingResource) {
        const updated = await resourceService.updateResource(
          editingResource.id,
          data as UpdateResourceInput
        );
        setFeedback({
          type: 'success',
          message: `Resource "${updated.title}" was updated successfully.`,
        });
      } else {
        const created = await resourceService.createResource(data as CreateResourceInput, {
          ownerId: profile?.uid,
          institutionId: profile?.institutionId,
        });
        setFeedback({
          type: 'success',
          message: `New resource "${created.title}" was created and added to inventory.`,
        });
      }
      setIsFormOpen(false);
      setEditingResource(null);
      await refreshResources();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save resource changes.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Deactivate or Reactivate Confirmation
  const handleDeactivateConfirm = async (res: Resource) => {
    setIsSubmitting(true);
    try {
      if (res.availabilityStatus === 'unavailable') {
        const reactivated = await resourceService.reactivateResource(res.id);
        setFeedback({
          type: 'success',
          message: `Resource "${reactivated.title}" has been reactivated and is now available.`,
        });
      } else {
        const deactivated = await resourceService.deactivateResource(res.id);
        setFeedback({
          type: 'success',
          message: `Resource "${deactivated.title}" has been deactivated and marked unavailable.`,
        });
      }
      setIsDeactivateOpen(false);
      setDeactivatingResource(null);
      await refreshResources();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to modify resource status.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open modal helpers
  const handleOpenCreate = () => {
    setEditingResource(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (res: Resource) => {
    setEditingResource(res);
    setIsFormOpen(true);
  };

  const handleOpenInspect = (res: Resource) => {
    setInspectingResource(res);
    setIsDetailsOpen(true);
  };

  const handleOpenDeactivate = (res: Resource) => {
    setDeactivatingResource(res);
    setIsDeactivateOpen(true);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedAvailability('ALL');
  };

  const isFiltered =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'ALL' ||
    selectedAvailability !== 'ALL';

  const categories = Object.values(ResourceCategory);

  return (
    <div className="space-y-6">
      {/* ── Status Feedback Banner ── */}
      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="h-4 w-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="cursor-pointer text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Resource Management & Inventory
            </h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {resources.length} items cataloged
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Publish new hardware, update physical locations and quantities, and toggle availability
            states across campus facilities.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          icon={<PlusIcon className="h-4 w-4" />}
        >
          Add Resource
        </Button>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search input */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <SearchIcon className="h-4 w-4" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources by title, description, or keyword..."
              aria-label="Search managed resources"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-10 pl-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick counts */}
          <div className="flex items-center justify-between gap-3 text-xs md:justify-end">
            <span className="text-slate-500">
              Showing <strong className="text-slate-900 dark:text-white">{filteredResources.length}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{resources.length}</strong>
            </span>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
              >
                <XIcon className="h-3.5 w-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Category */}
          <div className="space-y-1">
            <label
              htmlFor="owner-category-filter"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <FilterIcon className="h-3.5 w-3.5 text-slate-400" />
              Filter by Category
            </label>
            <select
              id="owner-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ResourceCategory | 'ALL')}
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Status */}
          <div className="space-y-1">
            <label
              htmlFor="owner-status-filter"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Filter by Status
            </label>
            <select
              id="owner-status-filter"
              value={selectedAvailability}
              onChange={(e) =>
                setSelectedAvailability(e.target.value as ResourceAvailabilityStatus | 'ALL')
              }
              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved / On Loan</option>
              <option value="unavailable">Unavailable / Deactivated</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Resources List / Grid ── */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center dark:border-rose-900/60 dark:bg-rose-950/30"
        >
          <p className="text-sm font-bold text-rose-800 dark:text-rose-200 mb-2">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshResources}
            icon={<RefreshCwIcon className="h-4 w-4" />}
          >
            Retry Loading
          </Button>
        </div>
      ) : filteredResources.length === 0 && isFiltered ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <PackageIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No matching resources found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            No items matched your current search query or filter selection.
          </p>
          <Button variant="primary" size="sm" onClick={handleResetFilters}>
            Clear Active Filters
          </Button>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <PackageIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No resources cataloged yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Begin managing your department equipment by listing your first resource.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Add Your First Resource
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResources.map((res) => (
            <OwnerResourceCard
              key={res.id}
              resource={res}
              onView={handleOpenInspect}
              onEdit={handleOpenEdit}
              onDeactivate={handleOpenDeactivate}
            />
          ))}
        </div>
      )}

      {/* ── Create / Edit Resource Modal ── */}
      <ResourceFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingResource(null);
        }}
        onSubmit={handleFormSubmit}
        initialResource={editingResource}
        isSubmitting={isSubmitting}
      />

      {/* ── Deactivate / Reactivate Confirmation Dialog ── */}
      <ResourceDeactivateDialog
        isOpen={isDeactivateOpen}
        resource={deactivatingResource}
        onClose={() => {
          setIsDeactivateOpen(false);
          setDeactivatingResource(null);
        }}
        onConfirm={handleDeactivateConfirm}
        isProcessing={isSubmitting}
      />

      {/* ── Inspect Details Modal ── */}
      <ResourceDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setInspectingResource(null);
        }}
        resource={inspectingResource}
      />
    </div>
  );
};
