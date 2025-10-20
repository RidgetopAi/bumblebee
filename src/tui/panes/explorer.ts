import path from 'path';
import { scanDirectoryTree, flattenFileTree, findNodeByPath, type FileTreeNode } from '../../utils/fsTree.js';
import { BumblebeeConfig } from '../../config/loadConfig.js';
import { bumblebeeTheme } from '../../config/theme-bumblebee.js';

/**
 * Explorer pane state and rendering for Bumblebee TUI
 * Implements NvimTree-like filesystem navigation
 */

export interface ExplorerState {
  rootPath: string;
  tree: FileTreeNode | null;
  flattened: string[];
  selectedIndex: number;
  expandedDirs: Set<string>; // Paths of expanded directories
  visible: boolean;
}

/**
 * Create initial explorer state
 */
export function createExplorerState(rootPath: string, config: BumblebeeConfig): ExplorerState {
  const tree = scanDirectoryTree(rootPath, config);
  const flattened = tree ? flattenFileTree(tree) : [];
  const state = {
    rootPath,
    tree,
    flattened,
    selectedIndex: 0,
    expandedDirs: new Set([rootPath]), // Root is always expanded
    visible: false, // Initially hidden
  };

  // Add parent directory entry if not at filesystem root
  addParentDirectoryEntry(state);

  return state;
}

/**
 * Check if the given path is at the filesystem root
 */
function isAtFilesystemRoot(rootPath: string): boolean {
  return path.dirname(rootPath) === rootPath;
}

/**
 * Add parent directory ("..") entry to the flattened list if not at root
 */
function addParentDirectoryEntry(state: ExplorerState): void {
  if (isAtFilesystemRoot(state.rootPath)) return;

  const parentPath = path.dirname(state.rootPath) + path.sep + '..';
  state.flattened.unshift(parentPath);
}

/**
 * Navigate to a new directory, updating the explorer state
 */
function navigateToDirectory(state: ExplorerState, targetPath: string, config: BumblebeeConfig): void {
  state.rootPath = targetPath;
  state.tree = scanDirectoryTree(targetPath, config);
  state.flattened = state.tree ? flattenFileTree(state.tree) : [];

  // Add parent directory entry if applicable
  addParentDirectoryEntry(state);

  // Reset selection and expansion state
  state.selectedIndex = 0;
  state.expandedDirs.clear();
  state.expandedDirs.add(targetPath);
}

/**
 * Get the currently selected file/directory path
 */
export function getSelectedPath(state: ExplorerState): string | null {
  if (!state.flattened.length || state.selectedIndex >= state.flattened.length) {
    return null;
  }
  return state.flattened[state.selectedIndex];
}

/**
 * Get the FileTreeNode for the currently selected item
 */
export function getSelectedNode(state: ExplorerState): FileTreeNode | null {
  const selectedPath = getSelectedPath(state);
  if (!selectedPath || !state.tree) {
    return null;
  }
  return findNodeByPath(state.tree, selectedPath);
}

/**
 * Move selection up/down in the explorer
 */
export function moveSelection(state: ExplorerState, direction: 'up' | 'down'): void {
  if (!state.flattened.length) return;

  if (direction === 'up') {
    state.selectedIndex = Math.max(0, state.selectedIndex - 1);
  } else {
    state.selectedIndex = Math.min(state.flattened.length - 1, state.selectedIndex + 1);
  }
}

/**
 * Toggle expand/collapse of a directory
 */
export function toggleDirectory(state: ExplorerState, path: string): void {
  const node = state.tree ? findNodeByPath(state.tree, path) : null;
  if (!node || node.type !== 'directory') return;

  if (state.expandedDirs.has(path)) {
    state.expandedDirs.delete(path);
  } else {
    state.expandedDirs.add(path);
  }

  // Re-flatten the tree with new expansion state
  state.flattened = state.tree ? flattenFileTree(state.tree) : [];
  // TODO: Filter flattened list based on expandedDirs
}

/**
 * Handle Enter key on selected item
 * Returns the path to open, or null if directory navigation occurred
 */
export function handleEnter(state: ExplorerState, config: BumblebeeConfig): string | null {
  const selectedPath = getSelectedPath(state);

  if (!selectedPath) return null;

  // Handle parent directory navigation ("..")
  if (selectedPath.endsWith(path.sep + '..')) {
    const parentPath = path.dirname(state.rootPath);
    if (parentPath !== state.rootPath) {
      navigateToDirectory(state, parentPath, config);
    }
    return null;
  }

  // Handle regular directory navigation
  const selectedNode = getSelectedNode(state);
  if (selectedNode?.type === 'directory') {
    navigateToDirectory(state, selectedPath, config);
    return null;
  }

  // Return file path to open
  return selectedPath;
}

/**
 * Render the explorer pane as an array of items for blessed.list()
 * Returns array of strings that will be set via setItems()
 */
export function renderExplorer(state: ExplorerState, config: BumblebeeConfig, height: number, width: number): string[] {
  if (!state.tree || !state.visible) {
    return [];
  }

  const items: string[] = [];
  const theme = bumblebeeTheme.current;

  // Render all items in flattened list (blessed.list handles viewport/scrolling)
  for (let i = 0; i < state.flattened.length; i++) {
    const itemPath = state.flattened[i];

    // Build the line content
    let line = '';

    // Handle ".." entries specially
    if (itemPath.endsWith(path.sep + '..')) {
      line += '↩️  ..';
    } else {
      // Regular file/directory
      const node = state.tree ? findNodeByPath(state.tree, itemPath) : null;
      if (node) {
        if (node.type === 'directory') {
          line += '📁 ' + node.name;
        } else if (node.type === 'symlink') {
          line += '↗ ' + node.name;
        } else {
          line += '📄 ' + node.name;
        }
      } else {
        // Fallback for items not found in tree (shouldn't happen)
        const name = path.basename(itemPath);
        line += '❓ ' + name;
      }
    }

    items.push(line);
  }

  return items;
}

/**
 * Build tree prefix for visual hierarchy (like NvimTree)
 */
function buildPrefix(depth: number, isLast: boolean): string {
  if (depth === 0) return '';

  let prefix = '';
  for (let i = 1; i < depth; i++) {
    prefix += '│   ';
  }

  prefix += isLast ? '└── ' : '├── ';
  return prefix;
}

/**
 * Toggle explorer visibility
 */
export function toggleExplorer(state: ExplorerState): void {
  state.visible = !state.visible;
}

/**
 * Show explorer pane
 */
export function showExplorer(state: ExplorerState): void {
  state.visible = true;
}

/**
 * Hide explorer pane
 */
export function hideExplorer(state: ExplorerState): void {
  state.visible = false;
}

/**
 * Check if explorer is currently visible
 */
export function isExplorerVisible(state: ExplorerState): boolean {
  return state.visible;
}

/**
 * Update explorer when filesystem changes (for chokidar integration)
 */
export function refreshExplorer(state: ExplorerState, config: BumblebeeConfig): void {
  // Re-scan the directory tree
  state.tree = scanDirectoryTree(state.rootPath, config);
  state.flattened = state.tree ? flattenFileTree(state.tree) : [];

  // Add parent directory entry if applicable
  addParentDirectoryEntry(state);

  // Ensure selection is still valid
  if (state.selectedIndex >= state.flattened.length) {
    state.selectedIndex = Math.max(0, state.flattened.length - 1);
  }
}
