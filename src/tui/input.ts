import fs from 'fs';
import { bumblebeeTheme } from '../config/theme-bumblebee.js';
import { Layout, showExplorerPane, hideExplorerPane, updateLayoutOnResize, focusExplorerPane, focusPreviewPane } from './layout.js';
import { type ExplorerState, moveSelection, handleEnter, toggleExplorer, renderExplorer, getSelectedPath } from './panes/explorer.js';
import { BumblebeeConfig } from '../config/loadConfig.js';
import { spawnEditor } from '../editor/spawnEditor.js';
import { restoreTui, type TuiRestoreState } from './restore.js';

/**
 * TUI Mode enumeration for keybinding state management
 */
export enum Mode {
  Normal = 'normal',
  Render = 'render',
  Edit = 'edit'
}

/**
 * Set up input handling and keybindings for the Bumblebee TUI
 * Implements Phase 2 keybindings: r, Esc, q, arrows/j/k
 * Implements Phase 3 explorer: Ctrl+e, navigation, Enter
 * Implements Phase 4 edit mode: 'i' keybinding with TUI suspension/restoration
 */
export function setupInput(
  screen: any,
  layout: Layout,
  explorerState: ExplorerState,
  config: BumblebeeConfig,
  onFileOpen?: (filePath: string) => void,
  onDirectoryChange?: (directory: string, explorerState: ExplorerState, layout: Layout, config: BumblebeeConfig, screen: any) => void,
  restoreState?: TuiRestoreState
): void {
  let currentMode = Mode.Normal;
  let explorerFocused = false;
  let previewFocused = false;

  // Set initial border colors (all normal borders)
  updateBorders(screen, layout, currentMode, explorerFocused, previewFocused);

  // Mode switching keybindings
  screen.key('r', () => {
    currentMode = Mode.Render;
    focusPreviewPane(layout);
    explorerFocused = false;
    previewFocused = true;
    updateBorders(screen, layout, currentMode, explorerFocused, previewFocused);
  });

  screen.key('escape', () => {
    currentMode = Mode.Normal;
    updateBorders(screen, layout, currentMode, explorerFocused, previewFocused);
  });

  // Quit keybindings
  screen.key(['q', 'C-c'], () => {
    process.exit(0);
  });

  // Scrolling keybindings (Vim-style + arrows)
  // Delegate scrolling to the appropriate pane based on focus
  screen.key(['up', 'k'], () => {
    if (explorerState.visible && currentMode === Mode.Normal) {
      // Explorer navigation
      moveSelection(explorerState, 'up');
      updateExplorerContent(layout, explorerState, config, false); // Don't reset scroll on navigation
      screen.render();
    } else if (currentMode === Mode.Normal || currentMode === Mode.Render) {
      // Preview scrolling
      layout.preview.scroll(-1);
      screen.render();
    }
  });

  screen.key(['down', 'j'], () => {
    if (explorerState.visible && currentMode === Mode.Normal) {
      // Explorer navigation
      moveSelection(explorerState, 'down');
      updateExplorerContent(layout, explorerState, config, false); // Don't reset scroll on navigation
      screen.render();
    } else if (currentMode === Mode.Normal || currentMode === Mode.Render) {
      // Preview scrolling
      layout.preview.scroll(1);
      screen.render();
    }
  });

  screen.key(['left', 'h'], () => {
    if (currentMode === Mode.Normal || currentMode === Mode.Render) {
      layout.preview.scroll(0, -1); // Scroll left
      screen.render();
    }
  });

  screen.key(['right', 'l'], () => {
    if (currentMode === Mode.Normal || currentMode === Mode.Render) {
      layout.preview.scroll(0, 1); // Scroll right
      screen.render();
    }
  });

  // Explorer toggle keybinding (Ctrl+e)
  screen.key('C-e', () => {
    if (currentMode === Mode.Normal) {
      toggleExplorer(explorerState);

      if (explorerState.visible) {
        showExplorerPane(layout, config.explorerWidth);
        focusExplorerPane(layout);
        explorerFocused = true;
        previewFocused = false;
      } else {
        hideExplorerPane(layout);
        focusPreviewPane(layout);
        explorerFocused = false;
        previewFocused = true;
      }

      updateBorders(screen, layout, currentMode, explorerFocused, previewFocused);
      updateExplorerContent(layout, explorerState, config, true); // Reset scroll when toggling
      screen.render();
    }
  });

  // Enter key for explorer actions
  screen.key('enter', () => {
    if (explorerState.visible && currentMode === Mode.Normal) {
      const oldRootPath = explorerState.rootPath; // Track if directory changed
      const filePath = handleEnter(explorerState, config);
      if (filePath && onFileOpen) {
        // File opened - switch focus to preview (auto-focus behavior)
        focusPreviewPane(layout);
        explorerFocused = false;
        previewFocused = true;
        onFileOpen(filePath);
      } else {
        // Directory navigated - keep focus in explorer and update watcher
        updateExplorerContent(layout, explorerState, config, true); // Reset scroll when changing directories
        // Update file watcher if directory changed
        if (explorerState.rootPath !== oldRootPath && onDirectoryChange) {
          onDirectoryChange(explorerState.rootPath, explorerState, layout, config, screen);
        }
      }
      updateBorders(screen, layout, currentMode, explorerFocused, previewFocused);
      screen.render();
    }
  });

  // Edit mode keybinding (Phase 4) - 'i' to open current file in editor
  screen.key('i', async () => {
    if (currentMode === Mode.Normal && restoreState) {
      try {
        // Get the current file path from status bar
        const currentFilePath = restoreState.currentFilePath;

        // Suspend TUI and spawn editor
        const fileChanged = await spawnEditor(currentFilePath, config, screen);

        // Editor exited - restore TUI
        const { screen: newScreen, layout: newLayout } = await restoreTui(restoreState);

        // Conditionally re-render if file changed (TB011-4)
        if (fileChanged) {
          // Re-read the file content
          const newContent = fs.readFileSync(currentFilePath, 'utf-8');

          // Update the restoreState with new content (this will trigger re-render)
          restoreState.markdownContent = newContent;

          // Note: Full re-render integration will be completed in TB012-4
          console.log('File changed - content updated for re-rendering');
        }

        // Update references (this is a temporary implementation for TB010-4 testing)
        // In production, this would be handled by the app.ts level
        console.log('TUI restoration completed - screen and layout recreated');

        // For now, just log success - full integration in TB012-4
      } catch (error) {
        console.error('Edit mode failed:', (error as Error).message);
        // In a real implementation, we'd show user feedback here
      }
    }
  });
}

