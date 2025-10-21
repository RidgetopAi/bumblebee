// Test if labels work on nested widgets
const blessed = require('neo-blessed');

const screen = blessed.screen({
  smartCSR: true,
  title: 'Nested Label Test'
});

// Create a preview pane (parent container)
const previewPane = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border: {
    type: 'line',
    fg: 'blue'
  },
  label: ' Preview Pane ',
  scrollable: true
});

// Create a code block widget WITH label
const codeBlock = blessed.box({
  top: 2,
  left: 2,
  width: 60,
  height: 8,
  content: 'function test() {\n  return true;\n}',
  label: '┤ typescript ├',  // THIS IS THE BADGE WE WANT TO SEE
  border: {
    type: 'line',
    fg: 'yellow'
  },
  padding: {
    left: 1,
    right: 1
  },
  style: {
    fg: 'white',
    bg: 'black'
  }
});

screen.append(previewPane);

// TRY 1: Append to preview pane (nested) - Does label show?
console.error('[TEST] Appending code block to preview pane (nested)...');
previewPane.append(codeBlock);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();

// Check if label exists
console.error(`[CHECK] codeBlock has _label: ${codeBlock._label !== undefined}`);
if (codeBlock._label) {
  console.error(`[CHECK] _label content: "${codeBlock._label.content}"`);
  console.error(`[CHECK] _label parent: ${codeBlock._label.parent === codeBlock}`);
}
