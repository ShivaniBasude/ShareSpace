// Unit and Integration Tests for ShareSpace Backend — Phase 3 (Bookings) & Phase 4 (QR Codes)
import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as admin from 'firebase-admin';
import { setDbForTesting } from '../shared/firebase';
import {
  createBooking,
  getBooking,
  listMyBookings,
  listOwnerBookingRequests,
  approveBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
} from '../bookings';
import {
  generateBookingQRCode,
  verifyQRCode,
  checkInWithQRCode,
  checkOutWithQRCode,
} from '../qr';
import { hashToken } from '../qr/qr.service';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'sharespace-dev' });
}

// In-Memory Mock Database supporting collections, transactions, and basic queries
class MockFirestore {
  public collections = new Map<string, Map<string, any>>();

  getCollection(name: string): Map<string, any> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    return this.collections.get(name)!;
  }

  collection(name: string) {
    return new MockCollectionReference(this, name);
  }

  async runTransaction<T>(updateFunction: (tx: MockTransaction) => Promise<T>): Promise<T> {
    const tx = new MockTransaction(this);
    return await updateFunction(tx);
  }
}

class MockCollectionReference {
  constructor(public db: MockFirestore, public name: string) {}

  doc(id?: string) {
    const docId = id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return new MockDocumentReference(this.db, this.name, docId);
  }

  where(field: string, op: string, value: any) {
    return new MockQuery(this.db, this.name, [{ field, op, value }]);
  }

  orderBy(field: string, dir: string = 'asc') {
    return new MockQuery(this.db, this.name, [], [{ field, dir }]);
  }

  async get() {
    return new MockQuery(this.db, this.name, []).get();
  }
}

class MockQuery {
  constructor(
    public db: MockFirestore,
    public collectionName: string,
    public filters: Array<{ field: string; op: string; value: any }> = [],
    public orders: Array<{ field: string; dir: string }> = [],
    public limitCount?: number,
    public startAfterDoc?: any
  ) {}

  where(field: string, op: string, value: any) {
    return new MockQuery(this.db, this.collectionName, [...this.filters, { field, op, value }], this.orders, this.limitCount, this.startAfterDoc);
  }

  orderBy(field: string, dir: string = 'asc') {
    return new MockQuery(this.db, this.collectionName, this.filters, [...this.orders, { field, dir }], this.limitCount, this.startAfterDoc);
  }

  limit(count: number) {
    return new MockQuery(this.db, this.collectionName, this.filters, this.orders, count, this.startAfterDoc);
  }

  startAfter(doc: any) {
    return new MockQuery(this.db, this.collectionName, this.filters, this.orders, this.limitCount, doc);
  }

  async get() {
    const col = this.db.getCollection(this.collectionName);
    let results: Array<{ id: string; data: any }> = [];

    for (const [id, data] of col.entries()) {
      let matches = true;
      for (const f of this.filters) {
        if (f.op === '==' && data[f.field] !== f.value) {
          matches = false;
          break;
        }
      }
      if (matches) {
        results.push({ id, data: { ...data } });
      }
    }

    if (this.startAfterDoc) {
      const idx = results.findIndex((r) => r.id === this.startAfterDoc.id);
      if (idx !== -1) {
        results = results.slice(idx + 1);
      }
    }

    if (typeof this.limitCount === 'number') {
      results = results.slice(0, this.limitCount);
    }

    return {
      empty: results.length === 0,
      size: results.length,
      docs: results.map((r) => ({
        id: r.id,
        ref: new MockDocumentReference(this.db, this.collectionName, r.id),
        exists: true,
        data: () => ({ ...r.data }),
      })),
    };
  }
}

class MockDocumentReference {
  constructor(public db: MockFirestore, public collectionName: string, public id: string) {}

  async get() {
    const col = this.db.getCollection(this.collectionName);
    const data = col.get(this.id);
    return {
      id: this.id,
      ref: this,
      exists: data !== undefined,
      data: () => (data ? { ...data } : undefined),
    };
  }

