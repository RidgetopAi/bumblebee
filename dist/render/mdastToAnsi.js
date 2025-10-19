import { parseMd } from '../parser/mdToAst.js';
import { wrapText } from './ansi/wrap.js';
import { getTextWidth } from './ansi/width.js';
/**
 * Render markdown content to ANSI-formatted terminal output.
 *
 * Takes markdown string, parses it to MDAST, and renders each node type
 * with appropriate ANSI formatting, colors, and text wrapping.
 *
 * @param markdown - Raw markdown string to render
 * @param width - Terminal width in columns for text wrapping
 * @param theme - Bumblebee theme with color palette and utilities
 * @returns ANSI-formatted string ready for terminal display
 *
 * @example
 * ```typescript
 * import { bumblebeeTheme } from '../config/theme-bumblebee.js';
 * const output = render('# Hello World\n\nThis is a paragraph.', 80, bumblebeeTheme);
 * console.log(output); // ANSI-formatted output
 * ```
 */
export function render(markdown, width, theme) {
    const ast = parseMd(markdown);
    return renderRoot(ast, width, theme);
}
/**
 * Render the root document node by joining all child nodes with newlines.
 */
function renderRoot(node, terminalWidth, theme) {
    const children = node.children.map(child => renderNode(child, terminalWidth, theme));
    return children.join('\n\n');
}
/**
 * Render a single MDAST node to ANSI-formatted string.
 * Dispatches to specific handler functions based on node type.
 */
function renderNode(node, terminalWidth, theme) {
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
            return renderList(node, terminalWidth, theme);
        case 'listItem':
            return renderListItem(node, terminalWidth, theme);
        case 'blockquote':
            return renderBlockquote(node, terminalWidth, theme);
        case 'code':
            return renderCode(node, terminalWidth, theme);
        case 'table':
            return renderTable(node, terminalWidth, theme);
        default:
            // Fallback for unknown node types
            return renderUnknown(node, terminalWidth, theme);
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
 * Render a heading with # prefixes and emphasis.
 */
function renderHeading(node, terminalWidth, theme) {
    const level = node.depth;
    const prefix = '#'.repeat(level) + ' ';
    const text = collectText(node);
    const headingText = prefix + text;
    // Apply yellow emphasis to the entire heading
    const emphasized = theme.current.yellowB + headingText + '\x1b[0m';
    return wrapText(emphasized, terminalWidth);
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
function renderList(node, terminalWidth, theme) {
    const isOrdered = node.ordered;
    const start = node.start || 1;
    const items = node.children.map((item, index) => {
        const bullet = isOrdered ? `${start + index}.` : '•';
        return renderListItemWithBullet(item, bullet, terminalWidth, theme);
    });
    return items.join('\n');
}
/**
 * Render a list item with bullet/number prefix and indentation.
 */
function renderListItem(node, terminalWidth, theme) {
    // This is called for nested list items, use a simple bullet
    return renderListItemWithBullet(node, '•', terminalWidth, theme);
}
/**
 * Helper to render a list item with a specific bullet prefix.
 */
function renderListItemWithBullet(node, bullet, terminalWidth, theme) {
    const content = node.children
        .map(child => renderNode(child, terminalWidth - 2, theme)) // -2 for bullet + space
        .join('\n');
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
function renderBlockquote(node, terminalWidth, theme) {
    const content = node.children
        .map(child => renderNode(child, terminalWidth - 2, theme)) // -2 for border
        .join('\n\n');
    const lines = content.split('\n');
    const borderedLines = lines.map(line => {
        const border = theme.current.gray + '│' + '\x1b[0m';
        const dimmedLine = '\x1b[2m' + line + '\x1b[22m'; // Dim the text
        return border + ' ' + dimmedLine;
    });
    return borderedLines.join('\n');
}
/**
 * Render a code block (plain, no syntax highlighting yet).
 */
function renderCode(node, terminalWidth, theme) {
    const code = node.value;
    const lang = node.lang || '';
    // Simple code block with borders
    const lines = code.split('\n');
    const borderedLines = lines.map(line => {
        // Use gray border for code blocks
        const border = theme.current.gray + '│' + '\x1b[0m';
        return border + ' ' + line;
    });
    // Add language badge if present
    if (lang) {
        const badge = theme.current.gray + '┤ ' + lang + ' ├' + '\x1b[0m';
        borderedLines.unshift(badge);
    }
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
function renderUnknown(node, terminalWidth, theme) {
    // Try to render children if they exist
    if ('children' in node && Array.isArray(node.children)) {
        const children = node.children.map((child) => renderNode(child, terminalWidth, theme));
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
