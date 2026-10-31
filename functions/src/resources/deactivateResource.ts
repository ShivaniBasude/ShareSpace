import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getUserProfile } from './service';
import { deactivateResourceDoc, getResourceDoc } from './service';
import { docToResource } from './resource.model';
import { Resource } from '../../../packages/shared/src/types';

/** Callable function to deactivate a resource (set availabilityStatus to 'unavailable'). */
export const deactivateResource = onCall<any, Resource>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  const uid = request.auth.uid;
  const { resourceId } = request.data ?? {};
  if (!resourceId || typeof resourceId !== 'string') {
    throw new HttpsError('invalid-argument', 'resourceId must be a non‑empty string.');
  }

  const userProfile = await getUserProfile(uid);

  const resourceSnap = await getResourceDoc(resourceId);
  const resource = docToResource(resourceSnap);

  // Only owner or manager/admin can deactivate
  const allowedRoles = ['institution_manager', 'admin'];
  const isOwner = resource.ownerId === uid;
  const hasRole = allowedRoles.includes(userProfile.role);
  if (!isOwner && !hasRole) {
    throw new HttpsError('permission-denied', 'Only the owner or an institution manager/admin can deactivate the resource.');
  }

  const deactivatedSnap = await deactivateResourceDoc(resourceId);
  return docToResource(deactivatedSnap);
});
