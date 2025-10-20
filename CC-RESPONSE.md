# Claude Code Scrolling Issues - Investigation Results

## 🚨 **IT'S NOT JUST YOU - MAJOR KNOWN ISSUES**

Good news/bad news: You're experiencing **widespread, documented bugs** affecting many users.

## 🔴 **Critical Issue #1: Version 2.0.8 Scroll Regression**

**Issue #9001** - Claude Code 2.0.8 has a **critical scroll regression**:
- **Symptom**: Terminal locked to showing only last ~20 lines
- **Cause**: Rendering "improvement" in 2.0.8 broke scrolling
- **Impact**: Can't scroll up to view history (mouse OR keyboard)
- **Status**: Active bug, HIGH severity

### ✅ **IMMEDIATE FIX: Downgrade to 2.0.1**

```bash
npm install -g @anthropic-ai/claude-code@2.0.1
```

Version 2.0.1 had working scrolling. This is the **recommended workaround** from multiple users.

---

## 🔴 **Critical Issue #2: Tmux Scrollback Buffer Bug**

**Issue #4851** - Severe performance degradation in tmux (37+ reactions):
- **Symptom**: After thousands of lines, terminal scrolls uncontrollably from beginning to current line
- **Impact**: Takes dozens of seconds, high CPU usage, essentially unusable
- **Trigger**: Window resize, multiline input, accumulated history
- **Root Cause**: Claude Code maintains internal scrollback buffer (possible memory leak)

### Tmux-Specific Workarounds:

1. **Increase history limit** (delays problem):
```bash
# In .tmux.conf
set-option -g history-limit 250000
```

2. **Resize pane** (temporary relief):
   - Even resizing by 1 line/column reduces lag tremendously

3. **Restart frequently** (nuclear option):
   - `/quit` and restart when scrolling gets bad

---

## 📊 **Other Related Issues Found**

Multiple users reporting:
- "High speed scrolling" that can't be stopped
- Flashing/scrolling terminal that crashes
- Mouse wheel only scrolls input box, not history
- Console auto-scrolling to top on every keystroke

**Common thread**: All started after recent updates (especially 2.0.8)

---

## 🎯 **My Recommendation**

### **Step 1: Check your version**
```bash
claude --version
```

### **Step 2: If 2.0.8, DOWNGRADE IMMEDIATELY**
```bash
npm install -g @anthropic-ai/claude-code@2.0.1
```

### **Step 3: If using tmux, apply tmux workarounds**
- Increase history-limit
- Be prepared to restart sessions more frequently
- Consider running Claude Code outside tmux for critical sessions

### **Step 4: Monitor GitHub issues**
- Issue #9001: https://github.com/anthropics/claude-code/issues/9001 (scroll regression)
- Issue #4851: https://github.com/anthropics/claude-code/issues/4851 (tmux scrollback)

Both are actively tracked by the Anthropic team.

---

## 💡 **Why This Weekend?**

The timing matches recent updates (2.0.8 and related versions) that introduced:
- "Message rendering improvements" (which broke scrolling)
- Changes to terminal handling (which amplified tmux issues)

**Your instinct was correct** - the updates caused this.

---

## 📋 **Quick Summary of Search Findings**

### GitHub Issues Found:
1. **Issue #9001** - Scroll regression in 2.0.8 (cannot scroll conversation history)
2. **Issue #4851** - Terminal scrollback buffer rewind lag in tmux after extended use
3. **Issue #5368** - Cannot scroll up to view conversation history (mouse wheel only scrolls input box)
4. **Issue #3648** - Terminal scrolling uncontrollably during Claude Code interaction
5. **Issue #1422** - Uninterruptible "high speed scrolling"
6. **Issue #826** - Console scrolling to top of history when Claude adds text

### User Reports:
- Twitter/X user Ian Nuttall: "If you get the flashing/scrolling terminal bug don't try to push through... it will crash"
- Multiple reports of scrolling taking "dozens of seconds"
- High CPU usage and laptop fans spinning up
- Problems worse in tmux but also affect regular terminals

---

## ✅ **Bottom Line**

**Downgrade to 2.0.1 and see if that resolves it.** This is a known, tracked bug affecting many users, not a local configuration issue. Your chat history file is likely fine - it's the Claude Code terminal rendering that's broken.

---

**Date of Investigation**: October 20, 2025
**Claude Code Versions Affected**: 2.0.8 (primary), possibly 2.0.5-2.0.7
**Working Version**: 2.0.1
**Platform**: Affects macOS, Linux, WSL2 - across all terminals (tmux, iTerm, VS Code, standard terminal)
