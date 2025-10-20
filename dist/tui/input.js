import { bumblebeeTheme } from '../config/theme-bumblebee.js';
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
 */
export function setupInput(screen, layout) {
    let currentMode = Mode.Normal;
    // Set initial border colors (all normal borders)
    updateBorders(screen, layout, currentMode);
    // Mode switching keybindings
    screen.key('r', () => {
        currentMode = Mode.Render;
        layout.preview.focus();
        updateBorders(screen, layout, currentMode);
    });
    screen.key('escape', () => {
        currentMode = Mode.Normal;
        updateBorders(screen, layout, currentMode);
    });
    // Quit keybindings
    screen.key(['q', 'C-c'], () => {
        process.exit(0);
    });
    // Scrolling keybindings (Vim-style + arrows)
    // Delegate scrolling to the preview pane
    screen.key(['up', 'k'], () => {
        if (currentMode === Mode.Normal || currentMode === Mode.Render) {
            layout.preview.scroll(-1);
            screen.render();
        }
    });
    screen.key(['down', 'j'], () => {
        if (currentMode === Mode.Normal || currentMode === Mode.Render) {
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
}
/**
 * Update TUI border colors based on current mode
 * Render mode: Preview pane gets cyan focus border
 * Normal mode: All panes get yellowA normal borders
 */
function updateBorders(screen, layout, mode) {
    const theme = bumblebeeTheme.current;
    if (mode === Mode.Render) {
        // Focus border for preview in render mode
        layout.preview.style.border.fg = theme.cyan;
    }
    else {
        // Normal borders for all panes in normal mode
        layout.preview.style.border.fg = theme.yellowA;
        layout.explorer.style.border.fg = theme.yellowA;
        layout.titleBar.style.border.fg = theme.yellowA;
        layout.statusBar.style.border.fg = theme.yellowA;
    }
    // Force screen re-render to show border changes
    screen.render();
}
