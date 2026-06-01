/** Coalesce concurrent async calls with the same key (e.g. React StrictMode double-mount). */
const inflight = new Map()

export function dedupeAsync(key, fn) {
  const existing = inflight.get(key)
  if (existing) return existing

  const promise = Promise.resolve()
    .then(fn)
    .finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}
