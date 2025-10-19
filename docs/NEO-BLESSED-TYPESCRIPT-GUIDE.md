# Neo-Blessed + TypeScript Quick Start Guide

**Purpose:** Help future instances avoid the TypeScript integration struggle with neo-blessed.

**Source:** Instance 4's working implementation + community patterns (2025-10-19)

---

## The Problem

Neo-blessed (v0.2.0) has no native TypeScript definitions. Using `@types/blessed` doesn't work because the type definitions are for the original `blessed`, not `neo-blessed`.

**Common Errors You'll See:**
```
Cannot find declaration file for module 'neo-blessed'
Module augmentation errors when declaring module
Implicit any errors throughout blessed code
```

---

## The Solution (PROVEN WORKING)

### 1. TypeScript Configuration

Add this to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "noImplicitAny": false,  // Required for neo-blessed
    "target": "ES2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true
  }
}
```

**Why:** `noImplicitAny: false` allows neo-blessed to work without type definitions.

### 2. Import Pattern

```typescript
import blessed from 'neo-blessed';
import { BumblebeeConfig } from './config/loadConfig.js';
import { bumblebeeTheme } from './config/theme-bumblebee.js';

// CRITICAL: Cast blessed to any for TypeScript compatibility
const blessedAny = blessed as any;
```

**Why:** The `as any` cast bypasses TypeScript's type checking for neo-blessed calls.

### 3. Use blessedAny Everywhere

```typescript
// ✅ CORRECT - Use blessedAny
const screen = blessedAny.screen({ ... });
const box = blessedAny.box({ ... });

// ❌ WRONG - Don't use blessed directly
const screen = blessed.screen({ ... });  // TypeScript error!
```

---

## Core Patterns (Copy-Paste Ready)

### Screen Setup

```typescript
const screen = blessedAny.screen({
  smartCSR: true,        // Smart cursor rendering (faster)
  title: 'Bumblebee',    // Terminal window title
  fullUnicode: true,     // Enable Unicode characters
});
```

### Title Bar (Top)

```typescript
const titleBar = blessedAny.box({
  top: 0,
  left: 0,
  width: '100%',
  height: 3,
  content: '{center}Bumblebee{/center}',  // Blessed tags for formatting
  tags: true,                              // Enable tag parsing
  style: {
    bg: '#010600',       // Background color (hex or ANSI)
    fg: '#E9B033',       // Foreground/text color
  },
});
```

### Scrollable Content Pane (Middle)

```typescript
const preview = blessedAny.box({
  top: 3,                // Start below title bar
  left: 0,
  width: '100%',
  height: '100%-6',      // Full height minus title (3) and status (3)
  content: '',           // Empty initially
  scrollable: true,      // Enable scrolling
  alwaysScroll: true,    // Always allow scroll
  mouse: true,           // Enable mouse support
  keys: true,            // Enable keyboard navigation
});
```

### Status Bar (Bottom)

```typescript
const statusBar = blessedAny.box({
  bottom: 0,             // Anchor to bottom
  left: 0,
  width: '100%',
  height: 3,
  content: ` ${filePath} `,
  style: {
    bg: '#010600',
    fg: '#E9B033',
    border: {
      fg: '#E9B033',     // Border color
    },
  },
  border: {
    type: 'line',        // Box drawing characters
  },
});
```

### Layout Assembly

```typescript
// Order matters - append in visual order (top to bottom)
screen.append(titleBar);
screen.append(preview);
screen.append(statusBar);

// ALWAYS render at the end
screen.render();
```

### Key Event Handling

```typescript
// Quit on Escape, q, or Ctrl+C
screen.key(['escape', 'q', 'C-c'], function(ch: string, key: any) {
  return process.exit(0);
});

// Handle terminal resize
screen.on('resize', function() {
  screen.render();  // Redraw everything
});
```

---

## Common Blessed Features

### Box Properties Reference

```typescript
{
  // Position
  top: 0 | '10%' | 'center',
  left: 0 | '10%' | 'center',
  right: 0 | '10%',
  bottom: 0 | '10%',

  // Size
  width: '100%' | 50 | 'shrink',
  height: '100%-6' | 20 | 'shrink',

  // Content
  content: 'text',
  tags: true,              // Enable {bold}, {center}, etc.

  // Scrolling
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: ' ',
    style: { bg: 'blue' }
  },

  // Interaction
  mouse: true,
  keys: true,
  clickable: true,

  // Borders
  border: {
    type: 'line' | 'bg' | 'none'
  },

  // Styling
  style: {
    fg: 'white' | '#FFFFFF',
    bg: 'black' | '#000000',
    border: { fg: 'yellow' },
    hover: { bg: 'blue' },
    focus: { border: { fg: 'cyan' } }
  }
}
```

### Blessed Tags (Inline Formatting)

```typescript
content: '{center}Centered{/center}'
content: '{bold}Bold text{/bold}'
content: '{underline}Underlined{/underline}'
content: '{red-fg}Red text{/red-fg}'
content: '{blue-bg}Blue background{/blue-bg}'
```

**IMPORTANT:** Must set `tags: true` on the box!

### Dynamic Content Updates

```typescript
// Update content
box.setContent('New content');

