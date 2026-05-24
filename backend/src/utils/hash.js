import crypto from "node:crypto";

export function sha1(input) {
  return crypto.createHash("sha1").update(String(input)).digest("hex");
}

export function jobIdFor(ats, slug, externalId) {
  return `${ats}:${slug}:${externalId}`;
}
