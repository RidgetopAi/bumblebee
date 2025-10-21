import type { Code } from 'mdast';

// Cast blessed to any to avoid TypeScript issues (neo-blessed has no types)
const blessedAny = (await import('neo-blessed')).default as any;

/**
 * Create a blessed Box widget for rendering code blocks in TUI mode
 *
 * This is Phase 5a: Widget-based code block rendering instead of flat text strings.
 * Uses blessed's native colors and styling for better integration with the TUI.
 *
 * @param code - The code content to render
 * @param lang - Language for syntax highlighting (optional)
 * @param width - Widget width in characters
 * @returns Blessed Box widget configured for code block display
 */
export function createCodeBlockWidget(code: string, lang: string = '', width: number): any {
  // Basic syntax highlighting using blessed colors
  const highlightedCode = highlightCode(code, lang);

  return blessedAny.box({
    width: width,
    height: 'shrink', // Auto-size height based on content
    content: highlightedCode,
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
function highlightCode(code: string, lang: string): string {
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
 * Uses blessed's built-in colors: cyan, green, yellow, magenta
 */
function highlightJavaScript(code: string): string {
  let result = code;

  // Keywords (cyan)
  const keywords = [
    'const', 'let', 'var', 'function', 'class', 'interface', 'type',
    'if', 'else', 'for', 'while', 'return', 'import', 'export',
    'async', 'await', 'try', 'catch', 'throw'
  ];

  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    result = result.replace(regex, `{cyan-fg}${keyword}{/cyan-fg}`);
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
 * Basic JSON syntax highlighting
 */
function highlightJSON(code: string): string {
  let result = code;

  // Strings (green)
  result = result.replace(/"([^"]*)"/g, `{green-fg}"$1"{/green-fg}`);

  // Numbers (yellow)
  result = result.replace(/\b\d+(\.\d+)?\b/g, `{yellow-fg}$&{/yellow-fg}`);

  // Booleans and null (cyan)
  const values = ['true', 'false', 'null'];
  for (const value of values) {
    const regex = new RegExp(`\\b${value}\\b`, 'g');
    result = result.replace(regex, `{cyan-fg}${value}{/cyan-fg}`);
  }

  return result;
}
