/**
 * Phase 3 — Extended booking types for the frontend mock layer.
 * These extend the canonical shared types without modifying packages/shared/src/types.ts.
 */

import type { BookingStatus } from '../../../packages/shared/src/types';
export type { BookingStatus };

/**
 * A booking request's quantity field (frontend-only extension).
 * The shared Booking type doesn't include quantity; this is tracked
 * in the mock layer until the backend contract is updated.
 */
export interface BookingWithQuantity {
  id: string;
  resourceId: string;
  resourceTitle: string;
  resourceCategory: string;
  resourceLocation?: string;
  /** UID of the student who made the request */
  userId: string;
  userDisplayName: string;
  userEmail: string;
  /** Number of units requested */
  requestedQuantity: number;
  /** Start date as ISO 8601 string */
  startTime: string;
  /** End date as ISO 8601 string */
  endTime: string;
  /** Reason/purpose for the booking */
  purpose: string;
  status: BookingStatus;
  /** UID of the resource owner */
  ownerId: string;
  ownerName?: string;
  /** Linked approval record ID */
  approvalId?: string;
  /** Remarks from the owner (for rejections) */
  remarks?: string;
  /** When the student physically checked out the resource */
  checkInTime?: string;
  /** When the student physically returned the resource */
  checkOutTime?: string;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
  /** Timeline events recorded for this booking */
  timeline: BookingTimelineEntry[];
}

export type TimelineEventType =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'checked_in'
  | 'completed'
  | 'overdue_flag'
  | 'incident_reported';

export interface BookingTimelineEntry {
  id: string;
  event: TimelineEventType;
  label: string;
  description?: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
}

export type IncidentCategory =
  | 'damaged'
  | 'missing'
  | 'late_return'
  | 'malfunction'
  | 'other';

/** Frontend incident report (mock-only until backend is integrated) */
export interface MockIncident {
  id: string;
  bookingId?: string;
  resourceId?: string;
  resourceTitle?: string;
  reportedBy: string;
  reporterName: string;
  category: IncidentCategory;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  institutionId: string;
  createdAt: string;
  updatedAt: string;
}

/** Frontend notification (synced with shared NotificationItem shape) */
export interface MockNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'booking' | 'approval' | 'incident' | 'system';
  linkUrl?: string;
  createdAt: string;
}

