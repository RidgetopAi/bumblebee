import React from 'react';
import { Box, Text } from 'ink';
import { bumblebeeTheme } from '../config/theme-bumblebee.js';
import type { FileTreeItem } from '../utils/fsTree.js';

interface ExplorerProps {
  /** Whether the explorer pane is visible */
  visible: boolean;
  /** Currently selected item index */
  selectedIndex: number;
  /** Array of file/directory items to display */
  items: FileTreeItem[];
  /** Optional callback when selection changes */
  onSelect?: (index: number) => void;
  /** Optional callback for navigation */
  onNavigate?: (direction: 'up' | 'down') => void;
}

/**
 * Explorer Component - File tree browser (NvimTree-like)
 *
 * Displays a navigable file tree with directory/file icons.
 * Highlights the currently selected item with cyan accent.
 * Only renders when visible.
 */
export function Explorer({
  visible,
  selectedIndex,
  items,
  onSelect,
  onNavigate
}: ExplorerProps) {
  if (!visible) {
    return null;
  }

  return (
    <Box flexDirection="column" height="100%">
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        let icon = item.type === 'directory' ? '📁' : '📄';
        if (item.name === '..') {
          icon = '⬆️';
        }

        return (
          <Box key={item.path} paddingX={1}>
            <Text
              color={isSelected ? bumblebeeTheme.current.cyan : undefined}
              inverse={isSelected}
              bold={isSelected}
            >
              {icon} {item.name}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
