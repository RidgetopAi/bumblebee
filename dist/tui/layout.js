import blessed from 'neo-blessed';
import { bumblebeeTheme } from '../config/theme-bumblebee.js';
// Cast blessed to any to avoid TypeScript issues (following app.ts pattern)
const blessedAny = blessed;
/**
 * Create the two-pane TUI layout structure
 * - Title bar at top with "Bumblebee"
 * - Explorer pane (left, initially hidden)
 * - Preview pane (right, main content area)
 * - Status bar at bottom with file path
 */
export function createLayout(fileOrDir) {
    // Get current terminal dimensions
    const screenWidth = process.stdout.columns || 80;
    const screenHeight = process.stdout.rows || 24;
    // Use Bumblebee theme colors
    const theme = bumblebeeTheme.current;
    // Title bar: Top, full width, 1 line high
    const titleBar = blessedAny.box({
        top: 0,
        left: 0,
        width: '100%',
        height: 1,
        content: 'Bumblebee',
        align: 'center',
        style: {
            fg: theme.yellowB, // Title text color
            bg: theme.nearBlack, // Title background color
            border: {
                fg: theme.yellowA, // Border color
            },
        },
        border: {
            type: 'line',
        },
    });
    // Explorer pane: Left side, initially hidden (height 0)
    // Phase 3 will implement toggle and content
    const explorer = blessedAny.box({
        top: 1, // Below title bar
        left: 0,
        width: 0, // Initially hidden (0 width)
        height: screenHeight - 2, // Full height minus title and status bars
        hidden: true, // Initially hidden
        style: {
            border: {
                fg: theme.yellowA, // Normal border color
            },
        },
        border: {
            type: 'line',
        },
    });
    // Preview pane: Right side, main content area
    // Will show rendered markdown content
    const preview = blessedAny.box({
        top: 1, // Below title bar
        left: 0, // Full width initially (explorer hidden)
        width: '100%', // Full width when explorer hidden
        height: screenHeight - 2, // Full height minus title and status bars
        scrollable: true, // Allow scrolling for long content
        alwaysScroll: true, // Always show scrollbar
        mouse: true, // Enable mouse events (for future features)
        style: {
            border: {
                fg: theme.yellowA, // Normal border color
            },
            scrollbar: {
                bg: theme.cyan, // Scrollbar color
            },
        },
        border: {
            type: 'line',
        },
    });
    // Status bar: Bottom, full width, 1 line high
    const statusBar = blessedAny.box({
        bottom: 0,
        left: 0,
        width: '100%',
        height: 1,
        content: fileOrDir, // Show current file/directory path
        align: 'left',
        style: {
            fg: theme.yellowB, // Status text color
            bg: theme.nearBlack, // Status background color
            border: {
                fg: theme.yellowB, // Status border color (matches text)
            },
        },
        border: {
            type: 'line',
        },
    });
    return {
        titleBar,
        explorer,
        preview,
        statusBar,
        currentPath: fileOrDir,
    };
}
/**
 * Append layout components to the blessed screen
 * Sets up the TUI structure and focus management
 */
export function appendLayoutToScreen(screen, layout) {
    // Append all layout components to the screen
    screen.append(layout.titleBar);
    screen.append(layout.explorer); // Initially hidden
    screen.append(layout.preview);
    screen.append(layout.statusBar);
    // Set initial focus to preview pane (main content area)
    layout.preview.focus();
}
