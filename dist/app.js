import blessed from 'neo-blessed';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { createLayout, appendLayoutToScreen, updateLayoutOnResize } from './tui/layout.js';
import { setupInput } from './tui/input.js';
import { render } from './render/mdastToAnsi.js';
import { getThemeForConfig } from './config/theme-bumblebee.js';
import { createExplorerState, renderExplorer, isExplorerVisible, refreshExplorer } from './tui/panes/explorer.js';
// Cast blessed to any to avoid TypeScript issues
const blessedAny = blessed;
// File watcher instance for explorer auto-refresh
let fileWatcher = null;
/**
 * Set up file watching for explorer auto-refresh
 */
function setupFileWatcher(directory, explorerState, layout, config, screen) {
    // Close existing watcher
    if (fileWatcher) {
        fileWatcher.close();
    }
    try {
        // Create new watcher with performance-optimized options
        fileWatcher = chokidar.watch(directory, {
            ignored: config.showDotfiles ? [] : (path) => path.includes('/.') || path.includes('\\.'), // Respect dotfile config
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 100, // Wait 100ms after last change
                pollInterval: 50
            },
            ignorePermissionErrors: true, // Handle permission issues gracefully
        });
        // Debounced refresh to group rapid changes (e.g., during git operations)
        let refreshTimeout = null;
        const debouncedRefresh = () => {
            if (refreshTimeout)
                clearTimeout(refreshTimeout);
            refreshTimeout = setTimeout(() => {
                try {
                    // Only refresh if explorer is visible and watching the right directory
                    if (explorerState.visible && directory === explorerState.rootPath) {
                        refreshExplorer(explorerState, config);
                        // Update the UI
                        const height = layout.explorer.height || 20;
                        const width = layout.explorer.width || config.explorerWidth;
                        const items = renderExplorer(explorerState, config, height, width);
                        layout.explorer.setItems(items);
                        layout.explorer.select(explorerState.selectedIndex);
                        screen.render();
                    }
                }
                catch (error) {
                    // Log but don't crash on refresh errors
                    console.warn('Explorer refresh failed:', error.message);
                }
            }, 300); // 300ms debounce delay
        };
        // Watch for all relevant filesystem events
        fileWatcher.on('all', (event, path) => {
            // Only respond to changes in the current explorer directory
            if (path.startsWith(directory)) {
                debouncedRefresh();
            }
        });
        // Handle watcher errors gracefully
        fileWatcher.on('error', (error) => {
            console.warn('File watcher error:', error.message);
        });
    }
    catch (error) {
        // Continue without file watching if setup fails
        console.warn('Failed to setup file watching:', error.message);
    }
}
/**
 * Update file watcher when directory changes
 */
function updateFileWatcher(directory, explorerState, layout, config, screen) {
    setupFileWatcher(directory, explorerState, layout, config, screen);
}
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
    // Determine explorer root: use parent directory if a file was passed
    let explorerRoot = fileOrDir;
    const stat = fs.statSync(fileOrDir);
    if (stat.isFile()) {
        explorerRoot = path.dirname(fileOrDir);
    }
    // Initialize explorer state
    const explorerState = createExplorerState(explorerRoot, config);
    // Set up file watching for explorer auto-refresh
    setupFileWatcher(explorerRoot, explorerState, layout, config, screen);
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
    // Create TUI restoration state for Phase 4 edit mode
    const restoreState = {
        config,
        currentFilePath,
        explorerState,
        markdownContent,
        currentTheme,
        handleFileOpen,
        updateFileWatcher,
    };
    // Set up input handling and keybindings
    setupInput(screen, layout, explorerState, config, handleFileOpen, updateFileWatcher, restoreState);
    // Clean up file watcher on exit
    process.on('exit', () => {
        if (fileWatcher) {
            fileWatcher.close();
        }
    });
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
            const items = renderExplorer(explorerState, config, height, width);
            layout.explorer.setItems(items);
            layout.explorer.select(explorerState.selectedIndex);
        }
        screen.render();
    });
    // Render the screen
    screen.render();
}
