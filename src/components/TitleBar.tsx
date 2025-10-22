import React from 'react';
import { Box, Text } from 'ink';

/**
 * TitleBar Component - Static title bar for Bumblebee TUI
 *
 * Displays "Bumblebee" centered with theme colors:
 * - Background: #010600 (near-black)
 * - Text: #E9B033 (yellow B)
 */
export function TitleBar() {
  return (
    <Box
      width="100%"
      justifyContent="center"
      backgroundColor="#010600"
      paddingX={1}
    >
      <Text color="#E9B033" bold>
        Bumblebee
      </Text>
    </Box>
  );
}
