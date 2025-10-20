# TB013-4: Multi-Editor Testing Plan for Phase 4 Edit Mode

**Task**: TB013-4
**Phase**: 4 - Edit Mode
**Created**: 2025-10-20
**QA Agent**: Testing Specialist

---

## Overview

This document provides comprehensive testing instructions for the Bumblebee TUI edit mode functionality across multiple editors. The edit mode (triggered by 'i' keybinding) suspends the TUI, opens the current file in an external editor, and restores the TUI after editing with updated content.

---

## Editor Selection Logic

### Code Location
- **Primary Implementation**: `/src/editor/spawnEditor.ts` (lines 26-27)
- **Configuration**: `/src/config/loadConfig.ts` (lines 14-15, 32-37)

### Selection Priority Chain
The editor is selected using the following priority order:

1. **Config file setting**: `bumblebee.config.json` → `editor` field
2. **Environment variable**: `$EDITOR` environment variable
3. **Default fallback**: `nvim`

```typescript
const editor = config.editor || process.env.EDITOR || 'nvim';
```

### Configuration Options

**Via Config File** (`bumblebee.config.json`):
```json
{
  "editor": "vim"
}
```

**Via Environment Variable**:
```bash
export EDITOR=nano
```

**Default Behavior**:
- If no config file exists and `$EDITOR` is not set: uses `nvim`
- Config validation requires `editor` to be a non-empty string

---

## Editors to Test

### 1. nvim (Neovim)
- **Status**: Already confirmed working ✓
- **Common on**: Modern Linux, macOS, WSL
- **Install**: `sudo apt install neovim` (Debian/Ubuntu)

### 2. vim (Vi IMproved)
- **Status**: To be tested
- **Common on**: Nearly all Unix-like systems
- **Install**: Usually pre-installed, or `sudo apt install vim`

### 3. nano (GNU nano)
- **Status**: To be tested
- **Common on**: Most Linux distributions
- **Install**: Usually pre-installed, or `sudo apt install nano`

### 4. vi (Original Vi)
- **Status**: To be tested
- **Common on**: All POSIX systems (minimal fallback)
- **Install**: Pre-installed on virtually all Unix-like systems

### 5. emacs (Optional Extended Testing)
- **Status**: Optional
- **Common on**: Linux, macOS
- **Install**: `sudo apt install emacs-nox` (terminal version)

---

## Test Scenarios

### Scenario 1: Normal Edit Flow (All Editors)

**Objective**: Verify basic edit-save-return cycle works correctly

**Steps**:
1. Configure editor (see Configuration Methods below)
2. Start Bumblebee with a markdown file: `bumblebee test.md`
3. Press `i` to enter edit mode
4. Verify TUI suspends cleanly (normal terminal prompt visible)
5. Verify editor opens with correct file
6. Make a visible edit (add/modify text)
7. Save and exit editor:
   - nvim/vim/vi: `:wq` or `ZZ`
   - nano: `Ctrl+X`, then `Y`, then `Enter`
   - emacs: `Ctrl+X Ctrl+S`, then `Ctrl+X Ctrl+C`
8. Verify TUI restores properly
9. Verify rendered content shows the edits

**Expected Results**:
- Screen clears properly when TUI suspends
- Editor launches without errors
- File path is correct in editor
- Terminal returns to TUI after editor exit
- Content updates are visible in TUI
- No visual artifacts or corruption

---

### Scenario 2: Edit Without Changes (All Editors)

**Objective**: Verify behavior when file is not modified

**Steps**:
1. Configure editor
2. Start Bumblebee with a markdown file
3. Press `i` to enter edit mode
4. Open file but make NO changes
5. Exit editor without saving:
   - nvim/vim/vi: `:q` or `:q!`
   - nano: `Ctrl+X`, then `N`
   - emacs: `Ctrl+X Ctrl+C`

**Expected Results**:
- TUI restores properly
- Content remains unchanged
- No unnecessary re-rendering
- No error messages

---

### Scenario 3: Editor Not Found (Error Handling)

**Objective**: Verify graceful error handling when editor is missing

**Steps**:
1. Configure a non-existent editor:
   ```json
   {
     "editor": "nonexistent-editor-xyz"
   }
   ```
2. Start Bumblebee
3. Press `i` to enter edit mode

