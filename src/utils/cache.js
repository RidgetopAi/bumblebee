import { createHash } from 'crypto';

/**
 * Simple LRU cache implementation for code blocks and language detection
 */
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// Create cache instances
export const codeBlockCache = new LRUCache(50);
export const languageDetectionCache = new LRUCache(100);
export const ansiColorCache = new LRUCache(200);

/**
 * Create a content hash for caching
 */
export function createContentHash(content) {
  return createHash('md5').update(content).digest('hex');
}

/**
 * Performance profiler (minimal implementation)
 */
export const PerformanceProfiler = {
  start(label) {
    const startTime = Date.now();
    return () => {
      // End profiling - minimal implementation
    };
  }
};

/**
 * Cache statistics (minimal implementation)
 */
export const CacheStats = {
  recordHit(type) {
    // Minimal implementation
  },
  recordMiss(type) {
    // Minimal implementation
  }
};
