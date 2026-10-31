import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { loginSchema, type LoginFormData } from './authSchemas';
import {
  Container,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Badge,
  LogoIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  CheckIcon,
} from '../../components/common';

export const LoginPage: React.FC = () => {
  const {
    login,
    logout,
    isLoading,
    error: authContextError,
    clearError,
    profile,
    user,
    isRegistrationIncomplete,
  } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name as keyof LoginFormData]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (localError) setLocalError(null);
    if (authContextError) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    // Validate with Zod
    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Partial<Record<keyof LoginFormData, string>> = {};
      for (const issue of validation.error.issues) {
        const fieldName = issue.path[0] as keyof LoginFormData;
        if (!errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      await login(formData.email, formData.password);
    } catch (err: unknown) {
      // Error message is already formatted by authService and stored in AuthContext
      const message = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setLocalError(message);
    }
  };

  // If already authenticated with active profile, show authenticated status card
  // (Protected dashboard routing will be wired in Sub-Phase 2.3)
  if (user && profile) {
    return (
      <div className="py-16 md:py-24 flex items-center justify-center">
        <Container size="sm">
          <Card className="max-w-md mx-auto shadow-sm">
            <CardHeader className="text-center space-y-2 pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 mb-2">
                <CheckIcon className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">Currently Signed In</CardTitle>
              <CardDescription>
                You are authenticated with an active campus account.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {profile.fullName}
                  </span>
                  <Badge status={profile.role} size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{profile.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Institution:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{profile.institutionId}</span>
                </div>
                {profile.department && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Department:</span>
                    <span className="text-slate-700 dark:text-slate-300">{profile.department}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">Account Status:</span>
                  <Badge status={profile.accountStatus} size="sm" />
                </div>
              </div>

              <div className="rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 p-3 border border-indigo-200/60 dark:border-indigo-900/40 text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2">
                <ShieldCheckIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Authentication verified. Dedicated role-based dashboards and protected routes will be activated in <strong>Sub-Phase 2.3</strong>.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-2">
              <Link to="/" className="w-full">
                <Button variant="primary" fullWidth icon={<ArrowRightIcon className="w-4 h-4" />} iconPosition="right">
                  Return to Home
                </Button>
              </Link>
              <Button variant="outline" size="sm" fullWidth onClick={() => logout()}>
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </Container>
      </div>
    );
  }

  // If user signed in but profile is incomplete (getMyProfile returned not-found)
  if (user && isRegistrationIncomplete) {
    return (
      <div className="py-16 md:py-24 flex items-center justify-center">
        <Container size="sm">
          <Card className="max-w-md mx-auto shadow-sm border-amber-200 dark:border-amber-900/60">
            <CardHeader className="text-center space-y-2 pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 mb-2">
                <AlertTriangleIcon className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">Profile Incomplete</CardTitle>
              <CardDescription>
                Your credentials are authenticated as <strong>{user.email}</strong>, but your campus profile document has not been finalized.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-4 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
                Please finalize your profile details to obtain your campus role and access college resources.
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-2">
              <Link to="/register" className="w-full">
                <Button variant="primary" fullWidth icon={<ArrowRightIcon className="w-4 h-4" />} iconPosition="right">
                  Complete University Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" fullWidth onClick={() => logout()}>
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </Container>
      </div>
    );
  }

  const activeError = localError || authContextError;

  return (
    <div className="py-16 md:py-24 flex items-center justify-center">
      <Container size="sm">
        <Card className="max-w-md mx-auto shadow-sm">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs mb-2">
              <LogoIcon className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Sign In to ShareSpace</CardTitle>
            <CardDescription>
              Enter your email and password to access campus spaces and resources.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {activeError && (
                <div
                  role="alert"
                  className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3.5 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-150"
                >
                  <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div className="leading-relaxed">{activeError}</div>
                </div>
              )}

              <Input
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="student@campus.edu"
                value={formData.email}
                onChange={handleChange}
                error={fieldErrors.email}
              />

              <div className="space-y-1">
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  error={fieldErrors.password}
                />
                <div className="text-right pt-0.5">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
                icon={<ArrowRightIcon className="w-4 h-4" />}
                iconPosition="right"
              >
                Sign In
              </Button>

              <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 w-full">
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  Register as Student
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </Container>
    </div>
  );
};

