# Bumblebee – CLI Markdown Viewer/Renderer (Spec + Phased Plan)

**Owner intent:** Build a terminal-first Markdown viewer with Neovim-as-editor, standout **code blocks**, and a **NvimTree-like** explorer. Deliver in small phases that a smaller LLM can execute without guessing.

---

## Locked Decisions

- **Language:** TypeScript
- **Parser/AST:** `remark-parse` + `remark-gfm` → MDAST
- **Renderer:** custom **MDAST → ANSI** (own layout/wrapping)
- **Highlighter:** **Shiki** (theme: `github-dark`) → ANSI, fallback `cli-highlight`
- **TUI framework:** `neo-blessed` (panes, borders, focus, resize, mouse later)
- **Editor:** spawn `$EDITOR` (default `nvim`) then return to Bumblebee
- **Package/runtime:** **Bun** preferred; fall back to Node/npm if needed
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
  - `Space e` toggle explorer (left pane)
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

## Repository Shape

```
/bumblebee
  package.json (or bunfig.toml)
  tsconfig.json
  bun.lockb (if Bun)
  bumblebee.config.json
  src/
    cli.ts
    app.ts
    config/
      loadConfig.ts
      theme-bumblebee.ts
      keymap.ts
    parser/
      mdToAst.ts
    render/
      mdastToAnsi.ts
      blocks/
        paragraph.ts
        heading.ts
        list.ts
        blockquote.ts
        link.ts
        table.ts
        code.ts
      ansi/
        colors.ts
        wrap.ts
        width.ts
        draw.ts
    tui/
      panes/
        titlebar.ts
        explorer.ts
        preview.ts
        statusbar.ts
      layout.ts
      input.ts
      selection.ts
    editor/
      spawnEditor.ts
    utils/
      fsTree.ts
      detectColor.ts
      log.ts
  tests/
    fixtures/
      simple.md
      tables.md
      code-blocks.md
      complex.md
    renderer.test.ts
    tables.test.ts
    codeblocks.test.ts
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
  toggleExplorer: "space+e",
  quit: "q",
  visual: "v",
  yank: "y",
};
```

---

## Phase 0 – Bootstrap & Contracts

**Tasks**

1. Init TS project; Bun first:
   - `bun init` → ESM; add `tsconfig.json` (`"module": "esnext"`, `"moduleResolution": "bundler"`).
   - Add scripts:
     - `"dev": "bun run src/cli.ts"`, `"build": "bun build --target bun --outdir dist src/cli.ts"`.
     - Fallback Node scripts (commented) for portability.

2. Add deps:
   - `remark-parse remark-gfm neo-blessed chokidar chalk wrap-ansi string-width cli-truncate table shiki cli-highlight commander gray-matter strip-ansi clipboardy`
   - Dev: `typescript @types/node vitest` 

3. Implement **`loadConfig.ts`** with defaults (above). Validate keys.
4. Implement **`theme-bumblebee.ts`** exporting resolved ANSI palette (TrueColor + 256 fallback).
5. Wire **CLI entry (`cli.ts`)** with `commander`:
   - `bumblebee [fileOrDir]` (default `.`)
   - Flags: `--no-truecolor`, `--config <path>`, `--stdout`

6. Create **titlebar/preview/status** placeholders (neo-blessed) and a minimal `app.ts`.

**Acceptance**

- `bun run src/cli.ts README.md` opens a TUI skeleton with titlebar "Bumblebee", empty preview, status showing file path.
- Resizes on terminal change without throwing.
- **Show work:** Document dependency versions installed and config validation logic.

**Rollback Criteria**

- TUI skeleton crashes on startup or resize
- Config validation fails on valid config

---

## Phase 1 – Markdown Pipeline (no TUI)

**Tasks**

