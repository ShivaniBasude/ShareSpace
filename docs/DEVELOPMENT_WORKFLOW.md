# ShareSpace — Development Workflow & Collaboration Guidelines

## Team Roles & Ownership Matrix

| Area / File Path | Primary Owner | Secondary Reviewer | Scope & Responsibilities |
| :--- | :--- | :--- | :--- |
| `src/components/**` | Frontend Developer | Backend Developer | Reusable UI components, design system, layout. |
| `src/features/**` | Frontend Developer | Backend Developer | Feature UI logic, client state, form handling. |
| `src/pages/**` | Frontend Developer | Backend Developer | Views and route composition. |
| `src/routes/**` | Frontend Developer | Backend Developer | Route definitions, route guards, redirects. |
| `src/services/**` | Frontend Developer | Backend Developer | Firebase Web SDK consumer calls & abstractions. |
| `functions/**` | Backend Developer | Frontend Developer | Cloud Functions, triggers, admin SDK execution. |
| `firestore.rules` | Backend Developer | Frontend Developer | Database security rules and access control tests. |
| `storage.rules` | Backend Developer | Frontend Developer | Storage bucket security rules. |
| `firebase.json` | Backend Developer | Frontend Developer | Firebase emulator & hosting configuration. |
| `docs/**` | **Both Developers** | **Both Developers** | Architecture, API contracts, schema updates. |
| `src/types/` & `functions/src/shared/` | **Both Developers** | **Both Developers** | Shared data models and contract synchronization. |
| `package.json` (root) | **Both Developers** | **Both Developers** | Top-level scripts and shared tooling dependencies. |

---

## Git Workflow & Branch Strategy

### 1. Branch Naming Convention
- **Frontend Tasks**: `feat/fe-<feature-name>` (e.g. `feat/fe-resource-card`, `feat/fe-booking-calendar`)
- **Backend Tasks**: `feat/be-<feature-name>` (e.g. `feat/be-booking-triggers`, `feat/be-qr-verification`)
- **Shared / Contract Tasks**: `chore/contract-<description>` (e.g. `chore/contract-incident-schema`)
- **Bug Fixes**: `fix/<description>`

### 2. Pull Request Rules
- Never push directly to `main`.
- Every pull request touching `src/types/` or `docs/API_CONTRACT.md` requires approval from both developers.
- Run `npm run build` locally before opening a pull request to ensure zero TypeScript errors.

---

## Daily Development Routine

### For Frontend Developer
1. Start local emulators (if running backend locally) or point to the shared project:
   ```bash
   firebase emulators:start
   ```
2. In a separate terminal, run the frontend dev server:
   ```bash
   npm run dev
   ```
3. Implement components and pages in `src/`.
4. Use dummy mock state or hook up to the local Firestore / Auth emulators using the client SDK.

### For Backend Developer
1. Navigate to `functions/`:
   ```bash
   cd functions
   npm run build:watch
   ```
2. In a separate terminal, run emulators with hot-reloading functions:
   ```bash
   firebase emulators:start
   ```
3. Test functions using Firebase Emulator UI at `http://localhost:4000` or via automated tests with `firebase-functions-test`.

---

## Shared Type Synchronization Procedure

When an entity or API payload changes:
1. Discuss the change in `docs/API_CONTRACT.md` or `docs/DATABASE_SCHEMA.md`.
2. Update the interface in `src/types/index.ts`.
3. Mirror the identical change into `functions/src/shared/types.ts`.
4. Verify that both `npm run build` (root) and `npm run build` (`functions/`) pass without errors.
