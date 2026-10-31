/**
 * ShareSpace — Firebase Cloud Functions Entry Point
 *
 * Backend modules are organized by domain under their respective subdirectories.
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (uses default credentials or emulator automatically)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export shared types
export * from './shared';

// Phase 1 Authentication & User Management Callable Functions
export * from './auth';

// Phase 2 Resource Management Callable Functions
export * from './resources';

// Phase 3 Booking & Approval Management Callable Functions
export * from './bookings';

// Phase 4 QR Code Management Callable Functions
export * from './qr';

// Domain modules (re-exported namespaces for compatibility)
export * as resourceFunctions from './resources';
export * as bookingFunctions from './bookings';
export * as qrFunctions from './qr';
export * as incidentFunctions from './incidents';
export * as notificationFunctions from './notifications';
export * as auditFunctions from './audit';
