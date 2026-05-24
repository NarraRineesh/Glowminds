import { sha1 } from "../utils/hash.js";

export function companyChanged(prev, snapshot) {
  if (!prev) return true;
  if (
    prev.latestUpdatedAt == null ||
    prev.jobCount == null ||
    prev.indiaJobCount == null
  ) {
    return true;
  }
  return (
    prev.jobCount !== snapshot.jobCount ||
    prev.indiaJobCount !== snapshot.indiaJobCount ||
    prev.latestUpdatedAt !== snapshot.latestUpdatedAt
  );
}

export function jobFingerprint({ title, location, updatedAt }) {
  const u =
    typeof updatedAt === "string"
      ? updatedAt
      : updatedAt
        ? new Date(updatedAt).toISOString()
        : "";
  return sha1(`${title || ""}|${location || ""}|${u}`);
}
