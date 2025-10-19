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

      // Render markdown to ANSI
      const output = render(markdown, width, theme);

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
      layout.preview.setContent(`Error: File not found: ${fileOrDir}`);
    } else {
      const stat = fs.statSync(fileOrDir);
      if (!stat.isFile()) {
        layout.preview.setContent(`Error: ${fileOrDir} is not a file`);
      } else {
        // Read markdown content
        markdownContent = fs.readFileSync(fileOrDir, 'utf-8');

        // Initial render at current terminal width
        const width = process.stdout.columns || 80;
        const rendered = render(markdownContent, width, currentTheme);
        layout.preview.setContent(rendered);
      }
    }
  } catch (error) {
    layout.preview.setContent(`Error reading file: ${(error as Error).message}`);
  }

  // Set up input handling and keybindings
  setupInput(screen, layout);

  // Handle resize with content reflow
  screen.on('resize', function() {
    // Re-render content at new terminal width
    if (markdownContent) {
      const newWidth = process.stdout.columns || 80;
      const rendered = render(markdownContent, newWidth, currentTheme);
      layout.preview.setContent(rendered);
    }
    screen.render();
  });

  // Render the screen
  screen.render();
}
