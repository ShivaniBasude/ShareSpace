import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDb, getAuth } from '../shared/firebase';
import {
  CompleteUserRegistrationInput,
  CompleteUserRegistrationResponse,
  UserProfile,
} from '../shared/types';

/**
 * completeUserRegistration
 *
 * Privileged Cloud Function called immediately after a user creates credentials
 * via Firebase Authentication (email/password).
 *
 * Security & Integrity Guarantees:
 * - Requires valid Firebase Auth token.
 * - Always enforces default role: 'student' (ignoring any role passed by client).
 * - Enforces default accountStatus: 'active'.
 * - Sets Auth Custom Claims ({ role: 'student', institutionId, accountStatus: 'active' }).
 * - Authoritative server-side timestamps via FieldValue.serverTimestamp().
 */
export const completeUserRegistration = onCall<CompleteUserRegistrationInput>(
  async (request): Promise<CompleteUserRegistrationResponse> => {
    // 1. Verify caller authentication
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Authentication required to complete registration.'
      );
    }

    const { uid } = request.auth;
    const email = request.auth.token.email;

    if (!email) {
      throw new HttpsError(
        'failed-precondition',
        'User authentication record must include a verified email address.'
      );
    }

    const data = request.data;

    // 2. Validate input parameters
    if (!data || typeof data !== 'object') {
      throw new HttpsError('invalid-argument', 'Request body must be an object.');
    }

    const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : '';
    const institutionId = typeof data.institutionId === 'string' ? data.institutionId.trim() : '';

    if (!fullName || fullName.length < 2) {
      throw new HttpsError(
        'invalid-argument',
        'Full name is required and must be at least 2 characters long.'
      );
    }

    if (!institutionId || institutionId.length < 2) {
      throw new HttpsError(
        'invalid-argument',
        'Institution ID is required.'
      );
    }

    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const existingDoc = await userRef.get();

    // 3. Check if user profile already exists
    if (existingDoc.exists) {
      const existingData = existingDoc.data() as UserProfile;
      if (existingData.accountStatus === 'disabled') {
        throw new HttpsError(
          'permission-denied',
          'This account has been disabled. Please contact the administrator.'
        );
      }
      return {
        success: true,
        profile: existingData,
        message: 'User profile already exists.',
      };
    }

    // 4. Construct authoritative UserProfile
    // SECURITY: Role is hardcoded to 'student' to prevent privilege escalation.
    const initialRole = 'student' as const;
    const initialStatus = 'active' as const;

    const department = typeof data.department === 'string' && data.department.trim()
      ? data.department.trim()
      : undefined;

    const phoneNumber = typeof data.phoneNumber === 'string' && data.phoneNumber.trim()
      ? data.phoneNumber.trim()
      : undefined;

    const profileImageUrl = typeof data.profileImageUrl === 'string' && data.profileImageUrl.trim()
      ? data.profileImageUrl.trim()
      : undefined;

    const userProfileData: Record<string, unknown> = {
      uid,
      fullName,
      email,
      role: initialRole,
      institutionId,
      accountStatus: initialStatus,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (department) userProfileData.department = department;
    if (phoneNumber) userProfileData.phoneNumber = phoneNumber;
    if (profileImageUrl) userProfileData.profileImageUrl = profileImageUrl;

    // 5. Persist profile in Firestore
    await userRef.set(userProfileData);

    // 6. Set Firebase Auth Custom Claims for instant token-based rules validation
    await getAuth().setCustomUserClaims(uid, {
      role: initialRole,
      institutionId,
      accountStatus: initialStatus,
    });

    // 7. Fetch the created document to return serialized timestamps
    const savedDoc = await userRef.get();
    const savedData = savedDoc.data() as UserProfile;

    return {
      success: true,
      profile: savedData,
      message: 'User registration completed successfully.',
    };
  }
);
