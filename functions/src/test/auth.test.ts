import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as admin from 'firebase-admin';
import { setDbForTesting, setAuthForTesting } from '../shared/firebase';
import {
  completeUserRegistration,
  getMyProfile,
  updateMyProfile,
  assignUserRole,
  setUserAccountStatus,
} from '../auth';

// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'sharespace-dev' });
}

// In-memory mock database for isolated unit testing
class MockDocReference {
  constructor(private collectionMap: Map<string, unknown>, private id: string) {}

  async get() {
    const data = this.collectionMap.get(this.id);
    return {
      exists: data !== undefined,
      data: () => (data ? { ...data } : undefined),
      id: this.id,
    };
  }

  async set(data: any) {
    this.collectionMap.set(this.id, { ...data });
  }

  async update(updates: any) {
    const existing = this.collectionMap.get(this.id);
    if (!existing) {
      throw new Error(`Doc ${this.id} does not exist`);
    }
    const updated = { ...existing };
    for (const [key, value] of Object.entries(updates)) {
      if (value && typeof value === 'object' && (value as any).isFieldDelete) {
        delete updated[key];
      } else {
        updated[key] = value;
      }
    }
    this.collectionMap.set(this.id, updated);
  }
}

class MockCollectionReference {
  private docs = new Map<string, any>();

  doc(id: string) {
    return new MockDocReference(this.docs, id);
  }

  clear() {
    this.docs.clear();
  }

  _getRaw(id: string) {
    return this.docs.get(id);
  }

  _setRaw(id: string, data: any) {
    this.docs.set(id, data);
  }
}

