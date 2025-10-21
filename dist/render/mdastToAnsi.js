import { parseMd } from '../parser/mdToAst.js';
import { wrapText } from './ansi/wrap.js';
import { getTextWidth } from './ansi/width.js';
import { renderCodeBlock } from './blocks/code.js';
import { createCodeBlockWidget } from '../tui/components/codeBlock.js';
/**
 * Render markdown content to ANSI-formatted terminal output or blessed tags/widgets.
 *
 * Takes markdown string, parses it to MDAST, and renders each node type
 * with appropriate ANSI formatting, colors, and text wrapping.
 *
 * In stdout mode: returns formatted string
 * In TUI mode: returns object with text content and widget placements
 *
 * @param markdown - Raw markdown string to render
 * @param width - Terminal width in columns for text wrapping
 * @param theme - Bumblebee theme with color palette and utilities
 * @param useBlessedTags - Use blessed tags/widgets instead of ANSI codes
 * @returns RenderResult: string for stdout, object with widgets for TUI
 *
 * @example
 * ```typescript
 * import { bumblebeeTheme } from '../config/theme-bumblebee.js';
 * const output = await render('# Hello World\n\nThis is a paragraph.', 80, bumblebeeTheme, false);
 * if (typeof output === 'string') {
 *   console.log(output); // ANSI-formatted output
 * } else {
 *   // Handle TUI widgets
 * }
 * ```
 */
export async function render(markdown, width, theme, useBlessedTags = false) {
    const ast = parseMd(markdown);
    return await renderRoot(ast, width, theme, useBlessedTags);
}
/**
 * Render the root document node by joining all child nodes with newlines.
 */
async function renderRoot(node, terminalWidth, theme, useBlessedTags) {
    if (!useBlessedTags) {
        // Stdout mode: simple string concatenation
        const children = await Promise.all(node.children.map(child => renderNode(child, terminalWidth, theme, useBlessedTags)));
        return children.join('\n\n');
    }
    // TUI mode: collect text and widgets separately
    const results = await Promise.all(node.children.map(child => renderNode(child, terminalWidth, theme, useBlessedTags)));
    let textContent = '';
    const allWidgets = [];
    let currentLine = 0;
    for (const result of results) {
        if (typeof result === 'string') {
            // Regular text content
            if (textContent)
                textContent += '\n\n';
            textContent += result;
            currentLine += result.split('\n').length + 2; // +2 for the \n\n separator
        }
        else {
            // Widget content
            if (textContent)
                textContent += '\n\n';
            // Add blank lines for widget space
            const maxWidgetHeight = Math.max(...result.widgets.map(w => w.lineCount));
            const blankLines = '\n'.repeat(maxWidgetHeight);
            textContent += blankLines;
            // Adjust widget line positions and add to collection
            for (const widget of result.widgets) {
                allWidgets.push({
                    widget: widget.widget,
                    startLine: currentLine + widget.startLine,
                    lineCount: widget.lineCount
                });
            }
            // Advance past the widget space
            currentLine += maxWidgetHeight + 2;
        }
    }
    return {
        textContent: textContent.replace(/\n\n$/, ''), // Remove trailing separator
        widgets: allWidgets
    };
}
/**
 * Render a single MDAST node to ANSI-formatted string or widget object.
 * Dispatches to specific handler functions based on node type.
 */
async function renderNode(node, terminalWidth, theme, useBlessedTags) {
    switch (node.type) {
        case 'paragraph':
            return renderParagraph(node, terminalWidth, theme);
        case 'heading':
            return renderHeading(node, terminalWidth, theme, useBlessedTags);
        case 'text':
            return renderText(node);
        case 'emphasis':
            return renderEmphasis(node, theme);
        case 'strong':
            return renderStrong(node, theme);
        case 'link':
            return renderLink(node, theme);
        case 'list':
            return await renderList(node, terminalWidth, theme, useBlessedTags);
        case 'listItem':
            return await renderListItem(node, terminalWidth, theme, useBlessedTags);
        case 'blockquote':
            return await renderBlockquote(node, terminalWidth, theme, useBlessedTags);
        case 'code':
            if (useBlessedTags) {
                // TUI mode: create widget instead of string
                return await renderCodeBlockWidget(node, terminalWidth, theme);
            }
            else {
                // Stdout mode: render as string
                return await renderCodeBlock(node, terminalWidth, theme, useBlessedTags);
            }
        case 'table':
            return renderTable(node, terminalWidth, theme);
        default:
            // Fallback for unknown node types
            return renderUnknown(node, terminalWidth, theme, useBlessedTags);
    }
}
/**
 * Render a paragraph by collecting text content and wrapping to terminal width.
 */
