import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Explorer } from '../src/components/Explorer.js';
import type { FileTreeItem } from '../src/utils/fsTree.js';

describe('Explorer Component', () => {
  const mockItems: FileTreeItem[] = [
    {
      name: 'src',
      path: '/path/to/src',
      type: 'directory',
    },
    {
      name: 'package.json',
      path: '/path/to/package.json',
      type: 'file',
    },
    {
      name: 'README.md',
      path: '/path/to/README.md',
      type: 'file',
    },
  ];

  it('renders file tree with correct icons', () => {
    const { lastFrame } = render(
      <Explorer
        visible={true}
        selectedIndex={0}
        items={mockItems}
      />
    );

    expect(lastFrame()).toContain('📁 src');
    expect(lastFrame()).toContain('📄 package.json');
    expect(lastFrame()).toContain('📄 README.md');
  });

  it('highlights selected item with cyan color', () => {
    const { lastFrame } = render(
      <Explorer
        visible={true}
        selectedIndex={1}
        items={mockItems}
      />
    );

    const frame = lastFrame();
    // The second item (package.json) should be highlighted
    expect(frame).toContain('📄 package.json'); // Selected item
    expect(frame).toContain('📁 src'); // Non-selected item
  });

  it('does not render when visible is false', () => {
    const { lastFrame } = render(
      <Explorer
        visible={false}
        selectedIndex={0}
        items={mockItems}
      />
    );

    expect(lastFrame()).toBe('');
  });

  it('handles empty items array', () => {
    const { lastFrame } = render(
      <Explorer
        visible={true}
        selectedIndex={0}
        items={[]}
      />
    );

    expect(lastFrame()).toBe('');
  });

  it('renders with proper spacing and layout', () => {
    const { lastFrame } = render(
      <Explorer
        visible={true}
        selectedIndex={0}
        items={mockItems}
      />
    );

    const frame = lastFrame();
    const lines = frame.split('\n').filter(line => line.trim());

    expect(lines).toHaveLength(3); // Three items
    expect(lines[0]).toContain('📁 src');
    expect(lines[1]).toContain('📄 package.json');
    expect(lines[2]).toContain('📄 README.md');
  });
});
