import { createContext } from 'react';
import type { User } from 'firebase/auth';
import type {
  UserProfile,
  UserRole,
  AccountStatus,
  CompleteUserRegistrationInput,
} from '../types';

export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  accountStatus: AccountStatus | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  isRegistrationIncomplete: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (
    email: string,
    password: string,
    input: CompleteUserRegistrationInput
  ) => Promise<UserProfile>;
  completeRegistration: (input: CompleteUserRegistrationInput) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

