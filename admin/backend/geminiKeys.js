/**
 * Gemini API Key Pool Manager
 * - Rotates through multiple keys
 * - Tracks rate-limit / quota errors per key
 * - Auto-recovers after cooldown (60s)
 * - Falls back to next key on failure
 */

class GeminiKeyPool {
  constructor() {
    this.keys = [];
    this.currentIndex = 0;
    this.cooldowns = {}; // keyIndex -> cooldownUntil timestamp
    this.COOLDOWN_MS = 60_000; // 1 minute cooldown on rate limit
  }

  /**
   * Load keys from comma-separated string or array
   */
  load(keysInput) {
    if (Array.isArray(keysInput)) {
      this.keys = keysInput.filter(k => k && k.trim());
    } else if (typeof keysInput === "string") {
      this.keys = keysInput.split(",").map(k => k.trim()).filter(Boolean);
    }
    // Reset cooldowns for removed keys
    for (const idx of Object.keys(this.cooldowns)) {
      if (idx >= this.keys.length) delete this.cooldowns[idx];
    }
    this.currentIndex = Math.min(this.currentIndex, Math.max(0, this.keys.length - 1));
    console.log(`🔑 GeminiKeyPool loaded: ${this.keys.length} key(s)`);
  }

  /**
   * Get the next available key (skips keys on cooldown)
   * Returns { key, index } or null if all keys exhausted
   */
  getNext() {
    if (this.keys.length === 0) return null;
    const now = Date.now();
    // Try all keys starting from currentIndex
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length;
      if (!this.cooldowns[idx] || this.cooldowns[idx] <= now) {
        this.currentIndex = (idx + 1) % this.keys.length;
        return { key: this.keys[idx], index: idx };
      }
    }
    // All keys on cooldown — try the oldest cooldown anyway
    let oldestIdx = 0;
    let oldestTime = Infinity;
    for (const [idx, until] of Object.entries(this.cooldowns)) {
      if (until < oldestTime) { oldestTime = until; oldestIdx = Number(idx); }
    }
    this.currentIndex = (oldestIdx + 1) % this.keys.length;
    return { key: this.keys[oldestIdx], index: oldestIdx };
  }

  /**
   * Mark a key as rate-limited / errored
   */
  markFailed(index) {
    this.cooldowns[index] = Date.now() + this.COOLDOWN_MS;
    console.log(`⚠️ Gemini key #${index} marked for cooldown (60s)`);
  }

  /**
   * Mark a key as working (clear cooldown if any)
   */
  markSuccess(index) {
    if (this.cooldowns[index]) {
      delete this.cooldowns[index];
    }
  }

  /**
   * Get status of all keys
   */
  getStatus() {
    const now = Date.now();
    return this.keys.map((k, i) => ({
      index: i,
      masked: k.slice(0, 8) + "..." + k.slice(-4),
      onCooldown: !!(this.cooldowns[i] && this.cooldowns[i] > now),
      cooldownRemaining: this.cooldowns[i] ? Math.max(0, Math.ceil((this.cooldowns[i] - now) / 1000)) : 0,
    }));
  }
}

// Singleton
const pool = new GeminiKeyPool();

// Load initial keys from env
function loadFromEnv() {
  const raw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  pool.load(raw);
}

export { pool, loadFromEnv };
