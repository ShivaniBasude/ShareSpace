import {
  type Resource,
  type ResourceAvailabilityStatus,
  ResourceCategory,
} from '../../../packages/shared/src/types';
import { MOCK_RESOURCES } from './mockResources';

/**
 * Demo owner ID used as a fallback when no authenticated user UID is available.
 * Several mock resources are assigned this ownerId so the owner dashboard shows
 * meaningful data in demo / unauthenticated mode.
 */
export const DEMO_OWNER_ID = 'demo-owner-uid';

export interface ResourceFilterOptions {
  searchQuery?: string;
  category?: ResourceCategory | 'ALL';
  availabilityStatus?: ResourceAvailabilityStatus | 'ALL';
  resourceType?: string | 'ALL';
}

export interface CreateResourceInput {
  title: string;
  description: string;
  category: ResourceCategory;
  resourceType: string;
  quantity: number;
  location?: string;
  condition?: string;
  approvalRequired: boolean;
  eligibilityRequirements?: string[];
  specifications?: Record<string, unknown>;
  images?: string[];
}

export interface UpdateResourceInput {
  title?: string;
  description?: string;
  category?: ResourceCategory;
  resourceType?: string;
  quantity?: number;
  location?: string;
  condition?: string;
  approvalRequired?: boolean;
  eligibilityRequirements?: string[];
  specifications?: Record<string, unknown>;
  images?: string[];
}

export interface OwnerResourceStats {
  totalCount: number;
  availableCount: number;
  unavailableCount: number;
  reservedCount: number;
  totalInventoryUnits: number;
  availableUnits: number;
}

export interface OwnerActivityLog {
  id: string;
  /** ownerId of the resource owner this activity entry belongs to */
  ownerId: string;
  action: string;
  resourceTitle: string;
  timestamp: string;
  type: 'status_change' | 'inventory_update' | 'creation' | 'notice';
}

// In-memory mutable store seeded from canonical mock dataset
// Supports session-level additions, edits, and deactivations without writing to Firestore
let resourcesStore: Resource[] = [...MOCK_RESOURCES];

/**
 * Tracks the availableQuantity of a resource before deactivation so it can be
 * restored precisely on reactivation instead of resetting to the full quantity.
 * Key: resource ID → preserved availableQuantity value.
 */
const preservedAvailableQty = new Map<string, number>();

// Mock recent activity log items for Owner Dashboard (clearly labeled demonstration data)
const INITIAL_OWNER_ACTIVITY: OwnerActivityLog[] = [
  {
    id: 'act-001',
    ownerId: DEMO_OWNER_ID,
    action: 'Inventory Audit Completed',
    resourceTitle: 'Precision GPU Workstation — Dell Precision 7920',
    timestamp: '2 hours ago',
    type: 'inventory_update',
  },
  {
    id: 'act-002',
    ownerId: DEMO_OWNER_ID,
    action: 'Equipment Maintenance Checked',
    resourceTitle: 'Digital Storage Oscilloscope — Keysight InfiniiVision 3000G',
    timestamp: 'Yesterday at 4:15 PM',
    type: 'status_change',
  },
  {
    id: 'act-003',
    ownerId: DEMO_OWNER_ID,
    action: 'Resource Created & Listed',
    resourceTitle: 'Bambu Lab X1-Carbon 3D Precision Printer',
    timestamp: '3 days ago',
    type: 'creation',
  },
  {
    id: 'act-004',
    ownerId: DEMO_OWNER_ID,
    action: 'Reservation Cycle Completed',
    resourceTitle: '4K Cinema Production Kit — Sony FX6 Full-Frame',
    timestamp: '5 days ago',
    type: 'notice',
  },
];

let activityStore: OwnerActivityLog[] = [...INITIAL_OWNER_ACTIVITY];

