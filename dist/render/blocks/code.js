import { codeToAnsi } from '../shiki.js';
import { wrapText } from '../ansi/wrap.js';
import { getTextWidth } from '../ansi/width.js';
import highlight from 'cli-highlight';
import { codeBlockCache, languageDetectionCache, createContentHash, PerformanceProfiler, CacheStats } from '../../utils/cache.js';
/**
 * Language detection priority system
 * Analyzes code content and returns the most likely programming language
 * Used when no explicit language is specified in code blocks
 *
 * Uses a weighted scoring system where more unique/specific patterns
 * get higher weights to avoid false positives from generic syntax.
 */
function detectLanguage(code) {
    // Check cache first
    const contentHash = createContentHash(code);
    const cached = languageDetectionCache.get(contentHash);
    if (cached !== undefined) {
        CacheStats.recordHit('languageDetection');
        return cached;
    }
    CacheStats.recordMiss('languageDetection');
    // Convert to lowercase for case-insensitive matching
    const lowerCode = code.toLowerCase();
    const originalCode = code;
    // Language patterns with weighted scores (higher = more specific/unique)
    const detections = [
        {
            lang: 'python',
            patterns: [
                { pattern: 'def ', weight: 3 },
                { pattern: 'import ', weight: 2 },
                { pattern: 'from ', weight: 2 },
                { pattern: 'class ', weight: 2 },
                { pattern: 'print(', weight: 2 },
                { pattern: 'if __name__', weight: 4 },
                { pattern: 'self.', weight: 3 },
                { pattern: 'lambda ', weight: 3 },
                { pattern: 'try:', weight: 2 },
                { pattern: 'except:', weight: 2 },
                { pattern: 'with ', weight: 2 },
                { pattern: '__init__', weight: 3 }
            ],
            score: 0
        },
        {
            lang: 'javascript',
            patterns: [
                { pattern: 'function ', weight: 2 },
                { pattern: 'const ', weight: 2 },
                { pattern: 'let ', weight: 2 },
                { pattern: 'var ', weight: 1 },
                { pattern: '=>', weight: 3 },
                { pattern: 'async ', weight: 3 },
                { pattern: 'await ', weight: 3 },
                { pattern: 'console.', weight: 4 },
                { pattern: 'document.', weight: 4 },
                { pattern: 'window.', weight: 4 },
                { pattern: 'require(', weight: 3 },
                { pattern: 'module.exports', weight: 4 },
                { pattern: 'addEventListener', weight: 4 }
            ],
            score: 0
        },
        {
            lang: 'typescript',
            patterns: [
                { pattern: 'interface ', weight: 5 },
                { pattern: 'type ', weight: 4 },
                { pattern: 'enum ', weight: 4 },
                { pattern: 'implements ', weight: 4 },
                { pattern: 'public ', weight: 3 },
                { pattern: 'private ', weight: 3 },
                { pattern: 'protected ', weight: 3 },
                { pattern: ': string', weight: 4 },
                { pattern: ': number', weight: 4 },
                { pattern: ': boolean', weight: 4 },
                { pattern: ': any', weight: 3 },
                { pattern: 'readonly ', weight: 4 },
                { pattern: 'abstract ', weight: 4 },
                { pattern: '<', weight: 1 } // Generics indicator
            ],
            score: 0
        },
        {
            lang: 'rust',
            patterns: [
                { pattern: 'fn ', weight: 3 },
                { pattern: 'let ', weight: 2 },
                { pattern: 'impl ', weight: 4 },
                { pattern: 'struct ', weight: 4 },
                { pattern: 'enum ', weight: 4 },
                { pattern: 'match ', weight: 4 },
                { pattern: 'use ', weight: 2 },
                { pattern: 'mod ', weight: 3 },
                { pattern: 'pub ', weight: 3 },
                { pattern: 'crate::', weight: 5 },
                { pattern: 'println!', weight: 5 },
                { pattern: 'vec![', weight: 4 },
                { pattern: 'Some(', weight: 4 },
                { pattern: 'None', weight: 4 }
            ],
            score: 0
        },
        {
            lang: 'go',
            patterns: [
                { pattern: 'func ', weight: 3 },
                { pattern: 'package ', weight: 4 },
                { pattern: 'import ', weight: 2 },
                { pattern: 'go ', weight: 3 },
                { pattern: 'chan ', weight: 5 },
                { pattern: 'defer ', weight: 4 },
                { pattern: 'goroutine', weight: 4 },
                { pattern: 'select ', weight: 4 },
                { pattern: 'interface{}', weight: 5 },
                { pattern: 'make(', weight: 4 },
                { pattern: 'new(', weight: 3 },
                { pattern: 'range ', weight: 4 }
            ],
            score: 0
        },
        {
            lang: 'c',
            patterns: [
                { pattern: '#include', weight: 5 },
                { pattern: 'int main', weight: 5 },
                { pattern: 'printf(', weight: 4 },
                { pattern: 'scanf(', weight: 4 },
                { pattern: 'malloc(', weight: 4 },
                { pattern: 'free(', weight: 4 },
                { pattern: 'void ', weight: 2 },
                { pattern: 'char ', weight: 2 },
                { pattern: 'int ', weight: 1 },
                { pattern: 'float ', weight: 2 },
                { pattern: 'double ', weight: 2 },
                { pattern: 'struct ', weight: 3 },
                { pattern: 'typedef ', weight: 4 }
            ],
            score: 0
        },
        {
            lang: 'cpp',
            patterns: [
                { pattern: '#include', weight: 4 },
                { pattern: 'std::', weight: 5 },
                { pattern: 'cout <<', weight: 5 },
                { pattern: 'cin >>', weight: 5 },
                { pattern: 'class ', weight: 3 },
                { pattern: 'public:', weight: 4 },
                { pattern: 'private:', weight: 4 },
                { pattern: 'protected:', weight: 4 },
                { pattern: 'virtual ', weight: 4 },
                { pattern: 'template<', weight: 5 },
                { pattern: 'namespace ', weight: 4 },
                { pattern: 'using namespace', weight: 5 }
            ],
            score: 0
        },
        {
            lang: 'java',
            patterns: [
                { pattern: 'public class', weight: 5 },
                { pattern: 'import java', weight: 5 },
                { pattern: 'System.out', weight: 5 },
                { pattern: 'public static', weight: 4 },
                { pattern: 'private ', weight: 2 },
                { pattern: 'protected ', weight: 2 },
                { pattern: 'interface ', weight: 3 },
                { pattern: 'extends ', weight: 4 },
                { pattern: 'implements ', weight: 4 },
                { pattern: 'throws ', weight: 3 },
                { pattern: 'try {', weight: 3 },
                { pattern: 'catch ', weight: 3 }
            ],
            score: 0
        },
        {
            lang: 'ruby',
            patterns: [
                { pattern: 'def ', weight: 3 },
                { pattern: 'class ', weight: 2 },
                { pattern: 'require ', weight: 3 },
                { pattern: 'gem ', weight: 4 },
                { pattern: 'puts ', weight: 3 },
                { pattern: 'end', weight: 1 },
                { pattern: 'do ', weight: 2 },
                { pattern: 'if ', weight: 1 },
                { pattern: 'elsif ', weight: 3 },
                { pattern: 'unless ', weight: 3 },
                { pattern: 'attr_accessor', weight: 5 },
                { pattern: 'initialize', weight: 4 },
                { pattern: 'self.', weight: 3 }
            ],
            score: 0
        },
        {
            lang: 'bash',
            patterns: [
                { pattern: '#!/bin/bash', weight: 5 },
                { pattern: '#!/bin/sh', weight: 5 },
                { pattern: 'function ', weight: 3 },
                { pattern: 'echo ', weight: 2 },
                { pattern: 'if [', weight: 4 },
                { pattern: 'then', weight: 3 },
                { pattern: 'fi', weight: 3 },
                { pattern: 'for ', weight: 2 },
                { pattern: 'do', weight: 2 },
                { pattern: 'done', weight: 2 },
                { pattern: 'while ', weight: 2 },
                { pattern: 'case ', weight: 3 },
                { pattern: 'esac', weight: 3 },
                { pattern: 'source ', weight: 3 },
                { pattern: 'export ', weight: 3 }
            ],
            score: 0
        },
        {
            lang: 'shell',
            patterns: [
                { pattern: '#!/bin/', weight: 4 },
                { pattern: 'echo ', weight: 2 },
                { pattern: 'ls ', weight: 2 },
                { pattern: 'cd ', weight: 2 },
                { pattern: 'mkdir ', weight: 2 },
                { pattern: 'rm ', weight: 2 },
                { pattern: 'cp ', weight: 2 },
                { pattern: 'mv ', weight: 2 },
                { pattern: 'grep ', weight: 3 },
                { pattern: 'sed ', weight: 3 },
                { pattern: 'awk ', weight: 3 },
                { pattern: 'chmod ', weight: 3 },
                { pattern: 'chown ', weight: 3 }
            ],
            score: 0
        },
        {
            lang: 'sql',
            patterns: [
                { pattern: 'SELECT ', weight: 5 },
                { pattern: 'FROM ', weight: 4 },
                { pattern: 'WHERE ', weight: 4 },
                { pattern: 'INSERT ', weight: 5 },
                { pattern: 'UPDATE ', weight: 5 },
                { pattern: 'DELETE ', weight: 5 },
                { pattern: 'CREATE ', weight: 4 },
                { pattern: 'ALTER ', weight: 4 },
                { pattern: 'DROP ', weight: 4 },
                { pattern: 'JOIN ', weight: 4 },
                { pattern: 'GROUP BY ', weight: 4 },
                { pattern: 'ORDER BY ', weight: 4 },
                { pattern: 'LIMIT ', weight: 3 }
            ],
            score: 0
        },
        {
            lang: 'json',
            patterns: [
                { pattern: '{"', weight: 3 },
                { pattern: '":', weight: 2 },
                { pattern: 'true', weight: 2 },
                { pattern: 'false', weight: 2 },
                { pattern: 'null', weight: 2 }
            ],
            score: 0
        },
        {
            lang: 'yaml',
            patterns: [
                { pattern: '---', weight: 4 },
                { pattern: /^  /m, weight: 2 }, // Indentation
                { pattern: ': ', weight: 2 },
                { pattern: '- ', weight: 2 }
            ],
            score: 0
        },
        {
            lang: 'html',
            patterns: [
                { pattern: '<!DOCTYPE', weight: 5 },
                { pattern: '<html>', weight: 4 },
                { pattern: '<head>', weight: 3 },
                { pattern: '<body>', weight: 3 },
                { pattern: '<div>', weight: 2 },
                { pattern: '<p>', weight: 2 },
                { pattern: '<script>', weight: 4 },
                { pattern: '<style>', weight: 4 },
                { pattern: 'href=', weight: 3 },
                { pattern: 'src=', weight: 3 }
            ],
            score: 0
        },
        {
            lang: 'css',
            patterns: [
                { pattern: '{', weight: 1 },
                { pattern: '}', weight: 1 },
                { pattern: ';', weight: 1 },
                { pattern: '@media', weight: 5 },
                { pattern: '@import', weight: 4 },
                { pattern: 'color:', weight: 3 },
                { pattern: 'background:', weight: 3 },
                { pattern: 'margin:', weight: 2 },
                { pattern: 'padding:', weight: 2 },
                { pattern: 'font-size:', weight: 3 }
            ],
            score: 0
        },
        {
            lang: 'markdown',
            patterns: [
                { pattern: '# ', weight: 3 },
                { pattern: '## ', weight: 3 },
                { pattern: '**', weight: 2 },
                { pattern: '* ', weight: 2 },
                { pattern: '- ', weight: 2 },
                { pattern: '1. ', weight: 3 },
                { pattern: '[', weight: 2 },
                { pattern: '](', weight: 2 },
                { pattern: '```', weight: 4 }
            ],
            score: 0
        },
        {
            lang: 'toml',
            patterns: [
                { pattern: '[', weight: 2 },
                { pattern: ']', weight: 2 },
                { pattern: '=', weight: 1 },
                { pattern: 'true', weight: 2 },
                { pattern: 'false', weight: 2 }
            ],
            score: 0
        }
    ];
    // Score each language based on weighted pattern matches
    for (const detection of detections) {
        let score = 0;
        for (const { pattern, weight } of detection.patterns) {
            let regex;
            if (pattern instanceof RegExp) {
                // Already a RegExp object
                regex = new RegExp(pattern.source, pattern.flags + 'gi');
            }
            else {
                // String pattern - escape special regex chars
                const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                regex = new RegExp(escapedPattern, 'gi');
            }
            const matches = lowerCode.match(regex);
            if (matches) {
                score += matches.length * weight;
            }
        }
        detection.score = score;
    }
    // Find the language with the highest score
    let bestLang = '';
    let bestScore = 0;
    for (const detection of detections) {
        if (detection.score > bestScore) {
            bestScore = detection.score;
            bestLang = detection.lang;
        }
    }
    // Only return a language if we have sufficient confidence (score >= 5)
    // This helps avoid false positives from generic patterns
    const result = bestScore >= 5 ? bestLang : '';
    // Cache the result
    languageDetectionCache.set(contentHash, result);
    return result;
}
/**
 * Render code using cli-highlight as fallback
 * Provides basic syntax highlighting when Shiki is unavailable
 */
