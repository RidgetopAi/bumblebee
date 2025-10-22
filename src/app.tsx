import React, { useState, useEffect } from 'react';
import { Box, useInput, useApp as useInkApp, useStdout } from 'ink';
import { TitleBar } from './components/TitleBar.js';
import { StatusBar } from './components/StatusBar.js';
import { Preview } from './components/Preview.js';
import { useAppState } from './hooks/useAppState.js';
import { render } from './render/mdastToAnsi.js';
import { parseMd } from './parser/mdToAst.js';
import { bumblebeeTheme } from './config/theme-bumblebee.js';

/**
 * Main Bumblebee TUI Application Component
 *
 * Orchestrates the TUI layout with TitleBar, Preview, and StatusBar components.
 * Handles keyboard input and manages application state.
 */
export function App() {
  const { exit } = useInkApp();
  const { stdout } = useStdout();
  const { state, setCurrentFile, setContent, setScrollOffset } = useAppState();

  // Load sample content on mount
  useEffect(() => {
    const loadContent = async () => {
      const sampleMarkdown = `# Welcome to Bumblebee

This is a **markdown viewer** with *syntax highlighting* for code blocks.

## Features

- Terminal-based markdown rendering
- Syntax highlighting with Shiki
- Keyboard navigation
- Clean, minimal interface

## Code Example

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

> This is a blockquote with some **bold** and *italic* text.

Enjoy using Bumblebee! 🎯
`;

      // Render the markdown
      const rendered = await render(sampleMarkdown, 80, bumblebeeTheme);
      setContent(rendered);
      setScrollOffset(0);
      setCurrentFile('sample.md');
    };

    loadContent();
  }, [setContent, setCurrentFile]);

  // Handle resize: clamp scroll offset to valid bounds when terminal height changes
  useEffect(() => {
    const availableHeight = stdout?.rows ? stdout.rows - 2 : 20;
    const lines = state.content.split('\n');
    const maxScroll = Math.max(0, lines.length - availableHeight);
    const clampedOffset = Math.min(state.scrollOffset, maxScroll);
    if (clampedOffset !== state.scrollOffset) {
      setScrollOffset(Math.max(0, clampedOffset));
    }
  }, [stdout?.rows, state.content, state.scrollOffset, setScrollOffset]);

  // Handle keyboard input
  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
    }

    // Calculate scrolling parameters
    const availableHeight = stdout?.rows ? stdout.rows - 2 : 20;
    const lines = state.content.split('\n');
    const maxScroll = Math.max(0, lines.length - availableHeight);

    // Handle scrolling
    if (key.upArrow || input === 'k') {
      setScrollOffset(Math.max(0, state.scrollOffset - 1));
    }
    if (key.downArrow || input === 'j') {
      setScrollOffset(Math.min(maxScroll, state.scrollOffset + 1));
    }
  });

  return (
    <Box flexDirection="column" height="100%">
      <TitleBar />
      <Preview content={state.content} scrollOffset={state.scrollOffset} />
      <StatusBar filePath={state.currentFile || 'No file'} mode={state.mode} />
    </Box>
  );
}
