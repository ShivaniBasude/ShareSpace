import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDb, getAuth } from '../shared/firebase';
import {
  GetMyProfileResponse,
  UpdateMyProfileInput,
  UpdateMyProfileResponse,
  UserProfile,
  UserRole,
  AccountStatus,
} from '../shared/types';

/**
 * getMyProfile
 *
 * Retrieves the authenticated user's profile from Firestore.
 * Verifies that the account is active; rejects disabled accounts.
 */
export const getMyProfile = onCall<void>(
  async (request): Promise<GetMyProfileResponse> => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Authentication required to retrieve user profile.'
      );
    }

    const { uid } = request.auth;
    const db = getDb();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      throw new HttpsError(
        'not-found',
        'User profile does not exist. Please complete registration first.'
      );
    }

    const profile = userDoc.data() as UserProfile;

    // Check account status
    if (profile.accountStatus === 'disabled') {
      throw new HttpsError(
        'permission-denied',
        'This account has been disabled. Access denied.'
      );
    }

    return { profile };
  }
);

/**
 * updateMyProfile
 *
 * Updates allowed profile fields for the authenticated user.
 *
 * Security & Integrity Guarantees:
 * - Only permits whitelisted fields (fullName, department, phoneNumber, profileImageUrl).
 * - Explicitly rejects attempts to alter role, accountStatus, institutionId, email, uid, createdAt.
 * - Computes updatedAt via FieldValue.serverTimestamp().
 * - Rejects disabled accounts.
 */
export const updateMyProfile = onCall<UpdateMyProfileInput>(
  async (request): Promise<UpdateMyProfileResponse> => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Authentication required to update profile.'
      );
    }

    const { uid } = request.auth;
    const data = request.data;

    if (!data || typeof data !== 'object') {
      throw new HttpsError('invalid-argument', 'Request body must be an object.');
    }

    // Check for prohibited field modification attempts
    const prohibitedFields = ['role', 'accountStatus', 'institutionId', 'email', 'uid', 'createdAt'];
    for (const field of prohibitedFields) {
      if (field in (data as Record<string, unknown>)) {
        throw new HttpsError(
          'permission-denied',
          `Modifying '${field}' is strictly prohibited.`
        );
      }
    }

    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new HttpsError(
        'not-found',
        'User profile does not exist. Please complete registration first.'
      );
    }

    const existingProfile = userDoc.data() as UserProfile;

    if (existingProfile.accountStatus === 'disabled') {
      throw new HttpsError(
        'permission-denied',
        'This account has been disabled. Access denied.'
      );
    }

    // Prepare strictly sanitized updates
    const updates: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (typeof data.fullName === 'string') {
      const trimmedName = data.fullName.trim();
      if (trimmedName.length < 2) {
        throw new HttpsError(
          'invalid-argument',
          'Full name must be at least 2 characters long.'
        );
      }
      updates.fullName = trimmedName;
    }

    if (typeof data.department === 'string') {
      updates.department = data.department.trim();
    } else if (data.department === null) {
      updates.department = admin.firestore.FieldValue.delete();
    }

    if (typeof data.phoneNumber === 'string') {
      updates.phoneNumber = data.phoneNumber.trim();
    } else if (data.phoneNumber === null) {
      updates.phoneNumber = admin.firestore.FieldValue.delete();
    }

    if (typeof data.profileImageUrl === 'string') {
      updates.profileImageUrl = data.profileImageUrl.trim();
    } else if (data.profileImageUrl === null) {
      updates.profileImageUrl = admin.firestore.FieldValue.delete();
    }

    await userRef.update(updates);

    const updatedDoc = await userRef.get();
    const updatedProfile = updatedDoc.data() as UserProfile;

    return {
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully.',
    };
  }
);

/**
 * assignUserRole (Privileged Admin Operation)
 *
 * Assigns a new role to a target user.
 * Can ONLY be invoked by users with role 'admin'.
 */
export interface AssignUserRoleInput {
  targetUid: string;
  newRole: UserRole;
}

export const assignUserRole = onCall<AssignUserRoleInput>(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    // Verify caller is an admin (via custom claims or database)
    const callerClaims = request.auth.token;
    if (callerClaims.role !== 'admin') {
      const db = getDb();
      const callerDoc = await db.collection('users').doc(request.auth.uid).get();
      if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
        throw new HttpsError(
          'permission-denied',
          'Only system administrators can assign user roles.'
        );
      }
    }

    const { targetUid, newRole } = request.data || {};
    const validRoles: UserRole[] = ['student', 'owner', 'institution_manager', 'admin'];

    if (!targetUid || !validRoles.includes(newRole)) {
      throw new HttpsError(
        'invalid-argument',
        `Valid targetUid and role (${validRoles.join(', ')}) required.`
      );
    }

    const db = getDb();
    const targetRef = db.collection('users').doc(targetUid);
    const targetDoc = await targetRef.get();

    if (!targetDoc.exists) {
      throw new HttpsError('not-found', 'Target user profile not found.');
    }

    const targetData = targetDoc.data() as UserProfile;

    // Update Firestore
    await targetRef.update({
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update Auth custom claims
    await getAuth().setCustomUserClaims(targetUid, {
      role: newRole,
      institutionId: targetData.institutionId,
      accountStatus: targetData.accountStatus,
    });

    return {
      success: true,
      targetUid,
      role: newRole,
      message: `Role successfully updated to ${newRole}.`,
    };
  }
);

/**
 * setUserAccountStatus (Privileged Admin / Institution Manager Operation)
 *
 * Enables or disables an account.
 */
export interface SetUserAccountStatusInput {
  targetUid: string;
  status: AccountStatus;
}

export const setUserAccountStatus = onCall<SetUserAccountStatusInput>(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const callerClaims = request.auth.token;
    const db = getDb();
    const callerDoc = await db.collection('users').doc(request.auth.uid).get();
    const callerData = callerDoc.data() as UserProfile | undefined;
    const callerRole = callerClaims.role || callerData?.role;

    if (callerRole !== 'admin' && callerRole !== 'institution_manager') {
      throw new HttpsError(
        'permission-denied',
        'Insufficient permissions to modify account status.'
      );
    }

    const { targetUid, status } = request.data || {};
    if (!targetUid || (status !== 'active' && status !== 'disabled')) {
      throw new HttpsError(
        'invalid-argument',
        'Valid targetUid and status (active | disabled) required.'
      );
    }

    const targetRef = db.collection('users').doc(targetUid);
    const targetDoc = await targetRef.get();

    if (!targetDoc.exists) {
      throw new HttpsError('not-found', 'Target user profile not found.');
    }

    const targetData = targetDoc.data() as UserProfile;

    // Institution Managers can only disable users within their own institution
    if (callerRole === 'institution_manager') {
      const callerInst = callerClaims.institutionId || callerData?.institutionId;
      if (callerInst !== targetData.institutionId) {
        throw new HttpsError(
          'permission-denied',
          'Institution managers can only modify users within their own institution.'
        );
      }
    }

    await targetRef.update({
      accountStatus: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await getAuth().setCustomUserClaims(targetUid, {
      role: targetData.role,
      institutionId: targetData.institutionId,
      accountStatus: status,
    });

    return {
      success: true,
      targetUid,
      accountStatus: status,
      message: `Account status updated to ${status}.`,
    };
  }
);
