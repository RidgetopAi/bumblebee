#!/usr/bin/env node
import { jsx as _jsx } from "react/jsx-runtime";
import { Command } from 'commander';
import { render } from 'ink';
import { loadConfig } from './config/loadConfig.js';
import { App } from './app.js';
import { render as renderMd } from './render/mdastToAnsi.js';
import { bumblebeeTheme } from './config/theme-bumblebee.js';
import fs from 'fs';
const program = new Command();
program
    .name('bumblebee')
    .description('CLI Markdown Viewer & Editor - Neovim-style terminal application')
    .version('1.0.0')
    .argument('[fileOrDir]', 'file or directory to open (default: current directory)', '.')
    .option('--no-truecolor', 'disable truecolor support')
    .option('--config <path>', 'path to config file')
    .option('--stdout', 'output to stdout instead of TUI')
    .action(async (fileOrDir, options) => {
    try {
        // Load configuration
        const config = loadConfig(options.config);
        // Override trueColor setting if --no-truecolor is used
        if (options.truecolor === false) {
            config.trueColor = 'off';
        }
        if (options.stdout) {
            // Stdout mode: render markdown to terminal
            let markdown;
            try {
                // Try to read file
                markdown = fs.readFileSync(fileOrDir, 'utf-8');
            }
            catch (error) {
                // If not a file, use as literal markdown
                markdown = fileOrDir;
            }
            const output = await renderMd(markdown, process.stdout.columns || 80, bumblebeeTheme);
            console.log(output);
        }
        else {
            // TUI mode: render Ink application
            render(_jsx(App, {}));
        }
    }
    catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
});
program.parse();
