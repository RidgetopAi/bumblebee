import blessed from 'neo-blessed';
import { BumblebeeConfig } from './config/loadConfig.js';
import { bumblebeeTheme } from './config/theme-bumblebee.js';

// Cast blessed to any to avoid TypeScript issues
const blessedAny = blessed as any;

export async function runApp(config: BumblebeeConfig, fileOrDir: string, stdout: boolean): Promise<void> {
  // For Phase 0, --stdout is not implemented yet, just show a placeholder
  if (stdout) {
    console.log('STDOUT mode not implemented yet. Use TUI mode.');
    return;
  }

  // Create screen
  const screen = blessedAny.screen({
    smartCSR: true,
    title: 'Bumblebee',
    fullUnicode: true,
  });

  // Create title bar
  const titleBar = blessedAny.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: '{center}Bumblebee{/center}',
    tags: true,
    style: {
      bg: bumblebeeTheme.current.nearBlack,
      fg: bumblebeeTheme.current.yellowB,
    },
  });

  // Create preview pane (empty for Phase 0)
  const preview = blessedAny.box({
    top: 3,
    left: 0,
    width: '100%',
    height: '100%-6',
    content: '', // Empty for Phase 0
    scrollable: true,
    alwaysScroll: true,
    mouse: true,
    keys: true,
  });

  // Create status bar
  const statusBar = blessedAny.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: ` ${fileOrDir} `,
    style: {
      bg: bumblebeeTheme.current.nearBlack,
      fg: bumblebeeTheme.current.yellowB,
      border: {
        fg: bumblebeeTheme.current.yellowB,
      },
    },
    border: {
      type: 'line',
    },
  });

  // Append elements to screen
  screen.append(titleBar);
  screen.append(preview);
  screen.append(statusBar);

  // Handle key events
  screen.key(['escape', 'q', 'C-c'], function(ch: string, key: any) {
    return process.exit(0);
  });

  // Handle resize
  screen.on('resize', function() {
    screen.render();
  });

  // Render the screen
  screen.render();
}
