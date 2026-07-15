import { getFirestore } from "../config/firebase.js";

/** Top-level Firestore collection refs for user-owned data. */
export function userDocRef(uid) {
  return getFirestore().collection("users").doc(uid);
}

export function subscriptionRef(uid) {
  return getFirestore().collection("subscriptions").doc(uid);
}

export function subscriptionPaymentRef(uid, paymentId) {
  return subscriptionRef(uid).collection("payments").doc(paymentId);
}

export function userCreditsRef(uid) {
  return getFirestore().collection("userCredits").doc(uid);
}

export function userEntitlementsRef(uid) {
  return getFirestore().collection("userEntitlements").doc(uid);
}

export function applicationsCol() {
  return getFirestore().collection("applications");
}

export function applicationRef(appId) {
  return applicationsCol().doc(appId);
}

export function savedJobRef(uid, jobId) {
  return getFirestore().collection("savedJobs").doc(`${uid}_${jobId}`);
}

export function resumeRef(uid, resumeId) {
  return getFirestore().collection("resumes").doc(`${uid}_${resumeId}`);
}

export function creditLedgerCol() {
  return getFirestore().collection("creditLedger");
}

export function learningPathRef(uid) {
  return getFirestore().collection("learningPaths").doc(uid);
}

export async function readSubscription(uid) {
  const subSnap = await subscriptionRef(uid).get();
  return subSnap.exists ? subSnap.data() : null;
}

export async function readCredits(uid) {
  const creditsSnap = await userCreditsRef(uid).get();
  return creditsSnap.exists ? creditsSnap.data() : null;
}

export async function readEntitlements(uid) {
  const entSnap = await userEntitlementsRef(uid).get();
  return entSnap.exists ? entSnap.data() : null;
}
