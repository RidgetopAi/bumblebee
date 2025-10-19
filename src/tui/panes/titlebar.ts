import { bumblebeeTheme } from '../../config/theme-bumblebee.js';

// Cast blessed to any to avoid TypeScript issues (neo-blessed has no types)
const blessedAny = (await import('neo-blessed')).default as any;

export function createTitleBar(): any {
  return blessedAny.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: '{center}Bumblebee{/center}',
    tags: true,
    style: {
      bg: bumblebeeTheme.current.nearBlack,
      fg: bumblebeeTheme.current.yellowB,
    },
  });
}
