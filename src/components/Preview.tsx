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

  // Calculate available height (terminal rows minus title and status bars)
  const availableHeight = stdout?.rows ? stdout.rows - 2 : 20;

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
      height={availableHeight}
      borderStyle="single"
      borderColor={bumblebeeTheme.current.yellowA}
    >
      <Text>
        {visibleContent}
      </Text>
    </Box>
  );
}