function renderCodeWithCliHighlight(code, lang) {
    try {
        // Use cli-highlight with default theme for basic syntax highlighting
        return highlight(code, { language: lang });
    }
    catch (error) {
        // If cli-highlight fails, return plain text
        return code;
    }
}
/**
 * Render a code block with syntax highlighting and Bumblebee styling
 *
 * Features:
 * - Syntax highlighting using Shiki with github-dark theme
 * - Yellow borders (#F2D638) with top/bottom ─ and sides │
 * - 1 column padding inside borders
 * - Language badge in top-right corner (┤ Lang ├)
 * - Line wrapping for long lines
 * - Fallback system: Shiki → cli-highlight → plain text
 *
 * @param node - MDAST Code node
 * @param terminalWidth - Terminal width for wrapping
 * @param theme - Bumblebee theme with color palette
 * @returns Formatted ANSI string ready for terminal display
 */
export async function renderCodeBlock(node, terminalWidth, theme, useBlessedTags) {
    const endProfile = PerformanceProfiler.start('render-code-block');
    const code = node.value;
    let lang = node.lang || '';
    // Create cache key: hash of code + lang + width + theme identifier
    const themeKey = `${theme.current.yellowA}-${theme.current.gray}`;
    const cacheKey = `${createContentHash(code)}-${lang}-${terminalWidth}-${themeKey}`;
    // Check cache first
    const cached = codeBlockCache.get(cacheKey);
    if (cached !== undefined) {
        CacheStats.recordHit('codeBlock');
        endProfile();
        return cached;
    }
    CacheStats.recordMiss('codeBlock');
    // Apply language detection if no explicit language provided
    if (!lang) {
        lang = detectLanguage(code);
    }
    // Get syntax-highlighted code or plain text
    let highlightedCode;
    if (useBlessedTags) {
        // TUI mode: Use plain text to avoid mixing ANSI codes with blessed tags
        // Blessed parser can't handle mixed ANSI escape sequences and blessed tag syntax
        highlightedCode = code;
    }
    else {
        // Stdout mode: Use full syntax highlighting with ANSI codes
        try {
            // Try Shiki first (best quality highlighting)
            if (lang) {
                highlightedCode = await codeToAnsi(code, lang, 'truecolor');
            }
            else {
                highlightedCode = code;
            }
        }
        catch (error) {
            // Shiki failed, try cli-highlight as intermediate fallback
            try {
                if (lang) {
                    highlightedCode = renderCodeWithCliHighlight(code, lang);
                }
                else {
                    highlightedCode = code;
                }
            }
            catch (fallbackError) {
                // Both highlighting methods failed, use plain text
                highlightedCode = code;
            }
        }
    }
    // Split code into lines
    const codeLines = highlightedCode.split('\n');
    // Calculate content width (terminal width minus borders and padding)
    const borderWidth = 2; // │ on each side
    const paddingWidth = 2; // 1 space padding on each side
    const contentWidth = terminalWidth - borderWidth - paddingWidth;
    // Wrap long lines
    const wrappedLines = codeLines.flatMap(line => wrapCodeLine(line, contentWidth));
    // Create content lines with borders and padding
    const contentLines = wrappedLines.map((line, index) => {
        // Add padding to fill content area
        const paddedLine = addPadding(line, contentWidth, theme, useBlessedTags);
        if (useBlessedTags) {
            // TUI mode: No side borders (blessed pane already has borders)
            // Just add padding and content
            return '  ' + paddedLine + '  ';
        }
        else {
            // Stdout mode: Full borders with │ on each side
            const leftBorder = theme.current.yellowA + '│' + '\x1b[39m';
            const rightBorder = theme.current.yellowA + '│' + '\x1b[39m';
            const padding = ' ';
            return leftBorder + padding + paddedLine + padding + rightBorder;
        }
    });
    // Create top border with language badge if specified
    let topBorder;
    if (useBlessedTags) {
        // TUI mode: Simple approach - just add badge at end
        if (lang) {
            const badge = createLanguageBadge(lang, theme, useBlessedTags);
            const badgeWidth = getTextWidth(lang) + 4; // ┤ Lang ├
            const beforeBadge = '─'.repeat(terminalWidth - badgeWidth - 2);
            topBorder = '{yellow-fg}' + beforeBadge + badge + '{/yellow-fg}';
        }
        else {
            topBorder = '{yellow-fg}' + '─'.repeat(terminalWidth - 2) + '{/yellow-fg}';
        }
    }
    else {
        // Stdout mode: Use substring overlay
        topBorder = theme.current.yellowA + '─'.repeat(terminalWidth - 2) + '\x1b[39m';
        if (lang) {
            const badge = createLanguageBadge(lang, theme, useBlessedTags);
            const badgeWidth = getTextWidth(lang) + 4; // ┤ Lang ├
            const badgeStartPos = terminalWidth - badgeWidth - 1;
            const beforeBadge = topBorder.substring(0, badgeStartPos);
            const afterBadge = topBorder.substring(badgeStartPos + badgeWidth);
            topBorder = beforeBadge + badge + afterBadge;
        }
    }
    // Create bottom border (same as plain top border)
    const bottomBorder = useBlessedTags
        ? '{yellow-fg}' + '─'.repeat(terminalWidth - 2) + '{/yellow-fg}'
        : theme.current.yellowA + '─'.repeat(terminalWidth - 2) + '\x1b[39m';
    // Combine all lines
    const result = [topBorder, ...contentLines, bottomBorder].join('\n');
    // Cache the result
    codeBlockCache.set(cacheKey, result);
    endProfile();
    return result;
}
/**
 * Fallback renderer for plain code blocks when Shiki is not available
 */
