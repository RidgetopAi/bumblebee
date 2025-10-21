import { createHighlighter } from 'shiki';
import { PerformanceProfiler, ansiColorCache, CacheStats } from '../utils/cache.js';
// Languages to preload eagerly (most common)
const EAGER_LANGUAGES = [
    'typescript',
    'javascript',
    'python',
    'rust',
    'go',
    'markdown',
    'json',
    'yaml',
    'html',
    'css'
];
// Languages to lazy load on demand (less common)
const LAZY_LANGUAGES = [
    'ruby',
    'c',
    'cpp',
    'java',
    'shell',
    'bash',
    'toml',
    'sql'
];
// All supported languages (eager + lazy)
const ALL_LANGUAGES = [...EAGER_LANGUAGES, ...LAZY_LANGUAGES];
// Global highlighter instance
let highlighter = null;
// Track loaded languages to avoid duplicate loading
const loadedLanguages = new Set();
// Lazy loading promises to prevent concurrent loading of same language
const loadingPromises = new Map();
/**
 * Initialize Shiki highlighter with github-dark theme and preload eager languages only
 */
export async function initializeShiki() {
    if (highlighter) {
        return highlighter;
    }
    const endProfile = PerformanceProfiler.start('shiki-initialization');
    highlighter = await createHighlighter({
        themes: ['github-dark'],
        langs: EAGER_LANGUAGES
    });
    // Mark eager languages as loaded
    EAGER_LANGUAGES.forEach(lang => loadedLanguages.add(lang));
    endProfile();
    return highlighter;
}
/**
 * Ensure a language is loaded, loading it lazily if needed
 */
export async function ensureLanguageLoaded(lang) {
    // Skip if not a supported language
    if (!ALL_LANGUAGES.includes(lang)) {
        return;
    }
    // Already loaded
    if (loadedLanguages.has(lang)) {
        return;
    }
    // Check if already loading
    const existingPromise = loadingPromises.get(lang);
    if (existingPromise) {
        return existingPromise;
    }
    // Start lazy loading
    const loadPromise = loadLanguage(lang);
    loadingPromises.set(lang, loadPromise);
    try {
        await loadPromise;
    }
    finally {
        loadingPromises.delete(lang);
    }
}
/**
 * Load a single language grammar lazily
 */
async function loadLanguage(lang) {
    if (!highlighter) {
        throw new Error('Shiki highlighter not initialized');
    }
    // Skip if already loaded or not supported
    if (loadedLanguages.has(lang) || !ALL_LANGUAGES.includes(lang)) {
        return;
    }
    const endProfile = PerformanceProfiler.start(`lazy-load-${lang}`);
    try {
        await highlighter.loadLanguage(lang);
        loadedLanguages.add(lang);
    }
    catch (error) {
        console.warn(`Failed to load language: ${lang}`, error);
        // Continue without the language rather than failing
    }
    endProfile();
}
/**
 * Check if a language is supported (either eager or lazy)
 */
export function isLanguageSupported(lang) {
    return ALL_LANGUAGES.includes(lang);
}
/**
 * Get the initialized highlighter instance
 * Throws if not initialized
 */
export function getHighlighter() {
    if (!highlighter) {
        throw new Error('Shiki highlighter not initialized. Call initializeShiki() first.');
    }
    return highlighter;
}
/**
 * Get themed tokens for code (with lazy loading)
 */
export async function codeToTokens(code, lang) {
    const endProfile = PerformanceProfiler.start('code-to-tokens');
    // Ensure language is loaded (lazy loading if needed)
    await ensureLanguageLoaded(lang);
    const highlighter = getHighlighter();
    const result = highlighter.codeToTokens(code, {
        lang: lang, // Shiki accepts string langs
        theme: 'github-dark'
    });
    endProfile();
    return result.tokens;
}
/**
 * Convert code to ANSI using Shiki with github-dark theme
 * Supports both TrueColor and 256-color fallbacks
 */
export async function codeToAnsi(code, lang, colorSupport = 'truecolor') {
    const endProfile = PerformanceProfiler.start('code-to-ansi');
    const tokens = await codeToTokens(code, lang);
    const result = toAnsi(tokens, colorSupport);
    endProfile();
    return result;
}
/**
 * Convert Shiki tokens to ANSI escape sequences
 * Supports both TrueColor and 256-color fallbacks
 * Tokens should be from highlighter.codeToTokens()
 */
export function toAnsi(tokens, colorSupport = 'truecolor') {
    const lines = [];
    for (const line of tokens) {
        const lineParts = [];
        for (const token of line) {
            const content = token.content;
            const color = token.color;
            if (color) {
                const ansiCode = colorToAnsi(color, colorSupport);
                lineParts.push(`${ansiCode}${content}\x1b[39m`); // Reset to default foreground
            }
            else {
                lineParts.push(content);
            }
        }
        lines.push(lineParts.join(''));
    }
    return lines.join('\n');
}
/**
* Convert hex color to ANSI escape sequence (with caching)
*/
function colorToAnsi(hexColor, colorSupport) {
    const cacheKey = `${hexColor}-${colorSupport}`;
    // Check cache first
    const cached = ansiColorCache.get(cacheKey);
    if (cached !== undefined) {
        CacheStats.recordHit('ansiColor');
        return cached;
    }
    CacheStats.recordMiss('ansiColor');
    let result;
    if (colorSupport === 'truecolor') {
        // Convert hex to RGB
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        result = `\x1b[38;2;${r};${g};${b}m`;
    }
    else {
        // Use 256-color approximation
        const replacements = get256ColorReplacements();
        const ansi256 = replacements[hexColor] || '15'; // Default to white
        result = `\x1b[38;5;${ansi256}m`;
    }
    // Cache the result
    ansiColorCache.set(cacheKey, result);
    return result;
}
/**
 * Get 256-color replacements for TrueColor codes
 * Maps common colors to their 256-color equivalents
 */
function get256ColorReplacements() {
    return {
        // GitHub Dark theme colors mapped to 256 colors
        '#ff7b72': '196', // red
        '#f85149': '196', // red-500
        '#da3633': '160', // red-600
        '#b62324': '124', // red-700
        '#79c0ff': '39', // blue
        '#58a6ff': '33', // blue-500
        '#388bfd': '27', // blue-600
        '#1f6feb': '26', // blue-700
        '#56d364': '40', // green
        '#238636': '28', // green-600
        '#0f5132': '22', // green-800
        '#ffd33d': '220', // yellow
        '#d29922': '172', // yellow-700 (last occurrence wins)
        '#bb8009': '136', // yellow-800 (last occurrence wins)
        '#f2cc60': '214', // yellow-300
        '#ffa657': '208', // orange
        '#ffa198': '210', // coral
        '#c9d1d9': '252', // gray-200
        '#8b949e': '244', // gray-400
        '#6e7681': '242', // gray-500
        '#484f58': '238', // gray-600
        '#30363d': '235', // gray-700
        '#21262d': '233', // gray-800
        '#161b22': '232', // gray-900
        '#0d1117': '232' // gray-950
    };
}
