#!/usr/bin/env node
/**
 * Bootstrap script: set or unset Firebase custom claim `isAdmin`.
 *
 * Usage:
 *   pnpm admin:set -- --email you@example.com
 *   pnpm admin:set -- --uid ABC123
 *   pnpm admin:set -- --email you@example.com --revoke
 *
 * Uses Firebase CLI login access token (firebase login) against Identity Toolkit,
 * or GOOGLE_APPLICATION_CREDENTIALS / Admin SDK when available.
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, "../functions/package.json"));

function readFirebasercProject() {
  try {
    const rc = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../.firebaserc"), "utf8"),
    );
    return (
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      rc.projects?.default ||
      rc.projects?.staging ||
      Object.values(rc.projects || {})[0] ||
      null
    );
  } catch {
    return process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || null;
  }
}

function readFirebaseCliTokens() {
  const configPath = path.join(
    os.homedir(),
    ".config",
    "configstore",
    "firebase-tools.json",
  );
  if (!fs.existsSync(configPath)) return null;
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return config.tokens || null;
}

function parseArgs(argv) {
  const out = { revoke: false, email: null, uid: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--") continue;
    if (a === "--help" || a === "-h") {
      out.help = true;
      continue;
    }
    if (a === "--revoke") out.revoke = true;
    else if (a === "--email") out.email = argv[++i];
    else if (a === "--uid") out.uid = argv[++i];
  }
  return out;
}

async function setClaimViaRest({ projectId, accessToken, email, uid, revoke }) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  let localId = uid;
  let displayEmail = email;
  let existingAttrs = {};

  const lookupRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:lookup`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(localId ? { localId: [localId] } : { email: [email] }),
    },
  );
  const lookup = await lookupRes.json();
  if (!lookupRes.ok) {
    throw new Error(
      lookup?.error?.message || `Lookup failed (${lookupRes.status})`,
    );
  }
  const user = lookup.users?.[0];
  if (!user) {
    throw new Error(localId ? `User not found for uid ${localId}` : `User not found for ${email}`);
  }
  localId = user.localId;
  displayEmail = user.email || email || localId;
  existingAttrs = user.customAttributes
    ? JSON.parse(user.customAttributes)
    : {};

  const claims = { ...existingAttrs };
  if (revoke) delete claims.isAdmin;
  else claims.isAdmin = true;

  const updateRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        localId,
        customAttributes: JSON.stringify(claims),
      }),
    },
  );
  const updated = await updateRes.json();
  if (!updateRes.ok) {
    throw new Error(
      updated?.error?.message || `Update failed (${updateRes.status})`,
    );
  }

  return { email: displayEmail, uid: localId };
}

async function setClaimViaAdminSdk({ projectId, email, uid, revoke }) {
  const {
    initializeApp,
    applicationDefault,
    getApps,
  } = require("firebase-admin/app");
  const { getAuth } = require("firebase-admin/auth");

  if (!getApps().length) {
    initializeApp({ credential: applicationDefault(), projectId });
  }
  const auth = getAuth();
  const user = uid ? await auth.getUser(uid) : await auth.getUserByEmail(email);
  const claims = { ...(user.customClaims || {}) };
  if (revoke) delete claims.isAdmin;
  else claims.isAdmin = true;
  await auth.setCustomUserClaims(user.uid, claims);
  return { email: user.email || user.uid, uid: user.uid };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || (!args.email && !args.uid)) {
    console.log(`Usage:
  pnpm admin:set -- --email you@example.com
  pnpm admin:set -- --uid ABC123
  pnpm admin:set -- --email you@example.com --revoke`);
    process.exit(args.help ? 0 : 1);
  }

  const projectId = readFirebasercProject();
  if (!projectId) {
    throw new Error("Could not resolve Firebase project id (check .firebaserc)");
  }

  let result;
  const tokens = readFirebaseCliTokens();
  if (tokens?.access_token) {
    result = await setClaimViaRest({
      projectId,
      accessToken: tokens.access_token,
      email: args.email,
      uid: args.uid,
      revoke: args.revoke,
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    result = await setClaimViaAdminSdk({
      projectId,
      email: args.email,
      uid: args.uid,
      revoke: args.revoke,
    });
  } else {
    throw new Error(
      "No credentials. Run `firebase login`, or set GOOGLE_APPLICATION_CREDENTIALS.",
    );
  }

  console.log(
    args.revoke
      ? `Revoked isAdmin for ${result.email}`
      : `Granted isAdmin to ${result.email}`,
  );
  console.log(`Project: ${projectId}`);
  console.log("Sign out and sign back in before opening /admin.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
