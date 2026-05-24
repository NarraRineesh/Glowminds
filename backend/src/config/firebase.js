import admin from "firebase-admin";
import { env } from "./env.js";

let app;

export function getFirebaseApp() {
  if (app) return app;

  if (admin.apps.length > 0) {
    app = admin.app();
    return app;
  }

  const opts = {};
  if (env.firebaseProjectId) {
    opts.projectId = env.firebaseProjectId;
  }
  if (env.googleApplicationCredentials) {
    opts.credential = admin.credential.applicationDefault();
  }

  app = admin.initializeApp(opts);
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
