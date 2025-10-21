import { bumblebeeTheme } from '../../config/theme-bumblebee.js';
import blessed from 'neo-blessed';

// Cast blessed to any to avoid TypeScript issues (neo-blessed has no types)
const blessedAny = blessed as any;

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
