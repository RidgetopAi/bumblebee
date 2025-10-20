# Oracle Analysis: Bumblebee Heading Rendering Bug

**Date:** 2025-10-19
**Oracle Consultation:** TUI Heading Rendering Investigation

---

## TL;DR: Root Cause Identified

**The bug is NOT about "#-prefix handling or terminal compatibility.**

**Root Cause:** Your heading lines start with an SGR color code and are pre-wrapped by `wrap-ansi`. Neo-blessed then re-wraps them again. The combination of:
1. `38;{2|5};…` color at column 0 
2. wrap-ansi's "close-on-newline/reopen" trick

...produces **incomplete re-open codes** (`38m`) that blessed ignores. The line ends up with only SGRs at split points and no visible text.

**Why lists work but headings don't:** Lists don't consistently start with a color code at column 0, or have color applied mid-line. Headings are the only elements that are "purely colored spans" from start to finish.

---

## Recommended Fixes (Simple Path)

### Priority Order (Try These First)

#### Fix 1: Stop Pre-Wrapping Headings (HIGHEST PRIORITY)
**File:** `src/render/mdastToAnsi.ts`

**Change in `renderHeading` function:**
```typescript
// BEFORE:
return wrapText(emphasized, terminalWidth);

// AFTER:
return emphasized;  // Let blessed handle wrapping
```

**Rationale:** Headings are typically short and don't need pre-wrapping. This eliminates wrap-ansi's invalid `38m` reopen sequence that blessed ignores.

**Effort:** < 5 minutes

---

#### Fix 2: Reset Only Foreground Color
**File:** `src/render/mdastToAnsi.ts`

**Change in `renderHeading` function:**
```typescript
// BEFORE:
const emphasized = theme.current.yellowB + headingText + '\x1b[0m';

// AFTER:
const emphasized = theme.current.yellowB + headingText + '\x1b[39m';
```

**Rationale:** `\x1b[39m` resets only foreground color instead of clearing ALL formatting. Avoids clearing flags blessed might be tracking.

**Effort:** < 5 minutes

---

#### Fix 3: Use Named Colors for Preview Pane
**File:** `src/tui/layout.ts`

**Change in preview box configuration:**
```typescript
// BEFORE:
style: {
  border: { fg: theme.yellowA },
  scrollbar: { bg: theme.cyan },
},

// AFTER:
style: {
  fg: 'white',        // Add base foreground
  bg: 'black',        // Add base background
  border: { fg: 'yellow' },
  scrollbar: { bg: 'cyan' },
},
```

**Rationale:** Your current theme strings like `'\x1b[38;5;214m'` are ignored by blessed's `colors.convert()`, resolving to "default" (0x1ff). Setting explicit base fg/bg ensures visibility and gives resets a safe baseline.

**Effort:** < 10 minutes

---

#### Fix 4: Test with 16-Color (Validation)
**File:** `src/render/mdastToAnsi.ts`

**Temporary test change:**
```typescript
// TEMPORARY TEST - Replace color codes:
const emphasized = '\x1b[33m' + headingText + '\x1b[39m';
```

**Rationale:** Confirms the issue is specifically with 256-color SGR `38;5` reopen artifacts, not terminal/compatibility.

**Effort:** < 5 minutes (revert after testing)

---

#### Fix 5: Use Blessed Tags (If Above Fails)
**File:** `src/render/mdastToAnsi.ts` + `src/tui/layout.ts`

**If raw SGR continues to fail, switch to blessed's native tag system:**

In `renderHeading`:
```typescript
// Convert to blessed tags instead of ANSI codes
const emphasized = '{yellow-fg}' + headingText + '{/yellow-fg}';
return emphasized;  // No wrapping needed
```

In `layout.ts` preview config:
```typescript
tags: true,  // Enable blessed tag parsing
```

**Rationale:** Bypasses SGR parsing entirely. Let blessed handle all formatting natively.

**Trade-off:** Lose exact 24-bit color control, but gain stability.

**Effort:** < 30 minutes

---

## Technical Deep Dive

### What's Actually Happening

1. **Your renderer** outputs: `\x1b[38;5;214m# Test Heading\x1b[0m`
2. **wrap-ansi** (inside wrapText) splits lines and tries to reopen colors
3. **For 256-color**, wrap-ansi emits incomplete reopen: `38m` (missing `;5;214`)
4. **Blessed ignores** the incomplete `38m` code
5. **Blessed's own wrapping** can leave lines with only SGR codes, no visible text
6. **Result:** Heading text becomes invisible

### Why Lists/Paragraphs Work

- Lists often have uncolored text first (bullets), color applied mid-line
- Paragraphs typically start without color codes at column 0
- Headings are unique: **always** start with color, **purely colored spans**

### Blessed ANSI Handling Quirks