1. `parser/mdToAst.ts`: pipe input → `remark-parse` + `remark-gfm` → MDAST.
2. `render/ansi/wrap.ts`, `width.ts`: utilities using `wrap-ansi`, `string-width`.
3. `render/mdastToAnsi.ts`:
   - Map nodes: paragraphs, headings, emphasis/strong, links (underline), lists (ul/ol), blockquotes, **tables (unstyled)**, code (plain).
   - Provide `render(md: string, width: number, theme)` → `string` (ANSI).

4. Wire CLI `--stdout` to use renderer (no TUI).
5. **Create test fixtures:**
   - `tests/fixtures/simple.md` - basic paragraphs, headings, emphasis
   - `tests/fixtures/tables.md` - various GFM table structures
   - `tests/fixtures/code-blocks.md` - fenced code blocks (plain, no Shiki yet)
   - `tests/fixtures/complex.md` - mixed content

6. **Write fixture tests** (`tests/renderer.test.ts`) using `vitest`:
   - Strip ANSI and validate structure/content presence
   - Test wrapping behavior at different widths

**Acceptance**

- All fixture tests pass with `vitest`
- Piped Markdown renders correctly to terminal width; **GFM tables render** without crash; long lines wrap.
- **Show work:** Test output with pass/fail counts; document any edge cases discovered.

**Rollback Criteria**

- Fixture tests fail (structure missing/incorrect)
- Tables crash or render corrupted
- Wrapping breaks on multi-byte characters

---

## Phase 2 – TUI Shell & Modes

**Tasks**

1. `tui/layout.ts`: two-pane layout (explorer hidden), title (top), status (bottom).
2. Borders/colors per spec: normal = `#F2D638`; focus = `#1EC4F2`; titlebar bg `#010600`, text `#E9B033`; status border `#E9B033`.
3. `tui/input.ts`: implement keybindings:
   - `r`, `Esc`, `q`, arrows/`j/k` for scroll.

4. `tui/panes/preview.ts`: renders buffer using Phase-1 renderer; on resize, reflow.

**Acceptance**

- Open a file path → preview shows parsed content; keys switch modes, quit works; no flicker on resize.
- **Show work:** Screenshot or describe color verification; document keybinding registration.

**Rollback Criteria**

- Mode switching fails or causes state corruption
- Resize causes flicker or content loss
- Preview doesn't render Phase-1 output correctly

**Dependencies:** Requires Phase 1 complete (renderer functional)

---

## Phase 3 – Explorer (NvimTree-like)

**Tasks**

1. `utils/fsTree.ts`: recursive directory to tree model (respect `showDotfiles`).
2. `tui/panes/explorer.ts`: list/tree with expand/collapse; default width `explorerWidth`.
3. Toggle with `Space e`. Navigation: arrows/`j/k`. **Enter**:
   - If dir → cd into dir (update tree root and status)
   - If file → open in preview (set current path) **and auto-switch focus to preview**

4. `chokidar` watch current root; update nodes on add/remove.

**Acceptance**

- Toggling explorer works; selecting opens files/enters directories; status shows full path; explorer border cyan when focused.
- **Auto-focus behavior:** Opening a file automatically moves focus to preview pane.
- **Show work:** Document focus-switching logic; verify chokidar updates reflect in real-time.

**Rollback Criteria**

- Explorer crashes on deep/circular directory structures
- File watching fails or causes performance issues
- Focus switching doesn't work reliably

**Dependencies:** Requires Phase 2 complete (TUI modes working)

---

## Phase 4 – Edit Mode (Neovim handoff)

**Tasks**

1. `editor/spawnEditor.ts`: spawn `$EDITOR` (default `nvim`) with current file; suspend TUI (hide screen), on exit restore TUI.
2. On return, re-read file and re-render; detect unchanged content to skip repaint.

**Acceptance**

- `i` opens file in Neovim; saving & exiting refreshes preview; no zombie processes; works on WSL2.
- **Show work:** Test with `nvim`, `vim`, `nano`; document process spawn/cleanup logic.

