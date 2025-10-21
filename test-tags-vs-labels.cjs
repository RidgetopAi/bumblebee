// Test if tags: true interferes with label visibility
const blessed = require('neo-blessed');

const screen = blessed.screen({
  smartCSR: true,
  title: 'Tags vs Labels Test - Press q to exit'
});

// TEST 1: Widget with tags: false (like my working test)
const withoutTags = blessed.box({
  top: 2,
  left: 2,
  width: 50,
  height: 8,
  content: 'const x = 1;\nconst y = 2;',
  label: '┤ tags: false ├',
  border: { type: 'line', fg: 'yellow' },
  padding: { left: 1, right: 1 },
  tags: false  // NO TAG PARSING
});

// TEST 2: Widget with tags: true (like Bumblebee)
const withTags = blessed.box({
  top: 12,
  left: 2,
  width: 50,
  height: 8,
  content: '{magenta-fg}const{/magenta-fg} x = 1;\n{magenta-fg}const{/magenta-fg} y = 2;',
  label: '┤ tags: true ├',
  border: { type: 'line', fg: 'yellow' },
  padding: { left: 1, right: 1 },
  tags: true  // WITH TAG PARSING
});

// Instructions
const instructions = blessed.box({
  top: 22,
  left: 2,
  width: 70,
  height: 3,
  content: 'Can you see BOTH labels?\nTop: tags: false, Bottom: tags: true\nPress q to exit',
  style: { fg: 'cyan' }
});

screen.append(withoutTags);
screen.append(withTags);
screen.append(instructions);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();

console.error('[tags: false] Has _label:', withoutTags._label !== undefined);
console.error('[tags: true ] Has _label:', withTags._label !== undefined);
console.error('\nWhich labels can you see?');
