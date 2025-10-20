import { readdirSync, lstatSync, statSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { BumblebeeConfig } from '../config/loadConfig.js';

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  children?: FileTreeNode[];
  isExpanded?: boolean;
}

export interface ScanOptions {
  showDotfiles: boolean;
  maxDepth?: number;
}

/**
 * Scans a directory recursively and returns a tree structure
 * @param rootPath - The root directory path to scan
 * @param config - Bumblebee configuration
 * @param options - Scan options
 * @returns The root FileTreeNode
 */
export function scanDirectoryTree(
  rootPath: string,
  config: BumblebeeConfig,
  options?: Partial<ScanOptions>
): FileTreeNode | null {
  const mergedOptions: ScanOptions = {
    showDotfiles: config.showDotfiles,
    ...options
  };

  const resolvedPath = resolve(rootPath);

  // Check if directory exists
  if (!existsSync(resolvedPath)) {
    return null;
  }

  const rootStat = lstatSync(resolvedPath);

  // Handle symlinks safely
  if (rootStat.isSymbolicLink()) {
    const targetPath = resolve(rootPath);
    // Check if symlink points to a directory
    try {
      const targetStat = statSync(targetPath);
      if (!targetStat.isDirectory()) {
        // Symlink to file - treat as file
        return {
          name: rootPath.split('/').pop() || rootPath,
          path: resolvedPath,
          type: 'symlink'
        };
      }
      // Symlink to directory - follow it but mark as symlink
      return scanDirectoryTreeInternal(targetPath, config, mergedOptions, 0, new Set([resolvedPath]));
    } catch {
      // Broken symlink or permission issue
      return {
        name: rootPath.split('/').pop() || rootPath,
        path: resolvedPath,
        type: 'symlink'
      };
    }
  }

  if (!rootStat.isDirectory()) {
    return null; // Not a directory
  }

  return scanDirectoryTreeInternal(resolvedPath, config, mergedOptions, 0, new Set());
}

/**
 * Internal recursive scanning function with symlink loop detection
 */
function scanDirectoryTreeInternal(
  dirPath: string,
  config: BumblebeeConfig,
  options: ScanOptions,
  currentDepth: number,
  visitedPaths: Set<string>
): FileTreeNode | null {
  // Prevent infinite recursion from symlinks
  if (visitedPaths.has(dirPath)) {
    return null;
  }

  // Check depth limit - if at max depth, return directory node without scanning contents
  if (options.maxDepth !== undefined && currentDepth >= options.maxDepth) {
    return {
      name: dirPath.split('/').pop() || dirPath,
      path: dirPath,
      type: 'directory',
      children: []
    };
  }

  try {
    const entries = readdirSync(dirPath);
    const children: FileTreeNode[] = [];

    for (const entry of entries) {
      // Skip dotfiles if not configured to show them
      if (!options.showDotfiles && entry.startsWith('.')) {
        continue;
      }

      const entryPath = join(dirPath, entry);
      const entryStat = lstatSync(entryPath);

      if (entryStat.isDirectory()) {
        // Directory
        const childNode = scanDirectoryTreeInternal(
          entryPath,
          config,
          options,
          currentDepth + 1,
          new Set([...visitedPaths, dirPath])
        );
        if (childNode) {
          children.push(childNode);
        }
      } else if (entryStat.isSymbolicLink()) {
        // Symlink - add without following to prevent loops
        children.push({
          name: entry,
          path: entryPath,
          type: 'symlink'
        });
      } else {
        // Regular file
        children.push({
          name: entry,
          path: entryPath,
          type: 'file'
        });
      }
    }

    // Sort: directories first (alphabetically), then files (alphabetically)
    children.sort((a, b) => {
      // Directories before files
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;

      // Alphabetical within same type
      return a.name.localeCompare(b.name);
    });

    return {
      name: dirPath.split('/').pop() || dirPath,
      path: dirPath,
      type: 'directory',
      children
    };
  } catch (error) {
    // Permission denied or other error - return null
    return null;
  }
}

/**
 * Flattens a file tree into a list of all file paths
 * @param root - The root FileTreeNode
 * @returns Array of all file paths
 */
export function flattenFileTree(root: FileTreeNode): string[] {
  const result: string[] = [];

  function traverse(node: FileTreeNode) {
    result.push(node.path);
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(root);
  return result;
}

/**
 * Finds a node by path in the tree
 * @param root - The root FileTreeNode
 * @param targetPath - The path to find
 * @returns The FileTreeNode if found, null otherwise
 */
export function findNodeByPath(root: FileTreeNode, targetPath: string): FileTreeNode | null {
  if (root.path === targetPath) {
    return root;
  }

  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByPath(child, targetPath);
      if (found) return found;
    }
  }

  return null;
}
