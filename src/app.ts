import blessed from 'neo-blessed';
import fs from 'fs';
import { BumblebeeConfig } from './config/loadConfig.js';
import { createLayout, appendLayoutToScreen } from './tui/layout.js';
import { setupInput } from './tui/input.js';
import { render } from './render/mdastToAnsi.js';
import { getThemeForConfig } from './config/theme-bumblebee.js';

// Cast blessed to any to avoid TypeScript issues
const blessedAny = blessed as any;

export async function runApp(config: BumblebeeConfig, fileOrDir: string, stdout: boolean): Promise<void> {
  if (stdout) {
    // STDOUT mode: render markdown file to stdout
    try {
      // Check if file exists and is a file
      if (!fs.existsSync(fileOrDir)) {
        console.error(`Error: File not found: ${fileOrDir}`);
        process.exit(1);
      }

      const stat = fs.statSync(fileOrDir);
      if (!stat.isFile()) {
        console.error(`Error: ${fileOrDir} is not a file`);
        process.exit(1);
      }

      // Read markdown content
      const markdown = fs.readFileSync(fileOrDir, 'utf-8');

      // Get terminal width, default to 80
      const width = process.stdout.columns || 80;

      // Get theme based on config
      const theme = getThemeForConfig(config.trueColor);

      // Render markdown to ANSI (useBlessedTags = false for stdout)
      const output = render(markdown, width, theme, false);

      // Output to stdout
      console.log(output);
      return;
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  }

  // Create screen
  const screen = blessedAny.screen({
    smartCSR: true,
    title: 'Bumblebee',
    fullUnicode: true,
    terminal: 'xterm-256color', // Force xterm compatibility to avoid tmux/screen parsing errors
  });

  // Create modular TUI layout
  const layout = createLayout(fileOrDir);

  // Append layout components to screen
  appendLayoutToScreen(screen, layout);

  // Read and render markdown content for preview
  let markdownContent = '';
  let currentTheme = getThemeForConfig(config.trueColor);

  try {
    // Check if file exists and is a file
    if (!fs.existsSync(fileOrDir)) {
      layout.preview.content = `Error: File not found: ${fileOrDir}`;
      screen.render();
    } else {
      const stat = fs.statSync(fileOrDir);
      if (!stat.isFile()) {
        layout.preview.content = `Error: ${fileOrDir} is not a file`;
        screen.render();
      } else {
        // Read markdown content
        markdownContent = fs.readFileSync(fileOrDir, 'utf-8');

        // Initial render at current terminal width
        // Use blessed tags (useBlessedTags = true) for TUI mode
        const width = process.stdout.columns || 80;
        const rendered = render(markdownContent, width, currentTheme, true);
        layout.preview.content = rendered;
        screen.render();
      }
    }
  } catch (error) {
    layout.preview.content = `Error reading file: ${(error as Error).message}`;
    screen.render();
  }

  // Set up input handling and keybindings
  setupInput(screen, layout);

  // Handle resize with content reflow
  screen.on('resize', function() {
    // Re-render content at new terminal width
    // Use blessed tags (useBlessedTags = true) for TUI mode
    if (markdownContent) {
      const newWidth = process.stdout.columns || 80;
      const rendered = render(markdownContent, newWidth, currentTheme, true);

      layout.preview.content = rendered;
    }
    screen.render();
  });

  // Render the screen
  screen.render();
}