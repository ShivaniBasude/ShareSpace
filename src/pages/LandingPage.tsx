import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  UsersIcon,
  ClockIcon,
  ArrowRightIcon,
  CheckIcon,
  LayersIcon,
} from '../components/common/Icons';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Container } from '../components/common/Container';
import type { ResourceCategory } from '../types';

export const LandingPage: React.FC = () => {
  const capabilities = [
    {
      icon: <CalendarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      title: 'Conflict-Free Booking',
      description:
        'Automated time-slot collision detection guarantees rooms and instruments cannot be double-booked across departments.',
    },
    {
      icon: <ShieldCheckIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      title: 'Tiered Faculty Approvals',
      description:
        'Configurable approval workflows automatically route high-demand spaces or specialized lab tools to designated faculty approvers.',
    },
    {
      icon: <QrCodeIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />,
      title: 'QR-Based Check-in & Return',
      description:
        'Digital QR passes verified on-site by lab administrators or campus security ensure verified custody and timely returns.',
    },
    {
      icon: <AlertTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      title: 'Incident & Damage Reporting',
      description:
        'Log maintenance requirements or physical damage with severity ratings, keeping equipment safe and operational.',
    },
    {
      icon: <UsersIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      title: 'Multi-Role Campus Governance',
      description:
        'Tailored dashboard interfaces for students, faculty approvers, resource owners, and institutional administrators.',
    },
    {
      icon: <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />,
      title: 'Real-Time Audit Trail',
      description:
        'Complete chronological audit log of all reservations, approvals, check-ins, and maintenance status transitions.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Discover & Request',
      description: 'Search available labs, conference halls, and equipment by capacity, department, and available time slots.',
    },
    {
      step: '02',
      title: 'Review & Approvals',
      description: 'Standard assets are confirmed instantly; specialized facilities route automatically to faculty with full transparency.',
    },
    {
      step: '03',
      title: 'QR Check-in & Return',
      description: 'Present your digital check-in QR pass at the venue to unlock access and confirm on-time resource handover.',
    },
  ];

  interface CategoryItem {
    category: ResourceCategory;
    name: string;
    description: string;
    examples: string;
  }

  const categoryList: CategoryItem[] = [
    {
      category: 'lab',
      name: 'Computer & Science Labs',
      description: 'High-performance computing clusters, physics labs, and chemistry stations.',
      examples: 'AI Research Lab, Clean Room, Bio-analysis Workbench',
    },
    {
      category: 'room',
      name: 'Seminar & Study Rooms',
      description: 'Quiet collaborative spaces equipped for group study and project sessions.',
      examples: 'Study Pods, Group Discussion Rooms, Faculty Meeting Suites',
    },
    {
      category: 'equipment',
      name: 'Specialized Hardware & Kits',
      description: 'Precision measuring devices, robotics toolkits, sensors, and 3D printers.',
      examples: 'Oscilloscopes, Drone Development Kits, Microcontrollers',
    },
    {
      category: 'hall',
      name: 'Auditoriums & Event Halls',
      description: 'Large capacity lecture halls and conference auditoriums with full AV setups.',
      examples: 'Main Auditorium, Amphitheater, Multipurpose Hall',
    },
    {
      category: 'vehicle',
      name: 'Campus Transport & Carts',
      description: 'Department utility vehicles and electric transport for campus logistics.',
      examples: 'Inter-department Utility Cart, Shuttle Van',
    },
  ];

  return (
    <div className="space-y-20 md:space-y-28 py-10 md:py-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <Container size="lg">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>Campus Resource Sharing Platform</span>
              <span className="text-indigo-400 dark:text-indigo-500">•</span>
              <span className="font-mono text-[11px]">Phase 1 Active</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Share Campus Spaces & Equipment,{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                Without the Chaos.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Replace paper sign-up sheets, lost keys, and double-booked halls. ShareSpace provides college students and faculty a centralized portal for booking rooms, specialized labs, and equipment with built-in QR validation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a href="#features">
                <Button variant="primary" size="lg" icon={<ArrowRightIcon className="w-4 h-4" />} iconPosition="right">
                  Explore Capabilities
                </Button>
              </a>
              <Link to="/about">
                <Button variant="outline" size="lg">
                  About ShareSpace
                </Button>
              </Link>
            </div>

            {/* Architectural Status Note */}
            <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CheckIcon className="w-4 h-4 text-emerald-500" />
              <span>Independent React frontend aligned with Firebase backend contracts</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Planned Capabilities Grid */}
      <section id="features" className="scroll-mt-20">
        <Container size="lg" className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Built for Campus Logistics
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              Designed around the core backend contracts and database schemas specified in the project architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap) => (
              <Card key={cap.title} hoverable className="flex flex-col justify-between">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80 mb-4">
                    {cap.icon}
                  </div>
                  <CardTitle>{cap.title}</CardTitle>
                  <CardDescription>{cap.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* How It Works (3-Step Timeline) */}
      <section id="how-it-works" className="scroll-mt-20 bg-slate-100/60 dark:bg-slate-900/40 py-16 border-y border-slate-200/60 dark:border-slate-800/60">
        <Container size="lg" className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              How ShareSpace Works
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              A transparent, self-service borrowing and reservation workflow for students and staff.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((st) => (
              <div
                key={st.step}
                className="relative bg-white dark:bg-slate-900/80 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-3 shadow-xs"
              >
                <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {st.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{st.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {st.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Categories Preview */}
      <section id="categories" className="scroll-mt-20">
        <Container size="lg" className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Supported Resource Categories
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              Synchronized with the shared <code className="text-indigo-600 dark:text-indigo-400 font-mono">ResourceCategory</code> domain model.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryList.map((cat) => (
              <Card key={cat.category} hoverable>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge status={cat.category} size="sm" />
                    <span className="text-[11px] font-mono text-slate-400 uppercase">
                      Category
                    </span>
                  </div>
                  <CardTitle>{cat.name}</CardTitle>
                  <CardDescription>{cat.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Examples: </span>
                    {cat.examples}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Phase 2 Authentication Preparation Banner */}
      <section>
        <Container size="lg">
          <div className="rounded-2xl bg-linear-to-r from-indigo-900 to-slate-900 text-white p-8 sm:p-12 shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono bg-white/10 text-indigo-200 border border-white/10">
                <LayersIcon className="w-3.5 h-3.5" />
                <span>Roadmap: Phase 2 Next</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Authentication & Role Dashboards
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Phase 1 delivers the UI system and public layouts. In Phase 2, we will integrate login, registration, and role-based dashboard shells for Students, Owners, and Administrators.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link to="/login">
                  <Button variant="primary" size="md">
                    Preview Auth Navigation &rarr;
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="secondary" size="md">
                    Read Architecture Overview
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

