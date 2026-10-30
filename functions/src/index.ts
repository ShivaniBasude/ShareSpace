/**
 * ShareSpace — Firebase Cloud Functions Entry Point
 *
 * Backend modules are organized by domain under their respective subdirectories.
 * Business logic will be implemented here by the Backend Developer.
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (uses default credentials or emulator automatically)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export shared types
export * from './shared';

// Domain modules (empty exports for initial setup)
export * as authFunctions from './auth';
export * as resourceFunctions from './resources';
export * as bookingFunctions from './bookings';
export * as qrFunctions from './qr';
export * as incidentFunctions from './incidents';
export * as notificationFunctions from './notifications';
export * as auditFunctions from './audit';
