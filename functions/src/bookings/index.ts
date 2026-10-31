// Booking Callable Cloud Functions
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  createBookingSchema,
  getBookingInputSchema,
  listBookingsInputSchema,
  approveBookingInputSchema,
  rejectBookingInputSchema,
  cancelBookingInputSchema,
  completeBookingInputSchema,
} from './booking.model';
import {
  getCallerContext,
  createBookingService,
  getBookingService,
  listMyBookingsService,
  listOwnerBookingRequestsService,
  approveBookingService,
  rejectBookingService,
  cancelBookingService,
  completeBookingService,
} from './service';

/** 1. createBooking */
export const createBooking = onCall(async (request) => {
  const caller = await getCallerContext(request.auth);
  const parsed = createBookingSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }
  return await createBookingService(caller, parsed.data);
});

/** 2. getBooking */
export const getBooking = onCall(async (request) => {
  const caller = await getCallerContext(request.auth);
  const parsed = getBookingInputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }
  return await getBookingService(caller, parsed.data.bookingId);
});

/** 3. listMyBookings */
export const listMyBookings = onCall(async (request) => {
  const caller = await getCallerContext(request.auth);
  const parsed = listBookingsInputSchema.safeParse(request.data ?? {});
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }
  return await listMyBookingsService(caller, parsed.data);
});

/** 4. listOwnerBookingRequests */
export const listOwnerBookingRequests = onCall(async (request) => {
  const caller = await getCallerContext(request.auth);
  const parsed = listBookingsInputSchema.safeParse(request.data ?? {});
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }
  return await listOwnerBookingRequestsService(caller, parsed.data);
});

/** 5. approveBooking */
export const approveBooking = onCall(async (request) => {
  const caller = await getCallerContext(request.auth);
  const parsed = approveBookingInputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }
  return await approveBookingService(caller, parsed.data.bookingId, parsed.data.remarks);
});

/** 6. rejectBooking */
export const rejectBooking = onCall(async (request) => {
  const caller = await getCallerContext(request.auth);
  const parsed = rejectBookingInputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }
  return await rejectBookingService(caller, parsed.data.bookingId, parsed.data.reason);
});

/** 7. cancelBooking */
export const cancelBooking = onCall(async (request) => {
  const caller = await getCallerContext(request.auth);
  const parsed = cancelBookingInputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }
  return await cancelBookingService(caller, parsed.data.bookingId, parsed.data.reason);
});

/** 8. completeBooking */
export const completeBooking = onCall(async (request) => {
  const caller = await getCallerContext(request.auth);
  const parsed = completeBookingInputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }
  return await completeBookingService(caller, parsed.data.bookingId);
});
