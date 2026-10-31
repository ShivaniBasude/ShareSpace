import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getUserProfile, searchResourcesQuery } from './service';
import { docToResource } from './resource.model';

/** Callable function to search resources with optional filters. */
export const searchResources = onCall(
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
      resourceType,
      location,
    } = request.data ?? {};

    const numericLimit = typeof limit === 'number' && limit > 0 && limit <= 50 ? limit : 20;

    const filters: Record<string, unknown> = {};
    if (category) filters.category = category;
    if (resourceType) filters.resourceType = resourceType;
    if (location) filters.location = location;

    const { docs, nextPageToken } = await searchResourcesQuery(
      institutionId,
      numericLimit,
      startAfterId,
      filters
    );
    const resources = docs.map((snap) => docToResource(snap));
    return { resources, nextPageToken };
  }
);