**Rollback Criteria**

- TUI doesn't restore correctly after editor exit
- Zombie processes remain
- File changes don't trigger re-render

**Dependencies:** Requires Phase 2 complete (TUI shell functional)

---

## Phase 5 – **Signature Code Blocks**

**Tasks**

1. Integrate **Shiki**:
   - Preload popular langs; theme `github-dark`.
   - Build `toAnsi(tokens, colorSupport)` that maps Shiki tokens to ANSI (TrueColor else 256-approx).

2. `render/blocks/code.ts`:
   - Draw border box with `#F2D638` (top/bottom `─`, sides `│`).
   - Padding 1 col inside.
   - **Badge**: top-right `┤ Lang ├` with subtle bg, text `#010600`.
   - Wrap long lines; keep indentation guides (use faint `│` every 4 cols).

3. Fallback: if Shiki init fails or lang unknown → `cli-highlight` or plaintext.
4. Language choose order: fence lang → filename ext → `plaintext`.
5. **Optimize for best performance:**
   - Cache Shiki highlighter instance + loaded grammars
   - Lazy-load language grammars on first use
   - Profile render time; log metrics in dev mode

**Acceptance**

- Code blocks render with highlighting, borders, and language badges
- Optimize aggressively: aim for best possible performance on 1K+ line docs with multiple code blocks
- Unknown languages don't crash; badge shows `Plaintext`.
- **Show work:** Document render timing benchmarks; include cache hit/miss metrics.

**Rollback Criteria**

- Shiki integration causes crashes or hangs
- Performance degrades unacceptably (>1s for typical docs)
- Fallback mechanisms don't work

**Dependencies:** Can run parallel to Phase 3-4; requires Phase 1 complete

---

## Phase 6 – Tables/Links/Images Polish

**Tasks**

1. `render/blocks/table.ts`: **padded** style (configurable); compute column widths from content; wrap cells; header underline.
2. Links: underline + cyan; inline URL after link text in `(<url>)`.
3. Images: show alt text and `![alt](url)` placeholder; no fetch. Gray frame `#8E8F95`.
4. Blockquotes: left bar in `#8E8F95`, dim quote text.
5. **Update fixture tests** (`tests/tables.test.ts`) to verify table alignment and cell wrapping.

**Acceptance**

- Mixed content doc (tables + code) keeps alignment under width changes; links readable; images graceful.
- **Show work:** Test table alignment at multiple terminal widths; verify no overflow.

**Rollback Criteria**

- Tables misalign on resize
- Wide tables cause crashes or corruption
- Link/image rendering breaks existing layouts

**Dependencies:** Requires Phase 1 complete; benefits from Phase 5 for mixed content testing

---

## Phase 7 – Visual Mode & Yank

**Tasks**

1. `tui/selection.ts`: **character-precise** visual selection state in preview buffer (start/end row/col), render selection with inverse/underline.
2. Keys: `v` enter/exit visual; arrows/`j/k` expands selection **character by character**; `y` copies selection to clipboard (`clipboardy`).
3. If selection intersects a code block → copy raw code content (strip ANSI) neatly.
4. Handle multi-byte characters correctly in selection boundaries.

**Acceptance**

- Selection behaves predictably with character-level precision; `y` places text in system clipboard (tested on WSL2).
- **Show work:** Test clipboard integration on WSL2; verify multi-byte character handling.

**Rollback Criteria**

- Selection state corrupts preview rendering
- Clipboard integration fails on target platform
- Multi-byte characters cause selection misalignment

**Dependencies:** Requires Phase 2 complete (preview rendering functional)

---

## Phase 8 – Theme/Accessibility/Perf

**Tasks**