function renderParagraph(node, terminalWidth, theme) {
    const text = collectText(node);
    return wrapText(text, terminalWidth);
}
/**
 * Render a heading with proper styling hierarchy (without # prefixes).
 *
 * Heading levels are styled with decreasing prominence:
 * - H1: Bold + Underline + yellowA (most prominent)
 * - H2: Bold + yellowA
 * - H3: Bold + yellowB
 * - H4: yellowB (no bold)
 * - H5-H6: gray (subtle)
 */
function renderHeading(node, terminalWidth, theme, useBlessedTags) {
    const level = node.depth;
    const text = collectText(node);
    if (useBlessedTags) {
        // Use blessed tags for TUI mode
        switch (level) {
            case 1:
                return '{bold}{underline}{yellow-fg}' + text + '{/yellow-fg}{/underline}{/bold}';
            case 2:
                return '{bold}{yellow-fg}' + text + '{/yellow-fg}{/bold}';
            case 3:
                return '{bold}{yellow-fg}' + text + '{/yellow-fg}{/bold}';
            case 4:
                return '{yellow-fg}' + text + '{/yellow-fg}';
            case 5:
            case 6:
            default:
                return '{#8E8F95-fg}' + text + '{/#8E8F95-fg}';
        }
    }
    else {
        // Use ANSI codes for stdout mode
        switch (level) {
            case 1:
                // Bold + Underline + yellowA
                return '\x1b[1m\x1b[4m' + theme.current.yellowA + text + '\x1b[39m\x1b[24m\x1b[22m';
            case 2:
                // Bold + yellowA
                return '\x1b[1m' + theme.current.yellowA + text + '\x1b[39m\x1b[22m';
            case 3:
                // Bold + yellowB
                return '\x1b[1m' + theme.current.yellowB + text + '\x1b[39m\x1b[22m';
            case 4:
                // yellowB (no bold)
                return theme.current.yellowB + text + '\x1b[39m';
            case 5:
            case 6:
            default:
                // gray (subtle)
                return theme.current.gray + text + '\x1b[39m';
        }
    }
}
/**
 * Render plain text content.
 */
function renderText(node) {
    return node.value;
}
/**
 * Render emphasis (italic) text.
 */
function renderEmphasis(node, theme) {
    const text = collectText(node);
    // Use italic ANSI code
    return '\x1b[3m' + text + '\x1b[23m';
}
/**
 * Render strong (bold) text.
 */
function renderStrong(node, theme) {
    const text = collectText(node);
    // Use bright/bold ANSI code
    return '\x1b[1m' + text + '\x1b[22m';
}
/**
 * Render a link with underline and cyan color.
 */
function renderLink(node, theme) {
    const text = collectText(node);
    const url = node.url;
    // Underline + cyan color
    const styledText = '\x1b[4m' + theme.current.cyan + text + '\x1b[0m';
    // Add URL in parentheses
    return styledText + ' (' + url + ')';
}
/**
 * Render a list (ordered or unordered).
 */
async function renderList(node, terminalWidth, theme, useBlessedTags) {
    const isOrdered = node.ordered;
    const start = node.start || 1;
    const items = await Promise.all(node.children.map(async (item, index) => {
        const bullet = isOrdered ? `${start + index}.` : '•';
        return await renderListItemWithBullet(item, bullet, terminalWidth, theme, useBlessedTags);
    }));
    return items.join('\n');
}
/**
 * Render a list item with bullet/number prefix and indentation.
 */
async function renderListItem(node, terminalWidth, theme, useBlessedTags) {
    // This is called for nested list items, use a simple bullet
    return await renderListItemWithBullet(node, '•', terminalWidth, theme, useBlessedTags);
}
/**
 * Helper to render a list item with a specific bullet prefix.
 */
async function renderListItemWithBullet(node, bullet, terminalWidth, theme, useBlessedTags) {
    const renderedChildren = await Promise.all(node.children.map(child => renderNode(child, terminalWidth - 2, theme, useBlessedTags)));
    const content = renderedChildren.join('\n');
    const lines = content.split('\n');
    const indentedLines = lines.map((line, index) => {
        if (index === 0) {
            return bullet + ' ' + line;
        }
        else {
            return '  ' + line; // Indent continuation lines
        }
    });
    return indentedLines.join('\n');
}
/**
 * Render a blockquote with left border bar and gray color.
 */
