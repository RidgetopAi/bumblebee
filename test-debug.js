#!/usr/bin/env node

import blessed from 'neo-blessed';

const screen = blessed.screen({
  smartCSR: true,
  title: 'Debug Test'
});

// Create a box with keys: false
const box = blessed.box({
  top: 0,
  left: 0,
  width: 30,
  height: 20,
  scrollable: true,
  alwaysScroll: true,
  keys: false,
  border: { type: 'line' },
  content: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10\nLine 11\nLine 12\nLine 13\nLine 14\nLine 15\nLine 16\nLine 17\nLine 18\nLine 19\nLine 20'
});

screen.append(box);

console.log('Initial state:', { childBase: box.childBase, childOffset: box.childOffset });

screen.key('j', () => {
  console.log('j pressed - BEFORE:', { childBase: box.childBase, childOffset: box.childOffset });
  // Don't reset - just update content
  box.content = 'Updated\n' + box.content;
  console.log('j pressed - AFTER:', { childBase: box.childBase, childOffset: box.childOffset });
  screen.render();
});

screen.key('r', () => {
  console.log('r pressed - resetting scroll');
  box.childBase = 0;
  box.childOffset = 0;
  screen.render();
  console.log('After reset:', { childBase: box.childBase, childOffset: box.childOffset });
});

screen.key('q', () => process.exit(0));

screen.render();