**Expected Results**:
- Error message displayed clearly
- Error mentions the editor name: `"Failed to spawn editor 'nonexistent-editor-xyz'"`
- TUI remains stable (doesn't crash)
- User can continue using Bumblebee after error

**Code Reference**: `spawnEditor.ts` lines 63-65 (error event handler)

---

### Scenario 4: Editor Exits with Error Code (All Editors)

**Objective**: Verify handling when editor exits abnormally

**Steps**:
1. Configure editor
2. Start Bumblebee with a markdown file
3. Press `i` to enter edit mode
4. Simulate editor error (editor-specific):
   - nvim/vim: Try to save read-only file, then `:q!`
   - nano: `Ctrl+X` without saving changes, choose `N`
   - Force-quit editor: `Ctrl+C` or `Ctrl+Z` (may vary)

**Expected Results**:
- TUI restores even after abnormal exit
- Application remains stable
- No corrupted state

**Code Reference**: `spawnEditor.ts` lines 45-60 (close event handler)

---

### Scenario 5: File Permission Issues

**Objective**: Verify behavior with read-only or permission-denied files

**Setup**:
```bash
# Create read-only test file
echo "# Read Only Test" > readonly.md
chmod 444 readonly.md
```

**Steps**:
1. Configure editor
2. Start Bumblebee: `bumblebee readonly.md`
3. Press `i` to enter edit mode
4. Attempt to edit and save
5. Handle editor's permission error appropriately
6. Exit editor

**Expected Results**:
- Editor shows appropriate permission error
- TUI restores after editor exit
- Original file remains unchanged
- No application crash

**Cleanup**:
```bash
chmod 644 readonly.md
rm readonly.md
```

---

### Scenario 6: Large File Editing (All Editors)

**Objective**: Verify performance with larger markdown files

**Setup**:
```bash
# Create large test file (~10K lines)
for i in {1..10000}; do echo "# Section $i"; echo "Content for section $i"; done > large-test.md
```

**Steps**:
1. Configure editor
2. Start Bumblebee: `bumblebee large-test.md`
3. Press `i` to enter edit mode
4. Navigate to middle of file
5. Make an edit
6. Save and exit

**Expected Results**:
- Editor opens without delay
- Edit and save work normally
- TUI restoration shows updated content
- Performance remains acceptable

**Cleanup**:
```bash
rm large-test.md
```

---

### Scenario 7: Environment Variable Priority

**Objective**: Verify config file overrides $EDITOR

**Steps**:
1. Set environment variable: `export EDITOR=vim`
2. Create config with different editor:
   ```json
   {
     "editor": "nano"
   }
   ```
3. Start Bumblebee
4. Press `i` to enter edit mode

**Expected Results**:
- Config file setting (nano) takes precedence
- Editor specified in config opens, not $EDITOR

---

### Scenario 8: Special Characters in File Path

**Objective**: Verify editor spawning with special characters

**Setup**:
```bash
mkdir -p "test dir with spaces"
echo "# Test" > "test dir with spaces/file with spaces.md"
```

**Steps**:
1. Configure editor
2. Start Bumblebee: `bumblebee "test dir with spaces/file with spaces.md"`
3. Press `i` to enter edit mode
4. Verify correct file opens
5. Make edit, save, exit

**Expected Results**:
- Correct file opens in editor
- File path handled properly (shell: true helps)
- Edits save correctly
- TUI restores with updates

**Cleanup**:
```bash
rm -rf "test dir with spaces"
```

**Code Reference**: `spawnEditor.ts` line 36 (`shell: true` for path compatibility)

---

## Configuration Methods for Testing

### Method 1: Config File (Recommended)

Create `bumblebee.config.json` in project root:

```json
{
  "editor": "vim"
}
```

**Pros**: Persistent, clear, easy to switch
**Cons**: Requires file creation

---

### Method 2: Environment Variable

Set before running Bumblebee:

```bash
export EDITOR=nano
bumblebee test.md
```

Or inline:
```bash
EDITOR=nano bumblebee test.md
```

**Pros**: Quick, no file needed
**Cons**: Only works if no config file exists

---

### Method 3: Test Default Behavior

Remove config file and unset $EDITOR:

```bash
rm -f bumblebee.config.json
unset EDITOR
bumblebee test.md
```

**Expected**: Uses nvim (default)

---

## Edge Cases & Error Scenarios

### Edge Case 1: Empty Config File
```json
{}
```
**Expected**: Uses $EDITOR or nvim (default)

---

### Edge Case 2: Invalid Config
```json
{
  "editor": ""
}
```
**Expected**: Validation error: "Config.editor must be a non-empty string"

---

### Edge Case 3: Editor with Arguments
```json
{
  "editor": "vim -u NONE"
}
```
**Expected**: Should work (shell: true allows arguments)

---

### Edge Case 4: Terminal Without $TERM
**Steps**:
1. Unset TERM: `unset TERM`
2. Start Bumblebee and press `i`

**Expected**: Editor receives fallback TERM='xterm-256color'
**Code Reference**: `spawnEditor.ts` lines 37-41 (TERM fallback)

---

### Edge Case 5: Multiple Rapid Edits
**Steps**:
1. Press `i`, make edit, save, exit
2. Immediately press `i` again
3. Make another edit, save, exit
4. Repeat 3-5 times

**Expected**: Each cycle works correctly, no state corruption

---

## Test Matrix

| Editor | Normal Edit | No Changes | Not Found | Error Exit | Permissions | Large File | Spaces in Path |
|--------|-------------|------------|-----------|------------|-------------|------------|----------------|
| nvim   | ✓ PASS      | TBD        | N/A       | TBD        | TBD         | TBD        | TBD            |
| vim    | TBD         | TBD        | TBD       | TBD        | TBD         | TBD        | TBD            |
| nano   | TBD         | TBD        | TBD       | TBD        | TBD         | TBD        | TBD            |
| vi     | TBD         | TBD        | TBD       | TBD        | TBD         | TBD        | TBD            |
| emacs  | TBD         | TBD        | TBD       | TBD        | TBD         | TBD        | TBD            |

---

## Testing Checklist

### Pre-Testing Setup
- [ ] Verify Bumblebee builds successfully: `npm run build`
- [ ] Create test markdown files with various content
- [ ] Verify which editors are installed: `which nvim vim nano vi emacs`
- [ ] Backup any existing `bumblebee.config.json`

### Core Functionality Tests
- [ ] nvim: Normal edit flow (already confirmed working)
- [ ] vim: Normal edit flow
- [ ] nano: Normal edit flow
- [ ] vi: Normal edit flow
- [ ] Each editor: No-change exit
- [ ] Each editor: Large file performance

### Configuration Tests
- [ ] Config file overrides $EDITOR
- [ ] $EDITOR works when no config exists
- [ ] Default (nvim) works when no config and no $EDITOR
- [ ] Editor with command-line arguments works

### Error Handling Tests
- [ ] Non-existent editor shows clear error
- [ ] Read-only file handled gracefully
- [ ] Editor abnormal exit doesn't crash TUI
- [ ] Special characters in paths work correctly

### Regression Tests
- [ ] Multiple consecutive edits work
- [ ] TUI restoration is complete (no artifacts)
- [ ] Content change detection works
- [ ] No memory leaks after multiple edits

---

## Known Issues & Limitations

### Current Implementation Notes

1. **Change Detection**: File content is compared before/after editing (lines 18-24, 47-59)
   - If file read fails after editing, assumes changed (safe default)
   - Uses simple string comparison (adequate for text files)

2. **TUI Suspension**: Uses `screen.destroy()` (line 31)
   - Restores normal terminal for editor
   - Caller responsible for TUI restoration (TB010-4)

3. **Shell Mode**: Enabled for Windows/WSL compatibility (line 36)
   - Allows editor arguments in config
   - Handles paths with spaces correctly

4. **TERM Environment**: Provides fallback (line 40)
   - Ensures editors have proper terminal type
   - Defaults to 'xterm-256color'

---

## Success Criteria

TB013-4 is considered complete when:

1. **All Priority Editors Tested**: vim, nano, vi (nvim already confirmed)
2. **Core Scenarios Pass**: Normal edit, no changes, error handling
3. **Edge Cases Verified**: At least 3 edge cases tested and documented
4. **Test Matrix Complete**: Results documented for each editor/scenario
5. **Issues Documented**: Any failures or limitations clearly noted
6. **Regression Verified**: No existing functionality broken

---

## Reporting Results

### For Each Test, Document:

1. **Editor Tested**: Name and version (`vim --version`, `nano --version`, etc.)
2. **Test Scenario**: Reference scenario number/name
3. **Result**: PASS / FAIL / PARTIAL
4. **Observations**: What happened, any unexpected behavior
5. **Issues Found**: Bugs, UX problems, error messages
6. **Screenshots**: If relevant (especially for visual artifacts)

### Example Test Result:

```markdown
**Test**: Scenario 1 - Normal Edit Flow
**Editor**: vim 8.2.4919
**Date**: 2025-10-20
**Result**: PASS

Observations:
- TUI suspended cleanly
- vim opened with correct file
- Edited content visible after :wq
- TUI restored perfectly
- No visual artifacts

Issues: None
```

---

## QA Team Next Steps

1. **Review this document** thoroughly
2. **Set up test environment** with multiple editors installed
3. **Execute test matrix** systematically (one editor at a time)
4. **Document all results** in test matrix above
5. **Report any failures** with detailed reproduction steps
6. **Verify edge cases** for any problematic editors
7. **Update completion status** in AIDIS when testing complete

---

## References

- **Implementation**: `/src/editor/spawnEditor.ts`
- **Configuration**: `/src/config/loadConfig.ts`
- **Integration**: `app.ts` (TB010-4 TUI restoration)
- **Task Tracking**: TB013-4 in AIDIS
- **Phase Plan**: Phase 4 - Edit Mode

---

**Document Version**: 1.0
**Last Updated**: 2025-10-20
**Status**: Ready for QA Team Testing
