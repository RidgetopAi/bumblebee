// Simple test to verify widget labels work
import blessed from 'neo-blessed';

const screen = blessed.screen({
  smartCSR: true,
  title: 'Label Test',
  terminal: 'xterm-256color'
});

const box = blessed.box({
  top: 2,
  left: 2,
  width: 60,
  height: 8,
  content: 'function test() {\n  return true;\n}',
  label: '┤ typescript ├',
  border: {
    type: 'line',
    fg: 'yellow'
  },
  padding: {
    left: 1,
    right: 1
  },
  tags: true,
  style: {
    fg: 'white',
    bg: 'black'
  }
});

screen.append(box);

const infoBox = blessed.box({
  top: 12,
  left: 2,
  width: 60,
  height: 3,
  content: 'If you see "┤ typescript ├" on the border above, badges work!',
  border: {
    type: 'line',
    fg: 'green'
  },
  padding: {
    left: 1,
    right: 1
  },
  style: {
    fg: 'white'
  }
});

screen.append(infoBox);

screen.key(['escape', 'q', 'C-c'], function() {
  process.exit(0);
});

screen.render();

setTimeout(() => {
  process.exit(0);
}, 2000);
