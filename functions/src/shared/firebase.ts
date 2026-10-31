import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

let testDb: admin.firestore.Firestore | null = null;
let testAuth: admin.auth.Auth | null = null;

export const getDb = (): admin.firestore.Firestore => testDb || admin.firestore();
export const getAuth = (): admin.auth.Auth => testAuth || admin.auth();

export const setDbForTesting = (db: unknown) => {
  testDb = db as admin.firestore.Firestore;
};

export const setAuthForTesting = (auth: unknown) => {
  testAuth = auth as admin.auth.Auth;
};