// Update specific line
box.setLine(0, 'First line');

// Append to content
box.pushLine('New line');

// Always render after updates
screen.render();
```

---

## Bumblebee Theme Integration

```typescript
import { bumblebeeTheme } from './config/theme-bumblebee.js';

// Use theme colors in style objects
style: {
  bg: bumblebeeTheme.current.nearBlack,   // #010600
  fg: bumblebeeTheme.current.yellowB,     // #E9B033
  border: {
    fg: bumblebeeTheme.current.yellowA,   // #F2D638
  }
}

// Or use helper functions
import { yellowA, yellowB, cyan } from './config/theme-bumblebee.js';

const styledText = yellowA('Primary text') + ' ' + cyan('Accent');
box.setContent(styledText);
```

---

## Build & Run Process

### Development (Bun)

```bash
bun run src/cli.ts [fileOrDir]
bun run src/cli.ts --help
```

### Build (TypeScript Compilation)

```bash
# Compile TypeScript to JavaScript
npx tsc --outDir dist

# Make CLI executable
chmod +x dist/cli.js

# Test built version
node dist/cli.js --help
./dist/cli.js README.md
```

### Production Build Script

```json
{
  "scripts": {
    "build": "npx tsc --outDir dist && chmod +x dist/cli.js",
    "dev": "bun run src/cli.ts"
  }
}
```

---

## Common Gotchas

### 1. Import Statement

```typescript
// ✅ CORRECT (ESM)
import blessed from 'neo-blessed';

// ❌ WRONG (CommonJS - doesn't work with ESM TypeScript)
const blessed = require('neo-blessed');
```

### 2. Always Cast to Any

```typescript
// ✅ CORRECT
const blessedAny = blessed as any;
const screen = blessedAny.screen({ ... });

// ❌ WRONG - TypeScript errors
const screen = blessed.screen({ ... });
```

### 3. Relative Heights

```typescript
// ✅ CORRECT - Use string for calculations
height: '100%-6'   // Full height minus 6 lines

// ❌ WRONG - Number subtraction doesn't work
height: 100 - 6
```

### 4. Must Call render()

```typescript
screen.append(box);
screen.render();    // ✅ REQUIRED - nothing shows without this!
```

### 5. Event Handler Scope

```typescript
// ✅ CORRECT - Use function() for proper 'this' binding
screen.key(['q'], function(ch, key) {
  return process.exit(0);
});

// ⚠️ Arrow functions work but may not have correct 'this'
screen.key(['q'], (ch, key) => {
  process.exit(0);
});
```

---

## Tested Configuration

**Versions That Work:**
- `neo-blessed@0.2.0` ✅
- `typescript@5.9.3` ✅
- `@types/node@24.8.1` ✅
- Node.js (npm fallback) ✅
- Bun (preferred runtime) ✅

**TypeScript Settings:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "noImplicitAny": false,    // CRITICAL for neo-blessed
    "strict": true
  }
}
```

---

## Complete Working Example

See `src/app.ts` in this repository for a fully functional TUI skeleton:
- Title bar with Bumblebee branding
- Scrollable preview pane
- Status bar showing file path
- Quit on Escape/q/Ctrl+C
- Resize handling

**Key takeaway:** Don't waste time trying to get perfect TypeScript types for neo-blessed. Use the `blessedAny` pattern and move on to building features.

---

## Resources

- **Neo-blessed GitHub:** github.com/blessedjs/neo-blessed
- **Blessed Documentation:** blessed.readthedocs.io
- **Working Code:** See `src/app.ts` in this project
- **Instance 4 Lessons:** AIDIS context f8ae2e3f-061d-4ecb-9cb8-7e450bb52647

---

**Last Updated:** 2025-10-19 (Instance 4)
**Status:** Proven working in production
