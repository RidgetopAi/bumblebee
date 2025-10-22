import React from 'react';
import { Box, Text } from 'ink';
import { bumblebeeTheme } from '../config/theme-bumblebee.js';

/**
 * TitleBar Component - Static title bar for Bumblebee TUI
 *
 * Displays "Bumblebee" centered with theme colors:
 * - Background: nearBlack (#010600)
 * - Text: yellowB (#E9B033)
 */
export function TitleBar() {
  return (
    <Box
      width="100%"
      justifyContent="center"
      backgroundColor={bumblebeeTheme.current.nearBlack}
      paddingX={1}
    >
      <Text color={bumblebeeTheme.current.yellowB} bold>
        Bumblebee
      </Text>
    </Box>
  );
}
