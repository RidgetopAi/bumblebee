import { parseMd } from '../parser/mdToAst.js';
import { wrapText } from './ansi/wrap.js';
import { getTextWidth } from './ansi/width.js';
import { renderCodeBlock } from './blocks/code.js';
import type { BumblebeeTheme } from '../config/theme-bumblebee.js';
import type { Root, RootContent, Paragraph, Heading, Text, Emphasis, Strong, Link, List, ListItem, Blockquote, Code, Table, TableRow, TableCell } from 'mdast';

/**
 * Render markdown content to ANSI-formatted terminal output or blessed tags.
 *
 * Takes markdown string, parses it to MDAST, and renders each node type
 * with appropriate ANSI formatting, colors, and text wrapping.
 *
 * @param markdown - Raw markdown string to render
 * @param width - Terminal width in columns for text wrapping
 * @param theme - Bumblebee theme with color palette and utilities
 * @param useBlessedTags - Use blessed tags (e.g. {yellow-fg}) instead of ANSI codes
 * @returns Formatted string ready for terminal display
 *
 * @example
 * ```typescript
 * import { bumblebeeTheme } from '../config/theme-bumblebee.js';
 * const output = render('# Hello World\n\nThis is a paragraph.', 80, bumblebeeTheme, false);
 * console.log(output); // ANSI-formatted output
 * ```
 */
export function render(markdown: string, width: number, theme: BumblebeeTheme, useBlessedTags: boolean = false): string {
  const ast = parseMd(markdown);
  return renderRoot(ast, width, theme, useBlessedTags);
}

/**
 * Render the root document node by joining all child nodes with newlines.
 */
function renderRoot(node: Root, terminalWidth: number, theme: BumblebeeTheme, useBlessedTags: boolean): string {
  const children = node.children.map(child => renderNode(child, terminalWidth, theme, useBlessedTags));
  return children.join('\n\n');
}

/**
 * Render a single MDAST node to ANSI-formatted string.
 * Dispatches to specific handler functions based on node type.
 */
function renderNode(node: RootContent, terminalWidth: number, theme: BumblebeeTheme, useBlessedTags: boolean): string {
  switch (node.type) {
    case 'paragraph':
      return renderParagraph(node as Paragraph, terminalWidth, theme);
    case 'heading':
      return renderHeading(node as Heading, terminalWidth, theme, useBlessedTags);
    case 'text':
      return renderText(node as Text);
    case 'emphasis':
      return renderEmphasis(node as Emphasis, theme);
    case 'strong':
      return renderStrong(node as Strong, theme);
    case 'link':
      return renderLink(node as Link, theme);
    case 'list':
      return renderList(node as List, terminalWidth, theme, useBlessedTags);
    case 'listItem':
      return renderListItem(node as ListItem, terminalWidth, theme, useBlessedTags);
    case 'blockquote':
      return renderBlockquote(node as Blockquote, terminalWidth, theme, useBlessedTags);
    case 'code':
      return renderCodeBlock(node as Code, terminalWidth, theme);
    case 'table':
      return renderTable(node as Table, terminalWidth, theme);
    default:
      // Fallback for unknown node types
      return renderUnknown(node, terminalWidth, theme, useBlessedTags);
  }
}

/**
 * Render a paragraph by collecting text content and wrapping to terminal width.
 */
