import {
  type Resource,
  type ResourceAvailabilityStatus,
  ResourceCategory,
} from '../../../packages/shared/src/types';
import { MOCK_RESOURCES } from './mockResources';

export interface ResourceFilterOptions {
  searchQuery?: string;
  category?: ResourceCategory | 'ALL';
  availabilityStatus?: ResourceAvailabilityStatus | 'ALL';
  resourceType?: string | 'ALL';
}

/**
 * Client data-access layer for campus resources.
 * Currently backed by canonical mock data; designed for drop-in replacement
 * with Firestore collection queries or Cloud Function calls in subsequent phases.
 */
export const resourceService = {
  /**
   * Retrieves all resources matching the given query and filter options.
   */
  async getResources(
    filters?: ResourceFilterOptions,
    simulateDelayMs = 250
  ): Promise<Resource[]> {
    if (simulateDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, simulateDelayMs));
    }

    let results = [...MOCK_RESOURCES];

    if (!filters) {
      return results;
    }

    const { searchQuery, category, availabilityStatus, resourceType } = filters;

    // Filter by text search (case-insensitive in title and description)
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.resourceType.toLowerCase().includes(q) ||
          (r.location && r.location.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (category && category !== 'ALL') {
      results = results.filter((r) => r.category === category);
    }

    // Filter by availability status
    if (availabilityStatus && availabilityStatus !== 'ALL') {
      results = results.filter((r) => r.availabilityStatus === availabilityStatus);
    }

    // Filter by custom resource type
    if (resourceType && resourceType !== 'ALL') {
      results = results.filter((r) => r.resourceType === resourceType);
    }

    return results;
  },

  /**
   * Retrieves a single resource by its unique identifier.
   */
  async getResourceById(id: string): Promise<Resource | null> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const item = MOCK_RESOURCES.find((r) => r.id === id);
    return item ?? null;
  },

  /**
   * Computes distinct resource types available in the current dataset.
   */
  getDistinctResourceTypes(resources: Resource[] = MOCK_RESOURCES): string[] {
    const types = new Set<string>();
    resources.forEach((r) => {
      if (r.resourceType) {
        types.add(r.resourceType);
      }
    });
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  },
};

