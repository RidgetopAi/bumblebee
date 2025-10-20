import { bumblebeeTheme } from '../config/theme-bumblebee.js';
import { showExplorerPane, hideExplorerPane } from './layout.js';
import { moveSelection, handleEnter, toggleExplorer, renderExplorer } from './panes/explorer.js';
/**
 * TUI Mode enumeration for keybinding state management
 */
export var Mode;
(function (Mode) {
    Mode["Normal"] = "normal";
    Mode["Render"] = "render";
    Mode["Edit"] = "edit";
})(Mode || (Mode = {}));
/**
 * Set up input handling and keybindings for the Bumblebee TUI
 * Implements Phase 2 keybindings: r, Esc, q, arrows/j/k
 * Implements Phase 3 explorer: Space e, navigation, Enter
 */
export function setupInput(screen, layout, explorerState, config, onFileOpen) {
    let currentMode = Mode.Normal;
    let explorerFocused = false;
    // Set initial border colors (all normal borders)
    updateBorders(screen, layout, currentMode, explorerFocused);
    // Mode switching keybindings
    screen.key('r', () => {
        currentMode = Mode.Render;
        layout.preview.focus();
        explorerFocused = false;
        updateBorders(screen, layout, currentMode, explorerFocused);
    });
    screen.key('escape', () => {
        currentMode = Mode.Normal;
        updateBorders(screen, layout, currentMode, explorerFocused);
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
        }
        else if (currentMode === Mode.Normal || currentMode === Mode.Render) {
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
        }
        else if (currentMode === Mode.Normal || currentMode === Mode.Render) {
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
    // Explorer toggle keybinding (Space + e)
    screen.key('space+e', () => {
        if (currentMode === Mode.Normal) {
            toggleExplorer(explorerState);
            if (explorerState.visible) {
                showExplorerPane(layout, config.explorerWidth);
                layout.explorer.focus();
                explorerFocused = true;
            }
            else {
                hideExplorerPane(layout);
                layout.preview.focus();
                explorerFocused = false;
            }
            updateBorders(screen, layout, currentMode, explorerFocused);
            updateExplorerContent(layout, explorerState, config);
            screen.render();
        }
    });
    // Enter key for explorer actions
    screen.key('enter', () => {
        if (explorerState.visible && currentMode === Mode.Normal) {
            const filePath = handleEnter(explorerState);
            if (filePath && onFileOpen) {
                // File opened - switch focus to preview
                layout.preview.focus();
                explorerFocused = false;
                onFileOpen(filePath);
            }
            else {
                // Directory toggled - update explorer display
                updateExplorerContent(layout, explorerState, config);
            }
            updateBorders(screen, layout, currentMode, explorerFocused);
            screen.render();
        }
    });
}
/**
 * Update TUI border colors based on current mode
 * Render mode: Preview pane gets cyan focus border
 * Normal mode: Explorer gets cyan when focused, others yellowA
 */
function updateBorders(screen, layout, mode, explorerFocused = false) {
    const theme = bumblebeeTheme.current;
    if (mode === Mode.Render) {
        // Focus border for preview in render mode
        layout.preview.style.border.fg = theme.cyan;
        layout.explorer.style.border.fg = theme.yellowA;
    }
    else {
        // Normal mode: Explorer gets cyan when focused
        layout.preview.style.border.fg = theme.yellowA;
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
function updateExplorerContent(layout, explorerState, config) {
    if (explorerState.visible) {
        const height = layout.explorer.height || 20;
        const width = layout.explorer.width || config.explorerWidth;
        const content = renderExplorer(explorerState, config, height, width);
        layout.explorer.content = content;
    }
}
