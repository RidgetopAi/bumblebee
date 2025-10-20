import { scanDirectoryTree, flattenFileTree, findNodeByPath } from '../../utils/fsTree.js';
import { bumblebeeTheme } from '../../config/theme-bumblebee.js';
/**
 * Create initial explorer state
 */
export function createExplorerState(rootPath, config) {
    const tree = scanDirectoryTree(rootPath, config);
    const flattened = tree ? flattenFileTree(tree) : [];
    return {
        rootPath,
        tree,
        flattened,
        selectedIndex: 0,
        expandedDirs: new Set([rootPath]), // Root is always expanded
        visible: false, // Initially hidden
    };
}
/**
 * Get the currently selected file/directory path
 */
export function getSelectedPath(state) {
    if (!state.flattened.length || state.selectedIndex >= state.flattened.length) {
        return null;
    }
    return state.flattened[state.selectedIndex];
}
/**
 * Get the FileTreeNode for the currently selected item
 */
export function getSelectedNode(state) {
    const selectedPath = getSelectedPath(state);
    if (!selectedPath || !state.tree) {
        return null;
    }
    return findNodeByPath(state.tree, selectedPath);
}
/**
 * Move selection up/down in the explorer
 */
export function moveSelection(state, direction) {
    if (!state.flattened.length)
        return;
    if (direction === 'up') {
        state.selectedIndex = Math.max(0, state.selectedIndex - 1);
    }
    else {
        state.selectedIndex = Math.min(state.flattened.length - 1, state.selectedIndex + 1);
    }
}
/**
 * Toggle expand/collapse of a directory
 */
export function toggleDirectory(state, path) {
    const node = state.tree ? findNodeByPath(state.tree, path) : null;
    if (!node || node.type !== 'directory')
        return;
    if (state.expandedDirs.has(path)) {
        state.expandedDirs.delete(path);
    }
    else {
        state.expandedDirs.add(path);
    }
    // Re-flatten the tree with new expansion state
    state.flattened = state.tree ? flattenFileTree(state.tree) : [];
    // TODO: Filter flattened list based on expandedDirs
}
/**
 * Handle Enter key on selected item
 * Returns the path to open, or null if directory was toggled
 */
export function handleEnter(state) {
    const selectedPath = getSelectedPath(state);
    const selectedNode = getSelectedNode(state);
    if (!selectedPath || !selectedNode)
        return null;
    if (selectedNode.type === 'directory') {
        // Toggle directory expansion
        toggleDirectory(state, selectedPath);
        return null;
    }
    else {
        // Return file path to open
        return selectedPath;
    }
}
/**
 * Render the explorer pane content as a string
 */
export function renderExplorer(state, config, height, width) {
    if (!state.tree || !state.visible) {
        return '';
    }
    const lines = [];
    const theme = bumblebeeTheme.current;
    // Render tree recursively
    function renderNode(node, depth, isLast) {
        if (lines.length >= height)
            return; // Don't exceed available height
        const isSelected = state.flattened[state.selectedIndex] === node.path;
        const prefix = buildPrefix(depth, isLast);
        // Build the line content
        let line = '';
        // Selection highlight
        if (isSelected) {
            line += `${theme.cyan}► `;
        }
        else {
            line += '  ';
        }
        // Tree structure prefix
        line += prefix;
        // Directory/file indicator
        if (node.type === 'directory') {
            const isExpanded = state.expandedDirs.has(node.path);
            line += isExpanded ? '▼ ' : '▶ ';
        }
        else if (node.type === 'symlink') {
            line += '↗ ';
        }
        else {
            line += '  ';
        }
        // Node name
        line += node.name;
        // Apply selection colors
        if (isSelected) {
            line = `${theme.cyan}${line}${theme.nearBlack}`;
        }
        lines.push(line);
        // Render children if directory is expanded
        if (node.type === 'directory' && node.children && state.expandedDirs.has(node.path)) {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                const childIsLast = i === node.children.length - 1;
                renderNode(child, depth + 1, childIsLast);
            }
        }
    }
    // Start rendering from root
    renderNode(state.tree, 0, true);
    // Fill remaining height with empty lines
    while (lines.length < height) {
        lines.push('');
    }
    return lines.join('\n');
}
/**
 * Build tree prefix for visual hierarchy (like NvimTree)
 */
function buildPrefix(depth, isLast) {
    if (depth === 0)
        return '';
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
export function toggleExplorer(state) {
    state.visible = !state.visible;
}
/**
 * Show explorer pane
 */
export function showExplorer(state) {
    state.visible = true;
}
/**
 * Hide explorer pane
 */
export function hideExplorer(state) {
    state.visible = false;
}
/**
 * Check if explorer is currently visible
 */
export function isExplorerVisible(state) {
    return state.visible;
}
/**
 * Update explorer when filesystem changes (for chokidar integration)
 */
export function refreshExplorer(state, config) {
    // Re-scan the directory tree
    state.tree = scanDirectoryTree(state.rootPath, config);
    state.flattened = state.tree ? flattenFileTree(state.tree) : [];
    // Ensure selection is still valid
    if (state.selectedIndex >= state.flattened.length) {
        state.selectedIndex = Math.max(0, state.flattened.length - 1);
    }
}
