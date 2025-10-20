import { spawn } from 'child_process';
import { BumblebeeConfig } from '../config/loadConfig.js';

/**
 * Spawn an external editor for the given file path
 * Suspends the TUI, opens file in $EDITOR (default nvim), then restores TUI
 *
 * @param filePath - Path to the file to edit
 * @param config - Bumblebee configuration containing editor setting
 * @param screen - Blessed screen instance for TUI management
 * @returns Promise that resolves when editor exits
 */
export async function spawnEditor(filePath: string, config: BumblebeeConfig, screen: any): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Get editor from config or environment, default to nvim
    const editor = config.editor || process.env.EDITOR || 'nvim';

    try {
      // Suspend TUI by destroying the screen (restores normal terminal)
      screen.destroy();

      // Spawn editor process with inherited stdio
      const editorProcess = spawn(editor, [filePath], {
        stdio: 'inherit',  // Inherit stdin/stdout/stderr for proper editor interaction
        shell: true,       // Use shell for Windows/WSL compatibility
        env: {
          ...process.env,
          // Ensure editor has proper terminal environment
          TERM: process.env.TERM || 'xterm-256color',
        },
      });

      // Handle process completion
      editorProcess.on('close', (code: number) => {
        // Editor exited, resolve the promise
        // Note: TUI restoration will be handled by caller (TB010-4)
        resolve();
      });

      // Handle spawn errors (editor not found, etc.)
      editorProcess.on('error', (error: Error) => {
        reject(new Error(`Failed to spawn editor '${editor}': ${error.message}`));
      });

    } catch (error) {
      reject(new Error(`Failed to spawn editor: ${(error as Error).message}`));
    }
  });
}
