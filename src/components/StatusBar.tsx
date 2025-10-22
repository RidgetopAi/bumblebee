import React from 'react';
import { Box, Text } from 'ink';

/**
 * StatusBar Component - Bottom status bar for Bumblebee TUI
 *
 * Props-based component that displays current file path and mode indicator.
 *
 * Border: #E9B033 (yellow B, status/bottom border)
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
      borderColor="#E9B033"
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