1. TrueColor detection; 256-approx palette mapping with readable contrast (no unreadable combos).
2. Benchmarks: rendering 1K-line doc; log timing; optimize render pipeline based on metrics.
3. Config toggles: colors, keybindings, explorer width, showDotfiles.
4. Backpressure: avoid blocking UI on Shiki init (lazy load once; cache).
5. **Performance optimizations:**
   - Cache: Shiki highlighter instance + language grammars
   - Reflow only visible viewport in preview for huge docs (virtualize lines)
   - Diff-based rerender: on file change, re-render sections whose hashes changed
   - Avoid double wrapping (measure → wrap once per width)
   - Defer image/link URL post-processing until lines are visible

**Acceptance**

- `--no-truecolor` still looks on-brand; render times stable across resizes; no crashes with malformed Markdown (render an inline error block instead).
- **Show work:** Document performance benchmarks before/after optimizations; include timing metrics.

**Rollback Criteria**

- Performance optimizations introduce rendering bugs
- Color fallbacks are unreadable
- Config validation breaks existing configs

**Dependencies:** Requires Phase 5 complete (for Shiki caching); benefits from all previous phases for comprehensive testing

---

## Phase 9 – Packaging, Tests, Mouse

**Tasks**

1. **Bun build** to `dist/` with shebang; expose `bin` in `package.json` so `bunx` or `npm -g` works.
2. **Comprehensive snapshot tests** (`vitest`) for renderer (`strip-ansi` before compare). Fixtures: headings, lists, quotes, links, **tables**, **code**.
3. Mouse:
   - Single-click in explorer opens item; drag divider to resize panes.
   - Scroll wheel in preview.

4. Optional: export to HTML (`remark-rehype` + `rehype-stringify`) behind `--export html`.

**Acceptance**

- `bun build` → `dist/cli` runs; global install path documented; all tests pass; mouse open/resize works.
- **Show work:** Document build output size; test global installation; include test coverage report.

**Rollback Criteria**

- Build fails or produces non-executable output
- Tests fail on clean install
- Mouse integration breaks existing keyboard navigation

**Dependencies:** Requires all previous phases complete

---

## Performance Notes (actionable)

- Cache: Shiki highlighter instance + language grammars.
- Reflow only visible viewport in preview for huge docs (virtualize lines).
- Diff-based rerender: on file change, re-render sections whose hashes changed.
- Avoid double wrapping (measure → wrap once per width).
- Defer image/link URL post-processing until lines are visible.
- Profile and log render times in dev mode; optimize hot paths.

---

## Risk Log & Fallbacks

- **Bun incompatibility** (native modules, Shiki wasm): **Fallback** to Node 20 + `esbuild` bundle.
- **Windows/WSL spawn quirks:** ensure `shell: true` and inherit stdio; test with PowerShell + Ubuntu.
- **TrueColor support:** detect via `$COLORTERM`/termcap; **Fallback** to 256.
- **Clipboard integration (WSL2):** may require `clip.exe` detection; test thoroughly.
- **Character-precise selection complexity:** may need line-aware cursor positioning; implement incrementally.

---

## Phase Parallelization Map

- **Phase 0:** Must complete first (foundation)
- **Phase 1:** Must complete before Phase 2, 3, 4
- **Phase 2:** Blocks Phase 3, 4, 7
- **Phase 3:** Can run parallel to Phase 4, 5
- **Phase 4:** Can run parallel to Phase 3, 5
- **Phase 5:** Can run parallel to Phase 3, 4 after Phase 1
- **Phase 6:** Requires Phase 1; can run parallel to Phase 3-5
- **Phase 7:** Requires Phase 2; can run parallel to Phase 5, 6
- **Phase 8:** Requires Phase 5; benefits from all phases for testing
- **Phase 9:** Requires all previous phases

---

**Execution Note for Smaller LLMs:**
- Each phase includes explicit "Show work" requirements for verification
- Rollback criteria define when to stop and fix issues before proceeding
- Test with fixtures at each stage; document findings
- Log performance metrics to guide optimization decisions
