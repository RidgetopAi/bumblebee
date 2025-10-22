# Bumblebee – CLI Markdown Viewer/Renderer (Spec + Phased Plan v2)

**Owner intent:** Build a terminal-first Markdown viewer with Neovim-as-editor, standout **code blocks**, and a **NvimTree-like** explorer. Deliver in small phases that a smaller LLM can execute without guessing.

**Version 2 Changes:** Switched from neo-blessed to **Ink + React** for better state management, clearer component contracts, and improved AI-assisted development.

---

## Locked Decisions

- **Language:** TypeScript
- **Parser/AST:** `remark-parse` + `remark-gfm` → MDAST ✅ **Phase 1 Complete**
- **Renderer:** custom **MDAST → ANSI** (own layout/wrapping) ✅ **Phase 1 Complete**
- **Highlighter:** **Shiki** (theme: `github-dark`) → ANSI ✅ **Phase 1 Complete**
- **TUI framework:** **Ink + React** (components, hooks, proper state management)
- **Editor:** spawn `$EDITOR` (default `nvim`) then return to Bumblebee
- **Package/runtime:** **Node.js** with TypeScript (Ink requires Node)
- **Testing:** `vitest` with snapshot tests
- **Theme (Bumblebee):**
  - Yellow A `#F2D638` (primary border)
  - Yellow B `#E9B033` (status/bottom border, title text)
  - Near-black `#010600` (title bar bg, main bg)
  - Gray `#8E8F95` (quotes/secondary)
  - Cyan `#1EC4F2` (active/focus accent "Spiro Disco Ball")

- **Keybindings**
  - `r` render mode (preview focus)
  - `i` edit mode (spawn `$EDITOR`)
  - `Esc` normal mode
  - `Ctrl+e` toggle explorer (left pane)
    - **Inside explorer:** arrows or `j/k` to move; **Enter** open file or cd into dir
    - **Auto-focus:** Opening a file auto-switches focus to preview

  - `q` quit
  - `j/k` and arrow keys move/scroll
  - **Visual select:** `v` to start **character-precise** selection in preview; arrows/`j/k` to expand; `y` to yank selection
  - **Mouse (later):** single-click open; pane resize

- **CLI Default:** `bumblebee` (no args) opens explorer at current directory (`.`)

- **Layout**
  - Title bar: "**Bumblebee**" (bg `#010600`, text `#E9B033`, centered)
  - Explorer: left pane (toggle), NvimTree-like
  - Preview: right pane (scrollable)
  - Bottom status: file path, **border `#E9B033`**
  - Normal mode borders: **`#F2D638`**; focus/active accents: **`#1EC4F2`**

- **Code blocks (signature):**
  - Shiki highlighting; **border `#F2D638`**
  - **Language badge** top-right (`┤ Lang ├`), badge text `#010600`, subtle bg
  - Popular langs preloaded (ts/js, py, rb, rs, go, c/cpp, java, sh, md, json, yaml/toml, html/css, sql)
  - Fallback: detect from filename; else `plaintext`

- **Tables:** **padded** style by default
- **Links:** display URL inline
- **Performance:** optimize aggressively; target best possible performance for 1K+ line docs

---

## Repository Shape (Updated for Ink)

```
/bumblebee
  package.json
  tsconfig.json
  bumblebee.config.json
  src/
    cli.ts                    # Entry point
    app.tsx                   # Main Ink app component
    config/
      loadConfig.ts           # ✅ Phase 0 complete
      theme-bumblebee.ts      # ✅ Phase 0 complete
      keymap.ts               # Keybinding config
    parser/
      mdToAst.ts              # ✅ Phase 1 complete
    render/
      mdastToAnsi.ts          # ✅ Phase 1 complete (core renderer)
      blocks/
        code.ts               # ✅ Phase 1 complete (Shiki integration)
      ansi/
        wrap.ts               # ✅ Phase 1 complete
        width.ts              # ✅ Phase 1 complete
      shiki.ts                # ✅ Phase 1 complete
    components/              # Ink React components
      App.tsx                # Main TUI shell
      TitleBar.tsx           # Top bar component
      Explorer.tsx           # File explorer component
      Preview.tsx            # Markdown preview component
      StatusBar.tsx          # Bottom status component
      CodeBlock.tsx          # Code block widget (for Shiki output)
    hooks/                   # React hooks for state
      useAppState.ts         # Global app state (mode, focus)
      useExplorer.ts         # Explorer state & navigation
      usePreview.ts          # Preview scroll & content
      useEditor.ts           # Editor spawning logic
      useKeyBindings.ts      # Input handling
    utils/
      fsTree.ts              # File tree utilities
      clipboard.ts           # Clipboard integration
  tests/
    fixtures/
      simple.md
      tables.md
      code-blocks.md
      complex.md
    renderer.test.ts         # ✅ Phase 1 complete
  README.md
```

