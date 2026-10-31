import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { forgotPasswordSchema, type ForgotPasswordFormData } from './authSchemas';
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
  LogoIcon,
  CheckIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
} from '../../components/common';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword, isLoading, error: authContextError, clearError } = useAuth();

  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });

  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ email: e.target.value });
    if (fieldError) setFieldError(undefined);
    if (localError) setLocalError(null);
    if (authContextError) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    const validation = forgotPasswordSchema.safeParse(formData);
    if (!validation.success) {
      setFieldError(validation.error.issues[0]?.message);
      return;
    }

    setFieldError(undefined);

    try {
      await resetPassword(formData.email);
      setIsSubmitted(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to send password reset email. Please try again.';
      setLocalError(message);
    }
  };

  const activeError = localError || authContextError;

  return (
    <div className="py-16 md:py-24 flex items-center justify-center">
      <Container size="sm">
        <Card className="max-w-md mx-auto shadow-sm">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs mb-2">
              <LogoIcon className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your registered college email and we will send you a reset link.
            </CardDescription>
          </CardHeader>

          {isSubmitted ? (
            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 space-y-2">
                <div className="font-semibold flex items-center gap-1.5 text-sm">
                  <CheckIcon className="w-4 h-4 text-emerald-600" />
                  <span>Password Reset Email Sent</span>
                </div>
                <p className="leading-relaxed">
                  If an account exists for <strong>{formData.email}</strong>, password reset instructions will be sent. Please check your inbox.
                </p>
              </div>

              <div className="pt-2">
                <Link to="/login" className="w-full block">
                  <Button variant="primary" fullWidth icon={<ArrowRightIcon className="w-4 h-4" />} iconPosition="right">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
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
                  error={fieldError}
                />
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
                  Send Reset Link
                </Button>

                <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 w-full">
                  Remember your credentials?{' '}
                  <Link
                    to="/login"
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </Container>
    </div>
  );
};

