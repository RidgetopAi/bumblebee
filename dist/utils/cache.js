import { createHash } from 'crypto';
/**
 * Simple LRU cache implementation for performance optimization
 */
export class LRUCache {
    cache = new Map();
    maxSize;
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
    }
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // Move to end (most recently used)
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }
    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        else if (this.cache.size >= this.maxSize) {
            // Remove least recently used (first item)
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
    has(key) {
        return this.cache.has(key);
    }
}
/**
 * Create a content hash for cache key generation
 */
export function createContentHash(content) {
    return createHash('md5').update(content).digest('hex').substring(0, 16);
}
/**
 * Global caches for performance optimization
 */
export const codeBlockCache = new LRUCache(200);
export const languageDetectionCache = new LRUCache(500);
export const ansiColorCache = new LRUCache(100);
/**
 * Performance profiling utilities
 */
export class PerformanceProfiler {
    static timings = new Map();
    static enabled = process.env.BUMBLEBEE_PROFILE === 'true';
    static start(label) {
        if (!this.enabled) {
            return () => { }; // No-op
        }
        const start = process.hrtime.bigint();
        return () => {
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
            if (!this.timings.has(label)) {
                this.timings.set(label, []);
            }
            this.timings.get(label).push(duration);
            if (this.enabled) {
                console.debug(`[PROFILE] ${label}: ${duration.toFixed(2)}ms`);
            }
        };
    }
    static getStats(label) {
        const times = this.timings.get(label);
        if (!times || times.length === 0) {
            return null;
        }
        const count = times.length;
        const sum = times.reduce((a, b) => a + b, 0);
        const avg = sum / count;
        const min = Math.min(...times);
        const max = Math.max(...times);
        return { count, avg, min, max };
    }
    static logStats() {
        if (!this.enabled)
            return;
        console.log('\n[PERFORMANCE PROFILE SUMMARY]');
        console.log('================================');
        for (const [label, times] of this.timings) {
            const stats = this.getStats(label);
            if (stats) {
                console.log(`${label}:`);
                console.log(`  Count: ${stats.count}`);
                console.log(`  Avg: ${stats.avg.toFixed(2)}ms`);
                console.log(`  Min: ${stats.min.toFixed(2)}ms`);
                console.log(`  Max: ${stats.max.toFixed(2)}ms`);
                console.log('');
            }
        }
        // Log cache statistics
        console.log('Cache Statistics:');
        console.log(`  Code Block Cache: ${codeBlockCache.size()}/200 entries`);
        console.log(`  Language Detection Cache: ${languageDetectionCache.size()}/500 entries`);
        console.log(`  ANSI Color Cache: ${ansiColorCache.size()}/100 entries`);
    }
    static reset() {
        this.timings.clear();
        codeBlockCache.clear();
        languageDetectionCache.clear();
        ansiColorCache.clear();
    }
}
/**
 * Cache statistics for monitoring
 */
export class CacheStats {
    static stats = {
        codeBlock: { hits: 0, misses: 0 },
        languageDetection: { hits: 0, misses: 0 },
        ansiColor: { hits: 0, misses: 0 }
    };
    static recordHit(type) {
        this.stats[type].hits++;
    }
    static recordMiss(type) {
        this.stats[type].misses++;
    }
    static getStats() {
        return { ...this.stats };
    }
    static getHitRatio(type) {
        const { hits, misses } = this.stats[type];
        const total = hits + misses;
        return total === 0 ? 0 : hits / total;
    }
    static logStats() {
        if (process.env.BUMBLEBEE_PROFILE !== 'true')
            return;
        console.log('\n[CACHE STATISTICS]');
        console.log('==================');
        const types = ['codeBlock', 'languageDetection', 'ansiColor'];
        for (const type of types) {
            const { hits, misses } = this.stats[type];
            const total = hits + misses;
            const ratio = total === 0 ? 0 : (hits / total * 100);
            console.log(`${type}:`);
            console.log(`  Hits: ${hits}, Misses: ${misses}, Total: ${total}`);
            console.log(`  Hit Ratio: ${ratio.toFixed(1)}%`);
        }
    }
}
