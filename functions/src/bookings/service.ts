// Booking Service Layer
// Handles business logic, Firestore transactions, authorization checks,
// and inventory reservation/restoration.

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { Booking, BookingStatus, UserRole } from '../../../packages/shared/src/types';
import { getDb } from '../shared/firebase';
import { docToBooking } from './booking.model';

export interface CallerContext {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  institutionId: string;
  accountStatus: string;
}

/**
 * Validates caller auth context and retrieves their canonical user profile from Firestore.
 */
export async function getCallerContext(auth?: { uid: string; token: Record<string, unknown> }): Promise<CallerContext> {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  const db = getDb();
  const userDoc = await db.collection('users').doc(auth.uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User profile not found.');
  }
  const userData = userDoc.data();
  if (!userData || userData.accountStatus === 'disabled') {
    throw new HttpsError('permission-denied', 'Account is disabled or profile is malformed.');
  }

  return {
    uid: auth.uid,
    email: auth.token.email || userData.email || '',
    displayName: userData.fullName || auth.token.name || 'User',
    role: (userData.role || auth.token.role || 'student') as UserRole,
    institutionId: userData.institutionId || auth.token.institutionId || '',
    accountStatus: userData.accountStatus,
  };
}

/**
 * 1. createBooking
 * - Reserve inventory at creation inside a Firestore transaction.
 * - Both pending and auto-approved bookings decrement availableQuantity.
 */
export async function createBookingService(
  caller: CallerContext,
  input: {
    resourceId: string;
    quantity: number;
    startTime: Date;
    endTime: Date;
    purpose: string;
  }
): Promise<Booking> {
  const db = getDb();
  const resourceRef = db.collection('resources').doc(input.resourceId);
  const bookingRef = db.collection('bookings').doc();

  return await db.runTransaction(async (tx) => {
    const resourceDoc = await tx.get(resourceRef);
    if (!resourceDoc.exists) {
      throw new HttpsError('not-found', 'Resource not found.');
    }
    const resource = resourceDoc.data();
    if (!resource) {
      throw new HttpsError('internal', 'Resource data is corrupted.');
    }

    // Institution check
    if (resource.institutionId !== caller.institutionId) {
      throw new HttpsError('permission-denied', 'Cannot book resources outside your institution.');
    }

    // Availability status check
    if (resource.availabilityStatus === 'unavailable') {
      throw new HttpsError('failed-precondition', 'Resource is currently unavailable.');
    }

    // Inventory check
    const currentAvailable = typeof resource.availableQuantity === 'number' ? resource.availableQuantity : 0;
    if (currentAvailable < input.quantity) {
      throw new HttpsError('failed-precondition', `Insufficient inventory. Available: ${currentAvailable}, requested: ${input.quantity}`);
    }

    // Determine initial status based on approvalRequired
    const approvalRequired = Boolean(resource.approvalRequired);
    const initialStatus: BookingStatus = approvalRequired ? 'pending' : 'approved';

    // Decrement availableQuantity
    const newAvailable = currentAvailable - input.quantity;
    const now = admin.firestore.FieldValue.serverTimestamp();

    tx.update(resourceRef, {
      availableQuantity: newAvailable,
      updatedAt: now,
    });

    const bookingPayload = {
      resourceId: input.resourceId,
      userId: caller.uid,
      userDisplayName: caller.displayName,
      userEmail: caller.email,
      ownerId: resource.ownerId || '',
      quantity: input.quantity,
      startTime: admin.firestore.Timestamp.fromDate(input.startTime),
      endTime: admin.firestore.Timestamp.fromDate(input.endTime),
      purpose: input.purpose,
      status: initialStatus,
      inventoryReserved: true,
      institutionId: caller.institutionId,
      createdAt: now,
      updatedAt: now,
    };

    tx.set(bookingRef, bookingPayload);

    return {
      id: bookingRef.id,
      ...bookingPayload,
    } as unknown as Booking;
  });
}

/**
 * 2. getBooking
 */
