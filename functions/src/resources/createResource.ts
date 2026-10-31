import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getUserProfile, createResourceDoc } from './service';
import { createResourceSchema } from './resource.model';
import { Resource } from '../../../packages/shared/src/types';


/** Callable function to create a new resource. */
export const createResource = onCall(async (request) => {
  // Authentication check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  const uid = request.auth.uid;

  // Retrieve trusted user profile (contains institutionId, role, etc.)
  const userProfile = await getUserProfile(uid);
  const institutionId = userProfile.institutionId as string;

  // Validate payload using Zod schema (strict, protects forbidden fields)
  const parseResult = createResourceSchema.safeParse(request.data);
  if (!parseResult.success) {
    throw new HttpsError('invalid-argument', parseResult.error.message);
  }
  const validated = parseResult.data;

  // Build resource object without client‑provided protected fields
  const resourceData = {
    ...validated,
    institutionId,
    ownerId: uid,
    // remaining fields will be set by the service layer (availableQuantity, timestamps, etc.)
  } as Omit<Resource, 'id' | 'availableQuantity' | 'createdAt' | 'updatedAt'>;

  const created = await createResourceDoc(resourceData);
  return created;
});
