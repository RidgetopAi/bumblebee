import { describe, it, expect } from 'vitest';
import { createExplorerState, moveSelection, handleEnter, toggleExplorer, renderExplorer, getSelectedPath, getSelectedNode, refreshExplorer } from '../src/tui/panes/explorer.js';
import { BumblebeeConfig } from '../src/config/loadConfig.js';
import path from 'path';

describe('Explorer Pane', () => {
  const testDir = path.join(process.cwd(), 'tests', 'fsTree-fixtures', 'test-dir');

  const defaultConfig: BumblebeeConfig = {
    editor: 'nvim',
    trueColor: 'auto',
    theme: 'bumblebee',
    tableStyle: 'padded',
    showDotfiles: false,
    explorerWidth: 28,
    shikiTheme: 'github-dark',
  };

  describe('createExplorerState', () => {
    it('should create initial explorer state', () => {
      const state = createExplorerState(testDir, defaultConfig);

      expect(state.rootPath).toBe(testDir);
      expect(state.tree).not.toBeNull();
      expect(Array.isArray(state.flattened)).toBe(true);
      expect(state.selectedIndex).toBe(0);
      expect(state.expandedDirs.has(testDir)).toBe(true); // Root is expanded
      expect(state.visible).toBe(false); // Initially hidden
    });
  });

  describe('moveSelection', () => {
    it('should move selection up and down', () => {
      const state = createExplorerState(testDir, defaultConfig);

      // Initial selection
      expect(state.selectedIndex).toBe(0);

      // Move down
      moveSelection(state, 'down');
      expect(state.selectedIndex).toBe(1);

      // Move up
      moveSelection(state, 'up');
      expect(state.selectedIndex).toBe(0);

      // Don't go below 0
      moveSelection(state, 'up');
      expect(state.selectedIndex).toBe(0);
    });

    it('should not exceed flattened array bounds', () => {
      const state = createExplorerState(testDir, defaultConfig);

      // Move to last item
      const lastIndex = state.flattened.length - 1;
      state.selectedIndex = lastIndex;

      // Try to move down past the end
      moveSelection(state, 'down');
      expect(state.selectedIndex).toBe(lastIndex);
    });
  });

  describe('getSelectedPath and getSelectedNode', () => {
    it('should return selected path and node', () => {
      const state = createExplorerState(testDir, defaultConfig);

      const selectedPath = getSelectedPath(state);
      // With parent directory support, index 0 should be the ".." entry when not at root
      expect(selectedPath).toMatch(/\/\.\.$/); // Should be ".." path

      const selectedNode = getSelectedNode(state);
      // ".." entries don't have nodes in the tree, so should be null
      expect(selectedNode).toBeNull();
    });

    it('should return null for invalid selection', () => {
      const state = createExplorerState(testDir, defaultConfig);
      state.selectedIndex = 999; // Invalid index

      const selectedPath = getSelectedPath(state);
      expect(selectedPath).toBeNull();

      const selectedNode = getSelectedNode(state);
      expect(selectedNode).toBeNull();
    });
  });

  describe('toggleExplorer', () => {
    it('should toggle explorer visibility', () => {
      const state = createExplorerState(testDir, defaultConfig);

      expect(state.visible).toBe(false);

      toggleExplorer(state);
      expect(state.visible).toBe(true);

      toggleExplorer(state);
      expect(state.visible).toBe(false);
    });
  });

  describe('handleEnter', () => {
    it('should return file path when file is selected', () => {
      const state = createExplorerState(testDir, defaultConfig);

      // Find a file in the flattened list
      const fileIndex = state.flattened.findIndex(path => path.endsWith('file1.txt'));
      expect(fileIndex).toBeGreaterThan(-1);

      state.selectedIndex = fileIndex;

      const result = handleEnter(state, defaultConfig);
      expect(result).toBe(state.flattened[fileIndex]);
    });

    it('should return null when directory is selected (navigates into directory)', () => {
      const state = createExplorerState(testDir, defaultConfig);

      // Select a directory
      const dirIndex = state.flattened.findIndex(path => path.endsWith('subdir'));
      expect(dirIndex).toBeGreaterThan(-1);

      state.selectedIndex = dirIndex;

      const result = handleEnter(state, defaultConfig);
      expect(result).toBeNull(); // Directory navigation returns null
    });
  });

  describe('renderExplorer', () => {
    it('should render explorer content when visible', () => {
      const state = createExplorerState(testDir, defaultConfig);
      state.visible = true;

      const content = renderExplorer(state, defaultConfig, 10, 28);

      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
      expect(content.includes('test-dir')).toBe(true); // Root directory name
    });

    it('should return empty string when not visible', () => {
      const state = createExplorerState(testDir, defaultConfig);
      state.visible = false;

      const content = renderExplorer(state, defaultConfig, 10, 28);

      expect(content).toBe('');
    });

    it('should highlight selected item', () => {
      const state = createExplorerState(testDir, defaultConfig);
      state.visible = true;

      const content = renderExplorer(state, defaultConfig, 20, 28);

      // Should contain selection indicator (►)
      expect(content.includes('►')).toBe(true);
    });
  });

  describe('directory navigation', () => {
    it('should navigate into directories', () => {
      const state = createExplorerState(testDir, defaultConfig);

      // Find subdir path
      const subdirPath = path.join(testDir, 'subdir');
      const subdirIndex = state.flattened.findIndex(p => p === subdirPath);
      expect(subdirIndex).toBeGreaterThan(-1);

      // Select the subdirectory
      state.selectedIndex = subdirIndex;

      // Store original root path
      const originalRoot = state.rootPath;

      // Navigate into directory
      const result = handleEnter(state, defaultConfig);
      expect(result).toBeNull(); // Directory navigation returns null

      // Should have changed root path
      expect(state.rootPath).toBe(subdirPath);
      expect(state.rootPath).not.toBe(originalRoot);

      // Selection should be reset
      expect(state.selectedIndex).toBe(0);
    });

    it('should navigate to parent directory with ".."', () => {
      // Create state in a subdirectory
      const subdirPath = path.join(testDir, 'subdir');
      const state = createExplorerState(subdirPath, defaultConfig);

      // Should have ".." as first entry
      expect(state.flattened[0]).toMatch(/\/\.\.$/);

      // Select ".."
      state.selectedIndex = 0;

      // Navigate up
      const result = handleEnter(state, defaultConfig);
      expect(result).toBeNull(); // Parent navigation returns null

      // Should be back in original directory
      expect(state.rootPath).toBe(testDir);
    });
  });

  describe('auto-focus behavior', () => {
    it('should return file path when file is selected (triggers auto-focus)', () => {
      const state = createExplorerState(testDir, defaultConfig);

      // Find a file in the flattened list
      const fileIndex = state.flattened.findIndex(path => path.endsWith('file1.txt'));
      expect(fileIndex).toBeGreaterThan(-1);

      state.selectedIndex = fileIndex;

      const result = handleEnter(state, defaultConfig);
      expect(result).toBe(state.flattened[fileIndex]); // File opening returns file path
      // Note: Focus switching to preview pane is handled by input system
    });

    it('should return null when directory is selected (keeps focus in explorer)', () => {
      const state = createExplorerState(testDir, defaultConfig);

      // Select a directory
      const dirIndex = state.flattened.findIndex(path => path.endsWith('subdir'));
      expect(dirIndex).toBeGreaterThan(-1);

      state.selectedIndex = dirIndex;

      const result = handleEnter(state, defaultConfig);
      expect(result).toBeNull(); // Directory navigation returns null
      // Note: Focus stays in explorer pane (no auto-focus switch)
    });
  });

  describe('refreshExplorer', () => {
    it('should refresh explorer state and maintain selection bounds', () => {
      const state = createExplorerState(testDir, defaultConfig);
      const originalTree = state.tree;
      const originalFlattenedLength = state.flattened.length;

      // Set selection near the end
      state.selectedIndex = Math.min(state.flattened.length - 1, 5);

      // Refresh explorer
      refreshExplorer(state, defaultConfig);

      // Tree should be refreshed
      expect(state.tree).not.toBe(originalTree);
      expect(Array.isArray(state.flattened)).toBe(true);
      expect(state.flattened.length).toBeGreaterThan(0);

      // Selection should be valid (within bounds)
      expect(state.selectedIndex).toBeLessThan(state.flattened.length);
      expect(state.selectedIndex).toBeGreaterThanOrEqual(0);
    });

    it('should add parent directory entry when not at root', () => {
      // Create state in subdirectory
      const subdirPath = path.join(testDir, 'subdir');
      const state = createExplorerState(subdirPath, defaultConfig);

      // Refresh explorer
      refreshExplorer(state, defaultConfig);

      // Should have parent directory entry
      expect(state.flattened.length).toBeGreaterThan(0);
      expect(state.flattened[0]).toMatch(/\.\.$/);
    });
  });
});
