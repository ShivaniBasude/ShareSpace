/**
 * Phase 3 — Mock booking service.
 * Backed by an in-memory store. Structured for clean backend replacement.
 * All mock actions are clearly labeled in the UI; no real Firebase calls are made.
 *
 * Inventory rules:
 *   - pending:    no inventory change
 *   - approved:   reduce availableQuantity by requestedQuantity
 *   - rejected:   no inventory change
 *   - cancelled (pending):   no inventory change
 *   - cancelled (approved):  restore availableQuantity
 *   - checked_in: no second inventory change (already reserved at approval)
 *   - completed:  restore availableQuantity
 */

import type { BookingStatus } from '../../../packages/shared/src/types';
import type {
  BookingWithQuantity,
  BookingTimelineEntry,
  MockIncident,
  MockNotification,
  IncidentCategory,
} from './bookingTypes';
import {
  MOCK_BOOKINGS,
  DEMO_STUDENT_ID,
  DEMO_OWNER_ID,
  DEMO_INSTITUTION_ID,
} from './mockBookings';
import { resourceService } from '../resources/resourceService';

// ── In-memory stores ─────────────────────────────────────────────────────────

let bookingsStore: BookingWithQuantity[] = [...MOCK_BOOKINGS];
let notificationsStore: MockNotification[] = [];
let incidentsStore: MockIncident[] = [];

// ── Utilities ─────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

function makeTimeline(
  event: BookingTimelineEntry['event'],
  label: string,
  performedBy: string,
  performedByName: string,
  description?: string
): BookingTimelineEntry {
  return {
    id: genId('tl'),
    event,
    label,
    description,
    performedBy,
    performedByName,
    timestamp: nowIso(),
  };
}

function addNotification(
  userId: string,
  title: string,
  message: string,
  type: MockNotification['type'],
  linkUrl?: string
): void {
  notificationsStore = [
    {
      id: genId('notif'),
      userId,
      title,
      message,
      read: false,
      type,
      linkUrl,
      createdAt: nowIso(),
    },
    ...notificationsStore,
  ];
}

// Seed initial demo notifications
notificationsStore = [
  {
    id: 'notif-seed-001',
    userId: DEMO_STUDENT_ID,
    title: 'Booking Approved',
    message: 'Your booking for "Precision GPU Workstation" on Nov 5 has been approved.',
    read: false,
    type: 'approval',
    linkUrl: '/student/bookings',
    createdAt: '2026-10-29T14:30:00Z',
  },
  {
    id: 'notif-seed-002',
    userId: DEMO_STUDENT_ID,
    title: 'Booking Rejected',
    message: 'Your booking for "Silent Acoustic Study Pod C-12" was not approved.',
    read: true,
    type: 'approval',
    linkUrl: '/student/bookings',
    createdAt: '2026-10-18T15:30:00Z',
  },
  {
    id: 'notif-seed-003',
    userId: DEMO_STUDENT_ID,
    title: 'Booking Confirmed',
    message: 'Your booking request for "GPU Workstation" has been submitted.',
    read: true,
    type: 'booking',
    linkUrl: '/student/bookings',
    createdAt: '2026-10-28T10:00:00Z',
  },
  {
    id: 'notif-seed-004',
    userId: DEMO_OWNER_ID,
    title: 'New Booking Request',
    message: 'Priya Sharma has requested the GPU Workstation for Nov 12.',
    read: false,
    type: 'booking',
    linkUrl: '/owner/bookings',
    createdAt: '2026-10-31T07:00:00Z',
  },
  {
    id: 'notif-seed-005',
    userId: DEMO_OWNER_ID,
    title: 'New Booking Request',
    message: 'Marcus Liu has requested 2× Oscilloscopes for Nov 8.',
    read: false,
    type: 'booking',
    linkUrl: '/owner/bookings',
    createdAt: '2026-10-30T16:00:00Z',
  },
];

// ── Booking Service ───────────────────────────────────────────────────────────

