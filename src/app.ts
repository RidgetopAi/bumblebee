import blessed from 'neo-blessed';
import { BumblebeeConfig } from './config/loadConfig.js';
import { createLayout, appendLayoutToScreen } from './tui/layout.js';

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

  // Create modular TUI layout
  const layout = createLayout(fileOrDir);

  // Append layout components to screen
  appendLayoutToScreen(screen, layout);

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
