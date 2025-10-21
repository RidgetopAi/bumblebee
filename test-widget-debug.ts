#!/usr/bin/env node
/**
 * Test if widget creation works with the fixed import
 */

import blessed from 'neo-blessed';
import { createCodeBlockWidget } from './dist/tui/components/codeBlock.js';

// Create a screen first (required for widgets)
const screen = (blessed as any).screen({
  smartCSR: true,
  title: 'Widget Test'
});

console.log('Screen created successfully');

// Now try to create a widget
try {
  const widget = createCodeBlockWidget('const x = 42;\nconsole.log(x);', 'typescript', 80);
  console.log('Widget created successfully!');
  console.log('Widget type:', widget.type);
  console.log('Widget has content:', !!widget.content);
  console.log('Widget content length:', widget.content?.length || 0);
} catch (error) {
  console.error('ERROR creating widget:', error.message);
  console.error(error.stack);
}

screen.destroy();
console.log('Test complete');
