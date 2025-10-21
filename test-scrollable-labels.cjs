// Test if scrollable parent affects child widget labels
const blessed = require('neo-blessed');

const screen = blessed.screen({
  smartCSR: true,
  title: 'Scrollable Parent Test - Press q to exit, arrows to scroll'
});

// Scrollable container (like Bumblebee's preview pane)
const scrollableContainer = blessed.box({
  top: 1,
  left: 2,
  width: 80,
  height: 20,
  border: { type: 'line', fg: 'blue' },
  label: ' Scrollable Container (like preview pane) ',
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  mouse: true,
  tags: true,
  content: '\n\nSome text before the widget\n\n\n\n\n\n\n\n\n\n',  // Text + blank lines for widget
  style: {
    border: { fg: 'blue' },
    scrollbar: { bg: 'cyan' }
  }
});

// Code widget at specific position (like Bumblebee does)
const codeWidget = blessed.box({
  top: 5,  // Positioned at line 5
  left: 2,
  width: 70,
  height: 8,
  content: 'function test() {\n  return "Can you see my label?";\n}',
  label: '┤ typescript ├',
  border: { type: 'line', fg: 'yellow' },
  padding: { left: 1, right: 1 },
  tags: true,
  style: { fg: 'white', bg: 'black' }
});

// Instructions
const instructions = blessed.box({
  top: 22,
  left: 2,
  width: 80,
  height: 3,
  content: 'Can you see the ┤ typescript ├ label on the yellow box?\nUse arrow keys to scroll. Press q to exit.',
  style: { fg: 'cyan' }
});

screen.append(scrollableContainer);
scrollableContainer.append(codeWidget);
screen.append(instructions);

// Enable scrolling with arrow keys
screen.key(['up'], function() {
  scrollableContainer.scroll(-1);
  screen.render();
});

screen.key(['down'], function() {
  scrollableContainer.scroll(1);
  screen.render();
});

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();

console.error('[CHECK] Widget has _label:', codeWidget._label !== undefined);
console.error('[CHECK] Scroll position:', scrollableContainer.getScrollHeight());
console.error('\nCan you see the typescript label? Use arrows to scroll if needed.');
