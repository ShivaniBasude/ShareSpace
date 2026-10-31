// Booking model validation and helpers
import { z } from 'zod';
import { Booking, BookingStatus } from '../../../packages/shared/src/types';

/** Schema for creating a booking (client supplied fields). */
export const createBookingSchema = z
  .object({
    resourceId: z.string().trim().min(1),
    quantity: z.number().int().min(1).max(1000),
    startTime: z.preprocess((arg) => (arg instanceof Date ? arg : new Date(arg as string)), z.date()),
    endTime: z.preprocess((arg) => (arg instanceof Date ? arg : new Date(arg as string)), z.date()),
    purpose: z.string().trim().min(1).max(2000),
    // client must not set status or timestamps
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  })
  .strict();

/** Runtime schema for a Booking document read from Firestore. */
export const firestoreBookingSchema = z.object({
  resourceId: z.string(),
  userId: z.string(),
  userDisplayName: z.string(),
  userEmail: z.string(),
  startTime: z.any(), // Timestamp
  endTime: z.any(),
  purpose: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled', 'completed'] as const),
  approvalId: z.string().optional(),
  checkInTime: z.any().optional(),
  checkOutTime: z.any().optional(),
  institutionId: z.string(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

/** Convert Firestore doc to Booking type, validating structure. */
export function docToBooking(doc: FirebaseFirestore.DocumentSnapshot): Booking {
  if (!doc.exists) {
    throw new Error(`Booking document ${doc.id} does not exist`);
  }
  const raw = doc.data();
  const parsed = firestoreBookingSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid booking data for ${doc.id}: ${parsed.error.message}`);
  }
  const data = parsed.data;
  return {
    id: doc.id,
    resourceId: data.resourceId,
    userId: data.userId,
    userDisplayName: data.userDisplayName,
    userEmail: data.userEmail,
    startTime: data.startTime as any,
    endTime: data.endTime as any,
    purpose: data.purpose,
    status: data.status as BookingStatus,
    approvalId: data.approvalId,
    checkInTime: data.checkInTime as any,
    checkOutTime: data.checkOutTime as any,
    institutionId: data.institutionId,
    createdAt: data.createdAt as any,
    updatedAt: data.updatedAt as any,
  };
}
