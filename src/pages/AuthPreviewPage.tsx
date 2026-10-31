import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/common/Container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LogoIcon, ShieldCheckIcon, ArrowRightIcon } from '../components/common/Icons';

export interface AuthPreviewPageProps {
  mode?: 'login' | 'register';
}

export const AuthPreviewPage: React.FC<AuthPreviewPageProps> = ({ mode = 'login' }) => {
  const isLogin = mode === 'login';

  return (
    <div className="py-16 md:py-24 flex items-center justify-center">
      <Container size="sm">
        <Card className="max-w-md mx-auto shadow-md border-indigo-100 dark:border-indigo-950">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs mb-2">
              <LogoIcon className="h-6 w-6" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 mx-auto">
              <span>Roadmap: Phase 2 In Progress</span>
            </div>
            <CardTitle className="text-2xl">
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? 'Sign in to access campus resources, bookings, and approvals.'
                : 'Register with your college email to start reserving campus assets.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Phase 2 Authentication Status</span>
              </div>
              <p className="leading-relaxed">
                Navigation to this route is active. The underlying Firebase Auth providers (Email/Password, College SSO) and React Hook Form validation will be implemented in <strong>Phase 2</strong>.
              </p>
              <div className="text-[11px] font-mono text-slate-500 pt-1">
                Branch: <code className="text-indigo-600 dark:text-indigo-400">frontend/react-ui</code>
              </div>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <Link
                to="/login"
                className={`flex-1 py-2 text-center text-xs font-medium border-b-2 transition-colors ${
                  isLogin
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Log In View
              </Link>
              <Link
                to="/register"
                className={`flex-1 py-2 text-center text-xs font-medium border-b-2 transition-colors ${
                  !isLogin
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Register View
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-2">
            <Link to="/" className="w-full">
              <Button variant="primary" fullWidth icon={<ArrowRightIcon className="w-4 h-4" />} iconPosition="right">
                Return to Landing Page
              </Button>
            </Link>
            <Link to="/about" className="w-full text-center">
              <Button variant="ghost" size="sm" fullWidth>
                Read About ShareSpace
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </Container>
    </div>
  );
};

