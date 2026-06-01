import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;

function resolveKey() {
  const raw = process.env.PRICING_ENCRYPTION_KEY;
  if (!raw || !String(raw).trim()) return null;
  const trimmed = String(raw).trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }
  return scryptSync(trimmed, "glowminds-pricing-v1", 32);
}

export function isPricingEncryptionEnabled() {
  return resolveKey() != null;
}

export function encryptPricingPayload(payload) {
  const key = resolveKey();
  if (!key) return null;

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: ciphertext.toString("base64"),
  };
}

export function decryptPricingPayload({ iv, tag, data }) {
  const key = resolveKey();
  if (!key) {
    throw new Error("PRICING_ENCRYPTION_KEY is not configured");
  }
  if (!iv || !tag || !data) {
    throw new Error("Encrypted pricing payload is incomplete");
  }

  const decipher = createDecipheriv(ALGO, key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(data, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8"));
}