describe('ShareSpace Backend — Phase 1: Authentication & User Management Tests', () => {
  let mockUsersCollection: MockCollectionReference;
  let customClaimsMap: Map<string, any>;

  beforeEach(() => {
    mockUsersCollection = new MockCollectionReference();
    customClaimsMap = new Map();

    const mockDb = {
      collection: (name: string) => {
        if (name === 'users') return mockUsersCollection;
        return new MockCollectionReference();
      },
    };

    const mockAuth = {
      setCustomUserClaims: async (uid: string, claims: any) => {
        customClaimsMap.set(uid, claims);
      },
      getUser: async (uid: string) => {
        return { uid, customClaims: customClaimsMap.get(uid) };
      },
    };

    setDbForTesting(mockDb);
    setAuthForTesting(mockAuth);
  });

  describe('1. completeUserRegistration', () => {
    test('1.1 Should reject unauthenticated requests', async () => {
      await assert.rejects(
        async () => {
          await completeUserRegistration.run({
            auth: undefined,
            data: { fullName: 'John Doe', institutionId: 'inst-001' },
          } as any);
        },
        {
          code: 'unauthenticated',
        }
      );
    });

    test('1.2 Should reject requests with missing or short fullName', async () => {
      await assert.rejects(
        async () => {
          await completeUserRegistration.run({
            auth: { uid: 'user-1', token: { email: 'user1@univ.edu' } },
            data: { fullName: 'J', institutionId: 'inst-001' },
          } as any);
        },
        {
          code: 'invalid-argument',
        }
      );
    });

    test('1.3 Should reject requests with missing institutionId', async () => {
      await assert.rejects(
        async () => {
          await completeUserRegistration.run({
            auth: { uid: 'user-1', token: { email: 'user1@univ.edu' } },
            data: { fullName: 'John Doe', institutionId: '' },
          } as any);
        },
        {
          code: 'invalid-argument',
        }
      );
    });

    test('1.4 Should successfully register user and enforce role student', async () => {
      const response = await completeUserRegistration.run({
        auth: { uid: 'student-1', token: { email: 'student@univ.edu' } },
        data: {
          fullName: 'Alice Smith',
          institutionId: 'univ-main',
          department: 'Computer Science',
          phoneNumber: '+1234567890',
        },
      } as any);

      assert.equal(response.success, true);
      assert.equal(response.profile.role, 'student');
      assert.equal(response.profile.accountStatus, 'active');
      assert.equal(response.profile.fullName, 'Alice Smith');
      assert.equal(response.profile.institutionId, 'univ-main');

      // Verify custom claims
      const claims = customClaimsMap.get('student-1');
      assert.deepEqual(claims, {
        role: 'student',
        institutionId: 'univ-main',
        accountStatus: 'active',
      });
    });

    test('1.5 Should ignore any role passed by client to prevent role escalation', async () => {
      const response = await completeUserRegistration.run({
        auth: { uid: 'hacker-1', token: { email: 'hacker@univ.edu' } },
        data: {
          fullName: 'Bad Actor',
          institutionId: 'univ-main',
          role: 'admin', // Malicious attempt to self-promote
        },
      } as any);

      assert.equal(response.profile.role, 'student'); // Must strictly remain student
      const claims = customClaimsMap.get('hacker-1');
      assert.equal(claims.role, 'student');
    });
  });

  describe('2. getMyProfile', () => {
    test('2.1 Should reject unauthenticated requests', async () => {
      await assert.rejects(
        async () => {
          await getMyProfile.run({
            auth: undefined,
          } as any);
        },
        { code: 'unauthenticated' }
      );
    });

    test('2.2 Should retrieve existing user profile', async () => {
      mockUsersCollection._setRaw('user-abc', {
        uid: 'user-abc',
        fullName: 'Bob Brown',
        email: 'bob@univ.edu',
        role: 'student',
        institutionId: 'univ-main',
        accountStatus: 'active',
        createdAt: '2026-10-30T10:00:00Z',
        updatedAt: '2026-10-30T10:00:00Z',
      });

      const response = await getMyProfile.run({
        auth: { uid: 'user-abc', token: { email: 'bob@univ.edu' } },
      } as any);

      assert.equal(response.profile.uid, 'user-abc');
      assert.equal(response.profile.fullName, 'Bob Brown');
    });

    test('2.3 Should block access if account is disabled', async () => {
      mockUsersCollection._setRaw('disabled-user', {
        uid: 'disabled-user',
        fullName: 'Disabled Person',
        email: 'disabled@univ.edu',
        role: 'student',
        institutionId: 'univ-main',
        accountStatus: 'disabled',
      });

      await assert.rejects(
        async () => {
          await getMyProfile.run({
            auth: { uid: 'disabled-user', token: { email: 'disabled@univ.edu' } },
          } as any);
        },
        { code: 'permission-denied' }
      );
    });
  });

  describe('3. updateMyProfile', () => {
    beforeEach(() => {
      mockUsersCollection._setRaw('user-update', {
        uid: 'user-update',
        fullName: 'Original Name',
        email: 'orig@univ.edu',
        role: 'student',
        institutionId: 'univ-main',
        department: 'Physics',
        accountStatus: 'active',
      });
    });

    test('3.1 Should successfully update permitted fields', async () => {
      const response = await updateMyProfile.run({
        auth: { uid: 'user-update', token: { email: 'orig@univ.edu' } },
        data: {
          fullName: 'Updated Name',
          department: 'Mathematics',
          phoneNumber: '+9876543210',
        },
      } as any);

      assert.equal(response.success, true);
      assert.equal(response.profile.fullName, 'Updated Name');
      assert.equal(response.profile.department, 'Mathematics');
      assert.equal(response.profile.phoneNumber, '+9876543210');
    });

    test('3.2 Should reject attempts to alter protected fields (role, accountStatus, institutionId)', async () => {
      await assert.rejects(
        async () => {
          await updateMyProfile.run({
            auth: { uid: 'user-update', token: { email: 'orig@univ.edu' } },
            data: { role: 'admin' },
          } as any);
        },
        { code: 'permission-denied' }
      );

      await assert.rejects(
        async () => {
          await updateMyProfile.run({
            auth: { uid: 'user-update', token: { email: 'orig@univ.edu' } },
            data: { accountStatus: 'disabled' },
          } as any);
        },
        { code: 'permission-denied' }
      );

      await assert.rejects(
        async () => {
          await updateMyProfile.run({
            auth: { uid: 'user-update', token: { email: 'orig@univ.edu' } },
            data: { institutionId: 'other-inst' },
          } as any);
        },
        { code: 'permission-denied' }
      );
    });

    test('3.3 Should reject updates from disabled accounts', async () => {
      mockUsersCollection._setRaw('user-disabled-2', {
        uid: 'user-disabled-2',
        fullName: 'Locked Out',
        email: 'locked@univ.edu',
        role: 'student',
        institutionId: 'univ-main',
        accountStatus: 'disabled',
      });

      await assert.rejects(
        async () => {
          await updateMyProfile.run({
            auth: { uid: 'user-disabled-2', token: { email: 'locked@univ.edu' } },
            data: { fullName: 'Try New Name' },
          } as any);
        },
        { code: 'permission-denied' }
      );
    });
  });

  describe('4. assignUserRole & Permissions', () => {
    beforeEach(() => {
      mockUsersCollection._setRaw('admin-user', {
        uid: 'admin-user',
        fullName: 'System Admin',
        email: 'admin@univ.edu',
        role: 'admin',
        institutionId: 'univ-main',
        accountStatus: 'active',
      });

      mockUsersCollection._setRaw('student-target', {
        uid: 'student-target',
        fullName: 'Target Student',
        email: 'target@univ.edu',
        role: 'student',
        institutionId: 'univ-main',
        accountStatus: 'active',
      });
    });

    test('4.1 Should reject role assignment from non-admin users', async () => {
      await assert.rejects(
        async () => {
          await assignUserRole.run({
            auth: { uid: 'student-target', token: { role: 'student' } },
            data: { targetUid: 'student-target', newRole: 'owner' },
          } as any);
        },
        { code: 'permission-denied' }
      );
    });

    test('4.2 Should allow admin to promote user to owner or manager', async () => {
      const response = await assignUserRole.run({
        auth: { uid: 'admin-user', token: { role: 'admin' } },
        data: { targetUid: 'student-target', newRole: 'owner' },
      } as any);

      assert.equal(response.success, true);
      assert.equal(response.role, 'owner');

      const claims = customClaimsMap.get('student-target');
      assert.equal(claims.role, 'owner');
    });
  });

  describe('5. Cross-Institution Security & Account Disabling', () => {
    beforeEach(() => {
      mockUsersCollection._setRaw('manager-instA', {
        uid: 'manager-instA',
        fullName: 'Manager A',
        email: 'mgrA@instA.edu',
        role: 'institution_manager',
        institutionId: 'inst-A',
        accountStatus: 'active',
      });

      mockUsersCollection._setRaw('user-instB', {
        uid: 'user-instB',
        fullName: 'User B',
        email: 'userB@instB.edu',
        role: 'student',
        institutionId: 'inst-B',
        accountStatus: 'active',
      });
    });

    test('5.1 Institution Manager cannot disable user from another institution', async () => {
      await assert.rejects(
        async () => {
          await setUserAccountStatus.run({
            auth: {
              uid: 'manager-instA',
              token: { role: 'institution_manager', institutionId: 'inst-A' },
            },
            data: { targetUid: 'user-instB', status: 'disabled' },
          } as any);
        },
        { code: 'permission-denied' }
      );
    });

    test('5.2 Institution Manager can disable user within their own institution', async () => {
      mockUsersCollection._setRaw('user-instA', {
        uid: 'user-instA',
        fullName: 'User A',
        email: 'userA@instA.edu',
        role: 'student',
        institutionId: 'inst-A',
        accountStatus: 'active',
      });

      const response = await setUserAccountStatus.run({
        auth: {
          uid: 'manager-instA',
          token: { role: 'institution_manager', institutionId: 'inst-A' },
        },
        data: { targetUid: 'user-instA', status: 'disabled' },
      } as any);

      assert.equal(response.success, true);
      assert.equal(response.accountStatus, 'disabled');

      const claims = customClaimsMap.get('user-instA');
      assert.equal(claims.accountStatus, 'disabled');
    });
  });
});