  async set(data: any) {
    const col = this.db.getCollection(this.collectionName);
    col.set(this.id, { ...data });
  }

  async update(updates: any) {
    const col = this.db.getCollection(this.collectionName);
    const existing = col.get(this.id);
    if (!existing) {
      throw new Error(`Doc ${this.id} not found in ${this.collectionName}`);
    }
    col.set(this.id, { ...existing, ...updates });
  }
}

class MockTransaction {
  constructor(public db: MockFirestore) {}

  async get(refOrQuery: any) {
    return await refOrQuery.get();
  }

  set(ref: MockDocumentReference, data: any) {
    const col = this.db.getCollection(ref.collectionName);
    col.set(ref.id, { ...data });
  }

  update(ref: MockDocumentReference, updates: any) {
    const col = this.db.getCollection(ref.collectionName);
    const existing = col.get(ref.id) || {};
    col.set(ref.id, { ...existing, ...updates });
  }
}

describe('ShareSpace Backend — Phase 3: Booking & Approval Management Tests', () => {
  let mockDb: MockFirestore;

  beforeEach(() => {
    mockDb = new MockFirestore();
    setDbForTesting(mockDb);

    // Seed mock users
    mockDb.getCollection('users').set('student-1', {
      uid: 'student-1',
      fullName: 'Alice Student',
      email: 'alice@campus.edu',
      role: 'student',
      institutionId: 'inst-1',
      accountStatus: 'active',
    });

    mockDb.getCollection('users').set('owner-1', {
      uid: 'owner-1',
      fullName: 'Bob Owner',
      email: 'bob@campus.edu',
      role: 'owner',
      institutionId: 'inst-1',
      accountStatus: 'active',
    });

    mockDb.getCollection('users').set('manager-1', {
      uid: 'manager-1',
      fullName: 'Carol Manager',
      email: 'carol@campus.edu',
      role: 'institution_manager',
      institutionId: 'inst-1',
      accountStatus: 'active',
    });

    mockDb.getCollection('users').set('student-other-inst', {
      uid: 'student-other-inst',
      fullName: 'Dave Stranger',
      email: 'dave@other.edu',
      role: 'student',
      institutionId: 'inst-2',
      accountStatus: 'active',
    });

    // Seed mock resources
    mockDb.getCollection('resources').set('res-auto-approved', {
      id: 'res-auto-approved',
      title: 'Study Room A',
      ownerId: 'owner-1',
      institutionId: 'inst-1',
      quantity: 5,
      availableQuantity: 5,
      approvalRequired: false,
      availabilityStatus: 'available',
    });

    mockDb.getCollection('resources').set('res-needs-approval', {
      id: 'res-needs-approval',
      title: 'Precision Microscope',
      ownerId: 'owner-1',
      institutionId: 'inst-1',
      quantity: 2,
      availableQuantity: 2,
      approvalRequired: true,
      availabilityStatus: 'available',
    });
  });

  test('3.1 createBooking — should reject unauthenticated request', async () => {
    await assert.rejects(
      async () => {
        await createBooking.run({
          data: {
            resourceId: 'res-auto-approved',
            quantity: 1,
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000),
            purpose: 'Study session',
          },
        } as any);
      },
      (err: any) => err.code === 'unauthenticated'
    );
  });

  test('3.2 createBooking — should reject booking across different institutions', async () => {
    await assert.rejects(
      async () => {
        await createBooking.run({
          auth: { uid: 'student-other-inst', token: { email: 'dave@other.edu' } },
          data: {
            resourceId: 'res-auto-approved',
            quantity: 1,
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000),
            purpose: 'Study session',
          },
        } as any);
      },
      (err: any) => err.code === 'permission-denied'
    );
  });

  test('3.3 createBooking — auto-approved booking decrements inventory and sets status approved', async () => {
    const result = await createBooking.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: {
        resourceId: 'res-auto-approved',
        quantity: 2,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        purpose: 'Group project',
      },
    } as any);

    assert.equal(result.status, 'approved');
    assert.equal(result.inventoryReserved, true);
    assert.equal(result.quantity, 2);

    const resource = mockDb.getCollection('resources').get('res-auto-approved');
    assert.equal(resource.availableQuantity, 3); // 5 - 2 = 3
  });

  test('3.4 createBooking — pending booking decrements inventory and sets status pending', async () => {
    const result = await createBooking.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: {
        resourceId: 'res-needs-approval',
        quantity: 1,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        purpose: 'Lab experiment',
      },
    } as any);

    assert.equal(result.status, 'pending');
    assert.equal(result.inventoryReserved, true);

    const resource = mockDb.getCollection('resources').get('res-needs-approval');
    assert.equal(resource.availableQuantity, 1); // 2 - 1 = 1
  });

  test('3.5 createBooking — fails when requested quantity exceeds available quantity', async () => {
    await assert.rejects(
      async () => {
        await createBooking.run({
          auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
          data: {
            resourceId: 'res-needs-approval',
            quantity: 5, // Only 2 available
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000),
            purpose: 'Lab experiment',
          },
        } as any);
      },
      (err: any) => err.code === 'failed-precondition'
    );
  });

  test('3.6 approveBooking — owner can approve pending booking without double-decrementing inventory', async () => {
    const booking = await createBooking.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: {
        resourceId: 'res-needs-approval',
        quantity: 1,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        purpose: 'Lab research',
      },
    } as any);

    assert.equal(booking.status, 'pending');

    const approved = await approveBooking.run({
      auth: { uid: 'owner-1', token: { email: 'bob@campus.edu' } },
      data: {
        bookingId: booking.id,
        remarks: 'Approved for lab work',
      },
    } as any);

    assert.equal(approved.status, 'approved');
    assert.equal(approved.remarks, 'Approved for lab work');

    // Available inventory should remain 1 (not decremented twice!)
    const resource = mockDb.getCollection('resources').get('res-needs-approval');
    assert.equal(resource.availableQuantity, 1);
  });

  test('3.7 rejectBooking — owner rejects pending booking and restores inventory', async () => {
    const booking = await createBooking.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: {
        resourceId: 'res-needs-approval',
        quantity: 1,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        purpose: 'Lab research',
      },
    } as any);

    const rejected = await rejectBooking.run({
      auth: { uid: 'owner-1', token: { email: 'bob@campus.edu' } },
      data: {
        bookingId: booking.id,
        reason: 'Equipment under maintenance',
      },
    } as any);

    assert.equal(rejected.status, 'rejected');
    assert.equal(rejected.rejectionReason, 'Equipment under maintenance');
    assert.equal(rejected.inventoryReserved, false);

    // Inventory should be restored to 2
    const resource = mockDb.getCollection('resources').get('res-needs-approval');
    assert.equal(resource.availableQuantity, 2);
  });

  test('3.8 cancelBooking — student cancels booking and restores inventory', async () => {
    const booking = await createBooking.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: {
        resourceId: 'res-auto-approved',
        quantity: 2,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        purpose: 'Study session',
      },
    } as any);

    assert.equal(mockDb.getCollection('resources').get('res-auto-approved').availableQuantity, 3);

    const cancelled = await cancelBooking.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: {
        bookingId: booking.id,
        reason: 'Plans changed',
      },
    } as any);

    assert.equal(cancelled.status, 'cancelled');
    assert.equal(cancelled.cancellationReason, 'Plans changed');
    assert.equal(cancelled.inventoryReserved, false);

    // Inventory restored back to 5
    assert.equal(mockDb.getCollection('resources').get('res-auto-approved').availableQuantity, 5);
  });

  test('3.9 completeBooking — owner completes booking and restores inventory', async () => {
    const booking = await createBooking.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: {
        resourceId: 'res-auto-approved',
        quantity: 1,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        purpose: 'Study session',
      },
    } as any);

    assert.equal(mockDb.getCollection('resources').get('res-auto-approved').availableQuantity, 4);

    const completed = await completeBooking.run({
      auth: { uid: 'owner-1', token: { email: 'bob@campus.edu' } },
      data: {
        bookingId: booking.id,
      },
    } as any);

    assert.equal(completed.status, 'completed');
    assert.equal(completed.inventoryReserved, false);
    assert.equal(mockDb.getCollection('resources').get('res-auto-approved').availableQuantity, 5);
  });

  test('3.12 getBooking — fetches booking by ID for authorized requester', async () => {
    const booking = await createBooking.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: {
        resourceId: 'res-auto-approved',
        quantity: 1,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        purpose: 'Session 1',
      },
    } as any);

    const fetched = await getBooking.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: { bookingId: booking.id },
    } as any);

    assert.equal(fetched.id, booking.id);
    assert.equal(fetched.status, 'approved');
  });

  test('3.10 listMyBookings — returns user bookings with pagination', async () => {
    await createBooking.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: {
        resourceId: 'res-auto-approved',
        quantity: 1,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        purpose: 'Session 1',
      },
    } as any);

    const res = await listMyBookings.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: { limit: 10 },
    } as any);

    assert.ok(Array.isArray(res.bookings));
    assert.ok(res.bookings.length >= 1);
    assert.equal(res.bookings[0].userId, 'student-1');
  });

  test('3.11 listOwnerBookingRequests — only owners/managers can call', async () => {
    await assert.rejects(
      async () => {
        await listOwnerBookingRequests.run({
          auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
          data: { limit: 10 },
        } as any);
      },
      (err: any) => err.code === 'permission-denied'
    );

    const ownerRes = await listOwnerBookingRequests.run({
      auth: { uid: 'owner-1', token: { email: 'bob@campus.edu' } },
      data: { limit: 10 },
    } as any);
    assert.ok(Array.isArray(ownerRes.bookings));
  });
});

