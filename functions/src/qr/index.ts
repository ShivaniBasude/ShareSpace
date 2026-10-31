// QR Code Callable Cloud Functions
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { getCallerContext } from '../bookings/service';
import {
  generateBookingQRCodeService,
  verifyQRCodeService,
  checkInWithQRCodeService,
  checkOutWithQRCodeService,
} from './qr.service';

const generateQRCodeInputSchema = z
  .object({
    bookingId: z.string().trim().min(1),
  })
  .strict();

const qrTokenInputSchema = z
  .object({
    token: z.string().trim().min(16),
  })
  .strict();

/** 1. generateBookingQRCode */
export const generateBookingQRCode = onCall(async (request) => {
  const caller = await getCallerContext(request.auth);
  const parsed = generateQRCodeInputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }
  return await generateBookingQRCodeService(caller, parsed.data.bookingId);
});

/** 2. verifyQRCode */
export const verifyQRCode = onCall(async (request) => {
  const caller = await getCallerContext(request.auth);
  const parsed = qrTokenInputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }
  return await verifyQRCodeService(caller, parsed.data.token);
});

/** 3. checkInWithQRCode */
export const checkInWithQRCode = onCall(async (request) => {
  const caller = await getCallerContext(request.auth);
  const parsed = qrTokenInputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }
  return await checkInWithQRCodeService(caller, parsed.data.token);
});

/** 4. checkOutWithQRCode */
export const checkOutWithQRCode = onCall(async (request) => {
  const caller = await getCallerContext(request.auth);
  const parsed = qrTokenInputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }
  return await checkOutWithQRCodeService(caller, parsed.data.token);
});
