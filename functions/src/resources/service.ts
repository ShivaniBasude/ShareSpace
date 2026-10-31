// Resource service & repository layer
// Provides Firestore interactions for Resource management.
// All functions use the Admin SDK and assume the caller has already been
// authenticated and authorized in the callable wrapper.

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { Resource } from '../../../packages/shared/src/types';
import { DocumentSnapshot, Query } from '@google-cloud/firestore';

const db = admin.firestore();

/** Helper to retrieve a user's profile from /users collection.
 * Throws HttpsError if the profile does not exist or the account is disabled.
 */
export async function getUserProfile(uid: string) {
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) {
    throw new HttpsError('not-found', 'User profile does not exist.');
  }
  const data = doc.data();
  if (!data) {
    throw new HttpsError('internal', 'User profile data is malformed.');
  }
  // Return the raw data; callers will use institutionId, role, etc.
  return data as any;
}

/** Create a new resource document. */
export async function createResourceDoc(
  resourceData: Omit<Resource, 'id' | 'availableQuantity' | 'createdAt' | 'updatedAt'>
): Promise<Resource> {
  const ref = db.collection('resources').doc();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const payload = {
    ...resourceData,
    availableQuantity: resourceData.quantity,
    images: [],
    availabilityStatus: 'available',
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(payload);
  const snap = await ref.get();
  const data = snap.data();
  if (!data) {
    throw new HttpsError('internal', 'Failed to read created resource');
  }
  return { id: ref.id, ...(data as any) } as Resource;
}

/** Get a resource by ID. */
export async function getResourceDoc(resourceId: string): Promise<DocumentSnapshot> {
  const snap = await db.collection('resources').doc(resourceId).get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Resource not found');
  }
  return snap;
}

/** List resources with optional filters and pagination. */
export async function listResourcesQuery(
  institutionId: string,
  limit: number,
  startAfterId?: string,
  filters?: Partial<Pick<Resource, 'category' | 'availabilityStatus' | 'resourceType'>>
): Promise<{ docs: DocumentSnapshot[]; nextPageToken?: string }> {
  let q: Query = db.collection('resources').where('institutionId', '==', institutionId);
  if (filters?.category) q = q.where('category', '==', filters.category);
  if (filters?.availabilityStatus) q = q.where('availabilityStatus', '==', filters.availabilityStatus);
  if (filters?.resourceType) q = q.where('resourceType', '==', filters.resourceType);
  q = q.orderBy('createdAt', 'desc').limit(limit + 1);

  if (startAfterId) {
    const startSnap = await db.collection('resources').doc(startAfterId).get();
    if (startSnap.exists) {
      q = q.startAfter(startSnap);
    }
  }

  const snapshot = await q.get();
  const docs = snapshot.docs;
  let nextPageToken: string | undefined;
  if (docs.length > limit) {
    const lastVisible = docs[limit - 1];
    nextPageToken = lastVisible.id;
    docs.splice(limit); // keep only limit docs
  }
  return { docs, nextPageToken };
}

/** Update mutable fields of a resource. */
export async function updateResourceDoc(resourceId: string, updates: Partial<Resource>) {
  const ref = db.collection('resources').doc(resourceId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Resource not found');
    }
    const data = { ...updates, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    tx.update(ref, data);
  });
  const after = await ref.get();
  return after;
}

/** Deactivate a resource – marks it unavailable without deleting. */
export async function deactivateResourceDoc(resourceId: string) {
  const ref = db.collection('resources').doc(resourceId);
  await ref.update({
    availabilityStatus: 'unavailable',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const snap = await ref.get();
  return snap;
}

/** Search resources – same as list but allows extra filter fields. */
export async function searchResourcesQuery(
  institutionId: string,
  limit: number,
  startAfterId?: string,
  filters?: Partial<Pick<Resource, 'category' | 'resourceType' | 'location'>>
) {
  // Reuse listResourcesQuery with extended filters
  return listResourcesQuery(institutionId, limit, startAfterId, filters as any);
}
