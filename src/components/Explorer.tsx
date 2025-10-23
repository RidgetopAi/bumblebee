import React, { useMemo } from 'react';
import { Box, Text, useStdout } from 'ink';
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
 * Implements viewport scrolling to keep selected item visible.
 * Only renders when visible.
 */
export function Explorer({
  visible,
  selectedIndex,
  items,
  onSelect,
  onNavigate
}: ExplorerProps) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS (React Rules of Hooks)
  const { stdout } = useStdout();

  // Calculate available height for explorer (terminal rows minus title and status bars)
  // TitleBar: 1 row, StatusBar (with borders): 3 rows = 4 total
  const availableHeight = stdout?.rows ? stdout.rows - 4 : 20;

  // Calculate scroll offset to keep selected item in view (single source of truth)
  const scrollOffset = useMemo(() => {
    if (items.length <= availableHeight) {
      return 0;
    }
    // Keep selected item in the middle of the viewport when possible
    const middleOfViewport = Math.floor(availableHeight / 2);
    let offset = Math.max(0, selectedIndex - middleOfViewport);
    const maxScroll = Math.max(0, items.length - availableHeight);
    return Math.min(offset, maxScroll);
  }, [items.length, selectedIndex, availableHeight]);

  // Calculate visible items window based on scroll offset
  const visibleItems = useMemo(() => {
    if (items.length <= availableHeight) {
      return items;
    }
    return items.slice(scrollOffset, scrollOffset + availableHeight);
  }, [items, scrollOffset, availableHeight]);

  // Early return AFTER all hooks have been called
  if (!visible) {
    return null;
  }

  return (
    <Box flexDirection="column" height="100%">
      {visibleItems.map((item, visibleIndex) => {
        const actualIndex = scrollOffset + visibleIndex;
        const isSelected = actualIndex === selectedIndex;
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
