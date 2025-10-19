import blessed from 'neo-blessed';
import fs from 'fs';
import { createLayout, appendLayoutToScreen } from './tui/layout.js';
import { render } from './render/mdastToAnsi.js';
import { getThemeForConfig } from './config/theme-bumblebee.js';
// Cast blessed to any to avoid TypeScript issues
const blessedAny = blessed;
export async function runApp(config, fileOrDir, stdout) {
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
        }
        catch (error) {
            console.error(`Error: ${error.message}`);
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
    // Handle key events
    screen.key(['escape', 'q', 'C-c'], function (ch, key) {
        return process.exit(0);
    });
    // Handle resize
    screen.on('resize', function () {
        screen.render();
    });
    // Render the screen
    screen.render();
}
