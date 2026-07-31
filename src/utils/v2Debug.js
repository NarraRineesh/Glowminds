/** [v2] Feature debug helper — enable with localStorage.gm_v2_debug = '1' */
export function v2Debug(tag, ...args) {
  try {
    const on =
      import.meta.env.DEV ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('gm_v2_debug') === '1')
    if (on) console.debug(`[v2:${tag}]`, ...args)
  } catch {
    // ignore
  }
}