function renderParagraph(node: Paragraph, terminalWidth: number, theme: BumblebeeTheme): string {
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
function renderHeading(node: Heading, terminalWidth: number, theme: BumblebeeTheme, useBlessedTags: boolean): string {
  const level = node.depth;
  const text = collectText(node);
  const prefix = '#'.repeat(level) + ' ';

  if (useBlessedTags) {
    // Use blessed tags for TUI mode
    switch (level) {
      case 1:
        return '{bold}{underline}{yellow-fg}' + prefix + text + '{/yellow-fg}{/underline}{/bold}';
      case 2:
        return '{bold}{yellow-fg}' + prefix + text + '{/yellow-fg}{/bold}';
      case 3:
        return '{bold}{yellow-fg}' + prefix + text + '{/yellow-fg}{/bold}';
      case 4:
        return '{yellow-fg}' + prefix + text + '{/yellow-fg}';
      case 5:
      case 6:
      default:
        return '{#8E8F95-fg}' + prefix + text + '{/#8E8F95-fg}';
    }
  } else {
    // Use ANSI codes for stdout mode
    switch (level) {
      case 1:
        // Bold + Underline + yellowA
        return '\x1b[1m\x1b[4m' + theme.current.yellowA + prefix + text + '\x1b[39m\x1b[24m\x1b[22m';
      case 2:
        // Bold + yellowA
        return '\x1b[1m' + theme.current.yellowA + prefix + text + '\x1b[39m\x1b[22m';
      case 3:
        // Bold + yellowB
        return '\x1b[1m' + theme.current.yellowB + prefix + text + '\x1b[39m\x1b[22m';
      case 4:
        // yellowB (no bold)
        return theme.current.yellowB + prefix + text + '\x1b[39m';
      case 5:
      case 6:
      default:
        // gray (subtle)
        return theme.current.gray + prefix + text + '\x1b[39m';
    }
  }
}

/**
 * Render plain text content.
 */
function renderText(node: Text): string {
  return node.value;
}

/**
 * Render emphasis (italic) text.
 */
function renderEmphasis(node: Emphasis, theme: BumblebeeTheme): string {
  const text = collectText(node);
  // Use italic ANSI code
  return '\x1b[3m' + text + '\x1b[23m';
}

/**
 * Render strong (bold) text.
 */
function renderStrong(node: Strong, theme: BumblebeeTheme): string {
  const text = collectText(node);
  // Use bright/bold ANSI code
  return '\x1b[1m' + text + '\x1b[22m';
}

/**
 * Render a link with underline and cyan color.
 */
function renderLink(node: Link, theme: BumblebeeTheme): string {
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
function renderList(node: List, terminalWidth: number, theme: BumblebeeTheme, useBlessedTags: boolean): string {
  const isOrdered = node.ordered;
  const start = node.start || 1;

  const items = node.children.map((item, index) => {
    const bullet = isOrdered ? `${start + index}.` : '•';
    return renderListItemWithBullet(item as ListItem, bullet, terminalWidth, theme, useBlessedTags);
  });

  return items.join('\n');
}

/**
 * Render a list item with bullet/number prefix and indentation.
 */
function renderListItem(node: ListItem, terminalWidth: number, theme: BumblebeeTheme, useBlessedTags: boolean): string {
  // This is called for nested list items, use a simple bullet
  return renderListItemWithBullet(node, '•', terminalWidth, theme, useBlessedTags);
}

/**
 * Helper to render a list item with a specific bullet prefix.
 */
function renderListItemWithBullet(
  node: ListItem,
  bullet: string,
  terminalWidth: number,
  theme: BumblebeeTheme,
  useBlessedTags: boolean
): string {
  const content = node.children
    .map(child => renderNode(child, terminalWidth - 2, theme, useBlessedTags)) // -2 for bullet + space
    .join('\n');

  const lines = content.split('\n');
  const indentedLines = lines.map((line, index) => {
    if (index === 0) {
      return bullet + ' ' + line;
    } else {
      return '  ' + line; // Indent continuation lines
    }
  });

  return indentedLines.join('\n');
}

/**
 * Render a blockquote with left border bar and gray color.
 */
function renderBlockquote(node: Blockquote, terminalWidth: number, theme: BumblebeeTheme, useBlessedTags: boolean): string {
  const content = node.children
    .map(child => renderNode(child, terminalWidth - 2, theme, useBlessedTags)) // -2 for border
    .join('\n\n');

  const lines = content.split('\n');
  const borderedLines = lines.map(line => {
    const border = theme.current.gray + '│' + '\x1b[0m';
    const dimmedLine = '\x1b[2m' + line + '\x1b[22m'; // Dim the text
    return border + ' ' + dimmedLine;
  });

  return borderedLines.join('\n');
}


function renderTable(node: Table, terminalWidth: number, theme: BumblebeeTheme): string {
  if (!node.children.length) return '';

  const rows = node.children as TableRow[];
  const headerRow = rows[0];
  const dataRows = rows.slice(1);

  // Calculate column widths based on content
  const columnWidths = calculateColumnWidths(rows, terminalWidth);

  // Render header
  const headerCells = headerRow.children.map((cell, index) =>
    renderTableCell(cell as TableCell, columnWidths[index])
  );

  // Render data rows
  const dataRowStrings = dataRows.map(row => {
    const cells = row.children.map((cell, index) =>
      renderTableCell(cell as TableCell, columnWidths[index])
    );
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
function renderTableCell(cell: TableCell, maxWidth: number): string {
  const text = collectText(cell);
  // For now, just truncate if too long (Phase 6 will handle wrapping)
  if (getTextWidth(text) <= maxWidth) {
    return text.padEnd(maxWidth);
  } else {
    return text.substring(0, maxWidth - 3) + '...';
  }
}

/**
 * Calculate optimal column widths for a table.
 */
function calculateColumnWidths(rows: TableRow[], maxTotalWidth: number): number[] {
  const cells = rows.flatMap(row => row.children as TableCell[]);
  const numColumns = rows[0]?.children.length || 0;

  if (numColumns === 0) return [];

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
function renderUnknown(node: RootContent, terminalWidth: number, theme: BumblebeeTheme, useBlessedTags: boolean): string {
  // Try to render children if they exist
  if ('children' in node && Array.isArray(node.children)) {
    const children = (node as any).children.map((child: RootContent) =>
      renderNode(child, terminalWidth, theme, useBlessedTags)
    );
    return children.join('');
  }

  // Fallback to empty string
  return '';
}

/**
 * Recursively collect text content from a node and its children.
 * Used for nodes that contain inline elements like emphasis, strong, links.
 */
function collectText(node: RootContent | Root): string {
  if (node.type === 'text') {
    return (node as Text).value;
  }

  if ('children' in node && Array.isArray(node.children)) {
    return (node as any).children.map(collectText).join('');
  }

  // For leaf nodes without text, return empty string
  return '';
}