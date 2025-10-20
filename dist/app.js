import blessed from 'neo-blessed';
import fs from 'fs';
import { createLayout, appendLayoutToScreen, updateLayoutOnResize } from './tui/layout.js';
import { setupInput } from './tui/input.js';
import { render } from './render/mdastToAnsi.js';
import { getThemeForConfig } from './config/theme-bumblebee.js';
import { createExplorerState, renderExplorer, isExplorerVisible } from './tui/panes/explorer.js';
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
            // Render markdown to ANSI (useBlessedTags = false for stdout)
            const output = render(markdown, width, theme, false);
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
        terminal: 'xterm-256color', // Force xterm compatibility to avoid tmux/screen parsing errors
    });
    // Create modular TUI layout
    const layout = createLayout(fileOrDir);
    // Initialize explorer state
    const explorerState = createExplorerState(fileOrDir, config);
    // Append layout components to screen
    appendLayoutToScreen(screen, layout);
    // Read and render markdown content for preview
    let markdownContent = '';
    let currentTheme = getThemeForConfig(config.trueColor);
    let currentFilePath = fileOrDir;
    try {
        // Check if file exists and is a file
        if (!fs.existsSync(fileOrDir)) {
            layout.preview.content = `Error: File not found: ${fileOrDir}`;
            screen.render();
        }
        else {
            const stat = fs.statSync(fileOrDir);
            if (!stat.isFile()) {
                layout.preview.content = `Error: ${fileOrDir} is not a file`;
                screen.render();
            }
            else {
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
    }
    catch (error) {
        layout.preview.content = `Error reading file: ${error.message}`;
        screen.render();
    }
    // File opening handler for explorer
    const handleFileOpen = (filePath) => {
        try {
            // Check if file exists and is a file
            if (!fs.existsSync(filePath)) {
                layout.preview.content = `Error: File not found: ${filePath}`;
                screen.render();
                return;
            }
            const stat = fs.statSync(filePath);
            if (!stat.isFile()) {
                layout.preview.content = `Error: ${filePath} is not a file`;
                screen.render();
                return;
            }
            // Read and render the new file
            markdownContent = fs.readFileSync(filePath, 'utf-8');
            currentFilePath = filePath;
            // Update status bar with new file path
            layout.statusBar.content = filePath;
            // Render at current terminal width
            const width = process.stdout.columns || 80;
            const rendered = render(markdownContent, width, currentTheme, true);
            layout.preview.content = rendered;
            // Reset preview scroll position
            layout.preview.scrollTo(0);
            screen.render();
        }
        catch (error) {
            layout.preview.content = `Error reading file: ${error.message}`;
            screen.render();
        }
    };
    // Set up input handling and keybindings
    setupInput(screen, layout, explorerState, config, handleFileOpen);
    // Handle resize with content reflow
    screen.on('resize', function () {
        // Update layout dimensions for explorer/preview panes
        const explorerVisible = isExplorerVisible(explorerState);
        updateLayoutOnResize(layout, explorerVisible, config.explorerWidth);
        // Re-render content at new terminal width
        // Use blessed tags (useBlessedTags = true) for TUI mode
        if (markdownContent) {
            const newWidth = process.stdout.columns || 80;
            const rendered = render(markdownContent, newWidth, currentTheme, true);
            layout.preview.content = rendered;
        }
        // Update explorer content if visible
        if (explorerVisible) {
            const height = layout.explorer.height || 20;
            const width = layout.explorer.width || config.explorerWidth;
            const explorerContent = renderExplorer(explorerState, config, height, width);
            layout.explorer.content = explorerContent;
        }
        screen.render();
    });
    // Render the screen
    screen.render();
}
