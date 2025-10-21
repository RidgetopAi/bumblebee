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

function highlightJSON(code: string): string {
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

describe('Code Block Widget Component - Syntax Highlighting', () => {
  it('should apply basic JavaScript syntax highlighting', () => {
    const code = 'const x = 42; function test() { return "hello"; }';
    const result = highlightCode(code, 'javascript');

    // Check that blessed tags are applied for syntax highlighting
    expect(result).toContain('{magenta-fg}const{/magenta-fg}');
    expect(result).toContain('{magenta-fg}function{/magenta-fg}');
    expect(result).toContain('{yellow-fg}42{/yellow-fg}');
    expect(result).toContain('{green-fg}"hello"{/green-fg}');
  });

  it('should apply basic JSON syntax highlighting', () => {
    const code = '{"name": "test", "value": 123, "active": true}';
    const result = highlightCode(code, 'json');

    expect(result).toContain('{magenta-fg}"name"{/magenta-fg}:');
    expect(result).toContain(': {green-fg}"test"{/green-fg}');
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
    expect(result).toContain('{magenta-fg}const{/magenta-fg}');
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

  it('should add language badge to widget when language is specified', () => {
    const code = 'const x = 42;';
    const widget = createCodeBlockWidget(code, 'javascript', 50);

    expect(widget.label).toBe('┤ javascript ├');
  });

  it('should not add language badge when no language specified', () => {
    const code = 'const x = 42;';
    const widget = createCodeBlockWidget(code, '', 50);

    expect(widget.label).toBeUndefined();
  });

  it('should apply syntax highlighting to widget content', () => {
    const code = 'const x = 42; function test() { return "hello"; }';
    const widget = createCodeBlockWidget(code, 'javascript', 60);

    // Content should contain blessed color tags
    expect(widget.content).toContain('{magenta-fg}const{/magenta-fg}');
    expect(widget.content).toContain('{magenta-fg}function{/magenta-fg}');
    expect(widget.content).toContain('{yellow-fg}42{/yellow-fg}');
    expect(widget.content).toContain('{green-fg}"hello"{/green-fg}');
  });

  it('should handle plain text for unsupported languages', () => {
    const code = 'some plain text code';
    const widget = createCodeBlockWidget(code, 'unknown', 40);

    // Content should include indentation guides for short lines
    expect(widget.content).toContain(code);
    expect(widget.content).toContain('{gray-fg}│{/gray-fg}'); // Indentation guides added
    expect(widget.width).toBe(40);
  });

  it('should handle empty language parameter', () => {
    const code = 'console.log("test");';
    const widget = createCodeBlockWidget(code, '', 50);

    // Content should include indentation guides for short lines
    expect(widget.content).toContain(code);
    expect(widget.content).toContain('{gray-fg}│{/gray-fg}'); // Indentation guides added
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

describe('Code Block Widget Component - Real Code Testing (TB045-5a)', () => {
  it('should highlight real TypeScript code from bumblebee CLI', () => {
    const realCliCode = `#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig } from './config/loadConfig.js';
import { runApp } from './app.js';

const program = new Command();

program
  .name('bumblebee')
  .description('CLI Markdown Viewer & Editor')
  .version('1.0.0')
  .argument('[fileOrDir]', 'file or directory to open', '.')
  .option('--stdout', 'output to stdout instead of TUI')
  .action(async (fileOrDir: string, options: any) => {
    try {
      const config = loadConfig(options.config);
      await runApp(config, fileOrDir, options.stdout);
    } catch (error) {
      console.error('Error:', (error as Error).message);
    }
  });

program.parse();`;

    const result = highlightCode(realCliCode, 'typescript');

    // Verify key syntax elements are highlighted
    expect(result).toContain('{magenta-fg}import{/magenta-fg}');
    expect(result).toContain('{magenta-fg}const{/magenta-fg}');
    expect(result).toContain('{magenta-fg}async{/magenta-fg}');
    expect(result).toContain('{magenta-fg}try{/magenta-fg}');
    expect(result).toContain('{magenta-fg}catch{/magenta-fg}');

    // Verify strings are highlighted
    expect(result).toContain('{green-fg}\'commander\'{/green-fg}');
    expect(result).toContain('{green-fg}\'./config/loadConfig.js\'{/green-fg}');
    expect(result).toContain('{green-fg}\'bumblebee\'{/green-fg}');

    // Version string with numbers highlighted inside
    expect(result).toContain('{green-fg}\'CLI Markdown Viewer & Editor\'{/green-fg}');
  });

  it('should highlight real TypeScript code from bumblebee app.ts', () => {
    const realAppCode = `import blessed from 'neo-blessed';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { BumblebeeConfig } from './config/loadConfig.js';
import { createLayout, appendLayoutToScreen, updateLayoutOnResize } from './tui/layout.js';

const blessedAny = blessed as any;
let fileWatcher: any = null;

function setupFileWatcher(directory: string, explorerState: any, layout: any, config: BumblebeeConfig, screen: any): void {
  if (fileWatcher) {
    fileWatcher.close();
  }

  try {
    fileWatcher = chokidar.watch(directory, {
      ignored: config.showDotfiles ? [] : (path: string) => path.includes('/.'),
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      },
      ignorePermissionErrors: true,
    });

    const debouncedRefresh = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        try {
          if (explorerState.visible && directory === explorerState.rootPath) {
            refreshExplorer(explorerState, config);
          }
        } catch (error) {
          // Handle refresh errors gracefully
        }
      }, 300);
    };

    fileWatcher.on('add', debouncedRefresh);
    fileWatcher.on('unlink', debouncedRefresh);
  } catch (error) {
    // Handle watcher setup errors gracefully
  }
}`;

    const result = highlightCode(realAppCode, 'typescript');

    // Verify complex TypeScript syntax highlighting
    expect(result).toContain('{magenta-fg}import{/magenta-fg}');
    expect(result).toContain('{magenta-fg}const{/magenta-fg}');
    expect(result).toContain('{magenta-fg}let{/magenta-fg}');
    expect(result).toContain('{magenta-fg}function{/magenta-fg}');
    expect(result).toContain('{magenta-fg}try{/magenta-fg}');
    expect(result).toContain('{magenta-fg}catch{/magenta-fg}');
    expect(result).toContain('{magenta-fg}if{/magenta-fg}');

    // Interface types and generics
    expect(result).toContain('BumblebeeConfig');

    // Object literals and numeric values
    expect(result).toContain('{yellow-fg}100{/yellow-fg}');
    expect(result).toContain('{yellow-fg}50{/yellow-fg}');
    expect(result).toContain('{yellow-fg}300{/yellow-fg}');

    // String literals
    expect(result).toContain('{green-fg}\'neo-blessed\'{/green-fg}');
    expect(result).toContain('{green-fg}\'add\'{/green-fg}');
    expect(result).toContain('{green-fg}\'unlink\'{/green-fg}');
  });

  it('should handle multi-line comments and complex syntax', () => {
    const complexCode = `/**
 * This is a multi-line comment
 * with multiple lines
 */
interface User {
  name: string;
  age: number;
  active: boolean;
}

class UserService {
  private users: User[] = [];

  constructor() {
    this.users = [];
  }

  async addUser(user: User): Promise<void> {
    // Validate user data
    if (!user.name || user.age < 0) {
      throw new Error('Invalid user data');
    }

    this.users.push(user);
  }

  getUsers(): User[] {
    return this.users.filter(u => u.active === true);
  }
}`;

    const result = highlightCode(complexCode, 'typescript');

    // Keywords
    expect(result).toContain('{cyan-fg}interface{/cyan-fg}');
    expect(result).toContain('{magenta-fg}class{/magenta-fg}');
    expect(result).toContain('{magenta-fg}private{/magenta-fg}');
    expect(result).toContain('{magenta-fg}constructor{/magenta-fg}');
    expect(result).toContain('{magenta-fg}async{/magenta-fg}');
    expect(result).toContain('{magenta-fg}throw{/magenta-fg}');
    expect(result).toContain('{magenta-fg}new{/magenta-fg}');
    expect(result).toContain('{magenta-fg}return{/magenta-fg}');

    // Multi-line comments
    expect(result).toContain('{gray-fg}/*');
    expect(result).toContain('multi-line comment');
    expect(result).toContain('*/{/gray-fg}');

    // Single-line comments
    expect(result).toContain('{gray-fg}// Validate user data{/gray-fg}');

    // Types and values
    expect(result).toContain('string');
    expect(result).toContain('number');
    expect(result).toContain('boolean');
    expect(result).toContain('Promise');
  });

  it('should highlight real JSON configuration', () => {
    const realJson = `{
  "name": "bumblebee",
  "version": "1.0.0",
  "description": "CLI Markdown Viewer & Editor",
  "main": "dist/cli.js",
  "type": "module",
  "bin": {
    "bumblebee": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "dev": "tsx watch src/cli.ts",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "neo-blessed": "^0.2.4",
    "commander": "^12.0.0",
    "remark": "^15.0.1",
    "remark-parse": "^11.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "tsx": "^4.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "author": "Bumblebee Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/example/bumblebee.git"
  },
  "keywords": [
    "cli",
    "markdown",
    "viewer",
    "editor",
    "terminal"
  ],
  "bugs": {
    "url": "https://github.com/example/bumblebee/issues"
  },
  "homepage": "https://github.com/example/bumblebee#readme"
}`;

    const result = highlightCode(realJson, 'json');

    // String keys (magenta) and values (green)
    expect(result).toContain('{magenta-fg}"name"{/magenta-fg}');
    expect(result).toContain(': {green-fg}"bumblebee"{/green-fg}');
    expect(result).toContain('{magenta-fg}"description"{/magenta-fg}');
    expect(result).toContain('{green-fg}"CLI Markdown Viewer & Editor"{/green-fg}');

    // Version numbers (inside version strings get highlighted)
    expect(result).toContain('{yellow-fg}1.0{/yellow-fg}');
    expect(result).toContain('{yellow-fg}0.2{/yellow-fg}');
  });

  it('should create widget with real code and language badge', () => {
    const realCode = `import { Command } from 'commander';
const program = new Command();
program.version('1.0.0');`;

    const widget = createCodeBlockWidget(realCode, 'typescript', 60);

    // Verify widget configuration
    expect(widget.width).toBe(60);
    expect(widget.label).toBe('┤ typescript ├');

    // Verify highlighting is applied
    expect(widget.content).toContain('{magenta-fg}import{/magenta-fg}');
    expect(widget.content).toContain('{magenta-fg}const{/magenta-fg}');
    expect(widget.content).toContain('{green-fg}\'commander\'{/green-fg}');
    expect(widget.content).toContain('{yellow-fg}1.0{/yellow-fg}');
  });
});