function renderPlainCodeBlock(code, lang, terminalWidth, theme) {
    // Apply the same fallback logic as renderCodeBlock
    let highlightedCode;
    try {
        // Try cli-highlight for basic highlighting
        if (lang) {
            highlightedCode = renderCodeWithCliHighlight(code, lang);
        }
        else {
            highlightedCode = code;
        }
    }
    catch (error) {
        // cli-highlight failed, use plain text
        highlightedCode = code;
    }
    const lines = highlightedCode.split('\n');
    // Calculate content width (terminal width minus borders and padding)
    const borderWidth = 2; // │ on each side
    const paddingWidth = 2; // 1 space padding on each side
    const contentWidth = terminalWidth - borderWidth - paddingWidth;
    // Wrap long lines
    const wrappedLines = lines.flatMap(line => wrapCodeLine(line, contentWidth));
    // Create top border
    const topBorder = theme.current.yellowA + '─'.repeat(terminalWidth - 2) + '\x1b[39m';
    // Create bottom border (same as top)
    const bottomBorder = topBorder;
    // Create content lines with borders and padding
    const contentLines = wrappedLines.map((line, index) => {
        // Add padding to fill content area
        const paddedLine = addPadding(line, contentWidth, theme, false);
        // Create the full line: │ padding content padding │
        const leftBorder = theme.current.yellowA + '│' + '\x1b[39m';
        const rightBorder = theme.current.yellowA + '│' + '\x1b[39m';
        const padding = ' ';
        return leftBorder + padding + paddedLine + padding + rightBorder;
    });
    // Add language badge to top-right if language is specified
    let finalLines = contentLines;
    if (lang) {
        const badge = createLanguageBadge(lang, theme, false);
        // Overlay badge on the top border line
        if (finalLines.length > 0) {
            const topLine = finalLines[0];
            const badgeWidth = getTextWidth(lang) + 4; // ┤ Lang ├
            const badgeStartPos = terminalWidth - badgeWidth - 1; // Leave 1 space from right
            // Replace part of the top line with the badge
            const beforeBadge = topLine.substring(0, badgeStartPos);
            const afterBadge = topLine.substring(badgeStartPos + badgeWidth);
            finalLines[0] = beforeBadge + badge + afterBadge;
        }
    }
    // Combine all lines
    return [topBorder, ...finalLines, bottomBorder].join('\n');
}
/**
 * Wrap a single line of code if it's too long
 */
