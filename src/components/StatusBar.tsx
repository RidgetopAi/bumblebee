import React from 'react';
import { Box, Text } from 'ink';
import { bumblebeeTheme } from '../config/theme-bumblebee.js';

/**
 * StatusBar Component - Bottom status bar for Bumblebee TUI
 *
 * Props-based component that displays current file path and mode indicator.
 *
 * Border: yellowB (#E9B033, status/bottom border)
 */
interface StatusBarProps {
  filePath: string;
  mode: string;
}

export function StatusBar({ filePath, mode }: StatusBarProps) {
  return (
    <Box
      width="100%"
      borderStyle="single"
      borderColor={bumblebeeTheme.current.yellowB}
      paddingX={1}
      justifyContent="space-between"
    >
      <Text>
        {filePath}
      </Text>
      <Text>
        {mode}
      </Text>
    </Box>
  );
}
