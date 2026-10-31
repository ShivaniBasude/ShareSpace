import React from 'react';
import {
  type ResourceAvailabilityStatus,
  ResourceCategory,
} from '../../../packages/shared/src/types';
import {
  FilterIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from '../common';

export interface ResourceFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: ResourceCategory | 'ALL';
  onCategoryChange: (category: ResourceCategory | 'ALL') => void;
  selectedAvailability: ResourceAvailabilityStatus | 'ALL';
  onAvailabilityChange: (status: ResourceAvailabilityStatus | 'ALL') => void;
  selectedResourceType: string | 'ALL';
  onResourceTypeChange: (type: string | 'ALL') => void;
  availableResourceTypes: string[];
  onClearAll: () => void;
  totalCount: number;
  filteredCount: number;
}

export const ResourceFilters: React.FC<ResourceFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedAvailability,
  onAvailabilityChange,
  selectedResourceType,
  onResourceTypeChange,
  availableResourceTypes,
  onClearAll,
  totalCount,
  filteredCount,
}) => {
  const isFiltered =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'ALL' ||
    selectedAvailability !== 'ALL' ||
    selectedResourceType !== 'ALL';

  const categoryList: ResourceCategory[] = Object.values(ResourceCategory);

  return (
    <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:p-5">
      {/* ── Top Bar: Search Input & Quick Controls ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search input with icons */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
            <SearchIcon className="h-4 w-4" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search resources by title, description, or keyword..."
            aria-label="Search campus resources"
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-10 pl-10 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search query"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Counter & Clear All Action */}
        <div className="flex items-center justify-between gap-3 text-xs md:justify-end">
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-900 dark:text-white">{filteredCount}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{totalCount}</strong> items
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 transition-colors hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
            >
              <XIcon className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Dropdown Filters Grid ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Category Filter */}
        <div className="space-y-1">
          <label
            htmlFor="marketplace-category-select"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <FilterIcon className="h-3.5 w-3.5 text-slate-400" />
            Category
          </label>
          <select
            id="marketplace-category-select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value as ResourceCategory | 'ALL')}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 transition-colors focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="ALL">All Categories</option>
            {categoryList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Status Filter */}
        <div className="space-y-1">
          <label
            htmlFor="marketplace-availability-select"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Availability
          </label>
          <select
            id="marketplace-availability-select"
            value={selectedAvailability}
            onChange={(e) =>
              onAvailabilityChange(e.target.value as ResourceAvailabilityStatus | 'ALL')
            }
            className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 transition-colors focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="ALL">All Availability</option>
            <option value="available">Available Now</option>
            <option value="reserved">Reserved</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        {/* Resource Type Filter */}
        <div className="space-y-1">
          <label
            htmlFor="marketplace-type-select"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <SlidersHorizontalIcon className="h-3.5 w-3.5 text-slate-400" />
            Resource Type
          </label>
          <select
            id="marketplace-type-select"
            value={selectedResourceType}
            onChange={(e) => onResourceTypeChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 transition-colors focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="ALL">All Resource Types</option>
            {availableResourceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Active Filter Pills Bar ── */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Active Filters:
          </span>

          {searchQuery.trim().length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Query: &ldquo;{searchQuery}&rdquo;
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Remove search query filter"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedCategory !== 'ALL' && (
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              Category: {selectedCategory}
              <button
                type="button"
                onClick={() => onCategoryChange('ALL')}
                className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 cursor-pointer"
                aria-label="Remove category filter"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedAvailability !== 'ALL' && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              Status: {selectedAvailability}
              <button
                type="button"
                onClick={() => onAvailabilityChange('ALL')}
                className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-200 cursor-pointer"
                aria-label="Remove availability status filter"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedResourceType !== 'ALL' && (
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
              Type: {selectedResourceType}
              <button
                type="button"
                onClick={() => onResourceTypeChange('ALL')}
                className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-200 cursor-pointer"
                aria-label="Remove resource type filter"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