/**
 * Update TUI border colors based on current mode and focus state
 * Render mode: Preview pane gets cyan focus border
 * Normal mode: Active pane gets cyan focus border
 */
function updateBorders(screen: any, layout: Layout, mode: Mode, explorerFocused: boolean = false, previewFocused: boolean = false): void {
  const theme = bumblebeeTheme.current;

  if (mode === Mode.Render) {
    // Focus border for preview in render mode
    layout.preview.style.border.fg = theme.cyan;
    layout.explorer.style.border.fg = theme.yellowA;
  } else {
    // Normal mode: Active pane gets cyan focus border
    layout.preview.style.border.fg = previewFocused ? theme.cyan : theme.yellowA;
    layout.explorer.style.border.fg = explorerFocused ? theme.cyan : theme.yellowA;
    layout.titleBar.style.border.fg = theme.yellowA;
    layout.statusBar.style.border.fg = theme.yellowA;
  }

  // Force screen re-render to show border changes
  screen.render();
}

/**
 * Update the explorer pane content display
 *
 * CRITICAL: This function resets childBase and childOffset to 0 to prevent
 * progressive rendering issues. Without this reset, blessed would only render
 * lines starting from the current scroll position (childBase), causing the
 * explorer to only show content around the cursor instead of all files.
 */
function updateExplorerContent(layout: Layout, explorerState: ExplorerState, config: BumblebeeConfig, resetScroll: boolean = false): void {
  if (explorerState.visible) {
    const height = layout.explorer.height || 20;
    const width = layout.explorer.width || config.explorerWidth;
    const items = renderExplorer(explorerState, config, height, width);

    // CRITICAL: Use setItems() for blessed.list() - this renders ALL items immediately
    layout.explorer.setItems(items);
    
    // Select the current item
    layout.explorer.select(explorerState.selectedIndex);
  }
}