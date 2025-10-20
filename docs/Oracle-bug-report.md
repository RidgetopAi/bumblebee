# Bumblebee TUI Heading Rendering Bug - Oracle Consultation

**Date:** 2025-10-19
**Project:** Bumblebee CLI Markdown Viewer
**Critical Bug:** Headings don't render in TUI mode despite all attempted fixes
**Attempt:** Second attempt at this project - same exact issue as first attempt

---

## Project Overview

### What Bumblebee Is
A terminal-based markdown viewer built with TypeScript, using:
- **neo-blessed** for TUI (Terminal User Interface)
- **remark** for markdown parsing to MDAST (Markdown Abstract Syntax Tree)
- **Custom ANSI renderer** to convert MDAST to terminal-formatted output
- **Bumblebee color theme** (yellows #F2D638/#E9B033, cyan #1EC4F2)

### Architecture
```
Markdown File → Parser (remark) → MDAST → Renderer (mdastToAnsi) → ANSI Output → Blessed TUI
```

**Two modes:**
1. **Stdout mode (`--stdout`)**: Renders markdown directly to terminal - **WORKS PERFECTLY**
2. **TUI mode (default)**: Full blessed.js interface with scrolling, modes - **HEADINGS DON'T RENDER**

---

## What Has Been Built (Phase Status)

### ✅ Phase 0: Bootstrap & Config (COMPLETE)
- TypeScript project initialized
- Dependencies installed (neo-blessed, remark, commander)
- Config loader (`loadConfig.ts`) with spec defaults
- Theme system (`theme-bumblebee.ts`) with TrueColor/256-color fallbacks

### ✅ Phase 1: Markdown Rendering Pipeline (COMPLETE)
All components VERIFIED working in stdout mode:

**Files:**
- `src/parser/mdToAst.ts` - Parses markdown to MDAST using remark-parse + remark-gfm
- `src/render/mdastToAnsi.ts` - Renders MDAST to ANSI escape sequences
- `src/render/ansi/wrap.ts` - Text wrapping at terminal width
- `src/render/ansi/width.ts` - ANSI-aware string width calculation

**Supported Elements:**
- ✅ Headings (h1-h6) with `#` prefixes and yellow color
- ✅ Paragraphs with text wrapping
- ✅ Emphasis (*italic*) and Strong (**bold**)
- ✅ Lists (ordered and unordered)
- ✅ Blockquotes with > prefix
- ✅ Code blocks with syntax highlighting
- ✅ Tables with borders
- ✅ Links

**Test Suite:**
- 22/22 tests passing (vitest)
- All fixtures tested: simple.md, tables.md, code-blocks.md, complex.md
- TypeScript compilation: 0 errors
- Build process: clean

### ✅ Phase 2: TUI Shell & Modes (COMPLETE - except bug)

**Files:**
- `src/tui/layout.ts` - Two-pane layout (explorer hidden, preview visible)
- `src/tui/input.ts` - Keybindings (r/Esc/q, j/k/arrows for scrolling)
- `src/app.ts` - Main application with stdout and TUI modes

**Features Working:**
- ✅ TUI launches without crashing (after terminal compatibility fix)
- ✅ Mode switching (r → cyan border, Esc → yellow border)
- ✅ Scrolling with j/k and arrow keys
- ✅ Quit with q or Ctrl+C
- ✅ Terminal resize handling with content reflow
- ✅ **Lists render correctly in TUI** (bullets visible)
- ✅ Error handling for missing files

**Feature NOT Working:**
- ❌ **Headings don't render in TUI** (completely invisible)

---

## What Should Work

### Stdout Mode Behavior (WORKS)
```bash
$ node dist/cli.js --stdout test.md
```

**Output:**
```
^[[38;5;214m# Test Heading^[[0m

This is a test.
```

**Analysis:**
- ANSI escape code `^[[38;5;214m` is color code (orange/yellow-214)
- Heading text is present
- ANSI reset code `^[[0m` at end
- **Renderer is working perfectly**

### TUI Mode Expected Behavior (DOESN'T WORK)
```bash
$ node dist/cli.js test.md
```

**Expected:** Should see yellow "# Test Heading" text in preview pane

**Actual:**
- TUI launches ✅
- Preview pane is visible ✅
- Lists render (bullets visible) ✅
- Headings are **completely invisible** ❌
- No heading text shows at all

---

## The Bug

### Symptom
**In TUI mode, markdown headings (#, ##, ###, etc.) do not render at all.**

They are completely invisible - not just missing formatting, the text itself doesn't appear.

### What DOES Render in TUI
- ✅ Paragraph text
- ✅ List items (bullets visible)
- ✅ Error messages
- ✅ Borders and UI elements

### What DOESN'T Render in TUI
- ❌ Headings (h1, h2, h3, h4, h5, h6)

### Isolation Test
Using `test.md`:
```markdown
# Test Heading

This is a test.
```

**Stdout mode:** Shows heading with yellow color ✅
**TUI mode:** Heading invisible, "This is a test." visible ❌

---

## What We Have Tried

### Attempt 1: Terminal Compatibility Fix (SUCCESSFUL - Different Bug)
**Problem:** TUI crashed on launch in tmux/screen terminals
**Error:** `Error on screen-256color.plab_norm`
**Fix:** Added `terminal: 'xterm-256color'` to blessed screen config
**Result:** ✅ TUI no longer crashes
**Commit:** cea2294

### Attempt 2: Blessed Tag Parsing Fix (FAILED)
**Theory:** Blessed was interpreting ANSI codes as its own tag system
**Fix:** Added `tags: false` to preview pane config in `layout.ts`
**Result:** ❌ Headings still don't render
**Status:** Uncommitted (in working directory)

### Attempt 3: Content Setting API Fix (FAILED)
**Theory:** `setContent()` method incompatible with ANSI codes
**Fix:** Changed from `setContent()` to `.content` property assignment
**Added:** Explicit `screen.render()` calls after content updates
**Result:** ❌ Headings still don't render
**Status:** Uncommitted (in working directory)

### Current Code State
```typescript
// src/tui/layout.ts - Preview pane config
const preview = blessedAny.box({
  scrollable: true,
  alwaysScroll: true,
  mouse: true,
  tags: false,  // ← Added in Attempt 2
  style: {
    border: { fg: theme.yellowA },
    scrollbar: { bg: theme.cyan },
  },
  border: { type: 'line' },
});

// src/app.ts - Content setting
const rendered = render(markdownContent, width, currentTheme);
layout.preview.content = rendered;  // ← Changed from setContent() in Attempt 3
screen.render();  // ← Added explicit render call
```

---

## Technical Details

### Renderer Output (mdastToAnsi.ts)
```typescript
function renderHeading(node: Heading, terminalWidth: number, theme: BumblebeeTheme): string {
  const level = node.depth;
  const prefix = '#'.repeat(level) + ' ';
  const text = collectText(node);
  const headingText = prefix + text;

  // Apply yellow emphasis to the entire heading
  const emphasized = theme.current.yellowB + headingText + '\x1b[0m';

  return wrapText(emphasized, terminalWidth);
}
```

**Output for "# Test Heading":**
```
\x1b[38;5;214m# Test Heading\x1b[0m
```

Where:
- `\x1b[38;5;214m` = Set foreground color to 214 (orange/yellow)
- `\x1b[0m` = Reset formatting

### Blessed.js Content Setting

**Two APIs exist:**
1. `setContent(text: string)` - Method that sets content and processes it
2. `.content` property - Direct property assignment

According to blessed docs:
> "Note: When text is input, it will be stripped of all non-SGR escape codes, tabs will be replaced with 8 spaces, and tags will be replaced with SGR codes (if enabled)."

SGR codes (like `\x1b[38;5;214m`) should be preserved.

### Preview Pane Configuration
```typescript
{
  scrollable: true,
  alwaysScroll: true,
  mouse: true,
  keys: true,
  tags: false,  // We explicitly disabled tag processing
  style: { /* ... */ },
  border: { /* ... */ }
}
```

---

## Debugging Evidence

### Test 1: Stdout Mode ANSI Output
```bash
$ node dist/cli.js --stdout test.md | cat -v
^[[38;5;214m# Test Heading^[[0m

This is a test.
```

**Conclusion:** Renderer generates correct ANSI codes ✅

### Test 2: TUI Mode Visual Check
```bash
$ node dist/cli.js test.md
```

**Observation:**
- TUI window opens
- Preview pane visible with borders
- Scroll position indicator works
- "This is a test." paragraph text visible
- "# Test Heading" completely missing

### Test 3: List Rendering in TUI
Using a file with lists:
```markdown
- Item 1
- Item 2
```

**Result:** Bullets and text both visible in TUI ✅

**Conclusion:** TUI CAN render some content, but not headings

### Test 4: Simple.md Fixture
```bash
$ node dist/cli.js tests/fixtures/simple.md
```

**File contains:**
```markdown
# Simple Markdown Test

This is a simple paragraph.

## Second Level Heading

Another paragraph.

### Third Level Heading
```

**TUI shows:**
- ❌ "# Simple Markdown Test" - missing
- ✅ "This is a simple paragraph." - visible
- ❌ "## Second Level Heading" - missing
- ✅ "Another paragraph." - visible
- ❌ "### Third Level Heading" - missing

**Pattern:** ALL heading levels invisible, all paragraph text visible

---

## Code Locations

### Rendering Pipeline
- **Parser:** `src/parser/mdToAst.ts` line 12-18
- **Heading Renderer:** `src/render/mdastToAnsi.ts` lines 83-93
- **Main Dispatcher:** `src/render/mdastToAnsi.ts` lines 41-68
- **Text Collection:** `src/render/mdastToAnsi.ts` lines 289-302

### TUI Implementation
- **Preview Pane Creation:** `src/tui/layout.ts` lines 71-91
- **Content Setting:** `src/app.ts` lines 79-86
- **Resize Handler:** `src/app.ts` lines 95-106
- **Screen Config:** `src/app.ts` lines 50-55

### Tests (All Passing)
- **Renderer Tests:** `tests/renderer.test.ts` (22/22 passing)
- **Fixtures:** `tests/fixtures/*.md`

---

## Constraints & Observations

### What We Know
1. **Renderer works** - stdout mode proves ANSI generation is correct
2. **TUI works** - lists and paragraphs render fine
3. **Terminal supports ANSI** - stdout mode shows colors properly
4. **Blessed accepts content** - paragraphs and lists appear
5. **Only headings affected** - specific to heading node type

### What's Puzzling
1. Why do lists render but headings don't?
2. Both use ANSI color codes
3. Both go through same blessed content pipeline
4. Both have similar structure (prefix + text + reset)

### Blessed.js Peculiarities
- Uses its own tag system: `{bold}text{/bold}`
- Can process ANSI SGR codes when `tags: false`
- Has `setContent()` method and `.content` property
- Requires `screen.render()` to update display
- Strips non-SGR escape codes

### ANSI Code Comparison

**Heading output:**
```
\x1b[38;5;214m# Test Heading\x1b[0m
```

**List item output:**
```
• \x1b[1mItem 1\x1b[0m
```

Both use similar ANSI structure, but headings don't show.

---

## Environment

**Terminal:** screen-256color (tmux session)
**Node:** v18+
**TypeScript:** 5.x
**Dependencies:**
- neo-blessed: 0.9.99
- remark-parse: Latest
- commander: Latest
- vitest: 3.2.4

**Build:** `npm run build:node` (tsc + chmod)
**Test:** All 22 tests passing
**Git:** Clean commits, no errors

---

## Questions for Oracle

### Primary Question
**Why do headings not render in blessed.js TUI when:**
1. The renderer generates correct ANSI codes (verified via stdout)
2. Other content (lists, paragraphs) renders fine in the same TUI
3. We've tried `tags: false` to disable tag parsing
4. We've tried both `setContent()` and `.content` property
5. We've added explicit `screen.render()` calls

### Specific Theories to Evaluate

**Theory A: ANSI Code Incompatibility**
- Are heading ANSI codes somehow different/incompatible?
- Does blessed strip color codes from certain patterns?

**Theory B: Heading-Specific Content Processing**
- Does blessed have special handling for lines starting with `#`?
- Is there a conflict with its markdown rendering mode?

**Theory C: Text Wrapping Issue**
- Does `wrapText()` break blessed's ANSI parsing?
- Are heading lines being wrapped to zero width?

**Theory D: Color Code Format**
- Does `\x1b[38;5;214m` work in blessed but not for headings?
- Should we use different color code format?

**Theory E: Missing Configuration**
- Is there a blessed option we're missing for ANSI support?
- Do we need `ansi: true` or similar config?

### Diagnostic Requests

1. **What blessed.js setting controls ANSI escape sequence processing?**
2. **Why would lists render but headings not, given similar ANSI structure?**
3. **Is there a known issue with blessed and heading-like patterns (#-prefixed lines)?**
4. **Should we be using blessed's built-in markdown rendering instead?**
5. **What's the correct way to display pre-formatted ANSI content in blessed boxes?**

---

## Project Context

### This Is Attempt #2
**First attempt:** Hit this exact same issue - headings didn't render in TUI
**Second attempt (current):** Same bug, different approaches tried

**Why this project:**
- Deliberately chose hard problem (blessed.js + ANSI is niche)
- Testing workflow and iteration process
- Need to work through difficult technical issues
- Good test of systematic debugging

### Strategic Importance
This is a workflow test - need to figure out:
1. How to systematically debug blessed.js issues
2. When to ask for higher-level strategic help (now)
3. How to break through when standard fixes don't work

### What Success Looks Like
- Headings render in TUI with yellow color
- All markdown elements visible
- Complete Phase 2 acceptance criteria
- Move to Phase 3 (Explorer)

---

## Files for Review

**Key Files:**
- `src/render/mdastToAnsi.ts` - Heading renderer implementation
- `src/tui/layout.ts` - Preview pane configuration
- `src/app.ts` - Content setting and TUI setup
- `tests/renderer.test.ts` - Test suite (all passing)

**Test Files:**
- `test.md` - Minimal reproduction case
- `tests/fixtures/simple.md` - Multiple heading levels

**Working Directory:** `/home/ridgetop/aidis/projects/bumblebee`

---

## Request for Oracle

We need strategic guidance on:

1. **Root cause identification** - What's actually happening in blessed that prevents heading display?
2. **Alternative approaches** - Should we abandon ANSI-in-blessed and try a different architecture?
3. **Blessed.js deep knowledge** - What undocumented behavior might be affecting us?
4. **Debugging strategy** - How to systematically isolate the issue?

This has stumped two different attempts. Standard blessed.js solutions (tags: false, setContent vs .content) haven't worked. Lists render but headings don't, despite similar ANSI structure.

**We're stuck and need deeper insight.**