async function renderBlockquote(node, terminalWidth, theme, useBlessedTags) {
    const renderedChildren = await Promise.all(node.children.map(child => renderNode(child, terminalWidth - 2, theme, useBlessedTags)));
    const content = renderedChildren.join('\n\n');
    const lines = content.split('\n');
    const borderedLines = lines.map(line => {
        const border = theme.current.gray + '│' + '\x1b[0m';
        const dimmedLine = '\x1b[2m' + line + '\x1b[22m'; // Dim the text
        return border + ' ' + dimmedLine;
    });
    return borderedLines.join('\n');
}
/**
 * Render a table (unstyled, basic layout).
 */
function renderTable(node, terminalWidth, theme) {
    if (!node.children.length)
        return '';
    const rows = node.children;
    const headerRow = rows[0];
    const dataRows = rows.slice(1);
    // Calculate column widths based on content
    const columnWidths = calculateColumnWidths(rows, terminalWidth);
    // Render header
    const headerCells = headerRow.children.map((cell, index) => renderTableCell(cell, columnWidths[index]));
    // Render data rows
    const dataRowStrings = dataRows.map(row => {
        const cells = row.children.map((cell, index) => renderTableCell(cell, columnWidths[index]));
        return cells.join(' | ');
    });
    // Combine header and data
    const separator = columnWidths.map(width => '-'.repeat(width)).join('-+-');
    const allRows = [headerCells.join(' | '), separator, ...dataRowStrings];
    return allRows.join('\n');
}
/**
 * Render a single table cell, wrapping if necessary.
 */
function renderTableCell(cell, maxWidth) {
    const text = collectText(cell);
    // For now, just truncate if too long (Phase 6 will handle wrapping)
    if (getTextWidth(text) <= maxWidth) {
        return text.padEnd(maxWidth);
    }
    else {
        return text.substring(0, maxWidth - 3) + '...';
    }
}
/**
 * Calculate optimal column widths for a table.
 */
function calculateColumnWidths(rows, maxTotalWidth) {
    const cells = rows.flatMap(row => row.children);
    const numColumns = rows[0]?.children.length || 0;
    if (numColumns === 0)
        return [];
    // Get max width for each column
    const columnWidths = Array(numColumns).fill(0);
    for (const cell of cells) {
        const cellText = collectText(cell);
        const cellWidth = getTextWidth(cellText);
        const colIndex = cells.indexOf(cell) % numColumns;
        columnWidths[colIndex] = Math.max(columnWidths[colIndex], cellWidth);
    }
    // Ensure total width doesn't exceed terminal width
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0) +
        (numColumns - 1) * 3; // 3 chars for ' | '
    if (totalWidth > maxTotalWidth) {
        // Scale down proportionally
        const scale = maxTotalWidth / totalWidth;
        return columnWidths.map(width => Math.floor(width * scale));
    }
    return columnWidths;
}
/**
 * Fallback renderer for unknown node types.
 */
function renderUnknown(node, terminalWidth, theme, useBlessedTags) {
    // Try to render children if they exist
    if ('children' in node && Array.isArray(node.children)) {
        const children = node.children.map((child) => renderNode(child, terminalWidth, theme, useBlessedTags));
        return children.join('');
    }
    // Fallback to empty string
    return '';
}
/**
 * Recursively collect text content from a node and its children.
 * Used for nodes that contain inline elements like emphasis, strong, links.
 */
function collectText(node) {
    if (node.type === 'text') {
        return node.value;
    }
    if ('children' in node && Array.isArray(node.children)) {
        return node.children.map(collectText).join('');
    }
    // For leaf nodes without text, return empty string
    return '';
}
/**
 * Render a code block as a blessed widget for TUI mode.
 * Creates a widget object and returns it with positioning information.
 */
async function renderCodeBlockWidget(node, terminalWidth, theme) {
    const code = node.value;
    const lang = node.lang || '';
    // Create the blessed widget
    const widget = createCodeBlockWidget(code, lang, terminalWidth);
    // Calculate how many lines this widget will occupy
    // Widget uses 'shrink' height, so we need to estimate based on content
    const lines = code.split('\n');
    const lineCount = Math.max(lines.length + 2, 3); // +2 for borders, minimum 3 lines
    return {
        textContent: '', // Widget replaces text content
        widgets: [{
                widget,
                startLine: 0, // Widget starts at current position
                lineCount
            }]
    };
}
