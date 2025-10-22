import React, { useState, useEffect } from 'react';
import { Box, useInput, useApp as useInkApp } from 'ink';
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
  const { state, setCurrentFile, setContent } = useAppState();

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
      setCurrentFile('sample.md');
    };

    loadContent();
  }, [setContent, setCurrentFile]);

  // Handle keyboard input
  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
    }
  });

  return (
    <Box flexDirection="column" height="100%">
      <TitleBar />
      <Preview content={state.content} scrollOffset={0} />
      <StatusBar filePath={state.currentFile || 'No file'} mode={state.mode} />
    </Box>
  );
}
