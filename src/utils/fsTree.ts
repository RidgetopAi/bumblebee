import { readdirSync, statSync } from 'fs';
import { resolve, basename } from 'path';
import { loadConfig } from '../config/loadConfig.js';

export interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  isExpanded?: boolean;
  children?: FileTreeItem[];
}

export interface FileTree {
  root: string;
  items: FileTreeItem[];
}

/**
 * Check if a file or directory name is hidden (starts with '.')
 */
function isHidden(name: string): boolean {
  return name.startsWith('.');
}

/**
 * Sort file tree items: directories first (alphabetically), then files (alphabetically)
 */
function sortItems(items: FileTreeItem[]): FileTreeItem[] {
  return items.sort((a, b) => {
    // Directories come before files
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;

    // Within same type, sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Scan a directory and return its immediate children as a file tree
 * @param path - Directory path to scan
 * @param depth - Scan depth (default 1 = immediate children only)
 * @returns FileTree with root path and sorted items
 */
export function scanDirectory(path: string, depth: number = 1): FileTree {
  const config = loadConfig();
  const absolutePath = resolve(path);

  try {
    const entries = readdirSync(absolutePath);

    const items: FileTreeItem[] = entries
      .filter(name => config.showDotfiles || !isHidden(name))
      .map(name => {
        const fullPath = resolve(absolutePath, name);
        const stats = statSync(fullPath);

        return {
          name,
          path: fullPath,
          type: stats.isDirectory() ? 'directory' : 'file',
          isExpanded: false,
          children: undefined, // Not populated for depth=1
        };
      });

    return {
      root: absolutePath,
      items: sortItems(items),
    };
  } catch (error) {
    // Return empty tree for inaccessible directories
    return {
      root: absolutePath,
      items: [],
    };
  }
}
