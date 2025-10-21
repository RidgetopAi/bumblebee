#!/usr/bin/env node
/**
 * Test full rendering pipeline with widgets
 */

import blessed from 'neo-blessed';
import { render } from './dist/render/mdastToAnsi.js';
import { getThemeForConfig } from './dist/config/theme-bumblebee.js';

const markdown = `# Test Code Blocks

Here's a TypeScript code block:

\`\`\`typescript
const testCases = [
  { name: 'TypeScript', code: 'const x: number = 42; console.log(x);' },
  { name: 'Python', code: 'x = 42\\nprint(x)' },
];
\`\`\`

And some text after the code block.
`;

// Create screen FIRST (required for widgets)
const screen = (blessed as any).screen({
  smartCSR: true,
  title: 'Test'
});

console.log('Screen created');

const theme = getThemeForConfig(false);
const width = 80;

try {
  console.log('Rendering with useBlessedTags = true...');
  const result = await render(markdown, width, theme, true);

  console.log('\nRender completed successfully!');
  console.log('Result type:', typeof result);

  if (typeof result === 'object') {
    console.log('\n✓ Got object with widgets (correct for TUI mode)');
    console.log('  - textContent length:', result.textContent.length);
    console.log('  - widgets count:', result.widgets.length);

    if (result.widgets.length > 0) {
      console.log('\n✓ Widgets array is populated!');
      for (let i = 0; i < result.widgets.length; i++) {
        const wp = result.widgets[i];
        console.log(`\n  Widget ${i}:`);
        console.log('    - startLine:', wp.startLine);
        console.log('    - lineCount:', wp.lineCount);
        console.log('    - widget.type:', wp.widget?.type);
        console.log('    - widget.border:', wp.widget?.border ? 'YES' : 'NO');
        console.log('    - widget.label:', wp.widget?.label || '(none)');
        console.log('    - widget content preview:', wp.widget?.content?.substring(0, 60) + '...');
      }
    } else {
      console.log('\n✗ ERROR: widgets array is empty!');
    }
  } else {
    console.log('\n✗ ERROR: Got string instead of object (wrong mode)');
  }

} catch (error) {
  console.error('\n✗ ERROR during render:', error.message);
  console.error(error.stack);
}

screen.destroy();
console.log('\n✓ Test complete');
