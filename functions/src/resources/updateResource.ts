import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getUserProfile } from './service';
import { getResourceDoc, updateResourceDoc } from './service';
import { updateResourceSchema } from './resource.model';
import { docToResource } from './resource.model';

/** Callable function to update mutable fields of a resource. */
export const updateResource = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  const uid = request.auth.uid;
  const { resourceId, ...payload } = request.data ?? {};
  if (!resourceId || typeof resourceId !== 'string') {
    throw new HttpsError('invalid-argument', 'resourceId must be a non‑empty string.');
  }

  // Validate payload
  const parseResult = updateResourceSchema.safeParse(payload);
  if (!parseResult.success) {
    throw new HttpsError('invalid-argument', parseResult.error.message);
  }
  const updates = parseResult.data;

  // Fetch user profile and resource
  const userProfile = await getUserProfile(uid);
  const resourceSnap = await getResourceDoc(resourceId);
  const resource = docToResource(resourceSnap);

  // Authorization: owner or manager/admin can update
  const allowedRoles = ['institution_manager', 'admin'];
  const isOwner = resource.ownerId === uid;
  const hasRole = allowedRoles.includes(userProfile.role);
  if (!isOwner && !hasRole) {
    throw new HttpsError('permission-denied', 'Only the owner or an institution manager/admin can update the resource.');
  }

  // Proceed with update
  const updatedSnap = await updateResourceDoc(resourceId, updates);
  return docToResource(updatedSnap);
});