describe('ShareSpace Backend — Phase 4: QR Code Management Tests', () => {
  let mockDb: MockFirestore;
  let approvedBookingId: string;

  beforeEach(async () => {
    mockDb = new MockFirestore();
    setDbForTesting(mockDb);

    mockDb.getCollection('users').set('student-1', {
      uid: 'student-1',
      fullName: 'Alice Student',
      email: 'alice@campus.edu',
      role: 'student',
      institutionId: 'inst-1',
      accountStatus: 'active',
    });

    mockDb.getCollection('users').set('owner-1', {
      uid: 'owner-1',
      fullName: 'Bob Owner',
      email: 'bob@campus.edu',
      role: 'owner',
      institutionId: 'inst-1',
      accountStatus: 'active',
    });

    mockDb.getCollection('resources').set('res-1', {
      id: 'res-1',
      title: 'Lab Kit',
      ownerId: 'owner-1',
      institutionId: 'inst-1',
      quantity: 5,
      availableQuantity: 5,
      approvalRequired: false,
      availabilityStatus: 'available',
    });

    // Create an approved booking
    const booking = await createBooking.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: {
        resourceId: 'res-1',
        quantity: 1,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        purpose: 'Lab work',
      },
    } as any);
    approvedBookingId = booking.id;
  });

  test('4.1 generateBookingQRCode — generates valid QR for approved booking and stores SHA-256 hash', async () => {
    const qrResult = await generateBookingQRCode.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: { bookingId: approvedBookingId },
    } as any);

    assert.ok(qrResult.qrCodeId);
    assert.ok(qrResult.token);
    assert.ok(qrResult.qrCodeDataUrl.startsWith('data:image/png;base64,'));

    // Verify stored record
    const qrDoc = mockDb.getCollection('qr_codes').get(qrResult.qrCodeId);
    assert.ok(qrDoc);
    assert.equal(qrDoc.tokenHash, hashToken(qrResult.token));
    assert.equal(qrDoc.status, 'active');
    assert.equal(qrDoc.bookingId, approvedBookingId);
  });

  test('4.2 generateBookingQRCode — rejects generation for pending bookings', async () => {
    mockDb.getCollection('bookings').set('booking-pending', {
      id: 'booking-pending',
      resourceId: 'res-1',
      userId: 'student-1',
      institutionId: 'inst-1',
      status: 'pending',
    });

    await assert.rejects(
      async () => {
        await generateBookingQRCode.run({
          auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
          data: { bookingId: 'booking-pending' },
        } as any);
      },
      (err: any) => err.code === 'failed-precondition'
    );
  });

  test('4.3 verifyQRCode — verifies active token hash successfully', async () => {
    const qr = await generateBookingQRCode.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: { bookingId: approvedBookingId },
    } as any);

    const verified = await verifyQRCode.run({
      auth: { uid: 'owner-1', token: { email: 'bob@campus.edu' } },
      data: { token: qr.token },
    } as any);

    assert.equal(verified.valid, true);
    assert.equal(verified.qrStatus, 'active');
    assert.equal(verified.booking.id, approvedBookingId);
  });

  test('4.4 verifyQRCode — rejects invalid token', async () => {
    await assert.rejects(
      async () => {
        await verifyQRCode.run({
          auth: { uid: 'owner-1', token: { email: 'bob@campus.edu' } },
          data: { token: 'invalid-token-1234567890abcdef' },
        } as any);
      },
      (err: any) => err.code === 'not-found'
    );
  });

  test('4.5 checkInWithQRCode & checkOutWithQRCode — complete lifecycle and inventory restoration', async () => {
    // Check initial inventory
    assert.equal(mockDb.getCollection('resources').get('res-1').availableQuantity, 4);

    // 1. Generate QR
    const qr = await generateBookingQRCode.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: { bookingId: approvedBookingId },
    } as any);

    // 2. Check-in with QR
    const checkInRes = await checkInWithQRCode.run({
      auth: { uid: 'owner-1', token: { email: 'bob@campus.edu' } },
      data: { token: qr.token },
    } as any);

    assert.equal(checkInRes.success, true);
    assert.equal(checkInRes.booking.status, 'checked_in');

    const qrDocAfterCheckIn = mockDb.getCollection('qr_codes').get(qr.qrCodeId);
    assert.equal(qrDocAfterCheckIn.status, 'checked_in');

    // 3. Duplicate check-in fails
    await assert.rejects(
      async () => {
        await checkInWithQRCode.run({
          auth: { uid: 'owner-1', token: { email: 'bob@campus.edu' } },
          data: { token: qr.token },
        } as any);
      },
      (err: any) => err.code === 'already-exists'
    );

    // 4. Check-out with QR completes booking and restores inventory
    const checkOutRes = await checkOutWithQRCode.run({
      auth: { uid: 'owner-1', token: { email: 'bob@campus.edu' } },
      data: { token: qr.token },
    } as any);

    assert.equal(checkOutRes.success, true);
    assert.equal(checkOutRes.booking.status, 'completed');

    const qrDocAfterCheckOut = mockDb.getCollection('qr_codes').get(qr.qrCodeId);
    assert.equal(qrDocAfterCheckOut.status, 'completed');

    // Resource inventory restored back to 5
    assert.equal(mockDb.getCollection('resources').get('res-1').availableQuantity, 5);

    // 5. Duplicate check-out fails
    await assert.rejects(
      async () => {
        await checkOutWithQRCode.run({
          auth: { uid: 'owner-1', token: { email: 'bob@campus.edu' } },
          data: { token: qr.token },
        } as any);
      },
      (err: any) => err.code === 'already-exists'
    );
  });

  test('4.6 checkOutWithQRCode — fails if called before check-in', async () => {
    const qr = await generateBookingQRCode.run({
      auth: { uid: 'student-1', token: { email: 'alice@campus.edu' } },
      data: { bookingId: approvedBookingId },
    } as any);

    await assert.rejects(
      async () => {
        await checkOutWithQRCode.run({
          auth: { uid: 'owner-1', token: { email: 'bob@campus.edu' } },
          data: { token: qr.token },
        } as any);
      },
      (err: any) => err.code === 'failed-precondition'
    );
  });
});
