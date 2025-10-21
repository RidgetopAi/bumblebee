// Compare direct vs nested label visibility
const blessed = require('neo-blessed');

const screen = blessed.screen({
  smartCSR: true,
  title: 'Direct vs Nested Label Test - Press q to exit'
});

// DIRECT: Box appended directly to screen
const directBox = blessed.box({
  top: 1,
  left: 2,
  width: 40,
  height: 6,
  content: '// Direct to screen\nconst x = 1;',
  label: '┤ DIRECT ├',
  border: { type: 'line', fg: 'yellow' },
  padding: { left: 1, right: 1 }
});

// NESTED: Parent container
const container = blessed.box({
  top: 10,
  left: 2,
  width: 80,
  height: 15,
  border: { type: 'line', fg: 'blue' },
  label: ' Container ',
  scrollable: true
});

// NESTED: Box appended to container (like Bumblebee)
const nestedBox = blessed.box({
  top: 1,
  left: 1,
  width: 40,
  height: 6,
  content: '// Nested in container\nconst y = 2;',
  label: '┤ NESTED ├',
  border: { type: 'line', fg: 'yellow' },
  padding: { left: 1, right: 1 }
});

// Append in order
screen.append(directBox);
screen.append(container);
container.append(nestedBox);

// Instructions
const instructions = blessed.box({
  top: 0,
  left: 50,
  width: 40,
  height: 3,
  content: 'Can you see BOTH labels?\nDIRECT and NESTED?',
  style: { fg: 'cyan' }
});
screen.append(instructions);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();

// Debug output
console.error('[DIRECT] Has _label:', directBox._label !== undefined);
console.error('[NESTED] Has _label:', nestedBox._label !== undefined);
console.error('\nPress q to exit');
