import { codeToAnsi } from '../shiki.js';
import { wrapText } from '../ansi/wrap.js';
import { getTextWidth } from '../ansi/width.js';
/**
 * Render a code block with syntax highlighting and Bumblebee styling
 *
 * Features:
 * - Syntax highlighting using Shiki with github-dark theme
 * - Yellow borders (#F2D638) with top/bottom ─ and sides │
 * - 1 column padding inside borders
 * - Language badge in top-right corner (┤ Lang ├)
 * - Line wrapping for long lines
 * - Indentation guides (faint │ every 4 columns)
 *
 * @param node - MDAST Code node
 * @param terminalWidth - Terminal width for wrapping
 * @param theme - Bumblebee theme with color palette
 * @returns Formatted ANSI string ready for terminal display
 */
export function renderCodeBlock(node, terminalWidth, theme) {
    const code = node.value;
    const lang = node.lang || '';
    // Get syntax-highlighted ANSI code
    let highlightedCode;
    try {
        // Use Shiki for syntax highlighting if language is specified
        if (lang) {
            highlightedCode = codeToAnsi(code, lang, 'truecolor');
        }
        else {
            // Plain text for code blocks without language
            highlightedCode = code;
        }
    }
    catch (error) {
        // Fallback to plain text if highlighting fails
        highlightedCode = code;
    }
    // Split code into lines
    const codeLines = highlightedCode.split('\n');
    // Calculate content width (terminal width minus borders and padding)
    const borderWidth = 2; // │ on each side
    const paddingWidth = 2; // 1 space padding on each side
    const contentWidth = terminalWidth - borderWidth - paddingWidth;
    // Wrap long lines and add indentation guides
    const wrappedLines = codeLines.flatMap(line => wrapCodeLine(line, contentWidth));
    // Create content lines with borders, padding, and indentation guides
    const contentLines = wrappedLines.map((line, index) => {
        // Add indentation guides (faint │ every 4 columns in the content area)
        const lineWithGuides = addIndentationGuides(line, contentWidth, theme);
        // Create the full line: │ padding content padding │
        const leftBorder = theme.current.yellowA + '│' + '\x1b[39m';
        const rightBorder = theme.current.yellowA + '│' + '\x1b[39m';
        const padding = ' ';
        return leftBorder + padding + lineWithGuides + padding + rightBorder;
    });
    // Create top border with language badge if specified
    let topBorder = theme.current.yellowA + '─'.repeat(terminalWidth - 2) + '\x1b[39m';
    if (lang) {
        const badge = createLanguageBadge(lang, theme);
        const badgeWidth = getTextWidth(lang) + 4; // ┤ Lang ├
        const badgeStartPos = terminalWidth - badgeWidth - 1; // Leave 1 space from right
        // Overlay badge on the top border by replacing characters
        const beforeBadge = topBorder.substring(0, badgeStartPos);
        const afterBadge = topBorder.substring(badgeStartPos + badgeWidth);
        topBorder = beforeBadge + badge + afterBadge;
    }
    // Create bottom border (same as plain top border)
    const bottomBorder = theme.current.yellowA + '─'.repeat(terminalWidth - 2) + '\x1b[39m';
    // Combine all lines
    return [topBorder, ...contentLines, bottomBorder].join('\n');
}
/**
 * Fallback renderer for plain code blocks when Shiki is not available
 */
function renderPlainCodeBlock(code, lang, terminalWidth, theme) {
    const lines = code.split('\n');
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
    // Create content lines with borders, padding, and indentation guides
    const contentLines = wrappedLines.map((line, index) => {
        // Add indentation guides (faint │ every 4 columns in the content area)
        const lineWithGuides = addIndentationGuides(line, contentWidth, theme);
        // Create the full line: │ padding content padding │
        const leftBorder = theme.current.yellowA + '│' + '\x1b[39m';
        const rightBorder = theme.current.yellowA + '│' + '\x1b[39m';
        const padding = ' ';
        return leftBorder + padding + lineWithGuides + padding + rightBorder;
    });
    // Add language badge to top-right if language is specified
    let finalLines = contentLines;
    if (lang) {
        const badge = createLanguageBadge(lang, theme);
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
* Add indentation guides (faint │) every 4 columns
*/
function addIndentationGuides(line, contentWidth, theme) {
    // Calculate the visible width of the line (excluding ANSI codes)
    const visibleWidth = getTextWidth(line);
    // If the line is already at full width, return as-is
    if (visibleWidth >= contentWidth) {
        return line;
    }
    // Add padding with indentation guides
    let padding = '';
    for (let i = visibleWidth; i < contentWidth; i++) {
        if ((i + 1) % 4 === 0) { // +1 because positions are 1-indexed in the content area
            padding += theme.current.gray + '│' + '\x1b[39m';
        }
        else {
            padding += ' ';
        }
    }
    return line + padding;
}
/**
* Create a language badge for the top-right corner
* Per spec: badge text #010600 (nearBlack), subtle background
 */
function createLanguageBadge(lang, theme) {
    // Use nearBlack text with subtle background (yellow border shows through)
    const textColor = '\x1b[38;2;1;6;0m'; // nearBlack text
    const reset = '\x1b[39m';
    return `${textColor}┤ ${lang} ├${reset}`;
}
