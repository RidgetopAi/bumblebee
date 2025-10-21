// Test if widget.top positioning clips labels
const blessed = require('neo-blessed');

const screen = blessed.screen({
  smartCSR: true,
  title: 'Widget Positioning Test - Press q to exit'
});

// Scrollable container (like preview pane)
const container = blessed.box({
  top: 1,
  left: 2,
  width: 80,
  height: 25,
  border: { type: 'line', fg: 'blue' },
  label: ' Container (preview pane) ',
  scrollable: true,
  tags: true
});

// Widget positioned at top: 0 (label would be at -1, clipped!)
const widget1 = blessed.box({
  top: 0,  // <-- PROBLEM: Label renders at -1, outside container!
  left: 2,
  width: 70,
  height: 8,
  content: 'const x = 1;\n// Widget at top: 0',
  label: '┤ top: 0 (clipped?) ├',
  border: { type: 'line', fg: 'yellow' },
  padding: { left: 1, right: 1 },
  tags: true
});

// Widget positioned at top: 2 (label at 1, should be visible)
const widget2 = blessed.box({
  top: 10,  // <-- Label at 9, inside container
  left: 2,
  width: 70,
  height: 8,
  content: 'const y = 2;\n// Widget at top: 10',
  label: '┤ top: 10 (visible?) ├',
  border: { type: 'line', fg: 'yellow' },
  padding: { left: 1, right: 1 },
  tags: true
});

container.append(widget1);
container.append(widget2);
screen.append(container);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();

console.error('[top: 0 ] Has _label:', widget1._label !== undefined);
console.error('[top: 10] Has _label:', widget2._label !== undefined);
console.error('\nCan you see the top widget label? Or only the second one?');
console.error('If only second label is visible, positioning at top:0 clips labels!');
