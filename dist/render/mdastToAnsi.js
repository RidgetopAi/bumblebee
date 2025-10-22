import { parseMd } from '../parser/mdToAst.js';
import { wrapText } from './ansi/wrap.js';
import { getTextWidth } from './ansi/width.js';
import { renderCodeBlock } from './blocks/code.js';
/**
 * Render markdown content to ANSI-formatted terminal output.
 *
 * Takes markdown string, parses it to MDAST, and renders each node type
 * with appropriate ANSI formatting, colors, and text wrapping.
 *
 * @param markdown - Raw markdown string to render
 * @param width - Terminal width in columns for text wrapping
 * @param theme - Bumblebee theme with color palette and utilities
 * @returns RenderResult: ANSI-formatted string
 *
 * @example
 * ```typescript
 * import { bumblebeeTheme } from '../config/theme-bumblebee.js';
 * const output = await render('# Hello World\n\nThis is a paragraph.', 80, bumblebeeTheme);
 * console.log(output); // ANSI-formatted output
 * ```
 */
export async function render(markdown, width, theme) {
    const ast = parseMd(markdown);
    return await renderRoot(ast, width, theme);
}
/**
 * Render the root document node by joining all child nodes with newlines.
 */
async function renderRoot(node, terminalWidth, theme) {
    const children = await Promise.all(node.children.map(child => renderNode(child, terminalWidth, theme)));
    return children.join('\n\n');
}
/**
 * Render a single MDAST node to ANSI-formatted string.
 * Dispatches to specific handler functions based on node type.
 */
async function renderNode(node, terminalWidth, theme) {
    switch (node.type) {
        case 'paragraph':
            return renderParagraph(node, terminalWidth, theme);
        case 'heading':
            return renderHeading(node, terminalWidth, theme);
        case 'text':
            return renderText(node);
        case 'emphasis':
            return renderEmphasis(node, theme);
        case 'strong':
            return renderStrong(node, theme);
        case 'link':
            return renderLink(node, theme);
        case 'list':
            return await renderList(node, terminalWidth, theme);
        case 'listItem':
            return await renderListItem(node, terminalWidth, theme);
        case 'blockquote':
            return await renderBlockquote(node, terminalWidth, theme);
        case 'code':
            return await renderCodeBlock(node, terminalWidth, theme);
        case 'table':
            return renderTable(node, terminalWidth, theme);
        default:
            // Fallback for unknown node types
            return await renderUnknown(node, terminalWidth, theme);
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
function renderHeading(node, terminalWidth, theme) {
    const level = node.depth;
    const text = collectText(node);
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
async function renderList(node, terminalWidth, theme) {
    const isOrdered = node.ordered;
    const start = node.start || 1;
    const items = await Promise.all(node.children.map(async (item, index) => {
        const bullet = isOrdered ? `${start + index}.` : '•';
        return await renderListItemWithBullet(item, bullet, terminalWidth, theme);
    }));
    return items.join('\n');
}
/**
 * Render a list item with bullet/number prefix and indentation.
 */
async function renderListItem(node, terminalWidth, theme) {
    // This is called for nested list items, use a simple bullet
    return await renderListItemWithBullet(node, '•', terminalWidth, theme);
}
/**
 * Helper to render a list item with a specific bullet prefix.
 */
async function renderListItemWithBullet(node, bullet, terminalWidth, theme) {
    const renderedChildren = await Promise.all(node.children.map(child => renderNode(child, terminalWidth - 2, theme)));
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
async function renderBlockquote(node, terminalWidth, theme) {
    const renderedChildren = await Promise.all(node.children.map(child => renderNode(child, terminalWidth - 2, theme)));
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
async function renderUnknown(node, terminalWidth, theme) {
    // Try to render children if they exist
    if ('children' in node && Array.isArray(node.children)) {
        const children = await Promise.all(node.children.map((child) => renderNode(child, terminalWidth, theme)));
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