function wrapCodeLine(line, maxWidth) {
    if (getTextWidth(line) <= maxWidth) {
        return [line];
    }
    // Use the existing wrapText function
    const wrapped = wrapText(line, maxWidth);
    // Split back into individual lines
    return wrapped.split('\n');
}
/**
* Add padding to code lines to fill the content area
*/
function addPadding(line, contentWidth, theme, useBlessedTags) {
    // Calculate the visible width of the line (excluding ANSI codes)
    const visibleWidth = getTextWidth(line);
    // If the line is already at full width, return as-is
    if (visibleWidth >= contentWidth) {
        return line;
    }
    // Add plain space padding (no indentation guides)
    const padding = ' '.repeat(contentWidth - visibleWidth);
    return line + padding;
}
/**
* Create a language badge for the top-right corner
* Per spec: badge text #010600 (nearBlack), subtle background
 */
function createLanguageBadge(lang, theme, useBlessedTags) {
    // Use nearBlack text with subtle background (yellow border shows through)
    if (useBlessedTags) {
        return `{#010600-fg}┤ ${lang} ├{/#010600-fg}`;
    }
    else {
        const textColor = '\x1b[38;2;1;6;0m'; // nearBlack text
        const reset = '\x1b[39m';
        return `${textColor}┤ ${lang} ├${reset}`;
    }
}
