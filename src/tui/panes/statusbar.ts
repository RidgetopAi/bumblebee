import { bumblebeeTheme } from '../../config/theme-bumblebee.js';

// Cast blessed to any to avoid TypeScript issues (neo-blessed has no types)
const blessedAny = (await import('neo-blessed')).default as any;

export function createStatusBar(fileOrDir: string): any {
  return blessedAny.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: ` ${fileOrDir} `,
    style: {
      bg: bumblebeeTheme.current.nearBlack,
      fg: bumblebeeTheme.current.yellowB,
      border: {
        fg: bumblebeeTheme.current.yellowB,
      },
    },
    border: {
      type: 'line',
    },
  });
}