---

## Config Contracts

**`bumblebee.config.json`**

```json
{
  "editor": "nvim",
  "trueColor": "auto",
  "theme": "bumblebee",
  "tableStyle": "padded",
  "showDotfiles": false,
  "explorerWidth": 28,
  "shikiTheme": "github-dark"
}
```

**Keymap override (optional, `config/keymap.ts` export)**

```ts
export const KEYMAP = {
  renderMode: "r",
  editMode: "i",
  normalMode: "escape",
  toggleExplorer: "ctrl+e",
  quit: "q",
  visual: "v",
  yank: "y",
};
```

---

## Phase 0 – Bootstrap & Contracts ✅ COMPLETE

**Tasks**

1. Init TS project with Node.js:
   - `npm init` → ESM; add `tsconfig.json`
   - Add scripts: `dev`, `build`, `test`

2. Add deps:
   - Core: `remark-parse remark-gfm chalk wrap-ansi string-width strip-ansi commander gray-matter shiki cli-highlight`
   - Dev: `typescript @types/node vitest tsx`

3. Implement **`loadConfig.ts`** with defaults. Validate keys.
4. Implement **`theme-bumblebee.ts`** exporting resolved ANSI palette (TrueColor + 256 fallback).
5. Wire **CLI entry (`cli.ts`)** with `commander`:
   - `bumblebee [fileOrDir]` (default `.`)
   - Flags: `--no-truecolor`, `--config <path>`, `--stdout`

**Status:** ✅ Complete

---

## Phase 1 – Markdown Pipeline (stdout mode) ✅ COMPLETE

**Tasks**

1. `parser/mdToAst.ts`: pipe input → `remark-parse` + `remark-gfm` → MDAST.
2. `render/ansi/wrap.ts`, `width.ts`: utilities using `wrap-ansi`, `string-width`.
3. `render/mdastToAnsi.ts`:
   - Map nodes: paragraphs, headings, emphasis/strong, links, lists, blockquotes, tables, code
   - Provide `render(md: string, width: number, theme)` → `string` (ANSI)

4. Wire CLI `--stdout` to use renderer (no TUI).
5. **Create test fixtures** and write **vitest tests** for renderer.

**Status:** ✅ Complete - stdout mode works perfectly

**What Works:**
- GFM parsing (tables, code blocks, lists)
- Shiki syntax highlighting with github-dark theme
- Text wrapping and ANSI color output
- Bumblebee theme colors

---

## Phase 2 – Ink TUI Shell & Components (NEW)

**Why Ink?**
- React patterns = massive LLM training data
- Proper hooks for state management (`useState`, `useReducer`)
- Clear component boundaries and props contracts
- Async-friendly architecture
- Active community, excellent docs
- **Much easier for AI agents to work with**

**Tasks**

1. Install Ink dependencies:
   ```bash
   npm install ink react ink-spinner ink-text-input
   ```

2. Create `src/app.tsx` - Main Ink app component:
   - State: current mode (normal/render/edit), focused pane, current file
   - Layout: TitleBar, Preview (full width initially), StatusBar
   - Use `useInput()` hook for basic keybindings (q to quit)

3. Create `src/components/TitleBar.tsx`:
   - Centered "Bumblebee" text with theme colors
   - Static component (no state)

4. Create `src/components/Preview.tsx`:
   - Props: `content` (rendered ANSI string), `scrollOffset`
   - Use `<Text>` to display content
   - Handle scroll state with `useState`

5. Create `src/components/StatusBar.tsx`:
   - Props: `filePath`, `mode`
   - Display current file path and mode indicator

6. Create `src/hooks/useAppState.ts`:
   - Global app state: `{ mode, focusedPane, currentFile, content }`
   - Mode transitions: normal ↔ render ↔ edit

