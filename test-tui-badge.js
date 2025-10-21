// Quick test to verify blessed label rendering
import blessed from 'neo-blessed';

const screen = blessed.screen({
  smartCSR: true,
  title: 'Badge Test'
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
  tags: false,
  style: {
    fg: 'white',
    bg: 'black'
  }
});

screen.append(box);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();
