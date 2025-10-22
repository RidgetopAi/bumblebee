import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../src/app.js';

// Mock the markdown renderer and parser
vi.mock('../src/render/mdastToAnsi.js', () => ({
  render: vi.fn(() => Promise.resolve('Rendered markdown content\nLine 2\nLine 3\nLine 4\nLine 5')),
}));

vi.mock('../src/parser/mdToAst.js', () => ({
  parseMd: vi.fn(() => ({ type: 'root', children: [] })),
}));

// Mock theme
vi.mock('../src/config/theme-bumblebee.js', () => ({
  bumblebeeTheme: {
    current: {
      nearBlack: '#010600',
      yellowB: '#E9B033',
      yellowA: '#F2D638',
    },
  },
}));

// Mock stdout for consistent testing
const mockStdout = {
  rows: 24,
  columns: 80,
  on: vi.fn(),
  off: vi.fn(),
  write: vi.fn(),
};

const originalStdout = process.stdout;

// Mock Ink's useApp hook
const mockExit = vi.fn();
vi.mock('ink', async () => {
  const actual = await vi.importActual('ink');
  return {
    ...actual,
    useApp: () => ({ exit: mockExit }),
  };
});

beforeEach(() => {
  // Mock process.stdout
  Object.defineProperty(process, 'stdout', {
    value: mockStdout,
    writable: true,
  });
});

afterEach(() => {
  // Restore original stdout
  Object.defineProperty(process, 'stdout', {
    value: originalStdout,
    writable: true,
  });
  vi.clearAllMocks();
});

describe('Ink TUI Integration Tests', () => {
  describe('App Component Rendering', () => {
    it('renders the main TUI layout with all components', async () => {
      const { lastFrame } = render(<App />);

      // Wait for async content loading
      await new Promise(resolve => setTimeout(resolve, 100));

      const output = lastFrame();

      // Verify all components are present
      expect(output).toContain('Bumblebee'); // TitleBar
      expect(output).toContain('sample.md'); // StatusBar shows file
      expect(output).toContain('normal'); // StatusBar shows mode
      expect(output).toContain('Rendered markdown content'); // Preview content
    });

    it('loads and displays sample content on mount', async () => {
      const { lastFrame } = render(<App />);

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 100));

      const output = lastFrame();
      expect(output).toContain('Rendered markdown content');
      expect(output).toContain('Line 2');
      expect(output).toContain('Line 5');
    });
  });

  describe('Resize Handling', () => {
    it('adapts to different terminal heights', async () => {
      // Start with tall terminal
      mockStdout.rows = 30;

      const { lastFrame, rerender } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));
      let output = lastFrame();

      // Should show more content in taller terminal
      expect(output).toContain('Rendered markdown content');

      // Resize to shorter terminal
      mockStdout.rows = 10;
      rerender(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));
      output = lastFrame();

      // Content should still be visible but potentially truncated
      expect(output).toContain('Bumblebee'); // Title still visible
      expect(output).toContain('sample.md'); // Status still visible
    });
  });

  describe('Keyboard Input Handling', () => {
    it('handles quit commands (q)', async () => {
      mockExit.mockClear();

      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Send 'q' key
      stdin.write('q');

      // Wait for input processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockExit).toHaveBeenCalled();
    });

    it('handles scrolling keys without crashing', async () => {
      const { stdin } = render(<App />);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Send scrolling keys - should not crash
      stdin.write('j'); // down
      stdin.write('k'); // up

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not have crashed - test passes if we reach here
      expect(true).toBe(true);
    });
  });
});