7. Wire CLI to render Ink app:
   - Check if stdout mode (`--stdout` flag) → use Phase 1 renderer
   - Otherwise → render `<App />` component

8. Apply Bumblebee theme colors using Ink's `<Box>` with border colors

**Acceptance**

- `npm run dev <file.md>` opens TUI with titlebar, preview showing parsed markdown, status bar
- `q` quits cleanly
- Preview scrolls with `j/k` or arrow keys
- Colors match Bumblebee theme
- No crashes on resize

**Rollback Criteria**

- Ink rendering fails or shows corruption
- State updates don't reflect in UI
- Keybindings don't register

**Dependencies:** Requires Phase 1 complete (renderer functional)

---

## Phase 3 – Explorer Component (NvimTree-like)

**Tasks**

1. Create `src/hooks/useExplorer.ts`:
   - State: `rootPath`, `fileTree`, `selectedIndex`, `expandedDirs`, `visible`
   - Functions: `toggleVisibility()`, `navigate()`, `selectNext()`, `selectPrev()`, `handleEnter()`

2. Create `src/utils/fsTree.ts`:
   - `scanDirectory(path, depth=1)` → returns immediate children only
   - Directory tree model with expand/collapse support
   - Respect `showDotfiles` config

3. Create `src/components/Explorer.tsx`:
   - Props: `visible`, `selectedIndex`, `items`, `onSelect`, `onNavigate`
   - Render file tree with icons (📁 dirs, 📄 files)
   - Highlight selected item with cyan accent
   - Show ".." for parent navigation when not at root

4. Update `src/app.tsx`:
   - Add explorer to layout when visible (left pane, configurable width)
   - `Ctrl+e` toggles explorer visibility
   - Arrow keys navigate when explorer focused
   - Enter opens file or enters directory

5. Integrate `chokidar` for file watching:
   - Watch current directory
   - Refresh explorer on file add/remove
   - Debounce updates (300ms)

**Acceptance**

- `Ctrl+e` shows/hides explorer
- File tree displays correctly with icons
- Arrow keys navigate, Enter opens files or enters directories
- Opening a file auto-switches focus to preview
- Explorer updates when files change in watched directory
- Parent directory navigation (".." ) works without hanging

**Rollback Criteria**

- Explorer doesn't render or shows corrupted tree
- Navigation doesn't update selection
- File watching causes performance issues
- Directory scanning hangs on large directories

**Dependencies:** Requires Phase 2 complete (Ink TUI shell)

---

## Phase 4 – Edit Mode (Neovim Integration)

**Tasks**

1. Create `src/hooks/useEditor.ts`:
   - `spawnEditor(filePath)` - suspends Ink, spawns `$EDITOR`
   - Uses `process.spawn()` with `stdio: 'inherit'`
   - Detects file changes on editor exit
   - Restores Ink app after exit

2. Update `src/app.tsx`:
   - `i` key enters edit mode
   - Suspend Ink rendering (`unmountOnExit`)
   - Spawn editor for current file
   - On exit: re-read file, re-render if changed
   - Resume Ink rendering

3. Handle edge cases:
   - Editor not found → show error in status bar
   - File deleted during edit → handle gracefully
   - No file selected → ignore `i` key

**Acceptance**

- `i` opens current file in `$EDITOR` (nvim by default)
- TUI suspends cleanly, terminal shows editor
- After `:wq`, returns to Bumblebee with updated content
- If file unchanged, no re-render
- Works on WSL2 and macOS

**Rollback Criteria**

- TUI doesn't restore after editor exit
- Terminal corruption after editor
- Zombie processes remain
- File changes don't trigger re-render

**Dependencies:** Requires Phase 2 complete (Ink app running)

---

## Phase 5 – Signature Code Blocks (Shiki) ✅ FOUNDATION COMPLETE

**Tasks**

1. Integrate Shiki (already done in Phase 1):
   - Preload popular language grammars
   - Cache highlighter instance
   - Lazy-load languages on first use

2. Create `src/components/CodeBlock.tsx`:
   - Ink component for rendering code blocks
   - Props: `code`, `language`, `theme`
   - Border box with `#F2D638` color
   - Language badge at top-right: `┤ Lang ├`
   - Padding inside border

