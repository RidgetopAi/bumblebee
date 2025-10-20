import blessed from 'neo-blessed';
import { bumblebeeTheme } from '../config/theme-bumblebee.js';

// Cast blessed to any to avoid TypeScript issues (following app.ts pattern)
const blessedAny = blessed as any;

// Layout interface defining the TUI structure
export interface Layout {
  titleBar: any;      // Blessed box for title bar
  explorer: any;      // Blessed box for explorer pane (hidden initially)
  preview: any;       // Blessed box for preview pane (main content)
  statusBar: any;     // Blessed box for status bar
  currentPath: string; // Current file/directory path for status
}

/**
 * Create the two-pane TUI layout structure
 * - Title bar at top with "Bumblebee"
 * - Explorer pane (left, initially hidden)
 * - Preview pane (right, main content area)
 * - Status bar at bottom with file path
 */
export function createLayout(fileOrDir: string): Layout {
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
      fg: theme.yellowB,      // Title text color
      bg: theme.nearBlack,    // Title background color
      border: {
        fg: theme.yellowA,    // Border color
      },
    },
    border: {
      type: 'line',
    },
  });

  // Explorer pane: Left side, initially hidden (height 0)
  // Phase 3 will implement toggle and content
  const explorer = blessedAny.box({
    top: 3,                    // Below title bar (title is 3 lines tall)
    left: 0,
    width: 0,                  // Initially hidden (0 width)
    height: screenHeight - 6,  // Full height minus title (3) and status (3) bars
    hidden: true,              // Initially hidden
    style: {
      border: {
        fg: theme.yellowA,     // Normal border color
      },
    },
    border: {
      type: 'line',
    },
  });

  // Preview pane: Right side, main content area
  // Will show rendered markdown content
  const preview = blessedAny.box({
    top: 3,                    // Below title bar (title is 3 lines tall)
    left: 0,                   // Full width initially (explorer hidden)
    width: '100%',             // Full width when explorer hidden
    height: screenHeight - 6,  // Full height minus title (3) and status (3) bars
    scrollable: true,          // Allow scrolling for long content
    alwaysScroll: true,        // Always show scrollbar
    keys: true,                // Enable keyboard input
    mouse: true,               // Enable mouse events (for future features)
    tags: true,                // Enable tag parsing for blessed tags
    style: {
      border: {
        fg: theme.yellowA,     // Normal border color
      },
      scrollbar: {
        bg: theme.cyan,        // Scrollbar color
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
    content: fileOrDir,        // Show current file/directory path
    align: 'left',
    style: {
      fg: theme.yellowB,       // Status text color
      bg: theme.nearBlack,     // Status background color
      border: {
        fg: theme.yellowB,     // Status border color (matches text)
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
export function appendLayoutToScreen(screen: any, layout: Layout): void {
  // Append all layout components to the screen
  screen.append(layout.titleBar);
  screen.append(layout.explorer);  // Initially hidden
  screen.append(layout.preview);
  screen.append(layout.statusBar);

  // Set initial focus to preview pane (main content area)
  layout.preview.focus();
}
