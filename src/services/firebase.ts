// Firebase Client SDK initialization
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Emulators must only be enabled in local development mode (never in production builds)
const isEmulator =
  import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

export const firebaseConfig: FirebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    (isEmulator ? 'demo-sharespace-key' : 'unconfigured-api-key'),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sharespace-dev.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sharespace-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sharespace-dev.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:demo',
};

// Initialize or reuse existing Firebase App instance (prevent duplicate apps)
export const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// Initialize Firebase services from the single app instance
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);
export const storage: FirebaseStorage = getStorage(app);

// Connect to Firebase Emulators only when explicitly enabled in local dev
// Ensures emulators are connected only once per session / HMR cycle
const globalWithEmulatorFlag = globalThis as typeof globalThis & {
  __SHARESPACE_EMULATOR_ATTACHED__?: boolean;
};

if (isEmulator && !globalWithEmulatorFlag.__SHARESPACE_EMULATOR_ATTACHED__) {
  // Base emulator host: defaults to 127.0.0.1 (or reachable LAN IP/hostname if on separate backend machine)
  const defaultHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || '127.0.0.1';

  // Auth emulator
  const authHost = import.meta.env.VITE_FIREBASE_EMULATOR_AUTH_HOST || defaultHost;
  const authPort = Number(import.meta.env.VITE_FIREBASE_EMULATOR_AUTH_PORT) || 9099;
  const authUrl =
    import.meta.env.VITE_FIREBASE_EMULATOR_AUTH_URL || `http://${authHost}:${authPort}`;

  // Firestore emulator (port 8081 per firebase.json)
  const firestoreHost = import.meta.env.VITE_FIREBASE_EMULATOR_FIRESTORE_HOST || defaultHost;
  const firestorePort =
    Number(import.meta.env.VITE_FIREBASE_EMULATOR_FIRESTORE_PORT) || 8081;

  // Cloud Functions emulator (port 5001 per firebase.json)
  const functionsHost = import.meta.env.VITE_FIREBASE_EMULATOR_FUNCTIONS_HOST || defaultHost;
  const functionsPort =
    Number(import.meta.env.VITE_FIREBASE_EMULATOR_FUNCTIONS_PORT) || 5001;

  // Storage emulator (port 9199 per firebase.json)
  const storageHost = import.meta.env.VITE_FIREBASE_EMULATOR_STORAGE_HOST || defaultHost;
  const storagePort =
    Number(import.meta.env.VITE_FIREBASE_EMULATOR_STORAGE_PORT) || 9199;

  try {
    // 1. Auth Emulator
    connectAuthEmulator(auth, authUrl, { disableWarnings: true });

    // 2. Firestore Emulator
    connectFirestoreEmulator(db, firestoreHost, firestorePort);

    // 3. Functions Emulator
    connectFunctionsEmulator(functions, functionsHost, functionsPort);

    // 4. Storage Emulator
    connectStorageEmulator(storage, storageHost, storagePort);

    globalWithEmulatorFlag.__SHARESPACE_EMULATOR_ATTACHED__ = true;
    console.info(
      `[ShareSpace] Connected to Firebase Emulators:\n` +
      `  • Auth: ${authUrl}\n` +
      `  • Firestore: ${firestoreHost}:${firestorePort}\n` +
      `  • Functions: ${functionsHost}:${functionsPort}\n` +
      `  • Storage: ${storageHost}:${storagePort}`
    );
  } catch (err) {
    console.warn('[ShareSpace] Firebase emulator connection warning:', err);
  }
}