- ✅ Blessed **does** accept SGR codes in content
- ✅ Blessed strips non-SGR escape codes
- ❌ Blessed has **no special handling** for '#'-prefixed lines
- ❌ Blessed and wrap-ansi can **fight each other** on re-wrapping
- ❌ wrap-ansi's 256/truecolor line-boundary reopens are **incomplete**
- ❌ Blessed ignores incomplete SGR codes like `38m` without parameters

---

## Advanced Approaches (Only If Simple Fixes Fail)

### Approach A: Use Terminal Widget (ANSI-First)
```typescript
// Replace box with terminal widget
const preview = blessed.terminal({
  // terminal widget designed for raw ANSI streams
  // No content parsing or wrapping fights
});
```

**Pros:** Robust ANSI handling, no wrapping conflicts
**Cons:** Heavier widget, different API

---

### Approach B: Full Blessed-Native Styling
```typescript
// Generate blessed tags for ALL elements, not just headings
// Let blessed do 100% of formatting
const emphasized = '{yellow-fg}{bold}# Title{/bold}{/yellow-fg}';
```

**Pros:** Stable, native blessed rendering, simpler pipeline
**Cons:** Lose 24-bit color precision, need to map colors

---

## Implementation Strategy

### Recommended Order

1. **Start with Fix 1-3 combined** (highest success probability)
   - Remove wrapText from headings
   - Use `\x1b[39m` for reset
   - Add named colors to preview style
   
2. **Test with Fix 4** to validate diagnosis

3. **If still broken:** Try Fix 5 (blessed tags)

4. **If ALL fail:** Consider advanced approaches

### Estimated Time
- Simple path (Fixes 1-3): **< 30 minutes**
- With validation (Fix 4): **< 45 minutes**
- Full blessed tags (Fix 5): **< 1.5 hours**
- Advanced approaches: **2-4 hours**

---

## Risks and Trade-offs

### Fix 1 (No Pre-Wrap)
**Risk:** Long headings wrap slightly differently than in stdout mode
**Mitigation:** Headings are typically short; unlikely to be an issue

### Fix 3 (Named Colors)
**Risk:** Lose exact theme color hues (214 vs generic "yellow")
**Mitigation:** Can later map theme to #hex strings blessed can convert

### Fix 5 (Blessed Tags)
**Risk:** Content with literal `{` or `}` breaks rendering
**Mitigation:** Use `helpers.escape()` for literal curly braces

---

## When to Revisit Architecture

Consider advanced approaches if:
- Long headings still lose color or mis-wrap after all fixes
- Need exact wrap parity between stdout/TUI for snapshot testing
- Require full truecolor fidelity everywhere
- Multiple terminal types show inconsistent behavior

---

## Questions Answered

### Q: What blessed.js setting controls ANSI escape sequence processing?
**A:** Blessed accepts SGR codes in content by default. No special flag needed. The `tags: false` setting prevents blessed tag parsing (`{bold}`), allowing SGR codes through.

### Q: Why would lists render but headings not, given similar ANSI structure?
**A:** Headings uniquely start with color at column 0 and are purely colored spans. The wrap-ansi + blessed double-wrap interaction only breaks this specific pattern due to incomplete `38m` reopen codes.

### Q: Is there a known issue with blessed and heading-like patterns?
**A:** No issue with '#' characters specifically. The issue is: ANSI-at-column-0 + double-wrapping + incomplete 256-color reopens.

### Q: Should we be using blessed's built-in markdown rendering?
**A:** Blessed doesn't have markdown rendering. You're doing the right thing by parsing to MDAST and rendering yourself.

### Q: What's the correct way to display pre-formatted ANSI content in blessed boxes?
**A:** Either:
1. Let blessed handle wrapping (don't pre-wrap), OR
2. Use a `terminal` widget for raw ANSI streams, OR  
3. Use blessed tags instead of SGR codes

Avoid: Feeding SGR strings into `style` properties (use color names/hex instead).

---

## Next Steps

1. **Implement Fix 1-3** in one commit
2. **Test with simple.md** fixture
3. **If successful:** Test with all fixtures
4. **If unsuccessful:** Try Fix 4, then Fix 5
5. **Document decision** in AIDIS with `decision_record`

---

## Success Criteria

✅ All heading levels (h1-h6) visible in TUI
✅ Yellow color applied to headings  
✅ No regression in lists/paragraphs/other elements
✅ Scrolling still works
✅ Resize handling intact

---

## Oracle Confidence Level

**High confidence** in Fix 1-3 resolving the issue.

The root cause analysis is solid:
- wrap-ansi + blessed re-wrapping conflict
- Incomplete 38m reopen codes
- Heading-specific pattern (color at column 0)

**Expected outcome:** 90%+ probability Fix 1-3 resolves the bug completely.
