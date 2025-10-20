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
    // Title bar: Top, full width, 3 lines (1 content + 2 border lines)
    const titleBar = blessedAny.box({
        top: 0,
        left: 0,
        width: '100%',
        height: 3,
        content: 'Bumblebee',
        align: 'center',
        style: {
            fg: '#E9B033', // Bumblebee yellowB title text
            bg: '#010600', // Bumblebee nearBlack background
            border: {
                fg: '#F2D638', // Bumblebee yellowA border
            },
        },
        border: {
            type: 'line',
        },
    });
    // Explorer pane: Left side, initially hidden (height 0)
    // Phase 3: File tree navigation with scrolling and keyboard support
    // CRITICAL: Using list() not box() - list renders all items immediately via setItems()
    const explorer = blessedAny.list({
        top: 3, // Below title bar (title is 3 lines tall)
        left: 0,
        width: 0, // Initially hidden (0 width)
        height: screenHeight - 6, // Full height minus title (3) and status (3) bars
        hidden: true, // Initially hidden
        scrollable: true, // Allow scrolling for long file lists
        keys: false, // DISABLED: We handle all keys at screen level to prevent blessed auto-scrolling
        mouse: true, // Enable mouse events
        tags: true, // Enable tag parsing for blessed tags (ANSI colors)
        vi: false, // Disable vi keys (we handle our own)
        style: {
            border: {
                fg: '#F2D638', // Bumblebee yellowA border
            },
            selected: {
                bg: '#1EC4F2', // Bumblebee cyan selection background
                fg: '#010600', // Bumblebee nearBlack selection text
                bold: true, // Make selection bold for better visibility
            },
            item: {
                fg: 'white', // Normal item color
            },
            scrollbar: {
                bg: '#1EC4F2', // Bumblebee cyan scrollbar
            },
        },
        border: {
            type: 'line',
        },
    });
    // Preview pane: Right side, main content area
    // Will show rendered markdown content
    const preview = blessedAny.box({
        top: 3, // Below title bar (title is 3 lines tall)
        left: 0, // Full width initially (explorer hidden)
        width: '100%', // Full width when explorer hidden
        height: screenHeight - 6, // Full height minus title (3) and status (3) bars
        scrollable: true, // Allow scrolling for long content
        alwaysScroll: true, // Always show scrollbar
        keys: true, // Enable keyboard input
        mouse: true, // Enable mouse events (for future features)
        tags: true, // Enable tag parsing for blessed tags
        style: {
            border: {
                fg: '#F2D638', // Bumblebee yellowA border
            },
            scrollbar: {
                bg: '#1EC4F2', // Bumblebee cyan scrollbar
            },
        },
        border: {
            type: 'line',
        },
    });
    // Status bar: Bottom, full width, 3 lines (1 content + 2 border lines)
    const statusBar = blessedAny.box({
        bottom: 0,
        left: 0,
        width: '100%',
        height: 3,
        content: fileOrDir, // Show current file/directory path
        align: 'left',
        style: {
            fg: '#E9B033', // Bumblebee yellowB status text
            bg: '#010600', // Bumblebee nearBlack background
            border: {
                fg: '#F2D638', // Bumblebee yellowA border
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
    focusPreviewPane(layout);
}
/**
 * Show the explorer pane and adjust preview pane width
 * @param layout The TUI layout
 * @param explorerWidth Width of the explorer pane
 */
export function showExplorerPane(layout, explorerWidth) {
    const screenWidth = process.stdout.columns || 80;
    // Show and size the explorer pane
    layout.explorer.width = explorerWidth;
    layout.explorer.left = 0;
    layout.explorer.hidden = false;
    // Adjust preview pane to account for explorer
    layout.preview.left = explorerWidth;
    layout.preview.width = screenWidth - explorerWidth;
    // Force layout refresh
    layout.explorer.emit('resize');
    layout.preview.emit('resize');
}
/**
 * Hide the explorer pane and expand preview to full width
 * @param layout The TUI layout
 */
export function hideExplorerPane(layout) {
    const screenWidth = process.stdout.columns || 80;
    // Hide the explorer pane
    layout.explorer.width = 0;
    layout.explorer.hidden = true;
    // Expand preview pane to full width
    layout.preview.left = 0;
    layout.preview.width = screenWidth;
    // Force layout refresh
    layout.preview.emit('resize');
}
/**
 * Set focus to the explorer pane
 * Updates blessed focus for keyboard input handling
 */
export function focusExplorerPane(layout) {
    layout.explorer.focus();
}
/**
 * Set focus to the preview pane
 * Updates blessed focus for keyboard input handling
 */
export function focusPreviewPane(layout) {
    layout.preview.focus();
}
/**
 * Update layout dimensions when terminal resizes
 * @param layout The TUI layout
 * @param explorerVisible Whether explorer is currently visible
 * @param explorerWidth Width of explorer pane when visible
 */
export function updateLayoutOnResize(layout, explorerVisible, explorerWidth) {
    const screenWidth = process.stdout.columns || 80;
    const screenHeight = process.stdout.rows || 24;
    // Update all component heights (same for all)
    const contentHeight = screenHeight - 6; // Minus title (3) and status (3) bars
    layout.explorer.height = contentHeight;
    layout.preview.height = contentHeight;
    if (explorerVisible) {
        // Explorer is visible - maintain proportions
        layout.explorer.width = explorerWidth;
        layout.explorer.left = 0;
        layout.preview.left = explorerWidth;
        layout.preview.width = screenWidth - explorerWidth;
    }
    else {
        // Explorer hidden - preview takes full width
        layout.explorer.width = 0;
        layout.preview.left = 0;
        layout.preview.width = screenWidth;
    }
    // Force layout refresh
    if (explorerVisible) {
        layout.explorer.emit('resize');
    }
    layout.preview.emit('resize');
}