export async function getBookingService(caller: CallerContext, bookingId: string): Promise<Booking> {
  const db = getDb();
  const doc = await db.collection('bookings').doc(bookingId).get();
  if (!doc.exists) {
    throw new HttpsError('not-found', 'Booking not found.');
  }

  const booking = docToBooking(doc);

  // Institution check
  if (booking.institutionId !== caller.institutionId && caller.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Access denied.');
  }

  // Authorization check: requester, owner, manager, or admin
  const isRequester = booking.userId === caller.uid;
  const isOwner = booking.ownerId === caller.uid;
  const isManager = caller.role === 'institution_manager';
  const isAdmin = caller.role === 'admin';

  if (!isRequester && !isOwner && !isManager && !isAdmin) {
    throw new HttpsError('permission-denied', 'You do not have permission to view this booking.');
  }

  return booking;
}

/**
 * 3. listMyBookings
 */
export async function listMyBookingsService(
  caller: CallerContext,
  params: { limit: number; startAfterId?: string; status?: BookingStatus }
): Promise<{ bookings: Booking[]; nextPageToken?: string }> {
  const db = getDb();
  let q = db
    .collection('bookings')
    .where('userId', '==', caller.uid)
    .where('institutionId', '==', caller.institutionId);

  if (params.status) {
    q = q.where('status', '==', params.status);
  }

  q = q.orderBy('createdAt', 'desc').limit(params.limit + 1);

  if (params.startAfterId) {
    const startSnap = await db.collection('bookings').doc(params.startAfterId).get();
    if (startSnap.exists) {
      q = q.startAfter(startSnap);
    }
  }

  const snapshot = await q.get();
  const docs = snapshot.docs;
  let nextPageToken: string | undefined;

  if (docs.length > params.limit) {
    const lastVisible = docs[params.limit - 1];
    nextPageToken = lastVisible.id;
    docs.splice(params.limit);
  }

  const bookings = docs.map((d) => docToBooking(d));
  return { bookings, nextPageToken };
}

/**
 * 4. listOwnerBookingRequests
 */
export async function listOwnerBookingRequestsService(
  caller: CallerContext,
  params: { limit: number; startAfterId?: string; status?: BookingStatus }
): Promise<{ bookings: Booking[]; nextPageToken?: string }> {
  const db = getDb();

  let q: admin.firestore.Query;
  if (caller.role === 'institution_manager' || caller.role === 'admin') {
    q = db.collection('bookings').where('institutionId', '==', caller.institutionId);
  } else if (caller.role === 'owner') {
    q = db.collection('bookings')
      .where('ownerId', '==', caller.uid)
      .where('institutionId', '==', caller.institutionId);
  } else {
    throw new HttpsError('permission-denied', 'Only resource owners, managers, and admins can view incoming booking requests.');
  }

  if (params.status) {
    q = q.where('status', '==', params.status);
  }

  q = q.orderBy('createdAt', 'desc').limit(params.limit + 1);

  if (params.startAfterId) {
    const startSnap = await db.collection('bookings').doc(params.startAfterId).get();
    if (startSnap.exists) {
      q = q.startAfter(startSnap);
    }
  }

  const snapshot = await q.get();
  const docs = snapshot.docs;
  let nextPageToken: string | undefined;

  if (docs.length > params.limit) {
    const lastVisible = docs[params.limit - 1];
    nextPageToken = lastVisible.id;
    docs.splice(params.limit);
  }

  const bookings = docs.map((d) => docToBooking(d));
  return { bookings, nextPageToken };
}

/**
 * 5. approveBooking
 * - Allowed callers: owner, institution_manager, admin.
 * - Current status must be 'pending'.
 * - Inventory is ALREADY reserved; do NOT decrement again.
 */
