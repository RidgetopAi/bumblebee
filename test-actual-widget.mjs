// Test using the ACTUAL Bumblebee createCodeBlockWidget function
import blessed from 'neo-blessed';
import { createCodeBlockWidget } from './dist/tui/components/codeBlock.js';

const screen = blessed.screen({
  smartCSR: true,
  title: 'Actual Bumblebee Widget Test - Press q to exit'
});

// Create preview pane exactly like Bumblebee does
const previewPane = blessed.box({
  top: 3,
  left: 0,
  width: '100%',
  height: screen.height - 6,
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  mouse: true,
  tags: true,
  style: {
    border: { fg: '#F2D638' },
    scrollbar: { bg: '#1EC4F2' }
  },
  border: { type: 'line' },
  label: ' Preview '
});

// Add some text content (like Bumblebee does)
previewPane.content = '# Test Document\n\n\n\n\n\n\n\n';

// Create widget using ACTUAL Bumblebee function
const widget1 = createCodeBlockWidget(
  'function test() {\n  return "hello";\n}',
  'typescript',
  70
);

const widget2 = createCodeBlockWidget(
  'const x = 42;',
  'javascript', 
  70
);

// Position and append exactly like Bumblebee does
widget1.top = 4;  // After some text
widget2.top = 14;

previewPane.append(widget1);
previewPane.append(widget2);
screen.append(previewPane);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();

console.error('[ACTUAL WIDGET 1] Has _label:', widget1._label !== undefined);
console.error('[ACTUAL WIDGET 2] Has _label:', widget2._label !== undefined);
console.error('\nUsing REAL Bumblebee createCodeBlockWidget()');
console.error('Can you see ┤ typescript ├ and ┤ javascript ├ labels?');
