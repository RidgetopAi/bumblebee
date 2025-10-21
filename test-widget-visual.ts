#!/usr/bin/env node
/**
 * Visual test to see if code block widgets render correctly
 */

import blessed from 'neo-blessed';
import { createCodeBlockWidget } from './dist/tui/components/codeBlock.js';

const blessedAny = blessed as any;

// Create screen
const screen = blessedAny.screen({
  smartCSR: true,
  title: 'Code Block Widget Test',
  fullUnicode: true
});

// Create container box
const container = blessedAny.box({
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  scrollable: true,
  tags: true,
  content: 'Test text above the widget\n\nMore text here\n\n',
  style: {
    border: {
      fg: 'yellow'
    }
  },
  border: {
    type: 'line'
  }
});

screen.append(container);

// Create code block widget
const codeWidget = createCodeBlockWidget(
  'const x: number = 42;\nconsole.log(x);',
  'typescript',
  70
);

// Position it
codeWidget.top = 4; // After the text content
codeWidget.left = 2;

// Append to container
container.append(codeWidget);

// Add text after widget
const afterText = blessedAny.text({
  top: 10,
  left: 2,
  content: 'Text after the widget'
});

container.append(afterText);

// Render
screen.render();

// Quit on 'q' or Ctrl+C
screen.key(['q', 'C-c'], function() {
  screen.destroy();
  process.exit(0);
});

// Keep alive
console.log('Widget test running. Press "q" to quit.');
