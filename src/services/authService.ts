import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from './firebase';
import type {
  UserProfile,
  CompleteUserRegistrationInput,
  CompleteUserRegistrationResponse,
  GetMyProfileResponse,
  UpdateMyProfileInput,
  UpdateMyProfileResponse,
} from '../types';

/**
 * Custom error thrown when Firebase Auth user creation succeeded,
 * but the backend completeUserRegistration Cloud Function failed.
 */
export class PartialRegistrationError extends Error {
  public user: User;
  public originalError: unknown;

  constructor(user: User, originalError: unknown, message: string) {
    super(message);
    this.name = 'PartialRegistrationError';
    this.user = user;
    this.originalError = originalError;
  }
}

/**
 * Formats Firebase Auth and Cloud Function errors into user-friendly messages.
 */
export function formatAuthError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred. Please try again.';
  }

  const err = error as { code?: string; message?: string };
  const code = err.code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in.';
    case 'auth/weak-password':
      return 'Password is too weak. Please provide at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled by an administrator.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Access is temporarily restricted. Please try again later.';
    case 'auth/network-request-failed':
      return 'Unable to reach the authentication service. Please check your network connection or emulator status.';
    case 'functions/unauthenticated':
      return 'Your session has expired. Please sign in again.';
    case 'functions/permission-denied':
      return 'Access denied. Your account may be disabled or lacks required permissions.';
    case 'functions/invalid-argument':
      return 'Invalid registration data submitted. Please check all required fields.';
    case 'functions/not-found':
      return 'User profile was not found. Registration may be incomplete.';
    default:
      return err.message || 'Authentication operation failed. Please try again.';
  }
}

/**
 * Signs in user with email and password, then fetches canonical Firestore profile.
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ user: User; profile: UserProfile }> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const user = credential.user;

  // Retrieve canonical profile from Cloud Function
  const profile = await fetchCurrentUserProfile();

  if (profile.accountStatus === 'disabled') {
    await signOut(auth);
    throw new Error('This account has been disabled. Access denied.');
  }

  return { user, profile };
}

/**
 * Creates Firebase Auth credentials and calls completeUserRegistration Cloud Function.
 * Implements safe recovery if the second step fails.
 */
export async function registerWithEmail(
  email: string,
  password: string,
  input: CompleteUserRegistrationInput
): Promise<{ user: User; profile: UserProfile }> {
  // 1. Create Firebase Auth user
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = credential.user;

  try {
    // 2. Call backend completeUserRegistration Cloud Function
    const completeReg = httpsCallable<
      CompleteUserRegistrationInput,
      CompleteUserRegistrationResponse
    >(functions, 'completeUserRegistration');

    const result = await completeReg(input);

    // 3. Refresh user token to ensure Auth Custom Claims (role, institutionId) are attached
    await user.getIdToken(true);

    return {
      user,
      profile: result.data.profile,
    };
  } catch (backendError) {
    // Handle partial registration failure without silently creating mock profile
    const friendlyMessage = formatAuthError(backendError);
    throw new PartialRegistrationError(
      user,
      backendError,
      `Account credentials created, but profile setup failed: ${friendlyMessage}`
    );
  }
}

/**
 * Completes registration for an already authenticated user whose initial Cloud Function call failed.
 */
export async function completeProfileRegistration(
  input: CompleteUserRegistrationInput
): Promise<UserProfile> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user session found. Please sign in before completing profile.');
  }

  const completeReg = httpsCallable<
    CompleteUserRegistrationInput,
    CompleteUserRegistrationResponse
  >(functions, 'completeUserRegistration');

  const result = await completeReg(input);
  await currentUser.getIdToken(true);
  return result.data.profile;
}

/**
 * Calls getMyProfile Cloud Function to fetch canonical profile for current session.
 */
export async function fetchCurrentUserProfile(): Promise<UserProfile> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User is not authenticated.');
  }

  const getProfile = httpsCallable<void, GetMyProfileResponse>(
    functions,
    'getMyProfile'
  );

  const result = await getProfile();
  return result.data.profile;
}

/**
 * Calls updateMyProfile Cloud Function to update allowed profile fields.
 */
export async function updateUserProfile(
  input: UpdateMyProfileInput
): Promise<UserProfile> {
  const updateProfile = httpsCallable<UpdateMyProfileInput, UpdateMyProfileResponse>(
    functions,
    'updateMyProfile'
  );

  const result = await updateProfile(input);
  return result.data.profile;
}

/**
 * Sends a password reset email to the specified address.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Signs out current user session from Firebase Auth.
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

