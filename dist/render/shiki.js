import { createHighlighter } from 'shiki';
// Popular languages to preload for performance
const POPULAR_LANGUAGES = [
    'typescript',
    'javascript',
    'python',
    'ruby',
    'rust',
    'go',
    'c',
    'cpp',
    'java',
    'shell',
    'bash',
    'markdown',
    'json',
    'yaml',
    'toml',
    'html',
    'css',
    'sql'
];
// Global highlighter instance
let highlighter = null;
/**
 * Initialize Shiki highlighter with github-dark theme and preload popular languages
 */
export async function initializeShiki() {
    if (highlighter) {
        return highlighter;
    }
    highlighter = await createHighlighter({
        themes: ['github-dark'],
        langs: POPULAR_LANGUAGES
    });
    return highlighter;
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
 * Get themed tokens for code
 */
export function codeToTokens(code, lang) {
    const highlighter = getHighlighter();
    const result = highlighter.codeToTokens(code, {
        lang: lang, // Shiki accepts string langs
        theme: 'github-dark'
    });
    return result.tokens;
}
/**
 * Convert code to ANSI using Shiki with github-dark theme
 * Supports both TrueColor and 256-color fallbacks
 */
export function codeToAnsi(code, lang, colorSupport = 'truecolor') {
    const tokens = codeToTokens(code, lang);
    return toAnsi(tokens, colorSupport);
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
 * Convert hex color to ANSI escape sequence
 */
function colorToAnsi(hexColor, colorSupport) {
    if (colorSupport === 'truecolor') {
        // Convert hex to RGB
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        return `\x1b[38;2;${r};${g};${b}m`;
    }
    else {
        // Use 256-color approximation
        const replacements = get256ColorReplacements();
        const ansi256 = replacements[hexColor] || '15'; // Default to white
        return `\x1b[38;5;${ansi256}m`;
    }
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
