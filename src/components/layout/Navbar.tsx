import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogoIcon, MenuIcon, XIcon, ArrowRightIcon } from '../common/Icons';
import { Button } from '../common/Button';
import { Container } from '../common/Container';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Capabilities', path: '/#features' },
    { label: 'How It Works', path: '/#how-it-works' },
    { label: 'Categories', path: '/#categories' },
    { label: 'About', path: '/about' },
  ];

  const isActive = (path: string) => {
    if (path.startsWith('/#')) return false;
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 transition-colors">
      <Container size="lg">
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-slate-900 dark:text-white group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md py-1"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
              <LogoIcon className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">
                Share<span className="text-indigo-600 dark:text-indigo-400">Space</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                Campus Resource Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isActive(link.path)
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Action Buttons (Prepared for Phase 2) */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Log In
                <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                  Phase 2
                </span>
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowRightIcon className="w-3.5 h-3.5" />}
                iconPosition="right"
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 py-4 px-2 space-y-2 animate-in fade-in duration-200">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 text-base font-medium rounded-lg ${
                    isActive(link.path)
                      ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="outline" size="md" fullWidth>
                  Log In
                  <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    Phase 2
                  </span>
                </Button>
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="primary" size="md" fullWidth>
                  Get Started (Register)
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
};

