import { bumblebeeTheme } from '../../config/theme-bumblebee.js';

// Cast blessed to any to avoid TypeScript issues (neo-blessed has no types)
const blessedAny = (await import('neo-blessed')).default as any;

export function createPreview(): any {
  return blessedAny.box({
    top: 3,
    left: 0,
    width: '100%',
    height: '100%-6',
    content: '', // Empty for Phase 0
    scrollable: true,
    alwaysScroll: true,
    mouse: true,
    keys: true,
    tags: true,
    style: {
      border: {
        fg: bumblebeeTheme.current.yellowA, // Normal border color
      },
    },
    border: {
      type: 'line',
    },
  });
}
