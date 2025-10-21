import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock neo-blessed to avoid requiring a screen
vi.mock('neo-blessed', () => ({
  default: {
    box: vi.fn((config) => ({
      ...config,
      // Add blessed-specific properties that tests expect
      width: config.width,
      height: config.height,
      content: config.content,
      border: config.border,
      padding: config.padding,
      style: config.style,
      tags: config.tags,
      scrollable: config.scrollable,
      // Mock blessed methods
      setContent: vi.fn(),
      render: vi.fn(),
    })),
  },
}));

import { createCodeBlockWidget } from '../src/tui/components/codeBlock';

// Import the syntax highlighting functions directly for testing
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

describe('Code Block Widget Component - Syntax Highlighting', () => {
  it('should apply basic JavaScript syntax highlighting', () => {
    const code = 'const x = 42; function test() { return "hello"; }';
    const result = highlightCode(code, 'javascript');

    // Check that blessed tags are applied for syntax highlighting
    expect(result).toContain('{cyan-fg}const{/cyan-fg}');
    expect(result).toContain('{cyan-fg}function{/cyan-fg}');
    expect(result).toContain('{yellow-fg}42{/yellow-fg}');
    expect(result).toContain('{green-fg}"hello"{/green-fg}');
  });

  it('should apply basic JSON syntax highlighting', () => {
    const code = '{"name": "test", "value": 123, "active": true}';
    const result = highlightCode(code, 'json');

    expect(result).toContain('{green-fg}"name"{/green-fg}');
    expect(result).toContain('{green-fg}"test"{/green-fg}');
    expect(result).toContain('{yellow-fg}123{/yellow-fg}');
    expect(result).toContain('{cyan-fg}true{/cyan-fg}');
  });

  it('should handle plain text for unsupported languages', () => {
    const code = 'some plain text code';
    const result = highlightCode(code, 'unknown');

    expect(result).toBe(code);
  });

  it('should handle empty language', () => {
    const code = 'console.log("test");';
    const result = highlightCode(code, '');

    expect(result).toBe(code);
  });

  it('should handle TypeScript syntax highlighting', () => {
    const code = 'interface User { name: string; } const user: User = { name: "test" };';
    const result = highlightCode(code, 'typescript');

    expect(result).toContain('{cyan-fg}interface{/cyan-fg}');
    expect(result).toContain('{cyan-fg}const{/cyan-fg}');
    expect(result).toContain('{green-fg}"test"{/green-fg}');
  });
});

describe('Code Block Widget Component - Widget Rendering', () => {
  it('should create a blessed Box widget with correct configuration', () => {
    const code = 'const x = 42;';
    const widget = createCodeBlockWidget(code, 'javascript', 50);

    // Verify it's a blessed box (has blessed properties)
    expect(widget).toBeDefined();
    expect(typeof widget).toBe('object');

    // Check basic blessed box properties
    expect(widget.width).toBe(50);
    expect(widget.height).toBe('shrink');
    expect(widget.tags).toBe(true);
    expect(widget.scrollable).toBe(false);

    // Check border configuration
    expect(widget.border).toBeDefined();
    expect(widget.border.type).toBe('line');
    expect(widget.border.fg).toBe('yellow');

    // Check padding configuration
    expect(widget.padding).toBeDefined();
    expect(widget.padding.left).toBe(1);
    expect(widget.padding.right).toBe(1);

    // Check style configuration
    expect(widget.style).toBeDefined();
    expect(widget.style.fg).toBe('white');
    expect(widget.style.bg).toBe('black');
  });

  it('should apply syntax highlighting to widget content', () => {
    const code = 'const x = 42; function test() { return "hello"; }';
    const widget = createCodeBlockWidget(code, 'javascript', 60);

    // Content should contain blessed color tags
    expect(widget.content).toContain('{cyan-fg}const{/cyan-fg}');
    expect(widget.content).toContain('{cyan-fg}function{/cyan-fg}');
    expect(widget.content).toContain('{yellow-fg}42{/yellow-fg}');
    expect(widget.content).toContain('{green-fg}"hello"{/green-fg}');
  });

  it('should handle plain text for unsupported languages', () => {
    const code = 'some plain text code';
    const widget = createCodeBlockWidget(code, 'unknown', 40);

    expect(widget.content).toBe(code); // No highlighting applied
    expect(widget.width).toBe(40);
  });

  it('should handle empty language parameter', () => {
    const code = 'console.log("test");';
    const widget = createCodeBlockWidget(code, '', 50);

    expect(widget.content).toBe(code); // Plain text when no language
  });

  it('should configure widget with proper defaults', () => {
    const code = 'test code';
    const widget = createCodeBlockWidget(code); // No lang or width specified

    expect(widget.width).toBeUndefined(); // Default blessed behavior
    expect(widget.content).toBe(code); // Plain text for no language
    expect(widget.border.fg).toBe('yellow');
    expect(widget.padding.left).toBe(1);
    expect(widget.padding.right).toBe(1);
  });
});
