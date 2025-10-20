import { describe, it, expect } from 'vitest';
import { scanDirectoryTree, flattenFileTree, findNodeByPath, type FileTreeNode } from '../src/utils/fsTree.js';
import { BumblebeeConfig } from '../src/config/loadConfig.js';
import path from 'path';

describe('Filesystem Tree Scanner', () => {
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

  const configWithDotfiles: BumblebeeConfig = {
    ...defaultConfig,
    showDotfiles: true,
  };

  describe('scanDirectoryTree', () => {
    it('should scan a directory and return a tree structure', () => {
      const result = scanDirectoryTree(testDir, defaultConfig);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('directory');
      expect(result?.name).toBe('test-dir');
      expect(result?.path).toBe(testDir);
      expect(Array.isArray(result?.children)).toBe(true);
    });

    it('should return null for non-existent directory', () => {
      const result = scanDirectoryTree('/non/existent/path', defaultConfig);
      expect(result).toBeNull();
    });

    it('should return null for files', () => {
      const result = scanDirectoryTree(path.join(testDir, 'file1.txt'), defaultConfig);
      expect(result).toBeNull();
    });

    it('should filter out dotfiles when showDotfiles is false', () => {
      const result = scanDirectoryTree(testDir, defaultConfig);

      expect(result?.children).toBeDefined();
      const hiddenDir = result!.children!.find(child => child.name === '.hidden');
      expect(hiddenDir).toBeUndefined();
    });

    it('should include dotfiles when showDotfiles is true', () => {
      const result = scanDirectoryTree(testDir, configWithDotfiles);

      expect(result?.children).toBeDefined();
      const hiddenDir = result!.children!.find(child => child.name === '.hidden');
      expect(hiddenDir).toBeDefined();
      expect(hiddenDir?.type).toBe('directory');
    });

    it('should sort directories first, then files alphabetically', () => {
      const result = scanDirectoryTree(testDir, defaultConfig);

      expect(result?.children).toBeDefined();
      const children = result!.children!;

      // Find indices of directories and files
      const subdirIndex = children.findIndex(child => child.name === 'subdir');
      const file1Index = children.findIndex(child => child.name === 'file1.txt');
      const file2Index = children.findIndex(child => child.name === 'file2.md');
      const symlinkIndex = children.findIndex(child => child.name === 'symlink-to-file.txt');

      // Directories should come before files
      expect(subdirIndex).toBeLessThan(file1Index);
      expect(subdirIndex).toBeLessThan(file2Index);
      expect(subdirIndex).toBeLessThan(symlinkIndex);

      // Files should be sorted alphabetically
      expect(file1Index).toBeLessThan(file2Index);
      expect(file2Index).toBeLessThan(symlinkIndex);
    });

    it('should handle symlinks safely', () => {
      const result = scanDirectoryTree(testDir, defaultConfig);

      expect(result?.children).toBeDefined();
      const symlinkNode = result!.children!.find(child => child.name === 'symlink-to-file.txt');
      expect(symlinkNode).toBeDefined();
      expect(symlinkNode?.type).toBe('symlink');
      expect(symlinkNode?.path).toBe(path.join(testDir, 'symlink-to-file.txt'));
    });

    it('should recursively scan subdirectories', () => {
      const result = scanDirectoryTree(testDir, defaultConfig);

      expect(result?.children).toBeDefined();
      const subdir = result!.children!.find(child => child.name === 'subdir');
      expect(subdir).toBeDefined();
      expect(subdir?.type).toBe('directory');
      expect(subdir?.children).toBeDefined();
      expect(subdir!.children!.length).toBe(1);
      expect(subdir!.children![0].name).toBe('subfile.txt');
      expect(subdir!.children![0].type).toBe('file');
    });
  });

  describe('flattenFileTree', () => {
    it('should flatten a tree into an array of paths', () => {
      const tree = scanDirectoryTree(testDir, defaultConfig);
      expect(tree).not.toBeNull();

      const flattened = flattenFileTree(tree!);

      expect(Array.isArray(flattened)).toBe(true);
      expect(flattened.length).toBeGreaterThan(1);
      expect(flattened[0]).toBe(testDir); // Root should be first
      expect(flattened).toContain(path.join(testDir, 'file1.txt'));
      expect(flattened).toContain(path.join(testDir, 'subdir'));
      expect(flattened).toContain(path.join(testDir, 'subdir', 'subfile.txt'));
    });
  });

  describe('findNodeByPath', () => {
    it('should find a node by exact path', () => {
      const tree = scanDirectoryTree(testDir, defaultConfig);
      expect(tree).not.toBeNull();

      const found = findNodeByPath(tree!, path.join(testDir, 'file1.txt'));
      expect(found).not.toBeNull();
      expect(found?.name).toBe('file1.txt');
      expect(found?.type).toBe('file');
    });

    it('should return null for non-existent path', () => {
      const tree = scanDirectoryTree(testDir, defaultConfig);
      expect(tree).not.toBeNull();

      const found = findNodeByPath(tree!, '/non/existent/path');
      expect(found).toBeNull();
    });

    it('should find the root node', () => {
      const tree = scanDirectoryTree(testDir, defaultConfig);
      expect(tree).not.toBeNull();

      const found = findNodeByPath(tree!, testDir);
      expect(found).toBe(tree);
    });
  });

  describe('edge cases', () => {
    it('should handle empty directories', () => {
      const emptyDir = path.join(process.cwd(), 'tests', 'fsTree-fixtures', 'empty-dir');
      // Create empty directory
      require('fs').mkdirSync(emptyDir, { recursive: true });

      const result = scanDirectoryTree(emptyDir, defaultConfig);
      expect(result).not.toBeNull();
      expect(result?.children).toEqual([]);

      // Clean up
      require('fs').rmdirSync(emptyDir);
    });

    it('should handle maxDepth option', () => {
      const result = scanDirectoryTree(testDir, defaultConfig, { showDotfiles: false, maxDepth: 1 });

      expect(result).not.toBeNull();
      const subdir = result!.children!.find(child => child.name === 'subdir');
      expect(subdir).toBeDefined();
      // With maxDepth 1, subdir should have no children
      expect(subdir?.children).toEqual([]);
    });
  });
});