3. Update `render/mdastToAnsi.ts`:
   - When in TUI mode, emit `<CodeBlock>` components
   - When in stdout mode, render inline ANSI

4. Optimize performance:
   - Cache Shiki highlighter + grammars
   - Lazy-load grammars on demand
   - Profile render time for 1K+ line docs

**Acceptance**

- Code blocks render with syntax highlighting
- Language badge displays correctly
- Border matches Bumblebee theme
- Unknown languages fall back to plaintext
- No performance degradation on large docs

**Rollback Criteria**

- Code blocks don't render or show corruption
- Performance degrades unacceptably (>1s typical docs)
- Shiki initialization fails

**Dependencies:** Phase 1 complete (Shiki integrated); Phase 2 (Ink components)

---

## Phase 6 – Tables/Links/Images Polish

**Tasks**

1. Update `render/mdastToAnsi.ts`:
   - Render GFM tables with padded style
   - Compute column widths dynamically
   - Handle cell wrapping for long content
   - Header underline

2. Links: underline + cyan; show URL inline `(<url>)`

3. Images: show alt text with `![alt](url)` placeholder; gray frame

4. Blockquotes: left bar in `#8E8F95`, dim text

5. Write tests for table alignment at various widths

**Acceptance**

- Tables render aligned and padded
- Column widths adjust to content
- Links are readable with inline URLs
- Images show graceful placeholders
- Mixed content (tables + code) maintains layout

**Rollback Criteria**

- Tables misalign or overflow
- Wide tables cause crashes
- Link/image rendering breaks layout

**Dependencies:** Requires Phase 1 complete

---

## Phase 7 – Visual Mode & Yank

**Tasks**

1. Create `src/hooks/useSelection.ts`:
   - State: `{ active, startRow, startCol, endRow, endCol }`
   - `startSelection()`, `expandSelection()`, `yankSelection()`

2. Update `src/components/Preview.tsx`:
   - Render selection with inverse/underline
   - Character-precise selection boundaries
   - Handle multi-byte characters

3. Wire keybindings:
   - `v` enters/exits visual mode
   - Arrows/`j/k` expands selection character by character
   - `y` yanks to system clipboard (using `clipboardy`)

4. Handle edge cases:
   - Selection across code blocks → copy raw code
   - Multi-byte character boundaries

**Acceptance**

- Visual selection works with character-level precision
- `y` copies to clipboard (verified on WSL2)
- Selection rendering doesn't corrupt preview
- Multi-byte characters handled correctly

**Rollback Criteria**

- Selection state corrupts preview
- Clipboard integration fails
- Multi-byte characters misalign selection

**Dependencies:** Requires Phase 2 complete (Preview component)

---

## Phase 8 – Theme/Accessibility/Performance

**Tasks**

1. TrueColor detection: check `$COLORTERM` env var
2. 256-color fallback with readable contrast mapping
3. Config toggles: colors, keybindings, explorer width, showDotfiles
4. Performance optimizations:
   - Virtualize long documents (render only viewport)
   - Diff-based re-render (hash sections, only update changed)
   - Lazy language loading for Shiki
   - Debounce file watcher events

5. Benchmarks: measure render time for 1K-line doc with multiple code blocks

**Acceptance**

- `--no-truecolor` still looks on-brand with 256-color fallback
- Render times stable across resizes
- Config overrides work correctly
- No crashes on malformed markdown

**Rollback Criteria**

- Performance optimizations introduce bugs
- Color fallbacks are unreadable
- Config changes break functionality

**Dependencies:** Requires Phase 5 complete (for Shiki optimization)

---

## Phase 9 – Packaging, Tests, Mouse

**Tasks**

1. Build with TypeScript:
   - `npm run build` → `dist/cli.js` with shebang
   - Expose `bin` in `package.json`
   - Test global install: `npm install -g .`

2. Comprehensive vitest tests:
   - Renderer snapshot tests (strip ANSI before compare)
   - Component tests for Ink components
   - Fixtures: headings, lists, quotes, links, tables, code

3. Mouse support (Ink + React):
   - Click to select file in explorer
   - Scroll wheel in preview
   - (Pane resize optional)

4. Optional: export to HTML (`remark-rehype` + `rehype-stringify`) behind `--export html`

**Acceptance**

