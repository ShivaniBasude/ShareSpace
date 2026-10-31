import React from 'react';
import { Link } from 'react-router-dom';
import { LogoIcon } from '../common/Icons';
import { Container } from '../common/Container';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900/60 transition-colors">
      <Container size="lg" className="py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                <LogoIcon className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                Share<span className="text-indigo-600 dark:text-indigo-400">Space</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Open-source campus resource platform facilitating labs, equipment, and facility sharing across departments.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Phase 1 Active (UI Foundation)
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  System Capabilities
                </Link>
              </li>
              <li>
                <Link to="/#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/#categories" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Resource Categories
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  About ShareSpace
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & Roles */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Campus Roles
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span>Students (Discovery & Requests)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                <span>Faculty Approvers</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                <span>Lab & Resource Owners</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                <span>Security & On-Site QR Verification</span>
              </li>
            </ul>
          </div>

          {/* Architecture & Boundaries */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Architecture Status
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Frontend developed on Git branch <code className="text-indigo-600 dark:text-indigo-400 font-mono">frontend/react-ui</code>. Firebase backend functions and security rules are decoupled per project contracts.
            </p>
            <div className="pt-1">
              <Link to="/login" className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium inline-flex items-center gap-1">
                Phase 2 Auth Roadmap &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} ShareSpace. Collaborative College Resource Platform.</p>
          <div className="flex items-center gap-6">
            <span>Built with React, Vite & Tailwind CSS</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>TypeScript Native</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};

