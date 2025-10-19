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
- **Theme (Bumblebee):**
  - Yellow A `#F2D638` (primary border)
  - Yellow B `#E9B033` (status/bottom border, title text)
  - Near-black `#010600` (title bar bg, main bg)
  - Gray `#8E8F95` (quotes/secondary)
  - Cyan `#1EC4F2` (active/focus accent “Spiro Disco Ball”)

- **Keybindings**
  - `r` render mode (preview focus)
  - `i` edit mode (spawn `$EDITOR`)
  - `Esc` normal mode
  - `Space e` toggle explorer (left pane)
    - **Inside explorer:** arrows or `j/k` to move; **Enter** open file or cd into dir

  - `q` quit
  - `j/k` and arrow keys move/scroll
  - **Visual select:** `v` to start selection in preview; arrows/`j/k` to expand; `y` to yank selection
  - **Mouse (later):** single-click open; pane resize

- **Layout**
  - Title bar: “**Bumblebee**” (bg `#010600`, text `#E9B033`, centered)
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
- **Performance:** “as enhanced as possible”; optimize for 1K+ line docs, no crashes

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
   - `remark-parse remark-gfm neo-blessed chokidar chalk wrap-ansi string-width cli-truncate table shiki cli-highlight commander gray-matter strip-ansi`
   - Dev: `typescript @types/node vitest` (or `uvu`).

3. Implement **`loadConfig.ts`** with defaults (above). Validate keys.
4. Implement **`theme-bumblebee.ts`** exporting resolved ANSI palette (TrueColor + 256 fallback).
5. Wire **CLI entry (`cli.ts`)** with `commander`:
   - `bumblebee [fileOrDir]` (default `.`)
   - Flags: `--no-truecolor`, `--config <path>`, `--stdout`

6. Create **titlebar/preview/status** placeholders (neo-blessed) and a minimal `app.ts`.

**Acceptance**

- `bun run src/cli.ts README.md` opens a TUI skeleton with titlebar “Bumblebee”, empty preview, status showing file path.
- Resizes on terminal change without throwing.

---

## Phase 1 – Markdown Pipeline (no TUI)

**Tasks**

1. `parser/mdToAst.ts`: pipe input → `remark-parse` + `remark-gfm` → MDAST.
2. `render/ansi/wrap.ts`, `width.ts`: utilities using `wrap-ansi`, `string-width`.
3. `render/mdastToAnsi.ts`:
   - Map nodes: paragraphs, headings, emphasis/strong, links (underline), lists (ul/ol), blockquotes, **tables (unstyled)**, code (plain).
   - Provide `render(md: string, width: number, theme)` → `string` (ANSI).

4. Wire CLI `--stdout` to use renderer (no TUI).

**Acceptance**

- Piped Markdown renders correctly to terminal width; **GFM tables render** without crash; long lines wrap.

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

---

## Phase 3 – Explorer (NvimTree-like)

**Tasks**

1. `utils/fsTree.ts`: recursive directory to tree model (respect `showDotfiles`).
2. `tui/panes/explorer.ts`: list/tree with expand/collapse; default width `explorerWidth`.
3. Toggle with `Space e`. Navigation: arrows/`j/k`. **Enter**:
   - If dir → cd into dir (update tree root and status)
   - If file → open in preview (set current path)

4. `chokidar` watch current root; update nodes on add/remove.

**Acceptance**

- Toggling explorer works; selecting opens files/enters directories; status shows full path; explorer border cyan when focused.

---

## Phase 4 – Edit Mode (Neovim handoff)

**Tasks**

1. `editor/spawnEditor.ts`: spawn `$EDITOR` (default `nvim`) with current file; suspend TUI (hide screen), on exit restore TUI.
2. On return, re-read file and re-render; detect unchanged content to skip repaint.

**Acceptance**

- `i` opens file in Neovim; saving & exiting refreshes preview; no zombie processes; works on WSL2.

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

**Acceptance**

- Large doc with many fences renders < ~300ms on typical machine (track and log time in dev).
- Unknown languages don’t crash; badge shows `Plaintext`.

---

## Phase 6 – Tables/Links/Images Polish

**Tasks**

1. `render/blocks/table.ts`: **padded** style (configurable); compute column widths from content; wrap cells; header underline.
2. Links: underline + cyan; inline URL after link text in `(<url>)`.
3. Images: show alt text and `![alt](url)` placeholder; no fetch. Gray frame `#8E8F95`.
4. Blockquotes: left bar in `#8E8F95`, dim quote text.

**Acceptance**

- Mixed content doc (tables + code) keeps alignment under width changes; links readable; images graceful.

---

## Phase 7 – Visual Mode & Yank

**Tasks**

1. `tui/selection.ts`: visual selection state in preview buffer (start/end row/col), render selection with inverse/underline.
2. Keys: `v` enter/exit visual; arrows/`j/k` expands selection; `y` copies selection to clipboard (`clipboardy`).
3. If selection intersects a code block → copy raw code content (strip ANSI) neatly.

**Acceptance**

- Selection behaves predictably; `y` places text in system clipboard (tested on WSL2).

---

## Phase 8 – Theme/Accessibility/Perf

**Tasks**

1. TrueColor detection; 256-approx palette mapping with readable contrast (no unreadable combos).
2. Benchmarks: rendering 1K-line doc; log timing; keep render under target (track in `utils/log.ts`).
3. Config toggles: colors, keybindings, explorer width, showDotfiles.
4. Backpressure: avoid blocking UI on Shiki init (lazy load once; cache).

**Acceptance**

- `--no-truecolor` still looks on-brand; render times stable across resizes; no crashes with malformed Markdown (render an inline error block instead).

---

## Phase 9 – Packaging, Tests, Mouse

**Tasks**

1. **Bun build** to `dist/` with shebang; expose `bin` in `package.json` so `bunx` or `npm -g` works.
2. Snapshot tests (`vitest`) for renderer (`strip-ansi` before compare). Fixtures: headings, lists, quotes, links, **tables**, **code**.
3. Mouse:
   - Single-click in explorer opens item; drag divider to resize panes.
   - Scroll wheel in preview.

4. Optional: export to HTML (`remark-rehype` + `rehype-stringify`) behind `--export html`.

**Acceptance**

- `bun build` → `dist/cli` runs; global install path documented; tests pass; mouse open/resize works.

---

## Performance Notes (actionable)

- Cache: Shiki highlighter instance + language grammars.
- Reflow only visible viewport in preview for huge docs (virtualize lines).
- Diff-based rerender: on file change, re-render sections whose hashes changed.
- Avoid double wrapping (measure → wrap once per width).
- Defer image/link URL post-processing until lines are visible.

---

## Risk Log & Fallbacks

- **Bun incompatibility** (native modules, Shiki wasm): **Fallback** to Node 20 + `esbuild` bundle.
- **Windows/WSL spawn quirks:** ensure `shell: true` and inherit stdio; test with PowerShell + Ubuntu.
- **TrueColor support:** detect via `$COLORTERM`/termcap; **Fallback** to 256.

---
