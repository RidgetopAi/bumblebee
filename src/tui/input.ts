import { bumblebeeTheme } from '../config/theme-bumblebee.js';
import { Layout, showExplorerPane, hideExplorerPane, updateLayoutOnResize, focusExplorerPane, focusPreviewPane } from './layout.js';
import { type ExplorerState, moveSelection, handleEnter, toggleExplorer, renderExplorer, getSelectedPath } from './panes/explorer.js';
import { BumblebeeConfig } from '../config/loadConfig.js';

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
 */
export function setupInput(
  screen: any,
  layout: Layout,
  explorerState: ExplorerState,
  config: BumblebeeConfig,
  onFileOpen?: (filePath: string) => void
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
      updateExplorerContent(layout, explorerState, config);
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
      updateExplorerContent(layout, explorerState, config);
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
      updateExplorerContent(layout, explorerState, config);
      screen.render();
    }
  });

  // Enter key for explorer actions
  screen.key('enter', () => {
    if (explorerState.visible && currentMode === Mode.Normal) {
      const filePath = handleEnter(explorerState, config);
      if (filePath && onFileOpen) {
        // File opened - switch focus to preview (auto-focus behavior)
        focusPreviewPane(layout);
        explorerFocused = false;
        previewFocused = true;
        onFileOpen(filePath);
      } else {
        // Directory navigated - keep focus in explorer
        updateExplorerContent(layout, explorerState, config);
      }
      updateBorders(screen, layout, currentMode, explorerFocused, previewFocused);
      screen.render();
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
 */
function updateExplorerContent(layout: Layout, explorerState: ExplorerState, config: BumblebeeConfig): void {
  if (explorerState.visible) {
    const height = layout.explorer.height || 20;
    const width = layout.explorer.width || config.explorerWidth;
    const content = renderExplorer(explorerState, config, height, width);
    layout.explorer.content = content;
  }
}