#!/usr/bin/env node
/**
 * Diagnostic test to trace widget rendering
 */

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

And some text after.
`;

const theme = getThemeForConfig(false);
const width = 80;

console.log('=== TESTING WIDGET MODE (useBlessedTags = true) ===\n');

const result = await render(markdown, width, theme, true);

console.log('Result type:', typeof result);

if (typeof result === 'object') {
  console.log('\nResult structure:');
  console.log('- textContent length:', result.textContent.length);
  console.log('- widgets array length:', result.widgets.length);

  console.log('\nText content preview (first 200 chars):');
  console.log(JSON.stringify(result.textContent.substring(0, 200)));

  console.log('\nWidgets array:');
  for (let i = 0; i < result.widgets.length; i++) {
    const wp = result.widgets[i];
    console.log(`  Widget ${i}:`, {
      startLine: wp.startLine,
      lineCount: wp.lineCount,
      widgetType: wp.widget?.type || 'unknown',
      widgetHeight: wp.widget?.height,
      widgetContent: wp.widget?.content?.substring(0, 50) + '...'
    });
  }
} else {
  console.log('ERROR: Result is a string, not an object!');
  console.log('String preview:', result.substring(0, 200));
}