/**
 * Client data-access layer for campus resources.
 * Currently backed by mock data; designed for clean drop-in replacement
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

    let results = [...resourcesStore];

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
   * Retrieves resources managed by a specific owner (with optional search & filters).
   * Only returns resources whose ownerId matches the supplied ownerId.
   */
  async getOwnerResources(
    ownerId: string,
    filters?: ResourceFilterOptions,
    simulateDelayMs = 200
  ): Promise<Resource[]> {
    if (simulateDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, simulateDelayMs));
    }

    // Scope to the owner's resources first
    let results = resourcesStore.filter((r) => r.ownerId === ownerId);

    if (!filters) {
      return results;
    }

    const { searchQuery, category, availabilityStatus, resourceType } = filters;

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

    if (category && category !== 'ALL') {
      results = results.filter((r) => r.category === category);
    }

    if (availabilityStatus && availabilityStatus !== 'ALL') {
      results = results.filter((r) => r.availabilityStatus === availabilityStatus);
    }

    if (resourceType && resourceType !== 'ALL') {
      results = results.filter((r) => r.resourceType === resourceType);
    }

    return results;
  },

  /**
   * Computes summary metrics for a specific owner's resources.
   */
  async getOwnerResourceStats(ownerId: string, simulateDelayMs = 150): Promise<OwnerResourceStats> {
    if (simulateDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, simulateDelayMs));
    }

    // Scope to the owner's resources only
    const all = resourcesStore.filter((r) => r.ownerId === ownerId);
    const availableCount = all.filter((r) => r.availabilityStatus === 'available').length;
    const unavailableCount = all.filter((r) => r.availabilityStatus === 'unavailable').length;
    const reservedCount = all.filter((r) => r.availabilityStatus === 'reserved').length;

    const totalInventoryUnits = all.reduce((sum, r) => sum + r.quantity, 0);
    const availableUnits = all.reduce((sum, r) => sum + r.availableQuantity, 0);

    return {
      totalCount: all.length,
      availableCount,
      unavailableCount,
      reservedCount,
      totalInventoryUnits,
      availableUnits,
    };
  },

  /**
   * Retrieves recent activity logs scoped to a specific owner.
   */
  async getOwnerRecentActivity(ownerId: string, simulateDelayMs = 100): Promise<OwnerActivityLog[]> {
    if (simulateDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, simulateDelayMs));
    }
    return activityStore.filter((a) => a.ownerId === ownerId);
  },

  /**
   * Retrieves a single resource by its unique identifier.
   */
  async getResourceById(id: string): Promise<Resource | null> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const item = resourcesStore.find((r) => r.id === id);
    return item ? { ...item } : null;
  },

  /**
   * Creates a new resource in the mock store.
   * Auto-assigns server-managed fields per schema rules:
   * - id, ownerId, institutionId, availableQuantity, availabilityStatus, createdAt, updatedAt
   */
  async createResource(
    input: CreateResourceInput,
    ownerMeta?: { ownerId?: string; institutionId?: string },
    simulateDelayMs = 250
  ): Promise<Resource> {
    if (simulateDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, simulateDelayMs));
    }

    const now = new Date().toISOString();
    const newId = `res-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const effectiveOwnerId = ownerMeta?.ownerId || DEMO_OWNER_ID;

    const newResource: Resource = {
      id: newId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      resourceType: input.resourceType.trim(),
      quantity: Math.max(1, Math.floor(input.quantity)),
      availableQuantity: Math.max(1, Math.floor(input.quantity)), // Initialized to total quantity
      availabilityStatus: 'available', // Server-initialized to available
      location: input.location?.trim() || undefined,
      condition: input.condition?.trim() || undefined,
      approvalRequired: Boolean(input.approvalRequired),
      eligibilityRequirements: input.eligibilityRequirements?.filter(Boolean) || [],
      specifications: input.specifications || {},
      images: input.images && input.images.length > 0 ? input.images : undefined,
      institutionId: ownerMeta?.institutionId || 'univ-main',
      ownerId: effectiveOwnerId,
      createdAt: now,
      updatedAt: now,
    };

    resourcesStore = [newResource, ...resourcesStore];

    // Prepend activity log scoped to the creating owner
    activityStore = [
      {
        id: `act-${Date.now()}`,
        ownerId: effectiveOwnerId,
        action: 'New Resource Listed',
        resourceTitle: newResource.title,
        timestamp: 'Just now',
        type: 'creation',
      },
      ...activityStore,
    ];

    return { ...newResource };
  },

  /**
   * Updates permitted fields of an existing resource.
   * Rejects modification of server-managed fields: id, ownerId, institutionId, createdAt, availabilityStatus
   */
  async updateResource(
    id: string,
    input: UpdateResourceInput,
    simulateDelayMs = 250
  ): Promise<Resource> {
    if (simulateDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, simulateDelayMs));
    }

    const index = resourcesStore.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Resource with ID "${id}" was not found.`);
    }

    const existing = resourcesStore[index];
    const now = new Date().toISOString();

    const newQuantity =
      input.quantity !== undefined
        ? Math.max(1, Math.floor(input.quantity))
        : existing.quantity;

    // Available quantity cannot exceed total quantity
    const updatedAvailableQty = Math.min(existing.availableQuantity, newQuantity);

    const updatedResource: Resource = {
      ...existing,
      title: input.title !== undefined ? input.title.trim() : existing.title,
      description:
        input.description !== undefined ? input.description.trim() : existing.description,
      category: input.category !== undefined ? input.category : existing.category,
      resourceType:
        input.resourceType !== undefined ? input.resourceType.trim() : existing.resourceType,
      quantity: newQuantity,
      availableQuantity: updatedAvailableQty,
      location:
        input.location !== undefined ? input.location.trim() || undefined : existing.location,
      condition:
        input.condition !== undefined ? input.condition.trim() || undefined : existing.condition,
      approvalRequired:
        input.approvalRequired !== undefined
          ? Boolean(input.approvalRequired)
          : existing.approvalRequired,
      eligibilityRequirements:
        input.eligibilityRequirements !== undefined
          ? input.eligibilityRequirements.filter(Boolean)
          : existing.eligibilityRequirements,
      specifications:
        input.specifications !== undefined ? input.specifications : existing.specifications,
      images: input.images !== undefined ? input.images : existing.images,
      updatedAt: now,
    };

    resourcesStore[index] = updatedResource;

    activityStore = [
      {
        id: `act-${Date.now()}`,
        ownerId: existing.ownerId,
        action: 'Resource Details Updated',
        resourceTitle: updatedResource.title,
        timestamp: 'Just now',
        type: 'status_change',
      },
      ...activityStore,
    ];

    return { ...updatedResource };
  },

  /**
   * Deactivates a resource (sets status to 'unavailable' and availableQuantity to 0).
   * Preserves the current availableQuantity in memory so reactivation can restore it
   * precisely instead of resetting to the full total quantity.
   * Aligned with backend schema: "'unavailable' via deactivateResource".
   */
  async deactivateResource(id: string, simulateDelayMs = 200): Promise<Resource> {
    if (simulateDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, simulateDelayMs));
    }

    const index = resourcesStore.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Resource with ID "${id}" was not found.`);
    }

    const existing = resourcesStore[index];
    const now = new Date().toISOString();

    // Preserve previous availableQuantity only if the resource is not already unavailable
    // (prevents overwriting a valid preserved value with 0 on a double-deactivation)
    if (existing.availabilityStatus !== 'unavailable') {
      preservedAvailableQty.set(id, existing.availableQuantity);
    }

    const deactivated: Resource = {
      ...existing,
      availabilityStatus: 'unavailable',
      availableQuantity: 0,
      updatedAt: now,
    };

    resourcesStore[index] = deactivated;

    activityStore = [
      {
        id: `act-${Date.now()}`,
        ownerId: existing.ownerId,
        action: 'Resource Deactivated',
        resourceTitle: deactivated.title,
        timestamp: 'Just now',
        type: 'status_change',
      },
      ...activityStore,
    ];

    return { ...deactivated };
  },

  /**
   * Reactivates an unavailable resource back to 'available'.
   * Restores the previously preserved availableQuantity (from before deactivation)
   * instead of blindly resetting to the full total quantity.
   */
  async reactivateResource(id: string, simulateDelayMs = 200): Promise<Resource> {
    if (simulateDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, simulateDelayMs));
    }

    const index = resourcesStore.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Resource with ID "${id}" was not found.`);
    }

    const existing = resourcesStore[index];
    const now = new Date().toISOString();

    // Restore the preserved quantity; clamp to total quantity to guard against
    // quantity reductions that occurred while the resource was deactivated.
    const preserved = preservedAvailableQty.get(id);
    const restoredQty =
      preserved !== undefined && preserved > 0
        ? Math.min(preserved, existing.quantity)
        : Math.min(1, existing.quantity); // Fallback: restore at least 1 unit

    preservedAvailableQty.delete(id);

    const reactivated: Resource = {
      ...existing,
      availabilityStatus: 'available',
      availableQuantity: restoredQty,
      updatedAt: now,
    };

    resourcesStore[index] = reactivated;

    activityStore = [
      {
        id: `act-${Date.now()}`,
        ownerId: existing.ownerId,
        action: 'Resource Reactivated',
        resourceTitle: reactivated.title,
        timestamp: 'Just now',
        type: 'status_change',
      },
      ...activityStore,
    ];

    return { ...reactivated };
  },

  /**
   * Computes distinct resource types available in the current dataset.
   */
  getDistinctResourceTypes(resources: Resource[] = resourcesStore): string[] {
    const types = new Set<string>();
    resources.forEach((r) => {
      if (r.resourceType) {
        types.add(r.resourceType);
      }
    });
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  },
};
