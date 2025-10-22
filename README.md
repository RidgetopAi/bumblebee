# Bumblebee 🐝

**CLI Markdown Viewer & Editor** - Terminal-first with Neovim-style navigation

## Status: Phase 1 Complete ✅

**Current State:**
- ✅ Phase 0: Project bootstrap, config system, theme
- ✅ Phase 1: Markdown parser (remark + GFM), Shiki syntax highlighting, ANSI renderer
- 🚧 Phase 2: TUI Shell (Ink + React) - Ready to begin

**Stack:**
- **Parser:** remark-parse + remark-gfm (GitHub Flavored Markdown)
- **Syntax Highlighting:** Shiki (github-dark theme)
- **TUI Framework:** Ink + React (replacing neo-blessed for better state management)
- **Runtime:** Node.js with TypeScript

## Quick Start

```bash
# Install dependencies
npm install

# Test stdout rendering (Phase 1 complete)
npm run stdout README.md

# Phase 2+ (TUI mode) - Coming soon
npm run dev
```

## Architecture

```
src/
  cli.ts              # Entry point, argument parsing
  config/             # Config loading, theme system
  parser/             # Markdown → MDAST
  render/             # MDAST → ANSI/Terminal output
    ansi/             # Text wrapping, width utilities
    blocks/           # Code block rendering (Shiki)
    shiki.ts          # Shiki highlighter initialization
  tests/              # Vitest fixtures and tests
```

## What Works (Phase 0-1)

- ✅ Markdown parsing with GFM tables, code blocks, lists
- ✅ Shiki syntax highlighting (TypeScript, JavaScript, Python, Rust, Go, etc.)
- ✅ ANSI color output with Bumblebee theme
- ✅ Text wrapping and terminal width detection
- ✅ Config system (`bumblebee.config.json`)
- ✅ Stdout rendering mode (`--stdout` flag)

## What's Next (Phase 2+)

- 🚧 Ink + React TUI shell (titlebar, preview, statusbar)
- 🚧 File explorer (NvimTree-like navigation)
- 🚧 Edit mode (spawn $EDITOR integration)
- 🚧 Visual selection & yank to clipboard
- 🚧 Mouse support

## Development

```bash
# Run tests
npm test

# Type check
npx tsc --noEmit

# Build
npm run build
```

## Design Philosophy

1. **Terminal-first** - Optimized for keyboard navigation, fast rendering
2. **Neovim-inspired** - Familiar keybindings for vim users
3. **Zero compromises** - Shiki highlighting, proper GFM support
4. **AI-friendly codebase** - Clear contracts, React patterns, well-documented

## License

ISC
