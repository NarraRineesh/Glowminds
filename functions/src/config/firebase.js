// Firebase Admin bootstrap for Functions.
//
// Functions Gen 2 runs under a managed service account with full Firestore +
// Auth permissions, so `initializeApp()` with no args picks up credentials
// automatically. The wrapper just memoises the SDK handles.

import admin from "firebase-admin";

let app;

export function getFirebaseApp() {
  if (app) return app;
  app = admin.apps.length ? admin.app() : admin.initializeApp();
  return app;
}

export function getFirestore() {
  getFirebaseApp();
  return admin.firestore();
}

export function getAuth() {
  getFirebaseApp();
  return admin.auth();
}

export { admin };
