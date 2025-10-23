import React, { useMemo } from 'react';
import { Box, Text, useStdout } from 'ink';
import { bumblebeeTheme } from '../config/theme-bumblebee.js';

/**
 * Preview Component - Scrollable preview pane for Bumblebee TUI
 *
 * Displays rendered ANSI content with scrolling support.
 * Shows a window of content based on scrollOffset prop.
 *
 * Border: yellowA (#F2D638, preview pane border)
 */
interface PreviewProps {
  content: string;
  scrollOffset: number;
}

export function Preview({ content, scrollOffset }: PreviewProps) {
  const { stdout } = useStdout();

  // Calculate available height (terminal rows minus title bar, status bar, and preview borders)
  // TitleBar: 1 row, StatusBar (with borders): 3 rows, Preview border (top+bottom): 2 rows = 6 total
  // Empirically verified: -5 positions content correctly (user feedback: -4 was 1 line too high)
  const availableHeight = stdout?.rows ? stdout.rows - 5 : 20;

  // Split content into lines
  const lines = useMemo(() => content.split('\n'), [content]);

  // Calculate visible content window
  const visibleContent = useMemo(() => {
    const start = Math.max(0, scrollOffset);
    const end = Math.min(lines.length, start + availableHeight);
    return lines.slice(start, end).join('\n');
  }, [lines, scrollOffset, availableHeight]);

  return (
    <Box
      flexDirection="column"
      flexGrow={1}
      borderStyle="single"
      borderColor={bumblebeeTheme.current.yellowA}
    >
      <Text>
        {visibleContent}
      </Text>
    </Box>
  );
}
