/** In-memory TTL cache for idempotent structured AI responses (not chat). */

const store = new Map();

export function getCachedAiJson(namespace, key) {
  const id = `${namespace}:${key}`;
  const hit = store.get(id);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    store.delete(id);
    return null;
  }
  return hit.value;
}

export function setCachedAiJson(namespace, key, value, ttlMs = 30 * 60 * 1000) {
  const id = `${namespace}:${key}`;
  store.set(id, { value, expiresAt: Date.now() + ttlMs });
  // Soft cap to avoid unbounded growth in long-lived functions instances.
  if (store.size > 500) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
}
