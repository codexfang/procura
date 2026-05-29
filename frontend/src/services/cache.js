const CACHE_PREFIX = "procura_cache_";

export const cache = {
  set(key, data, ttlMinutes = 30) {
    const entry = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    };
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      localStorage.removeItem(CACHE_PREFIX + key);
    }
  },

  get(key) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;

      const entry = JSON.parse(raw);
      const age = Date.now() - entry.timestamp;

      if (age > entry.ttl) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return entry.data;
    } catch {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
  },

  remove(key) {
    localStorage.removeItem(CACHE_PREFIX + key);
  },

  clear() {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(CACHE_PREFIX)
    );
    keys.forEach((k) => localStorage.removeItem(k));
  },
};

export const BACKEND_STATUS_KEY = CACHE_PREFIX + "backend_status";

export async function checkBackend() {
  try {
    const res = await fetch(
      `https://procura-onjp.onrender.com/health`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      cache.set(BACKEND_STATUS_KEY, { online: true }, 5);
      return true;
    }
  } catch {}
  cache.set(BACKEND_STATUS_KEY, { online: false }, 5);
  return false;
}
