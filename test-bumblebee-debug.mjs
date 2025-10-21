// Debug script to test widget creation
import { createCodeBlockWidget } from './dist/tui/components/codeBlock.js';

const code = 'function test() {\n  return true;\n}';
const lang = 'typescript';
const width = 80;

console.log('Creating widget with:');
console.log('- Code:', code.substring(0, 20) + '...');
console.log('- Lang:', lang);
console.log('- Width:', width);

const widget = createCodeBlockWidget(code, lang, width);

console.log('\nWidget properties:');
console.log('- Has label:', widget.label !== undefined);
console.log('- Label value:', widget.label);
console.log('- Border color:', widget.border.fg);
console.log('- Width:', widget.width);

