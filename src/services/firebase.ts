// Firebase Client SDK initialization
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const isEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

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

// Initialize or reuse Firebase App instance
export const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);

// Connect to local Firebase Emulators only when explicitly enabled
// Emulators can only be connected once per process/session
const globalWithEmulatorFlag = globalThis as typeof globalThis & {
  __SHARESPACE_EMULATOR_ATTACHED__?: boolean;
};

if (isEmulator && !globalWithEmulatorFlag.__SHARESPACE_EMULATOR_ATTACHED__) {
  const authUrl = import.meta.env.VITE_FIREBASE_EMULATOR_AUTH_URL || 'http://localhost:9099';
  const firestoreHost = import.meta.env.VITE_FIREBASE_EMULATOR_FIRESTORE_HOST || 'localhost';
  const firestorePort = Number(import.meta.env.VITE_FIREBASE_EMULATOR_FIRESTORE_PORT) || 8081;
  const functionsPort = Number(import.meta.env.VITE_FIREBASE_EMULATOR_FUNCTIONS_PORT) || 5001;

  try {
    connectAuthEmulator(auth, authUrl, { disableWarnings: true });
    connectFirestoreEmulator(db, firestoreHost, firestorePort);
    connectFunctionsEmulator(functions, 'localhost', functionsPort);
    globalWithEmulatorFlag.__SHARESPACE_EMULATOR_ATTACHED__ = true;
    console.info(`[ShareSpace] Connected to Firebase Emulators (Auth: ${authUrl}, Firestore: ${firestoreHost}:${firestorePort}, Functions: :${functionsPort})`);
  } catch (err) {
    console.warn('[ShareSpace] Firebase emulator connection warning:', err);
  }
}
