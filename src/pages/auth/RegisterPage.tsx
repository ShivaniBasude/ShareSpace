import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import {
  registerSchema,
  profileRecoverySchema,
  type RegisterFormData,
  type ProfileRecoveryFormData,
} from './authSchemas';
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
import { PartialRegistrationError } from '../../services/authService';

export const RegisterPage: React.FC = () => {
  const {
    register,
    completeRegistration,
    logout,
    isLoading,
    error: authContextError,
    clearError,
    user,
    profile,
    isRegistrationIncomplete,
  } = useAuth();

  // Full registration state
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    institutionId: '',
    department: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  // Profile recovery state (used when Auth credentials already exist)
  const [recoveryData, setRecoveryData] = useState<ProfileRecoveryFormData>({
    fullName: '',
    institutionId: '',
    department: '',
    phoneNumber: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [localError, setLocalError] = useState<string | null>(null);

  // If user is already authenticated in Firebase Auth, but profile does not exist
  const isRecoveryMode = Boolean(user && isRegistrationIncomplete);

  const handleFullChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (localError) setLocalError(null);
    if (authContextError) clearError();
  };

  const handleRecoveryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRecoveryData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (localError) setLocalError(null);
    if (authContextError) clearError();
  };

  // Full Registration Submit
  const handleFullSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    const validation = registerSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const fieldName = String(issue.path[0]);
        if (!errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      await register(formData.email, formData.password, {
        fullName: formData.fullName,
        institutionId: formData.institutionId,
        department: formData.department || undefined,
        phoneNumber: formData.phoneNumber || undefined,
      });
    } catch (err: unknown) {
      if (err instanceof PartialRegistrationError) {
        setLocalError(err.message);
        // Pre-fill recovery form with entered values
        setRecoveryData({
          fullName: formData.fullName,
          institutionId: formData.institutionId,
          department: formData.department,
          phoneNumber: formData.phoneNumber,
        });
      } else {
        const message = err instanceof Error ? err.message : 'Registration failed.';
        setLocalError(message);
      }
    }
  };

  // Profile Recovery Submit (No duplicate Firebase Auth user created)
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    const validation = profileRecoverySchema.safeParse(recoveryData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const fieldName = String(issue.path[0]);
        if (!errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      await completeRegistration({
        fullName: recoveryData.fullName,
        institutionId: recoveryData.institutionId,
        department: recoveryData.department || undefined,
        phoneNumber: recoveryData.phoneNumber || undefined,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to finalize profile.';
      setLocalError(message);
    }
  };

  // If already authenticated with active profile, show clean success card
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
              <CardTitle className="text-2xl">Registration Successful</CardTitle>
              <CardDescription>
                Your student profile is active and registered in Firestore.
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
                  <span className="text-slate-500">Institution ID:</span>
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
                  Student privileges active. Student dashboard views and booking interfaces will be activated in <strong>Sub-Phase 2.3</strong>.
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

  const activeError = localError || authContextError;

  // Recovery Mode View (When Auth credentials already exist for current user)
  if (isRecoveryMode && user) {
    return (
      <div className="py-16 md:py-24 flex items-center justify-center">
        <Container size="sm">
          <Card className="max-w-md mx-auto shadow-sm border-amber-200 dark:border-amber-900/60">
            <CardHeader className="text-center space-y-2 pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 mb-2">
                <AlertTriangleIcon className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">Complete Student Profile</CardTitle>
              <CardDescription>
                Credentials confirmed for <strong>{user.email}</strong>. Finalize your profile to activate your account.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleRecoverySubmit}>
              <CardContent className="space-y-4 pt-4">
                {activeError && (
                  <div
                    role="alert"
                    className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3.5 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5"
                  >
                    <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <div className="leading-relaxed">{activeError}</div>
                  </div>
                )}

                <div className="rounded-lg bg-amber-50/70 dark:bg-amber-950/30 p-3 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
                  Your login was created, but your profile document is required to assign your student role and campus permissions.
                </div>

                <Input
                  label="Full Name"
                  name="fullName"
                  required
                  placeholder="Jane Doe"
                  value={recoveryData.fullName}
                  onChange={handleRecoveryChange}
                  error={fieldErrors.fullName}
                />

                <Input
                  label="Institution / Campus ID"
                  name="institutionId"
                  required
                  placeholder="e.g. univ-main or your campus code"
                  helperText="Enter your official college or campus identifier (matches backend partition)."
                  value={recoveryData.institutionId}
                  onChange={handleRecoveryChange}
                  error={fieldErrors.institutionId}
                />

                <Input
                  label="Department / Faculty"
                  name="department"
                  placeholder="Computer Science & Engineering"
                  value={recoveryData.department}
                  onChange={handleRecoveryChange}
                  error={fieldErrors.department}
                />

                <Input
                  label="Contact Phone Number (Optional)"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+1-555-0199"
                  value={recoveryData.phoneNumber}
                  onChange={handleRecoveryChange}
                  error={fieldErrors.phoneNumber}
                />
              </CardContent>

              <CardFooter className="flex flex-col gap-2 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                  icon={<ArrowRightIcon className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Finalize Student Profile
                </Button>
                <Button variant="ghost" size="sm" fullWidth onClick={() => logout()}>
                  Cancel & Sign Out
                </Button>
              </CardFooter>
            </form>
          </Card>
        </Container>
      </div>
    );
  }

  // Standard Student Registration View
  return (
    <div className="py-12 md:py-20 flex items-center justify-center">
      <Container size="sm">
        <Card className="max-w-lg mx-auto shadow-sm">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs mb-2">
              <LogoIcon className="h-6 w-6" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mx-auto">
              <span>Account Type: Student</span>
            </div>
            <CardTitle className="text-2xl">Create Student Account</CardTitle>
            <CardDescription>
              Register with your email to discover and book campus labs, rooms, and equipment.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleFullSubmit}>
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
                label="Full Name"
                name="fullName"
                required
                placeholder="Jane Doe"
                value={formData.fullName}
                onChange={handleFullChange}
                error={fieldErrors.fullName}
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="student@campus.edu"
                value={formData.email}
                onChange={handleFullChange}
                error={fieldErrors.email}
              />

              <Input
                label="Institution / Campus ID"
                name="institutionId"
                required
                placeholder="e.g. univ-main"
                helperText="Enter your official college or campus identifier (matches backend partition)."
                value={formData.institutionId}
                onChange={handleFullChange}
                error={fieldErrors.institutionId}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Department (Optional)"
                  name="department"
                  placeholder="Computer Science"
                  value={formData.department}
                  onChange={handleFullChange}
                  error={fieldErrors.department}
                />

                <Input
                  label="Phone Number (Optional)"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+1-555-0199"
                  value={formData.phoneNumber}
                  onChange={handleFullChange}
                  error={fieldErrors.phoneNumber}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleFullChange}
                  error={fieldErrors.password}
                />

                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleFullChange}
                  error={fieldErrors.confirmPassword}
                />
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
                Register as Student
              </Button>

              <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 w-full">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </Container>
    </div>
  );
};

