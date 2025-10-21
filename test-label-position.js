#!/usr/bin/env node
/**
 * Test blessed label positioning and visibility
 * Run with: node test-label-position.js
 */

import blessed from 'neo-blessed';

const screen = blessed.screen({
  smartCSR: true,
  title: 'Label Position Test'
});

// Test 1: Default label (should appear at top-left of border)
const box1 = blessed.box({
  top: 2,
  left: 2,
  width: 60,
  height: 5,
  content: 'Test 1: Default label position',
  label: '┤ typescript ├',
  border: { type: 'line', fg: 'yellow' },
  tags: true,
  style: {
    fg: 'white',
    bg: 'black'
  }
});

// Test 2: Label with custom style
const box2 = blessed.box({
  top: 9,
  left: 2,
  width: 60,
  height: 5,
  content: 'Test 2: Label with custom style',
  label: ' TYPESCRIPT ',
  border: { type: 'line', fg: 'yellow' },
  tags: true,
  style: {
    fg: 'white',
    bg: 'black',
    label: {
      fg: 'black',
      bg: 'yellow',
      bold: true
    }
  }
});

// Test 3: Simple label without decorative brackets
const box3 = blessed.box({
  top: 16,
  left: 2,
  width: 60,
  height: 5,
  content: 'Test 3: Simple label text',
  label: 'javascript',
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
  content: 'Press q or Ctrl-C to exit',
  align: 'center',
  style: {
    fg: 'cyan',
    bold: true
  }
});

screen.append(box1);
screen.append(box2);
screen.append(box3);
screen.append(instructions);

// Exit keys
screen.key(['q', 'C-c'], () => process.exit(0));

// Debug: Log widget properties after creation
console.log('Box 1 label:', box1.label);
console.log('Box 2 label:', box2.label);
console.log('Box 3 label:', box3.label);

screen.render();
