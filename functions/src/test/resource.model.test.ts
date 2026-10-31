import { strict as assert } from 'assert';
import { test, describe } from 'node:test';
import { Timestamp } from 'firebase-admin/firestore';
import {
  createResourceSchema,
  updateResourceSchema,
  docToResource,
} from '../../src/resources/resource.model';

// Helper mock DocumentSnapshot
class MockDoc {
  constructor(public id: string, private _data: any, public exists = true) {}
  data() {
    return this._data;
  }
}

describe('createResourceSchema', () => {
  test('valid payload passes', () => {
    const payload = {
      title: 'Camera',
      description: 'DSLR',
      category: 'Electronics',
      resourceType: 'camera',
      quantity: 3,
      approvalRequired: false,
    };
    const result = createResourceSchema.safeParse(payload);
    assert.ok(result.success);
  });

  test('excessive quantity fails', () => {
    const payload = {
      title: 'Camera',
      description: 'DSLR',
      category: 'Electronics',
      resourceType: 'camera',
      quantity: 2000,
      approvalRequired: false,
    };
    const result = createResourceSchema.safeParse(payload);
    assert.equal(result.success, false);
  });

  test('oversized description fails', () => {
    const payload = {
      title: 'Camera',
      description: 'a'.repeat(2500),
      category: 'Electronics',
      resourceType: 'camera',
      quantity: 1,
      approvalRequired: false,
    };
    const result = createResourceSchema.safeParse(payload);
    assert.equal(result.success, false);
  });

  test('invalid specifications fail', () => {
    const payload = {
      title: 'Camera',
      description: 'DSLR',
      category: 'Electronics',
      resourceType: 'camera',
      quantity: 1,
      approvalRequired: false,
      specifications: 'not-an-object', // invalid
    } as any;
    const result = createResourceSchema.safeParse(payload);
    assert.equal(result.success, false);
  });
});

describe('updateResourceSchema', () => {
  test('empty payload fails', () => {
    const result = updateResourceSchema.safeParse({});
    assert.equal(result.success, false);
  });

  test('attempt to update availabilityStatus fails (field not present)', () => {
    const payload = { availabilityStatus: 'reserved' } as any;
    const result = updateResourceSchema.safeParse(payload);
    assert.equal(result.success, false);
  });

  test('valid partial update passes', () => {
    const payload = { title: 'New Title' };
    const result = updateResourceSchema.safeParse(payload);
    assert.ok(result.success);
  });
});

describe('docToResource', () => {
  test('throws on missing document', () => {
    const doc = new MockDoc('res1', {}, false);
    assert.throws(() => docToResource(doc as any), /does not exist/);
  });

  test('throws on malformed stored data (missing required field)', () => {
    const data = {
      // title missing
      description: 'desc',
      category: 'Electronics',
      resourceType: 'camera',
      institutionId: 'inst1',
      ownerId: 'uid1',
      quantity: 1,
      approvalRequired: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const doc = new MockDoc('res1', data);
    assert.throws(() => docToResource(doc as any), /Invalid resource data/);
  });

  test('valid Firestore document converts correctly with timestamps', () => {
    const now = Timestamp.now();
    const data = {
      title: 'Camera',
      description: 'DSLR',
      category: 'Electronics',
      resourceType: 'camera',
      institutionId: 'inst1',
      ownerId: 'uid1',
      quantity: 2,
      availabilityStatus: 'available',
      approvalRequired: true,
      createdAt: now,
      updatedAt: now,
    };
    const doc = new MockDoc('res1', data);
    const res = docToResource(doc as any);
    assert.equal(res.id, 'res1');
    assert.equal(res.createdAt, now);
    assert.equal(res.updatedAt, now);
    assert.equal(res.availabilityStatus, 'available');
  });
});
