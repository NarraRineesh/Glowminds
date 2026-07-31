import crypto from "node:crypto";

const HEX16 = /^[0-9a-f]{16}$/;

/** 16 hex digits (8 random bytes). */
export function newHashedId() {
  return crypto.randomBytes(8).toString("hex");
}

export function isHashedId(value) {
  return typeof value === "string" && HEX16.test(value);
}

/** Ensure object has a valid 16-hex id; returns a shallow copy when fixed. */
export function ensureHashedId(item) {
  if (!item || typeof item !== "object") return item;
  if (isHashedId(item.id)) return item;
  return { ...item, id: newHashedId() };
}

export function ensureHashedIds(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => ensureHashedId(item));
}
