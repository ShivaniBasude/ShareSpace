import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../context/authContextDef';

/**
 * Custom hook to access the ShareSpace authentication context.
 * Must be used within an <AuthProvider> component.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      'useAuth must be used within an <AuthProvider>. Ensure component is wrapped properly in src/App.tsx.'
    );
  }
  return context;
}
