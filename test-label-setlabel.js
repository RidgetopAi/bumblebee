#!/usr/bin/env node
/**
 * Test blessed setLabel() method
 * Run with: node test-label-setlabel.js
 */

import blessed from 'neo-blessed';

const screen = blessed.screen({
  smartCSR: true,
  title: 'SetLabel Test'
});

// Test using setLabel() method after creation
const box1 = blessed.box({
  top: 2,
  left: 2,
  width: 60,
  height: 5,
  content: 'Test: Using setLabel() method',
  border: { type: 'line', fg: 'yellow' },
  tags: true,
  style: {
    fg: 'white',
    bg: 'black'
  }
});

// Set label AFTER creation
box1.setLabel('┤ typescript ├');

// Test using label in constructor
const box2 = blessed.box({
  top: 9,
  left: 2,
  width: 60,
  height: 5,
  content: 'Test: Using label in constructor',
  label: '┤ javascript ├',
  border: { type: 'line', fg: 'yellow' },
  tags: true,
  style: {
    fg: 'white',
    bg: 'black'
  }
});

// Instructions box
const instructions = blessed.box({
  bottom: 1,
  left: 2,
  width: 60,
  height: 3,
  content: 'Press q or Ctrl-C to exit. Check if labels appear!',
  align: 'center',
  style: {
    fg: 'cyan',
    bold: true
  }
});

screen.append(box1);
screen.append(box2);
screen.append(instructions);

// Exit keys
screen.key(['q', 'C-c'], () => process.exit(0));

// Debug: Check if _label property exists (blessed internal)
console.log('Box 1 _label:', box1._label);
console.log('Box 2 _label:', box2._label);
console.log('Box 1 has setLabel?', typeof box1.setLabel);
console.log('Box 2 has setLabel?', typeof box2.setLabel);

screen.render();
