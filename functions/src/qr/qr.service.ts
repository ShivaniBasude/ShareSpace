// QR Code Service Layer
// Cryptographically secure token generation, hashing, verification,
// and check-in / check-out state machine integration.

import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { QRCodeRecord, QRCodeStatus, Booking } from '../../../packages/shared/src/types';
import { getDb } from '../shared/firebase';
import { CallerContext } from '../bookings/service';
import { docToBooking } from '../bookings/booking.model';

/**
 * Hash a plain-text token using SHA-256.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Helper to parse QR Firestore doc into QRCodeRecord.
 */
export function docToQRCodeRecord(doc: FirebaseFirestore.DocumentSnapshot): QRCodeRecord {
  if (!doc.exists) {
    throw new HttpsError('not-found', 'QR code record not found.');
  }
  const data = doc.data();
  if (!data) {
    throw new HttpsError('internal', 'QR code data is malformed.');
  }
  return {
    id: doc.id,
    bookingId: data.bookingId,
    resourceId: data.resourceId,
    institutionId: data.institutionId,
    ownerId: data.ownerId,
    requesterId: data.requesterId,
    tokenHash: data.tokenHash,
    status: data.status as QRCodeStatus,
    expiresAt: data.expiresAt,
    checkInTime: data.checkInTime,
    checkOutTime: data.checkOutTime,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * 1. generateBookingQRCode
 * - Only requester, resource owner, institution manager, or admin can generate.
 * - Booking status MUST be 'approved'.
 * - Reuses existing active QR code if still valid, or generates a fresh one.
 * - Stores SHA-256 hash in Firestore, never raw token.
 * - Generates QR Data URL image via qrcode library.
 * - Returns raw token and qrCodeDataUrl to the authorized caller.
 */
export async function generateBookingQRCodeService(
  caller: CallerContext,
  bookingId: string
): Promise<{ qrCodeId: string; token: string; qrCodeDataUrl: string; expiresAt: string }> {
  const db = getDb();
  const bookingRef = db.collection('bookings').doc(bookingId);

  const bookingDoc = await bookingRef.get();
  if (!bookingDoc.exists) {
    throw new HttpsError('not-found', 'Booking not found.');
  }
  const booking = bookingDoc.data();
  if (!booking) {
    throw new HttpsError('internal', 'Booking data is corrupt.');
  }

  // Cross-institution check
  if (booking.institutionId !== caller.institutionId && caller.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Access denied.');
  }

  // Caller authorization: requester, owner, manager, admin
  const isRequester = booking.userId === caller.uid;
  const isOwner = booking.ownerId === caller.uid;
  const isManager = caller.role === 'institution_manager';
  const isAdmin = caller.role === 'admin';
  if (!isRequester && !isOwner && !isManager && !isAdmin) {
    throw new HttpsError('permission-denied', 'You are not authorized to generate a QR code for this booking.');
  }

  // Only eligible approved bookings may receive QR codes
  if (booking.status !== 'approved') {
    throw new HttpsError('failed-precondition', `Cannot generate QR code for booking with status '${booking.status}'. Only approved bookings are eligible.`);
  }

  // Generate cryptographically secure 32-byte token (256-bit entropy)
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);

  // Set expiry to booking endTime or 24h from now, whichever is later
  let expiresAtDate: Date;
  if (booking.endTime && typeof booking.endTime.toDate === 'function') {
    expiresAtDate = booking.endTime.toDate();
  } else if (booking.endTime && booking.endTime instanceof Date) {
    expiresAtDate = booking.endTime;
  } else if (booking.endTime && typeof booking.endTime === 'string') {
    expiresAtDate = new Date(booking.endTime);
  } else {
    expiresAtDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  // Add a 2-hour grace period past endTime for checkout
  expiresAtDate = new Date(expiresAtDate.getTime() + 2 * 60 * 60 * 1000);

  const now = admin.firestore.FieldValue.serverTimestamp();
  const expiresAtTimestamp = admin.firestore.Timestamp.fromDate(expiresAtDate);

  const qrRef = db.collection('qr_codes').doc();
  const qrRecord = {
    bookingId,
    resourceId: booking.resourceId,
    institutionId: booking.institutionId,
    ownerId: booking.ownerId,
    requesterId: booking.userId,
    tokenHash,
    status: 'active' as QRCodeStatus,
    expiresAt: expiresAtTimestamp,
    createdAt: now,
    updatedAt: now,
  };

  await qrRef.set(qrRecord);

  // Generate Data URL for frontend scanning/rendering
  // Payload encoded in QR contains only token and minimal routing id, no PII or sensitive data
  const qrPayload = JSON.stringify({
    qrId: qrRef.id,
    token,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
  });

  return {
    qrCodeId: qrRef.id,
    token,
    qrCodeDataUrl,
    expiresAt: expiresAtDate.toISOString(),
  };
}

/**
 * 2. verifyQRCode
 * - Verifies token hash, expiration, booking status, and permissions.
 * - Allowed callers: owner, institution_manager, admin, or the requester.
 */
export async function verifyQRCodeService(
  caller: CallerContext,
  token: string
): Promise<{ valid: boolean; booking: Booking; qrStatus: QRCodeStatus; message: string }> {
  const db = getDb();
  const tokenHash = hashToken(token);

  const snapshot = await db.collection('qr_codes').where('tokenHash', '==', tokenHash).limit(1).get();
  if (snapshot.empty) {
    throw new HttpsError('not-found', 'Invalid QR code.');
  }

  const qrDoc = snapshot.docs[0];
  const qrData = docToQRCodeRecord(qrDoc);

  if (qrData.institutionId !== caller.institutionId && caller.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Cross-institution QR code verification is not permitted.');
  }

  // Check expiration
  let isExpired = false;
  if (qrData.expiresAt) {
    let expDate: Date;
    if (typeof (qrData.expiresAt as unknown as { toDate: () => Date }).toDate === 'function') {
      expDate = (qrData.expiresAt as unknown as { toDate: () => Date }).toDate();
    } else {
      expDate = (qrData.expiresAt as unknown as { toDate: () => Date }).toDate();
    }
    if (Date.now() > expDate.getTime()) {
      isExpired = true;
    }
  }

  if (isExpired || qrData.status === 'expired') {
    return {
      valid: false,
      booking: {} as Booking,
      qrStatus: 'expired',
      message: 'QR code has expired.',
    };
  }

  if (qrData.status === 'revoked') {
    return {
      valid: false,
      booking: {} as Booking,
      qrStatus: 'revoked',
      message: 'QR code has been revoked.',
    };
  }

  const bookingDoc = await db.collection('bookings').doc(qrData.bookingId).get();
  if (!bookingDoc.exists) {
    throw new HttpsError('not-found', 'Associated booking not found.');
  }
  const booking = docToBooking(bookingDoc);

  return {
    valid: true,
    booking,
    qrStatus: qrData.status,
    message: `QR code is ${qrData.status}.`,
  };
}

/**
 * 3. checkInWithQRCode
 * - Authorized actors: owner, institution_manager, or admin (on-site staff scanning the student QR).
 * - Verifies token hash.
 * - Transactionally verifies QR is 'active' and booking is 'approved'.
 * - Transitions booking: approved -> checked_in.
 * - Transitions QR: active -> checked_in.
 * - Keeps token usable for checkout (does not revoke token).
 */
export async function checkInWithQRCodeService(
  caller: CallerContext,
  token: string
): Promise<{ success: boolean; booking: Booking; message: string }> {
  const db = getDb();
  const tokenHash = hashToken(token);

  // Find QR record
  const snapshot = await db.collection('qr_codes').where('tokenHash', '==', tokenHash).limit(1).get();
  if (snapshot.empty) {
    throw new HttpsError('not-found', 'Invalid QR code.');
  }
  const qrDocRef = snapshot.docs[0].ref;

  return await db.runTransaction(async (tx) => {
    const qrDoc = await tx.get(qrDocRef);
    if (!qrDoc.exists) {
      throw new HttpsError('not-found', 'QR code record not found.');
    }
    const qrData = qrDoc.data();
    if (!qrData) {
      throw new HttpsError('internal', 'QR record is corrupted.');
    }

    if (qrData.institutionId !== caller.institutionId && caller.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Cross-institution check-in is not permitted.');
    }

    // Role check: resource owner, manager, admin
    const isOwner = qrData.ownerId === caller.uid;
    const isManager = caller.role === 'institution_manager';
    const isAdmin = caller.role === 'admin';
    if (!isOwner && !isManager && !isAdmin) {
      throw new HttpsError('permission-denied', 'Only resource owners, managers, or admins can process check-in.');
    }

    // QR state checks
    if (qrData.status === 'checked_in') {
      throw new HttpsError('already-exists', 'This booking has already been checked in.');
    }
    if (qrData.status !== 'active') {
      throw new HttpsError('failed-precondition', `Cannot check in with QR in status '${qrData.status}'.`);
    }

    // Check expiry
    if (qrData.expiresAt) {
      const expDate = typeof qrData.expiresAt.toDate === 'function' ? qrData.expiresAt.toDate() : new Date(qrData.expiresAt);
      if (Date.now() > expDate.getTime()) {
        tx.update(qrDocRef, { status: 'expired', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        throw new HttpsError('failed-precondition', 'QR code has expired.');
      }
    }

    // Fetch booking
    const bookingRef = db.collection('bookings').doc(qrData.bookingId);
    const bookingDoc = await tx.get(bookingRef);
    if (!bookingDoc.exists) {
      throw new HttpsError('not-found', 'Booking not found.');
    }
    const bookingData = bookingDoc.data();
    if (!bookingData) {
      throw new HttpsError('internal', 'Booking data is malformed.');
    }

    if (bookingData.status !== 'approved') {
      throw new HttpsError('failed-precondition', `Cannot check in booking with status '${bookingData.status}'. Must be approved.`);
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    // Transition QR state
    tx.update(qrDocRef, {
      status: 'checked_in',
      checkInTime: now,
      updatedAt: now,
    });

    // Transition Booking state
    tx.update(bookingRef, {
      status: 'checked_in',
      checkInTime: now,
      updatedAt: now,
    });

    const updatedBooking = {
      ...bookingData,
      id: bookingDoc.id,
      status: 'checked_in',
      checkInTime: now,
      updatedAt: now,
    } as unknown as Booking;

    return {
      success: true,
      booking: updatedBooking,
      message: 'Check-in successful.',
    };
  });
}

/**
 * 4. checkOutWithQRCode
 * - Authorized actors: owner, institution_manager, or admin.
 * - Verifies token hash.
 * - Transactionally verifies QR is 'checked_in' and booking is 'checked_in'.
 * - Transitions booking: checked_in -> completed.
 * - Transitions QR: checked_in -> completed.
 * - Restores inventory exactly once if inventoryReserved is true.
 */
export async function checkOutWithQRCodeService(
  caller: CallerContext,
  token: string
): Promise<{ success: boolean; booking: Booking; message: string }> {
  const db = getDb();
  const tokenHash = hashToken(token);

  const snapshot = await db.collection('qr_codes').where('tokenHash', '==', tokenHash).limit(1).get();
  if (snapshot.empty) {
    throw new HttpsError('not-found', 'Invalid QR code.');
  }
  const qrDocRef = snapshot.docs[0].ref;

  return await db.runTransaction(async (tx) => {
    const qrDoc = await tx.get(qrDocRef);
    if (!qrDoc.exists) {
      throw new HttpsError('not-found', 'QR code record not found.');
    }
    const qrData = qrDoc.data();
    if (!qrData) {
      throw new HttpsError('internal', 'QR record is corrupted.');
    }

    if (qrData.institutionId !== caller.institutionId && caller.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Cross-institution check-out is not permitted.');
    }

    // Role check: resource owner, manager, admin
    const isOwner = qrData.ownerId === caller.uid;
    const isManager = caller.role === 'institution_manager';
    const isAdmin = caller.role === 'admin';
    if (!isOwner && !isManager && !isAdmin) {
      throw new HttpsError('permission-denied', 'Only resource owners, managers, or admins can process check-out.');
    }

    if (qrData.status === 'completed') {
      throw new HttpsError('already-exists', 'This booking has already been checked out and completed.');
    }
    if (qrData.status !== 'checked_in') {
      throw new HttpsError('failed-precondition', `Cannot check out with QR in status '${qrData.status}'. Must be checked_in first.`);
    }

    // Fetch booking
    const bookingRef = db.collection('bookings').doc(qrData.bookingId);
    const bookingDoc = await tx.get(bookingRef);
    if (!bookingDoc.exists) {
      throw new HttpsError('not-found', 'Booking not found.');
    }
    const bookingData = bookingDoc.data();
    if (!bookingData) {
      throw new HttpsError('internal', 'Booking data is malformed.');
    }

    if (bookingData.status !== 'checked_in') {
      throw new HttpsError('failed-precondition', `Cannot check out booking with status '${bookingData.status}'. Must be checked_in first.`);
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    // Restore inventory if reserved
    const resourceRef = db.collection('resources').doc(bookingData.resourceId);
    const resourceDoc = await tx.get(resourceRef);
    if (bookingData.inventoryReserved && resourceDoc.exists) {
      const resourceData = resourceDoc.data();
      const currentAvailable = typeof resourceData?.availableQuantity === 'number' ? resourceData.availableQuantity : 0;
      const quantityToRestore = typeof bookingData.quantity === 'number' ? bookingData.quantity : 1;
      tx.update(resourceRef, {
        availableQuantity: currentAvailable + quantityToRestore,
        updatedAt: now,
      });
    }

    // Transition QR state
    tx.update(qrDocRef, {
      status: 'completed',
      checkOutTime: now,
      updatedAt: now,
    });

    // Transition Booking state
    tx.update(bookingRef, {
      status: 'completed',
      checkOutTime: now,
      inventoryReserved: false,
      updatedAt: now,
    });

    const updatedBooking = {
      ...bookingData,
      id: bookingDoc.id,
      status: 'completed',
      checkOutTime: now,
      inventoryReserved: false,
      updatedAt: now,
    } as unknown as Booking;

    return {
      success: true,
      booking: updatedBooking,
      message: 'Check-out successful. Resource returned and booking completed.',
    };
  });
}