export async function approveBookingService(
  caller: CallerContext,
  bookingId: string,
  remarks?: string
): Promise<Booking> {
  const db = getDb();
  const bookingRef = db.collection('bookings').doc(bookingId);

  return await db.runTransaction(async (tx) => {
    const bookingDoc = await tx.get(bookingRef);
    if (!bookingDoc.exists) {
      throw new HttpsError('not-found', 'Booking not found.');
    }
    const booking = bookingDoc.data();
    if (!booking) {
      throw new HttpsError('internal', 'Booking data is malformed.');
    }

    if (booking.institutionId !== caller.institutionId && caller.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Access denied.');
    }

    const isOwner = booking.ownerId === caller.uid;
    const isManager = caller.role === 'institution_manager';
    const isAdmin = caller.role === 'admin';
    if (!isOwner && !isManager && !isAdmin) {
      throw new HttpsError('permission-denied', 'Only the resource owner, manager, or admin can approve this booking.');
    }

    if (booking.status !== 'pending') {
      throw new HttpsError('failed-precondition', `Cannot approve booking in '${booking.status}' status. Only pending bookings can be approved.`);
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const updates: Record<string, unknown> = {
      status: 'approved',
      updatedAt: now,
    };
    if (remarks) {
      updates.remarks = remarks;
    }

    tx.update(bookingRef, updates);

    return {
      ...booking,
      id: bookingDoc.id,
      status: 'approved',
      ...(remarks ? { remarks } : {}),
      updatedAt: now,
    } as unknown as Booking;
  });
}

/**
 * 6. rejectBooking
 * - Allowed callers: owner, institution_manager, admin.
 * - Allowed status: 'pending'.
 * - Restores inventory exactly once if inventoryReserved is true.
 */
export async function rejectBookingService(
  caller: CallerContext,
  bookingId: string,
  reason: string
): Promise<Booking> {
  const db = getDb();
  const bookingRef = db.collection('bookings').doc(bookingId);

  return await db.runTransaction(async (tx) => {
    const bookingDoc = await tx.get(bookingRef);
    if (!bookingDoc.exists) {
      throw new HttpsError('not-found', 'Booking not found.');
    }
    const booking = bookingDoc.data();
    if (!booking) {
      throw new HttpsError('internal', 'Booking data is malformed.');
    }

    if (booking.institutionId !== caller.institutionId && caller.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Access denied.');
    }

    const isOwner = booking.ownerId === caller.uid;
    const isManager = caller.role === 'institution_manager';
    const isAdmin = caller.role === 'admin';
    if (!isOwner && !isManager && !isAdmin) {
      throw new HttpsError('permission-denied', 'Only the resource owner, manager, or admin can reject this booking.');
    }

    if (booking.status !== 'pending') {
      throw new HttpsError('failed-precondition', `Cannot reject booking in '${booking.status}' status. Only pending bookings can be rejected.`);
    }

    const resourceRef = db.collection('resources').doc(booking.resourceId);
    const resourceDoc = await tx.get(resourceRef);
    const now = admin.firestore.FieldValue.serverTimestamp();

    if (booking.inventoryReserved && resourceDoc.exists) {
      const resourceData = resourceDoc.data();
      const currentAvailable = typeof resourceData?.availableQuantity === 'number' ? resourceData.availableQuantity : 0;
      const quantityToRestore = typeof booking.quantity === 'number' ? booking.quantity : 1;
      tx.update(resourceRef, {
        availableQuantity: currentAvailable + quantityToRestore,
        updatedAt: now,
      });
    }

    tx.update(bookingRef, {
      status: 'rejected',
      rejectionReason: reason,
      inventoryReserved: false,
      updatedAt: now,
    });

    return {
      ...booking,
      id: bookingDoc.id,
      status: 'rejected',
      rejectionReason: reason,
      inventoryReserved: false,
      updatedAt: now,
    } as unknown as Booking;
  });
}

/**
 * 7. cancelBooking
 * - Allowed callers: requester (student/user), owner, institution_manager, admin.
 * - Allowed statuses: 'pending', 'approved'.
 * - Restores inventory exactly once if inventoryReserved is true.
 * - Invalidates any active QR code for this booking.
 */
export async function cancelBookingService(
  caller: CallerContext,
  bookingId: string,
  reason?: string
): Promise<Booking> {
  const db = getDb();
  const bookingRef = db.collection('bookings').doc(bookingId);

  return await db.runTransaction(async (tx) => {
    const bookingDoc = await tx.get(bookingRef);
    if (!bookingDoc.exists) {
      throw new HttpsError('not-found', 'Booking not found.');
    }
    const booking = bookingDoc.data();
    if (!booking) {
      throw new HttpsError('internal', 'Booking data is malformed.');
    }

    if (booking.institutionId !== caller.institutionId && caller.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Access denied.');
    }

    const isRequester = booking.userId === caller.uid;
    const isOwner = booking.ownerId === caller.uid;
    const isManager = caller.role === 'institution_manager';
    const isAdmin = caller.role === 'admin';
    if (!isRequester && !isOwner && !isManager && !isAdmin) {
      throw new HttpsError('permission-denied', 'You do not have permission to cancel this booking.');
    }

    if (booking.status !== 'pending' && booking.status !== 'approved') {
      throw new HttpsError('failed-precondition', `Cannot cancel booking with status '${booking.status}'. Only pending or approved bookings can be cancelled.`);
    }

    const resourceRef = db.collection('resources').doc(booking.resourceId);
    const resourceDoc = await tx.get(resourceRef);
    const now = admin.firestore.FieldValue.serverTimestamp();

    if (booking.inventoryReserved && resourceDoc.exists) {
      const resourceData = resourceDoc.data();
      const currentAvailable = typeof resourceData?.availableQuantity === 'number' ? resourceData.availableQuantity : 0;
      const quantityToRestore = typeof booking.quantity === 'number' ? booking.quantity : 1;
      tx.update(resourceRef, {
        availableQuantity: currentAvailable + quantityToRestore,
        updatedAt: now,
      });
    }

    // Invalidate active QR code if exists
    const qrSnap = await tx.get(db.collection('qr_codes').where('bookingId', '==', bookingId).limit(1));
    if (!qrSnap.empty) {
      const qrDoc = qrSnap.docs[0];
      tx.update(qrDoc.ref, {
        status: 'revoked',
        updatedAt: now,
      });
    }

    const updates: Record<string, unknown> = {
      status: 'cancelled',
      inventoryReserved: false,
      updatedAt: now,
    };
    if (reason) {
      updates.cancellationReason = reason;
    }

    tx.update(bookingRef, updates);

    return {
      ...booking,
      id: bookingDoc.id,
      status: 'cancelled',
      ...(reason ? { cancellationReason: reason } : {}),
      inventoryReserved: false,
      updatedAt: now,
    } as unknown as Booking;
  });
}

/**
 * 8. completeBooking
 * - Allowed callers: owner, institution_manager, admin.
 * - Allowed statuses: 'checked_in', or 'approved' (if direct completion without QR).
 * - Restores inventory exactly once if inventoryReserved is true.
 */
export async function completeBookingService(
  caller: CallerContext,
  bookingId: string
): Promise<Booking> {
  const db = getDb();
  const bookingRef = db.collection('bookings').doc(bookingId);

  return await db.runTransaction(async (tx) => {
    const bookingDoc = await tx.get(bookingRef);
    if (!bookingDoc.exists) {
      throw new HttpsError('not-found', 'Booking not found.');
    }
    const booking = bookingDoc.data();
    if (!booking) {
      throw new HttpsError('internal', 'Booking data is malformed.');
    }

    if (booking.institutionId !== caller.institutionId && caller.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Access denied.');
    }

    const isOwner = booking.ownerId === caller.uid;
    const isManager = caller.role === 'institution_manager';
    const isAdmin = caller.role === 'admin';
    if (!isOwner && !isManager && !isAdmin) {
      throw new HttpsError('permission-denied', 'Only the resource owner, manager, or admin can complete this booking.');
    }

    if (booking.status !== 'checked_in' && booking.status !== 'approved') {
      throw new HttpsError('failed-precondition', `Cannot complete booking in '${booking.status}' status. Only checked_in or approved bookings can be completed.`);
    }

    const resourceRef = db.collection('resources').doc(booking.resourceId);
    const resourceDoc = await tx.get(resourceRef);
    const now = admin.firestore.FieldValue.serverTimestamp();

    if (booking.inventoryReserved && resourceDoc.exists) {
      const resourceData = resourceDoc.data();
      const currentAvailable = typeof resourceData?.availableQuantity === 'number' ? resourceData.availableQuantity : 0;
      const quantityToRestore = typeof booking.quantity === 'number' ? booking.quantity : 1;
      tx.update(resourceRef, {
        availableQuantity: currentAvailable + quantityToRestore,
        updatedAt: now,
      });
    }

    // Invalidate/complete QR code if exists
    const qrSnap = await tx.get(db.collection('qr_codes').where('bookingId', '==', bookingId).limit(1));
    if (!qrSnap.empty) {
      const qrDoc = qrSnap.docs[0];
      tx.update(qrDoc.ref, {
        status: 'completed',
        checkOutTime: now,
        updatedAt: now,
      });
    }

    tx.update(bookingRef, {
      status: 'completed',
      checkOutTime: now,
      inventoryReserved: false,
      updatedAt: now,
    });

    return {
      ...booking,
      id: bookingDoc.id,
      status: 'completed',
      checkOutTime: now,
      inventoryReserved: false,
      updatedAt: now,
    } as unknown as Booking;
  });
}