- `npm run build` produces working executable
- Global install works: `bumblebee <file.md>`
- All vitest tests pass
- Mouse interactions work (click, scroll)

**Rollback Criteria**

- Build fails or produces non-functional binary
- Tests fail on clean install
- Mouse integration breaks keyboard nav

**Dependencies:** Requires all previous phases complete

---

## Performance Targets (Actionable)

- **Cache:** Shiki highlighter instance + loaded grammars
- **Virtualization:** Render only visible viewport for huge docs (>1K lines)
- **Diff-based render:** Hash sections; only re-render changed sections
- **Lazy loading:** Load Shiki grammars on demand
- **Debouncing:** File watcher events (300ms), input events (50ms)
- **Profiling:** Log render times in dev mode; optimize hot paths

**Target:** <100ms render time for typical docs (500 lines, 5 code blocks)

---

## Risk Log & Fallbacks

- **Ink learning curve:** Mitigated by excellent docs + massive LLM training data
- **React state complexity:** Use clear contracts, single source of truth per hook
- **Shiki WASM on Node.js:** Tested working; cache instance to avoid init cost
- **Windows/WSL spawn quirks:** Test thoroughly; ensure `shell: true` and inherit stdio
- **TrueColor support:** Detect via `$COLORTERM`; fallback to 256 colors
- **Clipboard on WSL2:** May require `clip.exe` detection; test extensively
- **Character-precise selection:** Implement incrementally; may need line-aware cursor

---

## Phase Parallelization Map

- **Phase 0:** Must complete first (foundation)
- **Phase 1:** Must complete before Phase 2
- **Phase 2:** Blocks Phase 3, 4, 7 (Ink app required)
- **Phase 3:** Can run parallel to Phase 4, 5
- **Phase 4:** Can run parallel to Phase 3, 5
- **Phase 5:** Can run parallel to Phase 3, 4 after Phase 2
- **Phase 6:** Requires Phase 1; can run parallel to Phase 3-5
- **Phase 7:** Requires Phase 2; can run parallel to Phase 5, 6
- **Phase 8:** Requires Phase 5; benefits from all phases
- **Phase 9:** Requires all previous phases

---

## Lessons Learned (blessed → Ink migration)

### What Worked ✅

1. **Phased plan with clear acceptance criteria** - Breaking into small, testable chunks prevented scope creep
2. **Phase 0-1 foundation (parser, Shiki, renderer)** - Completely reusable, well-tested, portable
3. **Clear requirements** - Knowing exact keybindings, theme, features upfront saved rework
4. **Review/validation steps** - Catching issues early prevented cascading bugs
5. **remark + Shiki technical choices** - Excellent libraries with good docs

### What Didn't Work ❌

1. **neo-blessed for TUI** - Poor state model, minimal docs, sparse LLM training data → constant guessing
2. **Reactive bug fixing** - Fixing symptoms (crashes, locks) without addressing root causes (state sync, async boundaries)
3. **Insufficient contracts** - Vague ownership of state led to mutations from multiple places
4. **Blessed's async incompatibility** - sync rendering model conflicted with async operations (file loading, Shiki)

### Why Ink is Better

1. **React = massive training data** - LLMs (including smaller ones) understand React deeply
2. **Clear component contracts** - Props in, state internal, events out
3. **Hooks for state** - `useState`, `useReducer`, `useEffect` → familiar, well-documented patterns
4. **Async-friendly** - Designed for async from the ground up
5. **Composability** - Small components compose cleanly without fighting the framework
6. **Debugging** - React DevTools patterns, clearer error messages

### Migration Strategy

- **60% code reuse:** Parser, config, theme, Shiki integration → port as-is
- **40% rewrite:** TUI components → cleaner with React patterns
- **Net benefit:** Better architecture + faster future development + easier AI collaboration

---

**Execution Note for Smaller LLMs:**
- Each phase includes explicit "Show work" requirements for verification
- Rollback criteria define when to stop and fix issues before proceeding
- Test with fixtures at each stage; document findings
- Log performance metrics to guide optimization
- Use React/Ink docs heavily - they're AI-friendly

**Version:** 2.0 (Ink + React)
**Last Updated:** 2025-10-21
**Phase 0-1 Status:** ✅ Complete
**Next Phase:** Phase 2 - Ink TUI Shell
