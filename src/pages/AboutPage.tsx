import { Link } from 'react-router-dom';
import { Container } from '../components/common/Container';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ShieldCheckIcon, CheckIcon, ArrowRightIcon, LayersIcon } from '../components/common/Icons';

export const AboutPage: React.FC = () => {
  const pillars = [
    {
      title: 'Resource Transparency',
      desc: 'Eliminating departmental silos so students and researchers can discover campus labs and assets that would otherwise sit idle.',
    },
    {
      title: 'Custody & Accountability',
      desc: 'QR verification ensures verified physical check-ins and returns, reducing equipment loss and unreturned items.',
    },
    {
      title: 'Predictable Scheduling',
      desc: 'Prevents double-booking conflicts and automates faculty approval routing for high-value research tools.',
    },
    {
      title: 'Maintenance Tracking',
      desc: 'Direct incident reporting with severity levels ensures lab managers can flag damages and track repairs immediately.',
    },
  ];

  return (
    <div className="py-12 md:py-16 space-y-16">
      <Container size="lg">
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <span>About ShareSpace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Connecting Campus Innovation with University Resources
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            ShareSpace is a dedicated resource-sharing platform engineered for college campuses, academic labs, and collaborative hackathons.
          </p>
        </div>
      </Container>

      {/* Core Mission */}
      <Container size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Why We Built ShareSpace
            </h2>
            <p>
              In many academic institutions, access to specialized resources—like 3D printers, optics benches, audio-visual suites, and study pods—is managed through disconnected spreadsheets, paper logbooks, or informal personal requests.
            </p>
            <p>
              This leads to uneven access, scheduling conflicts, and lost equipment. ShareSpace creates a unified digital catalog where students can explore available facilities and request reservations through clear, automated workflows.
            </p>
            <div className="pt-2">
              <Link to="/#categories">
                <Button variant="outline" size="sm" icon={<ArrowRightIcon className="w-3.5 h-3.5" />} iconPosition="right">
                  Browse Supported Categories
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900/60 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Platform Design Principles
            </h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Role-Aware:</strong> Distinct views for Students, Faculty Approvers, Lab Owners, and Security personnel.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Conflict Prevention:</strong> Server-enforced slot collision checks guarantee clean reservations.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Decoupled Architecture:</strong> Clear separation between React client and Firebase backend services.</span>
              </li>
            </ul>
          </div>
        </div>
      </Container>

      {/* Pillars Grid */}
      <Container size="lg" className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Core Objectives
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            How ShareSpace optimizes campus asset utilization
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => (
            <Card key={pillar.title} className="h-full">
              <CardHeader>
                <CardTitle className="text-base">{pillar.title}</CardTitle>
                <CardDescription className="text-xs">{pillar.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Container>

      {/* Development Roadmap Callout */}
      <Container size="lg">
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-700 dark:text-indigo-400">
              <LayersIcon className="w-4 h-4" />
              <span>Frontend Phase 1 Complete</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Phase 2: Authentication & Role Dashboards
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Coming next: User login, registration forms with Zod validation, and customized dashboard layouts for each campus role.
            </p>
          </div>
          <Link to="/" className="shrink-0">
            <Button variant="primary" size="md">
              Return to Home
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
};