export const bookingService = {
  // ── Read operations ────────────────────────────────────────────────────────

  /** All bookings made BY a specific student. */
  async getStudentBookings(userId: string, delay = 200): Promise<BookingWithQuantity[]> {
    await new Promise((r) => setTimeout(r, delay));
    return bookingsStore.filter((b) => b.userId === userId);
  },

  /** All bookings for resources owned by a specific owner. */
  async getOwnerBookings(ownerId: string, delay = 200): Promise<BookingWithQuantity[]> {
    await new Promise((r) => setTimeout(r, delay));
    return bookingsStore.filter((b) => b.ownerId === ownerId);
  },

  /** Single booking by ID (accessible to involved student or owner). */
  async getBookingById(bookingId: string, delay = 100): Promise<BookingWithQuantity | null> {
    await new Promise((r) => setTimeout(r, delay));
    return bookingsStore.find((b) => b.id === bookingId) ?? null;
  },

  /** Find booking by booking reference (same as ID in mock). */
  async verifyBookingReference(reference: string, delay = 150): Promise<BookingWithQuantity | null> {
    await new Promise((r) => setTimeout(r, delay));
    const booking = bookingsStore.find(
      (b) => b.id === reference.trim().toLowerCase()
    );
    return booking ?? null;
  },

  // ── Student actions ────────────────────────────────────────────────────────

  /**
   * Create a new booking request.
   * Validates quantity, dates, and resource availability.
   * Does NOT reduce inventory (pending state doesn't reserve stock).
   */
  async createBookingRequest(
    input: {
      resourceId: string;
      resourceTitle: string;
      resourceCategory: string;
      resourceLocation?: string;
      ownerId: string;
      ownerName?: string;
      requestedQuantity: number;
      startTime: string;
      endTime: string;
      purpose: string;
      userId: string;
      userDisplayName: string;
      userEmail: string;
    },
    delay = 300
  ): Promise<BookingWithQuantity> {
    await new Promise((r) => setTimeout(r, delay));

    // Validate dates
    const start = new Date(input.startTime);
    const end = new Date(input.endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format for start or end time.');
    }
    if (end <= start) {
      throw new Error('End date must be after the start date.');
    }

    // Validate quantity against current available stock
    const resource = await resourceService.getResourceById(input.resourceId);
    if (!resource) {
      throw new Error('Resource not found. It may have been removed.');
    }
    if (resource.availabilityStatus !== 'available') {
      throw new Error('This resource is currently unavailable for booking.');
    }
    if (input.requestedQuantity < 1) {
      throw new Error('Requested quantity must be at least 1.');
    }
    if (input.requestedQuantity > resource.availableQuantity) {
      throw new Error(
        `Only ${resource.availableQuantity} unit(s) available. Your request exceeds the current stock.`
      );
    }

    const now = nowIso();
    const booking: BookingWithQuantity = {
      id: genId('bk'),
      resourceId: input.resourceId,
      resourceTitle: input.resourceTitle,
      resourceCategory: input.resourceCategory,
      resourceLocation: input.resourceLocation,
      userId: input.userId,
      userDisplayName: input.userDisplayName,
      userEmail: input.userEmail,
      requestedQuantity: input.requestedQuantity,
      startTime: input.startTime,
      endTime: input.endTime,
      purpose: input.purpose.trim(),
      status: 'pending',
      ownerId: input.ownerId,
      ownerName: input.ownerName,
      institutionId: DEMO_INSTITUTION_ID,
      createdAt: now,
      updatedAt: now,
      timeline: [
        makeTimeline(
          'requested',
          'Booking Requested',
          input.userId,
          input.userDisplayName,
          'Booking request submitted and awaiting owner review.'
        ),
      ],
    };

    bookingsStore = [booking, ...bookingsStore];

    // Notify student
    addNotification(
      input.userId,
      'Booking Request Submitted',
      `Your request for "${input.resourceTitle}" has been submitted and is awaiting approval.`,
      'booking',
      '/student/bookings'
    );
    // Notify owner
    addNotification(
      input.ownerId,
      'New Booking Request',
      `${input.userDisplayName} has requested ${input.requestedQuantity}× "${input.resourceTitle}".`,
      'booking',
      '/owner/bookings'
    );

    return { ...booking };
  },

  /**
   * Cancel a booking (student action).
   * Allowed for: pending (no inventory effect), approved (restores inventory).
   * Not allowed for: checked_in, completed, rejected, already cancelled.
   */
  async cancelBooking(
    bookingId: string,
    cancelledBy: string,
    cancelledByName: string,
    delay = 200
  ): Promise<BookingWithQuantity> {
    await new Promise((r) => setTimeout(r, delay));

    const index = bookingsStore.findIndex((b) => b.id === bookingId);
    if (index === -1) throw new Error('Booking not found.');

    const booking = bookingsStore[index];
    const allowedStatuses: BookingStatus[] = ['pending', 'approved'];
    if (!allowedStatuses.includes(booking.status)) {
      throw new Error(
        `Cannot cancel a booking with status "${booking.status}". Only pending or approved bookings can be cancelled.`
      );
    }

    const wasApproved = booking.status === 'approved';

    const updated: BookingWithQuantity = {
      ...booking,
      status: 'cancelled',
      updatedAt: nowIso(),
      timeline: [
        ...booking.timeline,
        makeTimeline(
          'cancelled',
          'Booking Cancelled',
          cancelledBy,
          cancelledByName,
          'Booking cancelled by the student.'
        ),
      ],
    };

    bookingsStore[index] = updated;

    // Restore inventory only if the booking was previously approved (stock was already reserved)
    if (wasApproved) {
      await resourceService.restoreQuantity(booking.resourceId, booking.requestedQuantity);
    }

    addNotification(
      booking.ownerId,
      'Booking Cancelled',
      `${cancelledByName} has cancelled their booking for "${booking.resourceTitle}".`,
      'booking',
      '/owner/bookings'
    );

    return { ...updated };
  },

  // ── Owner actions ──────────────────────────────────────────────────────────

  /**
   * Approve a booking request.
   * Reduces available inventory by requestedQuantity.
   */
  async approveBooking(
    bookingId: string,
    approverId: string,
    approverName: string,
    delay = 250
  ): Promise<BookingWithQuantity> {
    await new Promise((r) => setTimeout(r, delay));

    const index = bookingsStore.findIndex((b) => b.id === bookingId);
    if (index === -1) throw new Error('Booking not found.');

    const booking = bookingsStore[index];
    if (booking.status !== 'pending') {
      throw new Error(
        `This booking has already been ${booking.status}. Only pending bookings can be approved.`
      );
    }

    // Verify sufficient stock
    const resource = await resourceService.getResourceById(booking.resourceId);
    if (!resource) throw new Error('The associated resource no longer exists.');
    if (resource.availableQuantity < booking.requestedQuantity) {
      throw new Error(
        `Insufficient stock: only ${resource.availableQuantity} unit(s) available but ${booking.requestedQuantity} were requested.`
      );
    }

    const approvalId = genId('appr');
    const updated: BookingWithQuantity = {
      ...booking,
      status: 'approved',
      approvalId,
      updatedAt: nowIso(),
      timeline: [
        ...booking.timeline,
        makeTimeline(
          'approved',
          'Booking Approved',
          approverId,
          approverName,
          'Your booking has been approved. Please collect the resource on the booking date.'
        ),
      ],
    };

    bookingsStore[index] = updated;

    // Reserve inventory
    await resourceService.reserveQuantity(booking.resourceId, booking.requestedQuantity);

    addNotification(
      booking.userId,
      'Booking Approved! ✓',
      `Your booking for "${booking.resourceTitle}" has been approved.`,
      'approval',
      '/student/bookings'
    );

    return { ...updated };
  },

  /**
   * Reject a booking request with an optional reason.
   * Does NOT change inventory.
   */
  async rejectBooking(
    bookingId: string,
    approverId: string,
    approverName: string,
    remarks: string,
    delay = 250
  ): Promise<BookingWithQuantity> {
    await new Promise((r) => setTimeout(r, delay));

    const index = bookingsStore.findIndex((b) => b.id === bookingId);
    if (index === -1) throw new Error('Booking not found.');

    const booking = bookingsStore[index];
    if (booking.status !== 'pending') {
      throw new Error(
        `This booking has already been ${booking.status}. Only pending bookings can be rejected.`
      );
    }

    const updated: BookingWithQuantity = {
      ...booking,
      status: 'rejected',
      remarks: remarks.trim() || 'No reason provided.',
      updatedAt: nowIso(),
      timeline: [
        ...booking.timeline,
        makeTimeline(
          'rejected',
          'Booking Rejected',
          approverId,
          approverName,
          remarks.trim() || 'The booking request was declined by the resource owner.'
        ),
      ],
    };

    bookingsStore[index] = updated;

    addNotification(
      booking.userId,
      'Booking Not Approved',
      `Your booking for "${booking.resourceTitle}" was not approved. Reason: ${remarks.trim() || 'No reason provided.'}`,
      'approval',
      '/student/bookings'
    );

    return { ...updated };
  },

  /**
   * Check in: student collects the resource (sets status to checked_in).
   * No inventory change — stock was already reserved at approval.
   */
  async checkIn(
    bookingId: string,
    performedBy: string,
    performedByName: string,
    delay = 200
  ): Promise<BookingWithQuantity> {
    await new Promise((r) => setTimeout(r, delay));

    const index = bookingsStore.findIndex((b) => b.id === bookingId);
    if (index === -1) throw new Error('Booking not found.');

    const booking = bookingsStore[index];
    if (booking.status !== 'approved') {
      throw new Error('Only approved bookings can be checked out. Current status: ' + booking.status);
    }

    const now = nowIso();
    const updated: BookingWithQuantity = {
      ...booking,
      status: 'checked_in',
      checkInTime: now,
      updatedAt: now,
      timeline: [
        ...booking.timeline,
        makeTimeline(
          'checked_in',
          'Checked Out',
          performedBy,
          performedByName,
          'Resource physically collected. Booking is now active.'
        ),
      ],
    };

    bookingsStore[index] = updated;

    addNotification(
      booking.userId,
      'Resource Checked Out',
      `You have checked out "${booking.resourceTitle}". Please return it by ${new Date(booking.endTime).toLocaleDateString()}.`,
      'booking',
      '/student/bookings'
    );
    addNotification(
      booking.ownerId,
      'Resource Checked Out',
      `${booking.userDisplayName} has checked out "${booking.resourceTitle}".`,
      'booking',
      '/owner/bookings'
    );

    return { ...updated };
  },

  /**
   * Check out (return): student returns the resource (sets status to completed).
   * Restores availableQuantity.
   */
  async checkOut(
    bookingId: string,
    performedBy: string,
    performedByName: string,
    delay = 200
  ): Promise<BookingWithQuantity> {
    await new Promise((r) => setTimeout(r, delay));

    const index = bookingsStore.findIndex((b) => b.id === bookingId);
    if (index === -1) throw new Error('Booking not found.');

    const booking = bookingsStore[index];
    if (booking.status !== 'checked_in') {
      throw new Error('Only active (checked-out) bookings can be returned. Current status: ' + booking.status);
    }

    const now = nowIso();
    const updated: BookingWithQuantity = {
      ...booking,
      status: 'completed',
      checkOutTime: now,
      updatedAt: now,
      timeline: [
        ...booking.timeline,
        makeTimeline(
          'completed',
          'Returned',
          performedBy,
          performedByName,
          'Resource returned successfully. Booking complete.'
        ),
      ],
    };

    bookingsStore[index] = updated;

    // Restore inventory
    await resourceService.restoreQuantity(booking.resourceId, booking.requestedQuantity);

    addNotification(
      booking.userId,
      'Return Confirmed',
      `Your return of "${booking.resourceTitle}" has been recorded. Thank you!`,
      'booking',
      '/student/bookings'
    );
    addNotification(
      booking.ownerId,
      'Resource Returned',
      `${booking.userDisplayName} has returned "${booking.resourceTitle}".`,
      'booking',
      '/owner/bookings'
    );

    return { ...updated };
  },

  // ── Incident reporting ─────────────────────────────────────────────────────

  async reportIncident(
    input: {
      bookingId?: string;
      resourceId?: string;
      resourceTitle?: string;
      reportedBy: string;
      reporterName: string;
      category: IncidentCategory;
      title: string;
      description: string;
      severity: MockIncident['severity'];
    },
    delay = 250
  ): Promise<MockIncident> {
    await new Promise((r) => setTimeout(r, delay));

    const incident: MockIncident = {
      id: genId('inc'),
      bookingId: input.bookingId,
      resourceId: input.resourceId,
      resourceTitle: input.resourceTitle,
      reportedBy: input.reportedBy,
      reporterName: input.reporterName,
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      severity: input.severity,
      status: 'open',
      institutionId: DEMO_INSTITUTION_ID,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    incidentsStore = [incident, ...incidentsStore];

    addNotification(
      input.reportedBy,
      'Incident Report Filed',
      `Your incident report "${input.title}" has been submitted and is under review.`,
      'incident',
      '/student/incidents'
    );

    return { ...incident };
  },

  async getIncidents(userId: string, delay = 150): Promise<MockIncident[]> {
    await new Promise((r) => setTimeout(r, delay));
    return incidentsStore.filter((i) => i.reportedBy === userId);
  },

  async getOwnerIncidents(ownerId: string, delay = 150): Promise<MockIncident[]> {
    await new Promise((r) => setTimeout(r, delay));
    // Owner sees incidents on their resources' bookings
    const ownerBookingIds = new Set(
      bookingsStore.filter((b) => b.ownerId === ownerId).map((b) => b.id)
    );
    return incidentsStore.filter(
      (i) => (i.bookingId && ownerBookingIds.has(i.bookingId)) || i.resourceId
    );
  },
};

// ── Notification Service ──────────────────────────────────────────────────────

export const notificationService = {
  async getNotifications(userId: string, delay = 100): Promise<MockNotification[]> {
    await new Promise((r) => setTimeout(r, delay));
    return notificationsStore.filter((n) => n.userId === userId);
  },

  async markAsRead(notificationId: string, delay = 80): Promise<void> {
    await new Promise((r) => setTimeout(r, delay));
    const index = notificationsStore.findIndex((n) => n.id === notificationId);
    if (index !== -1) {
      notificationsStore[index] = { ...notificationsStore[index], read: true };
    }
  },

  async markAllAsRead(userId: string, delay = 100): Promise<void> {
    await new Promise((r) => setTimeout(r, delay));
    notificationsStore = notificationsStore.map((n) =>
      n.userId === userId ? { ...n, read: true } : n
    );
  },

  getUnreadCount(userId: string): number {
    return notificationsStore.filter((n) => n.userId === userId && !n.read).length;
  },
};

export { DEMO_STUDENT_ID, DEMO_OWNER_ID };

