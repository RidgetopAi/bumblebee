#!/usr/bin/env node
import { Command } from 'commander';
import { loadConfig } from './config/loadConfig.js';
import { runApp } from './app.js';
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
        // Run the application
        await runApp(config, fileOrDir, options.stdout);
    }
    catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
});
program.parse();
