import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getUserProfile } from './service';
import { listResourcesQuery } from './service';
import { docToResource } from './resource.model';

/** Callable function to list resources with pagination and optional filters. */
export const listResources = onCall(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const userProfile = await getUserProfile(uid);
    const institutionId = userProfile.institutionId as string;

    const {
      limit = 20,
      startAfterId,
      category,
      availabilityStatus,
      resourceType,
    } = request.data ?? {};

    const numericLimit = typeof limit === 'number' && limit > 0 && limit <= 50 ? limit : 20;

    const filters: Record<string, unknown> = {};
    if (category) filters.category = category;
    if (availabilityStatus) filters.availabilityStatus = availabilityStatus;
    if (resourceType) filters.resourceType = resourceType;

    const { docs, nextPageToken } = await listResourcesQuery(
      institutionId,
      numericLimit,
      startAfterId,
      filters
    );

    const resources = docs.map((snap) => docToResource(snap));
    return { resources, nextPageToken };
  }
);
