import { bumblebeeTheme } from '../../config/theme-bumblebee.js';
import blessed from 'neo-blessed';
// Cast blessed to any to avoid TypeScript issues (neo-blessed has no types)
const blessedAny = blessed;
export function createTitleBar() {
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
            border: {
                fg: bumblebeeTheme.current.yellowA, // Normal border color
            },
        },
        border: {
            type: 'line',
        },
    });
}
