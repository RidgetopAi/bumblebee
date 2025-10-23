import { useState, useEffect } from 'react';
import { scanDirectory, FileTree, FileTreeItem } from '../utils/fsTree.js';

/**
 * Explorer state interface for file tree navigation
 */
export interface ExplorerState {
  /** Current directory being explored */
  rootPath: string;
  /** Scanned directory structure */
  fileTree: FileTree | null;
  /** Currently selected item index (0-based) */
  selectedIndex: number;
  /** Set of expanded directory paths */
  expandedDirs: Set<string>;
  /** Whether explorer pane is visible */
  visible: boolean;
}

/**
 * Initial explorer state
 */
const initialState: ExplorerState = {
  rootPath: process.cwd(),
  fileTree: null,
  selectedIndex: 0,
  expandedDirs: new Set(),
  visible: false,
};

/**
 * Custom hook for managing Bumblebee file explorer state
 */
export function useExplorer() {
  const [state, setState] = useState<ExplorerState>(initialState);

  /**
   * Load the file tree for the current root path
   */
  const loadFileTree = () => {
    const tree = scanDirectory(state.rootPath);
    setState(prev => ({
      ...prev,
      fileTree: tree,
      selectedIndex: Math.min(prev.selectedIndex, Math.max(0, tree.items.length - 1)),
    }));
  };

  /**
   * Set the root path and reload the file tree
   */
  const setRootPath = (path: string) => {
    setState(prev => ({ ...prev, rootPath: path }));
  };

  /**
   * Refresh the current directory scan
   */
  const refresh = () => {
    loadFileTree();
  };

  /**
   * Toggle explorer visibility
   */
  const toggleVisibility = () => {
    setState(prev => ({ ...prev, visible: !prev.visible }));
  };

  /**
   * Move selection to the next item (with wrapping)
   */
  const selectNext = () => {
    if (!state.fileTree) return;

    const maxIndex = state.fileTree.items.length - 1;
    if (maxIndex < 0) return;

    setState(prev => ({
      ...prev,
      selectedIndex: prev.selectedIndex >= maxIndex ? 0 : prev.selectedIndex + 1,
    }));
  };

  /**
   * Move selection to the previous item (with wrapping)
   */
  const selectPrev = () => {
    if (!state.fileTree) return;

    const maxIndex = state.fileTree.items.length - 1;
    if (maxIndex < 0) return;

    setState(prev => ({
      ...prev,
      selectedIndex: prev.selectedIndex <= 0 ? maxIndex : prev.selectedIndex - 1,
    }));
  };

  /**
  * Handle Enter key press on selected item
  */
  const handleEnter = (): { action: 'file' | 'directory' | 'none'; path: string } => {
  if (!state.fileTree) return { action: 'none', path: '' };

  const selectedItem = state.fileTree.items[state.selectedIndex];
  if (!selectedItem) return { action: 'none', path: '' };

  if (selectedItem.type === 'file') {
  return { action: 'file', path: selectedItem.path };
  }

  if (selectedItem.type === 'directory') {
  // Change to the selected directory
  setRootPath(selectedItem.path);
      return { action: 'directory', path: selectedItem.path };
  }

  return { action: 'none', path: '' };
  };

  /**
   * Expand a directory (add to expanded set)
   */
  const expandDirectory = (path: string) => {
    setState(prev => ({
      ...prev,
      expandedDirs: new Set([...prev.expandedDirs, path]),
    }));
  };

  /**
   * Collapse a directory (remove from expanded set)
   */
  const collapseDirectory = (path: string) => {
    setState(prev => {
      const newExpandedDirs = new Set(prev.expandedDirs);
      newExpandedDirs.delete(path);
      return {
        ...prev,
        expandedDirs: newExpandedDirs,
      };
    });
  };

  /**
   * Set selected index directly
   */
  const setSelectedIndex = (index: number) => {
    setState(prev => ({ ...prev, selectedIndex: index }));
  };

  /**
   * Update entire state (for complex updates)
   */
  const updateState = (updates: Partial<ExplorerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Load initial file tree on mount and when rootPath changes
  useEffect(() => {
    loadFileTree();
  }, [state.rootPath]);

  return {
    state,
    setRootPath,
    refresh,
    toggleVisibility,
    selectNext,
    selectPrev,
    handleEnter,
    expandDirectory,
    collapseDirectory,
    setSelectedIndex,
    updateState,
  };
}
