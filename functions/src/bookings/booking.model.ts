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
  })
  .strict()
  .refine((data) => data.endTime > data.startTime, {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  });

export const getBookingInputSchema = z
  .object({
    bookingId: z.string().trim().min(1),
  })
  .strict();

export const listBookingsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(20),
    startAfterId: z.string().trim().min(1).optional(),
    status: z.enum(['pending', 'approved', 'rejected', 'cancelled', 'checked_in', 'completed'] as const).optional(),
  })
  .strict();

export const approveBookingInputSchema = z
  .object({
    bookingId: z.string().trim().min(1),
    remarks: z.string().trim().max(1000).optional(),
  })
  .strict();

export const rejectBookingInputSchema = z
  .object({
    bookingId: z.string().trim().min(1),
    reason: z.string().trim().min(1).max(1000),
  })
  .strict();

export const cancelBookingInputSchema = z
  .object({
    bookingId: z.string().trim().min(1),
    reason: z.string().trim().max(1000).optional(),
  })
  .strict();

export const completeBookingInputSchema = z
  .object({
    bookingId: z.string().trim().min(1),
  })
  .strict();

/** Runtime schema for a Booking document read from Firestore. */
export const firestoreBookingSchema = z.object({
  resourceId: z.string(),
  userId: z.string(),
  userDisplayName: z.string(),
  userEmail: z.string(),
  ownerId: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
  startTime: z.unknown(), // Timestamp
  endTime: z.unknown(), // Timestamp
  purpose: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled', 'checked_in', 'completed'] as const),
  approvalId: z.string().optional(),
  remarks: z.string().optional(),
  rejectionReason: z.string().optional(),
  cancellationReason: z.string().optional(),
  inventoryReserved: z.boolean().optional(),
  checkInTime: z.unknown().optional(),
  checkOutTime: z.unknown().optional(),
  institutionId: z.string(),
  createdAt: z.unknown(),
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
    ownerId: data.ownerId,
    quantity: data.quantity ?? 1,
    startTime: data.startTime as unknown,
    endTime: data.endTime as unknown,
    purpose: data.purpose,
    status: data.status as BookingStatus,
    approvalId: data.approvalId,
    remarks: data.remarks,
    rejectionReason: data.rejectionReason,
    cancellationReason: data.cancellationReason,
    inventoryReserved: data.inventoryReserved ?? false,
    checkInTime: data.checkInTime as unknown,
    checkOutTime: data.checkOutTime as unknown,
    institutionId: data.institutionId,
    createdAt: data.createdAt as unknown,
    updatedAt: data.updatedAt as unknown,
  };
}
