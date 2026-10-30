# ShareSpace — Project Structure & Architecture

## Overview
ShareSpace is a collaborative resource-sharing and booking platform built for hackathons and campus environments. The project is designed with a clean separation of concerns between the **React Frontend** and the **Firebase Backend**, allowing two developers to work concurrently with minimal merge conflicts.

---

## Directory Organization

```
ShareSpace/
├── .env.example               # Template environment configuration (committed)
├── .firebaserc                # Firebase CLI project alias
├── .gitignore                 # Version control exclusion rules (secures secrets/logs)
├── firebase.json              # Firebase Emulators, Firestore, Functions, Storage configs
├── firestore.indexes.json     # Compound indexes configuration
├── firestore.rules            # Firestore security rules
├── storage.rules              # Cloud Storage security rules
├── index.html                 # Vite HTML entry point
├── package.json               # Frontend dependencies and root scripts
├── tsconfig.json              # Solution TypeScript configuration
├── tsconfig.app.json          # Frontend TypeScript configuration
├── tsconfig.node.json         # Vite tooling TypeScript configuration
├── vite.config.ts             # Vite configuration with Tailwind CSS v4 & React
│
├── docs/                      # Shared project and technical documentation
│   ├── PROJECT_STRUCTURE.md   # Architectural overview and directory layout
│   ├── DATABASE_SCHEMA.md     # Firestore collections and document design
│   ├── API_CONTRACT.md        # Cloud Functions callable contracts & payloads
│   ├── FIREBASE_SETUP.md      # Local emulator setup and Firebase onboarding
│   └── DEVELOPMENT_WORKFLOW.md# Git branching, ownership, and coordination guide
│
├── public/                    # Static assets served as-is
│
├── src/                       # FRONTEND APPLICATION (Owned by Frontend Developer)
│   ├── assets/                # Static media (icons, images, logos)
│   ├── components/            # Reusable React components
│   │   ├── common/            # Generic UI primitives (Buttons, Inputs, Modals, Cards)
│   │   ├── layout/            # Shell components (Navbar, Sidebar, Footer, PageWrapper)
│   │   ├── resources/         # Resource-specific presentation components
│   │   └── bookings/          # Booking-specific presentation components
│   ├── features/              # Feature-oriented domain modules
│   │   ├── auth/              # Authentication UI & state flows
│   │   ├── resources/         # Resource discovery, filtering, and viewing
│   │   ├── bookings/          # Reservation forms, calendars, and slots
│   │   ├── approvals/         # Administrative approval actions & workflows
│   │   ├── qr/                # QR code generation and scanner widgets
│   │   ├── incidents/         # Incident reporting and status tracking
│   │   ├── notifications/     # In-app notifications panel and badges
│   │   └── dashboards/        # Role-based dashboard widgets (User / Admin / Security)
│   ├── pages/                 # Route page components
│   ├── routes/                # Route configuration, loaders, and guards
│   ├── services/              # External service clients (Firebase SDK wrappers)
│   ├── hooks/                 # Custom React hooks (e.g. useAuth, useBookings)
│   ├── context/               # React Context providers (e.g. AuthContext)
│   ├── types/                 # Frontend TypeScript interfaces (synchronized with backend)
│   ├── styles/                # Global style sheets and Tailwind CSS setup
│   │   └── globals.css        # Tailwind v4 import and custom styles
│   ├── App.tsx                # Root application component
│   ├── index.css              # Base styling and CSS variables
│   └── main.tsx               # React application entry point
│
└── functions/                 # BACKEND FUNCTIONS (Owned by Backend Developer)
    ├── package.json           # Cloud Functions dependencies and scripts
    ├── tsconfig.json          # Backend TypeScript configuration (Target: Node 20)
    └── src/
        ├── index.ts           # Central functions export and Firebase Admin init
        ├── shared/            # Shared TypeScript types and utility helpers
        │   ├── types.ts       # Backend domain models (mirrors src/types)
        │   └── index.ts
        ├── auth/              # Auth triggers (e.g. user creation hooks, claims)
        ├── resources/         # Resource lifecycle and management triggers
        ├── bookings/          # Booking workflows, conflict prevention, validations
        ├── qr/                # QR verification and check-in handlers
        ├── incidents/         # Incident reporting triggers and alerts
        ├── notifications/     # Event-driven notification dispatchers
        └── audit/             # Automated audit trail logging functions
```

---

## Architectural Boundaries

### 1. Frontend Scope (`src/`)
- User Interface rendering, layout composition, and theme styling.
- Client-side navigation, history management, and route protection.
- State management and interaction handling.
- Calling Firebase Client SDK methods (or HTTPS/Callable Cloud Functions) via abstracted services in `src/services/`.

### 2. Backend Scope (`functions/`, `firestore.rules`, `storage.rules`)
- Trusted business logic execution and state mutations requiring admin privileges.
- Enforcing access controls via Firestore and Cloud Storage Security Rules.
- Reactive triggers (Firestore `onCreate`, `onUpdate`, Auth `onCreate`).
- Scheduled cron tasks (cleanup of expired reservations, reminders).

### 3. Shared Coordination Zone (`docs/`, `src/types/`, `functions/src/shared/`)
- Both developers review and agree on data contracts, collection structures, and function schemas before implementation.
- TypeScript interfaces are kept synchronized between `src/types/index.ts` and `functions/src/shared/types.ts`.
