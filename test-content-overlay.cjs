// Test if parent content overlays child widget labels
const blessed = require('neo-blessed');

const screen = blessed.screen({
  smartCSR: true,
  title: 'Content Overlay Test - Press q to exit'
});

// TEST 1: Container WITH content (like Bumblebee)
const containerWithContent = blessed.box({
  top: 1,
  left: 2,
  width: 50,
  height: 12,
  border: { type: 'line', fg: 'blue' },
  label: ' Container WITH content ',
  content: '\n\n\n\n\n\n\n\n\n\n',  // Blank lines like Bumblebee
  scrollable: true
});

const widgetInContentContainer = blessed.box({
  top: 2,
  left: 1,
  width: 40,
  height: 6,
  content: '// Inside content container\nconst x = 1;',
  label: '┤ WITH CONTENT ├',
  border: { type: 'line', fg: 'yellow' },
  padding: { left: 1, right: 1 }
});

// TEST 2: Container WITHOUT content
const containerEmpty = blessed.box({
  top: 1,
  left: 55,
  width: 50,
  height: 12,
  border: { type: 'line', fg: 'green' },
  label: ' Container EMPTY ',
  scrollable: true
  // NO content property
});

const widgetInEmptyContainer = blessed.box({
  top: 2,
  left: 1,
  width: 40,
  height: 6,
  content: '// Inside empty container\nconst y = 2;',
  label: '┤ EMPTY CONTAINER ├',
  border: { type: 'line', fg: 'yellow' },
  padding: { left: 1, right: 1 }
});

// Instructions
const instructions = blessed.box({
  top: 14,
  left: 2,
  width: 100,
  height: 3,
  content: 'Can you see BOTH labels? Left: WITH CONTENT, Right: EMPTY CONTAINER\nPress q to exit',
  style: { fg: 'cyan' }
});

screen.append(containerWithContent);
screen.append(containerEmpty);
containerWithContent.append(widgetInContentContainer);
containerEmpty.append(widgetInEmptyContainer);
screen.append(instructions);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();

console.error('[WITH CONTENT] Has _label:', widgetInContentContainer._label !== undefined);
console.error('[EMPTY] Has _label:', widgetInEmptyContainer._label !== undefined);
console.error('\nIf you can only see the RIGHT label, parent content overlays child labels!');
