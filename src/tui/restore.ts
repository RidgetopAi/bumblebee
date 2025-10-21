import blessed from 'neo-blessed';
import { BumblebeeConfig } from '../config/loadConfig.js';
import { createLayout, appendLayoutToScreen, showExplorerPane, hideExplorerPane, updateLayoutOnResize } from './layout.js';
import { setupInput } from './input.js';
import { render } from '../render/mdastToAnsi.js';
import { getThemeForConfig, type BumblebeeTheme } from '../config/theme-bumblebee.js';
import { type ExplorerState, renderExplorer, isExplorerVisible } from './panes/explorer.js';

// Cast blessed to any to avoid TypeScript issues
const blessedAny = blessed as any;

/**
 * TUI restoration state - all data needed to recreate the TUI after suspension
 */
export interface TuiRestoreState {
  config: BumblebeeConfig;
  currentFilePath: string;
  explorerState: ExplorerState;
  markdownContent: string;
  currentTheme: BumblebeeTheme;
  handleFileOpen: (filePath: string) => void;
  updateFileWatcher: (directory: string, explorerState: ExplorerState, layout: any, config: BumblebeeConfig, screen: any) => void;
  updateReferences?: (newScreen: any, newLayout: any) => void;
}

/**
 * Restore the TUI after editor suspension
 * Recreates screen, layout, content, and all interactive state
 *
 * @param state - All state needed for TUI restoration
 * @returns Promise resolving to recreated screen and layout
 */
export async function restoreTui(state: TuiRestoreState): Promise<{ screen: any, layout: any }> {
  const { config, currentFilePath, explorerState, markdownContent, currentTheme, handleFileOpen, updateFileWatcher } = state;

  // Recreate blessed screen with same configuration as app.ts
  const screen = blessedAny.screen({
    smartCSR: true,
    title: 'Bumblebee',
    fullUnicode: true,
    terminal: 'xterm-256color', // Force xterm compatibility to avoid tmux/screen parsing errors
  });

  // Recreate modular TUI layout
  const layout = createLayout(currentFilePath);

  // Restore explorer visibility and dimensions
  const explorerVisible = isExplorerVisible(explorerState);
  if (explorerVisible) {
    showExplorerPane(layout, config.explorerWidth);
  } else {
    hideExplorerPane(layout);
  }

  // Append layout components to screen
  appendLayoutToScreen(screen, layout);

  // Restore preview content
  const width = process.stdout.columns || 80;
  const rendered = render(markdownContent, width, currentTheme, true);
  layout.preview.content = rendered;

  // Update status bar with current file path
  layout.statusBar.content = currentFilePath;

  // Restore explorer content if visible
  if (explorerVisible) {
    const height = layout.explorer.height || 20;
    const explorerWidth = layout.explorer.width || config.explorerWidth;
    const items = renderExplorer(explorerState, config, height, explorerWidth);
    layout.explorer.setItems(items);
    layout.explorer.select(explorerState.selectedIndex);
  }

  // Re-setup input handling and keybindings
  setupInput(screen, layout, explorerState, config, handleFileOpen, updateFileWatcher, state);

  // Re-setup file watching for explorer auto-refresh
  const explorerRoot = explorerState.rootPath;
  updateFileWatcher(explorerRoot, explorerState, layout, config, screen);

  // Re-bind resize handler
  screen.on('resize', function() {
    // Update layout dimensions for explorer/preview panes
    const explorerVisibleNow = isExplorerVisible(explorerState);
    updateLayoutOnResize(layout, explorerVisibleNow, config.explorerWidth);

    // Re-render content at new terminal width
    if (markdownContent) {
      const newWidth = process.stdout.columns || 80;
      const rendered = await render(markdownContent, newWidth, currentTheme, true);
      
      // Apply render result
      if (typeof rendered === 'string') {
        layout.preview.content = rendered;
      } else {
        // Clear old widgets
        const childrenToRemove = layout.preview.children.filter((child: any) =>
          child !== layout.preview._label && child !== layout.preview._border
        );
        childrenToRemove.forEach((child: any) => layout.preview.remove(child));
        
        layout.preview.content = rendered.textContent;
        for (const widgetPlacement of rendered.widgets) {
          widgetPlacement.widget.top = widgetPlacement.startLine;
          layout.preview.append(widgetPlacement.widget);
        }
        screen.render();
      }
    }

    // Update explorer content if visible
    if (explorerVisibleNow) {
      const height = layout.explorer.height || 20;
      const width = layout.explorer.width || config.explorerWidth;
      const items = renderExplorer(explorerState, config, height, width);
      layout.explorer.setItems(items);
      layout.explorer.select(explorerState.selectedIndex);
    }

    screen.render();
  });

  // Render the restored screen
  screen.render();

  return { screen, layout };
}