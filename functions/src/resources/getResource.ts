import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getUserProfile } from './service';
import { docToResource } from './resource.model';
import { getResourceDoc } from './service';

/** Callable function to retrieve a single resource by ID. */
export const getResource = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  const uid = request.auth.uid;
  const { resourceId } = request.data ?? {};
  if (!resourceId || typeof resourceId !== 'string') {
    throw new HttpsError('invalid-argument', 'resourceId must be a non‑empty string.');
  }

  // Verify user profile for institutionId
  const userProfile = await getUserProfile(uid);
  const institutionId = userProfile.institutionId as string;

  const snap = await getResourceDoc(resourceId);
  const resource = docToResource(snap);

  // Institution level access check
  if (resource.institutionId !== institutionId) {
    throw new HttpsError('permission-denied', 'Access to this resource is denied.');
  }
  return resource;
});
