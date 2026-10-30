# ShareSpace — Firebase Setup & Emulator Guide

## Overview
ShareSpace is configured for complete local development using the **Firebase Local Emulator Suite**.
Both developers can develop and test offline without requiring a live cloud project or consuming quota.

---

## Prerequisites

1. **Node.js**: v20 or v22 LTS (Verified on `v24.x` / `v20.x`).
2. **Java Development Kit (JDK)**: JDK 17+ (Required to run the Firestore and Cloud Storage emulators).
3. **Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```
   *Alternative*: Run commands via `npx firebase-tools`.

---

## 1. Firebase Project Initialization (Cloud - When Ready)

1. Sign in to Firebase:
   ```bash
   firebase login
   ```
2. Link your cloud project (if already created on the Firebase Console):
   ```bash
   firebase use --add
   ```
   Or edit `.firebaserc` directly:
   ```json
   {
     "projects": {
       "default": "your-firebase-project-id"
     }
   }
   ```

---

## 2. Local Emulator Configuration

The project root contains `firebase.json` pre-configured with standard ports:

| Service | Port | Description |
| :--- | :--- | :--- |
| **Emulator UI** | `4000` | Web dashboard to view auth users, firestore data, storage files |
| **Auth** | `9099` | User sign-up, sign-in, token generation |
| **Firestore** | `8080` | Document database emulator |
| **Cloud Functions** | `5001` | Cloud Functions execution runtime |
| **Storage** | `9199` | File upload/download bucket emulator |

### Starting the Emulators

To start all configured emulators:
```bash
firebase emulators:start
```

To preserve emulator data between restarts:
```bash
firebase emulators:start --export-on-exit=./emulator-data --import=./emulator-data
```
*(Note: `./emulator-data` is ignored in `.gitignore` to prevent committing mock data).*

---

## 3. Frontend Environment Configuration

1. In the project root (`ShareSpace/`), create a local environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Set `VITE_USE_FIREBASE_EMULATOR=true`.
3. When `VITE_USE_FIREBASE_EMULATOR=true`, the Firebase Web SDK in `src/services/firebase.ts` connects directly to `localhost:9099`, `localhost:8080`, and `localhost:9199`.

---

## 4. Cloud Functions Setup (`functions/`)

1. Install dependencies:
   ```bash
   cd functions
   npm install
   ```
2. Build TypeScript:
   ```bash
   npm run build
   ```
3. Watch mode during backend development:
   ```bash
   npm run build:watch
   ```
