import blessed from 'neo-blessed';
// Cast blessed to any to avoid TypeScript issues (neo-blessed has no types)
const blessedAny = blessed;
/**
 * Add indentation guides to a code line within widget content area
 * @param line - Code line with blessed tags
 * @param contentWidth - Available content width (widget width - borders - padding)
 * @returns Line with indentation guides added
 */
function addIndentationGuides(line, contentWidth) {
    // Calculate visible width (ignoring blessed tags)
    const visibleWidth = getVisibleWidth(line);
    // If line already fills content area, return as-is
    if (visibleWidth >= contentWidth) {
        return line;
    }
    // Add padding with indentation guides every 4 columns
    let padding = '';
    for (let i = visibleWidth; i < contentWidth; i++) {
        if ((i + 1) % 4 === 0) {
            // Use blessed gray color for subtle guides
            padding += '{gray-fg}│{/gray-fg}';
        }
        else {
            padding += ' ';
        }
    }
    return line + padding;
}
/**
 * Calculate visible text width, ignoring blessed color tags
 * @param text - Text with blessed tags
 * @returns Visible character count
 */
function getVisibleWidth(text) {
    // Remove blessed tags like {color-fg} and {/color-fg}
    const withoutTags = text.replace(/\{[^}]+\}/g, '');
    return withoutTags.length;
}
/**
 * Create a blessed Box widget for rendering code blocks in TUI mode
 *
 * This is Phase 5a: Widget-based code block rendering instead of flat text strings.
 * Uses blessed's native colors and styling for better integration with the TUI.
 * Includes indentation guides (faint vertical lines) every 4 columns for improved readability.
 *
 * @param code - The code content to render
 * @param lang - Language for syntax highlighting (optional)
 * @param width - Widget width in characters
 * @returns Blessed Box widget configured for code block display
 */
export function createCodeBlockWidget(code, lang = '', width) {
    // Basic syntax highlighting using blessed colors
    const highlightedCode = highlightCode(code, lang);
    // Calculate content area width (widget width - borders - padding)
    const contentWidth = width - 4; // 2 for borders, 2 for padding
    // Add indentation guides to each line
    const linesWithGuides = highlightedCode.split('\n').map(line => addIndentationGuides(line, contentWidth)).join('\n');
    // Language badge for top border (only when language is specified)
    const label = lang ? `┤ ${lang} ├` : undefined;
    return blessedAny.box({
        width: width,
        height: 'shrink', // Auto-size height based on content
        content: linesWithGuides,
        label: label,
        border: {
            type: 'line',
            fg: 'yellow', // Bumblebee yellow border
        },
        padding: {
            left: 1,
            right: 1,
        },
        tags: true, // Enable blessed tag parsing
        style: {
            fg: 'white',
            bg: 'black',
        },
        scrollable: false, // Let parent handle scrolling
    });
}
/**
 * Apply basic syntax highlighting using blessed colors
 * Much simpler than Shiki - focuses on readability over perfection
 *
 * @param code - Raw code text
 * @param lang - Programming language
 * @returns Code with blessed color tags applied
 */
function highlightCode(code, lang) {
    switch (lang.toLowerCase()) {
        case 'javascript':
        case 'typescript':
            return highlightJavaScript(code);
        case 'json':
            return highlightJSON(code);
        default:
            return code; // Plain text for unsupported languages
    }
}
/**
* Basic JavaScript/TypeScript syntax highlighting
* Fine-tuned colors for improved readability and distinction
*/
function highlightJavaScript(code) {
    let result = code;
    // Keywords (magenta for better distinction)
    const keywords = [
        'const', 'let', 'var', 'function', 'class', 'private', 'constructor', 'new',
        'if', 'else', 'for', 'while', 'return', 'import', 'export',
        'async', 'await', 'try', 'catch', 'throw'
    ];
    for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        result = result.replace(regex, `{magenta-fg}${keyword}{/magenta-fg}`);
    }
    // Types and interfaces (cyan)
    const types = ['interface', 'type'];
    for (const type of types) {
        const regex = new RegExp(`\\b${type}\\b`, 'g');
        result = result.replace(regex, `{cyan-fg}${type}{/cyan-fg}`);
    }
    // Strings (green)
    result = result.replace(/(["'`])(.*?)\1/g, `{green-fg}$&{/green-fg}`);
    // Comments (gray)
    result = result.replace(/(\/\/.*$)/gm, `{gray-fg}$1{/gray-fg}`);
    result = result.replace(/(\/\*[\s\S]*?\*\/)/g, `{gray-fg}$&{/gray-fg}`);
    // Numbers (yellow)
    result = result.replace(/\b\d+(\.\d+)?\b/g, `{yellow-fg}$&{/yellow-fg}`);
    return result;
}
/**
* Basic JSON syntax highlighting with improved color distinction
*/
function highlightJSON(code) {
    let result = code;
    // Booleans and null first (cyan for values)
    result = result.replace(/\btrue\b/g, '{cyan-fg}true{/cyan-fg}');
    result = result.replace(/\bfalse\b/g, '{cyan-fg}false{/cyan-fg}');
    result = result.replace(/\bnull\b/g, '{cyan-fg}null{/cyan-fg}');
    // Keys (magenta for distinction from string values)
    result = result.replace(/"([^"]*?)"\s*:/g, `{magenta-fg}"$1"{/magenta-fg}:`);
    // String values (green)
    result = result.replace(/:\s*"([^"]*)"/g, `: {green-fg}"$1"{/green-fg}`);
    // Numbers (yellow)
    result = result.replace(/\b\d+(\.\d+)?\b/g, `{yellow-fg}$&{/yellow-fg}`);
    return result;
}
