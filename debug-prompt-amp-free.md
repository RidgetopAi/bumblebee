# BUMBLEBEE - Debug Instance Protocol

\*\*You are Debug Instance [N]
ridgetop@Ridgetop:~/aidis/projects/bumblebee$ node dist/cli.js test.md

Error on screen-256color.plab_norm:
";5%;%?%p5%t;2%;m%?%p9%t\u000e%e\u000f%;"

var v,
stack = [],
out = [];
out.push(";
5")};
if ((stack.push(v = params[4]),
v)) {out.push(";
2")}out.push("m");
if ((stack.push(v = params[8]),
v)) {out.push("\x0e")} else {out.push("\x0f")};
return out.join("");\*\*

**AIDIS Project:** bumblebee
**Working Directory:** `~/aidis/projects/bumblebee`
**Mission:** Fix critical bugs - TUI doesn't display content

---

## Critical Bugs to Fix

### Bug #1: TUI Crashes on Launch

```
Error on screen-256color.plab_norm:
";5%;%?%p5%t;2%;m%?%p9%t\u000e%e\u000f%;"
```

**Issue:** Blessed.js terminal compatibility (user in tmux/screen)

### Bug #2: H2 Headings Not Rendering

`--stdout` mode shows `# H1` but missing `## H2` headings

---

## AIDIS Investigation Protocol

### Step 1: Search for Bug Context

```typescript
// Find the investigation report
smart_search("blessed terminal compatibility h2 rendering");

// Find error contexts
context_search("terminal-compatibility blessed-js");

// Get recent instance work
context_get_recent((limit = 5));
```

### Step 2: Review Stored Evidence

Look for these context IDs:

- Investigation report: `862e6ec4-d3e6-474b-a1c1-b97378ae6c5c`
- Earlier investigation: `544f6ed8-4ebc-454d-b838-a5a9134fcd3a`

### Step 3: Find Related Decisions

```typescript
// Check for renderer decisions
decision_search("renderer mdast ansi");

// Check for TUI architecture
decision_search("blessed tui layout");
```

---

## Debug Workflow

### 1. INVESTIGATE (30 min)

**Use AIDIS to understand the problem:**

- What did investigation find?
- What fixes were proposed?
- What files are involved?

**Key files to examine:**

- `src/app.ts` (blessed screen config)
- `src/render/mdastToAnsi.ts` (h2 rendering)
- `src/tui/layout.ts` (preview pane)

### 2. REPRODUCE (15 min)

```bash
# Test stdout mode (should partially work)
node dist/cli.js --stdout README.md

# Test TUI (currently crashes)
node dist/cli.js test.md

# Check terminal type
echo $TERM  # Should show: screen-256color
```

### 3. FIX (Implementation)

**Likely fixes based on investigation:**

**Fix #1: Blessed Terminal Compatibility**

```typescript
// src/app.ts line ~50
const screen = blessedAny.screen({
  smartCSR: true,
  title: "Bumblebee",
  fullUnicode: true,
  terminal: "xterm-256color", // ← ADD THIS
  ignoreLocked: ["C-c"], // ← ADD THIS
});
```

**Fix #2: H2 Heading Rendering**

- Check `src/render/mdastToAnsi.ts`
- Search for h2/heading rendering logic
- Verify `## ` prefix and yellow color

**Fix #3: Content Display**

- Investigate `setContent()` vs `.content` property
- Check if `screen.render()` called after content set

### 4. VERIFY (Mandatory)

```bash
# TypeScript
npx tsc --noEmit  # Must be 0 errors

# Tests
npm test  # Must pass all 22 tests

# Build
npm run build:node

# Manual test: stdout
node dist/cli.js --stdout README.md
# Should show ALL headings (h1, h2, h3)

# Manual test: TUI
node dist/cli.js test.md
# Should NOT crash
# Should show rendered content

# Git commit and push
git add .
git commit -m "fix: resolve blessed.js terminal compatibility and h2 rendering"
git push origin main
```

---

## AIDIS Context Storage

**Store your findings:**

```typescript
// When you find the root cause
context_store(
  content: "Detailed explanation of what was broken and how you fixed it",
  type: "code",
  tags: ["debug", "blessed-js", "renderer-fix", "instance_N"]
);

// When complete
context_store(
  content: "Fix summary and verification results",
  type: "completion",
  tags: ["debug-complete", "tb019-fix", "instance_N"]
);
```

---

## Success Criteria

✅ TUI launches without crashing
✅ Preview pane shows rendered markdown content
✅ All heading levels render (h1, h2, h3)
✅ `--stdout` mode shows complete output
✅ TypeScript 0 errors
✅ All 22 tests pass
✅ Git commit pushed

---

## Key Principles

1. **Search AIDIS first** - Investigation already done, learn from it
2. **Verify EVERYTHING** - Test both stdout and TUI modes
3. **No test modification** - Fix code, not tests
4. **Store your learnings** - Help future instances

---

## Quick Reference

**AIDIS Search:**

```typescript
smart_search("keywords"); // Best for finding patterns
context_search("topic"); // Find specific contexts
context_get_recent((limit = 10)); // Recent instance work
```

**Files to Check:**

- `src/app.ts` (blessed config, content setting)
- `src/render/mdastToAnsi.ts` (heading rendering)
- `src/tui/layout.ts` (preview pane creation)

**Test Commands:**

```bash
node dist/cli.js --stdout test.md  # Should show all headings
node dist/cli.js test.md           # Should render in TUI
npm test                            # Should pass 22/22
```
