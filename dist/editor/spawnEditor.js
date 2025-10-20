import { spawn } from 'child_process';
import fs from 'fs';
/**
 * Spawn an external editor for the given file path
 * Suspends the TUI, opens file in $EDITOR (default nvim), then restores TUI
 * Detects if file content changed after editing for conditional re-rendering
 *
 * @param filePath - Path to the file to edit
 * @param config - Bumblebee configuration containing editor setting
 * @param screen - Blessed screen instance for TUI management
 * @returns Promise that resolves to true if file changed, false if unchanged
 */
export async function spawnEditor(filePath, config, screen) {
    return new Promise((resolve, reject) => {
        // Read file content before editing for change detection
        let originalContent;
        try {
            originalContent = fs.readFileSync(filePath, 'utf-8');
        }
        catch (error) {
            reject(new Error(`Failed to read file before editing: ${error.message}`));
            return;
        }
        // Get editor from config or environment, default to nvim
        const editor = config.editor || process.env.EDITOR || 'nvim';
        try {
            // Suspend TUI by destroying the screen (restores normal terminal)
            screen.destroy();
            // Spawn editor process with inherited stdio
            const editorProcess = spawn(editor, [filePath], {
                stdio: 'inherit', // Inherit stdin/stdout/stderr for proper editor interaction
                shell: true, // Use shell for Windows/WSL compatibility
                env: {
                    ...process.env,
                    // Ensure editor has proper terminal environment
                    TERM: process.env.TERM || 'xterm-256color',
                },
            });
            // Handle process completion
            editorProcess.on('close', (code) => {
                try {
                    // Read file content after editing
                    const newContent = fs.readFileSync(filePath, 'utf-8');
                    // Compare contents to detect changes
                    const hasChanged = newContent !== originalContent;
                    // Resolve with change detection result
                    // Note: TUI restoration will be handled by caller (TB010-4)
                    resolve(hasChanged);
                }
                catch (error) {
                    // If we can't read the file after editing, assume it changed (safe default)
                    resolve(true);
                }
            });
            // Handle spawn errors (editor not found, etc.)
            editorProcess.on('error', (error) => {
                reject(new Error(`Failed to spawn editor '${editor}': ${error.message}`));
            });
        }
        catch (error) {
            reject(new Error(`Failed to spawn editor: ${error.message}`));
        }
    });
}
