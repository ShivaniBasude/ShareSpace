import React, { useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  loginWithEmail,
  registerWithEmail,
  completeProfileRegistration,
  fetchCurrentUserProfile,
  logoutUser,
  sendPasswordReset,
  formatAuthError,
  PartialRegistrationError,
} from '../services/authService';
import type {
  UserProfile,
  UserRole,
  AccountStatus,
  CompleteUserRegistrationInput,
} from '../types';
import { AuthContext, type AuthContextValue } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
  const [isRegistrationIncomplete, setIsRegistrationIncomplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Ref flag to prevent repeated logout / fetch loops on disabled accounts
  const isHandlingDisabledAccountRef = useRef<boolean>(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refreshes the user profile from Firestore via getMyProfile Cloud Function.
   * Handles 'not-found' and disabled account states explicitly.
   */
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!auth.currentUser) {
      setProfile(null);
      setIsRegistrationIncomplete(false);
      return null;
    }

    setIsProfileLoading(true);
    try {
      const canonicalProfile = await fetchCurrentUserProfile();

      if (canonicalProfile.accountStatus === 'disabled') {
        if (!isHandlingDisabledAccountRef.current) {
          isHandlingDisabledAccountRef.current = true;
          setError('This account has been disabled. Access denied.');
          setProfile(null);
          setIsRegistrationIncomplete(false);
          await logoutUser();
        }
        return null;
      }

      setProfile(canonicalProfile);
      setIsRegistrationIncomplete(false);
      return canonicalProfile;
    } catch (err: unknown) {
      const errWithCode = err as { code?: string; message?: string };

      if (errWithCode.code === 'functions/not-found') {
        // User created Auth record, but completeUserRegistration was not completed
        setIsRegistrationIncomplete(true);
        setProfile(null);
        setError('Your user profile is incomplete. Please complete registration to continue.');
      } else if (errWithCode.code === 'functions/permission-denied') {
        // Account disabled in backend
        if (!isHandlingDisabledAccountRef.current) {
          isHandlingDisabledAccountRef.current = true;
          setError('This account has been disabled by an administrator.');
          setProfile(null);
          setIsRegistrationIncomplete(false);
          await logoutUser();
        }
      } else {
        setError(formatAuthError(err));
      }
      return null;
    } finally {
      setIsProfileLoading(false);
      isHandlingDisabledAccountRef.current = false;
    }
  }, []);

  /**
   * Subscribe to Firebase Auth state changes.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setIsRegistrationIncomplete(false);
        setIsLoading(false);
        return;
      }

      // If we are currently handling a disabled account sign-out, don't trigger fetch loop
      if (isHandlingDisabledAccountRef.current) {
        setIsLoading(false);
        return;
      }

      try {
        await refreshProfile();
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [refreshProfile]);

  /**
   * Log in with Email & Password.
   */
  const login = useCallback(
    async (email: string, password: string): Promise<UserProfile> => {
      clearError();
      setIsLoading(true);
      try {
        const { user: authedUser, profile: loadedProfile } = await loginWithEmail(
          email,
          password
        );
        setUser(authedUser);
        setProfile(loadedProfile);
        setIsRegistrationIncomplete(false);
        return loadedProfile;
      } catch (err: unknown) {
        const formatted = formatAuthError(err);
        setError(formatted);
        throw new Error(formatted, { cause: err });
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  /**
   * Register new user with Email, Password, and CompleteUserRegistrationInput.
   * Handles partial failures safely.
   */
  const register = useCallback(
    async (
      email: string,
      password: string,
      input: CompleteUserRegistrationInput
    ): Promise<UserProfile> => {
      clearError();
      setIsLoading(true);
      try {
        const { user: registeredUser, profile: createdProfile } = await registerWithEmail(
          email,
          password,
          input
        );
        setUser(registeredUser);
        setProfile(createdProfile);
        setIsRegistrationIncomplete(false);
        return createdProfile;
      } catch (err: unknown) {
        if (err instanceof PartialRegistrationError) {
          // Firebase Auth user created, but Cloud Function failed
          setUser(err.user);
          setProfile(null);
          setIsRegistrationIncomplete(true);
          setError(err.message);
          throw err;
        }

        const formatted = formatAuthError(err);
        setError(formatted);
        throw new Error(formatted, { cause: err });
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  /**
   * Completes registration for an active session whose initial Cloud Function failed.
   */
  const completeRegistration = useCallback(
    async (input: CompleteUserRegistrationInput): Promise<UserProfile> => {
      clearError();
      setIsLoading(true);
      try {
        const completedProfile = await completeProfileRegistration(input);
        setProfile(completedProfile);
        setIsRegistrationIncomplete(false);
        return completedProfile;
      } catch (err: unknown) {
        const formatted = formatAuthError(err);
        setError(formatted);
        throw new Error(formatted, { cause: err });
      } finally {
        setIsLoading(false);
      }
    },
    [clearError]
  );

  /**
   * Log out current user session cleanly.
   */
  const logout = useCallback(async (): Promise<void> => {
    clearError();
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setProfile(null);
      setIsRegistrationIncomplete(false);
    } catch (err: unknown) {
      setError(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  /**
   * Request password reset email.
   */
  const resetPassword = useCallback(
    async (email: string): Promise<void> => {
      clearError();
      try {
        await sendPasswordReset(email);
      } catch (err: unknown) {
        const formatted = formatAuthError(err);
        setError(formatted);
        throw new Error(formatted, { cause: err });
      }
    },
    [clearError]
  );

  const role: UserRole | null = profile?.role ?? null;
  const accountStatus: AccountStatus | null = profile?.accountStatus ?? null;

  const value: AuthContextValue = {
    user,
    profile,
    role,
    accountStatus,
    isLoading,
    isProfileLoading,
    isRegistrationIncomplete,
    error,
    login,
    register,
    completeRegistration,
    logout,
    resetPassword,
    refreshProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
