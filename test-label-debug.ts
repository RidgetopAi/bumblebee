#!/usr/bin/env node
import blessed from 'neo-blessed';
import { createCodeBlockWidget } from './dist/tui/components/codeBlock.js';

const screen = (blessed as any).screen();

console.log('\nTest 1: Widget with lang="typescript"');
const w1 = createCodeBlockWidget('code', 'typescript', 80);
console.log('  label value:', JSON.stringify(w1.label));
console.log('  label type:', typeof w1.label);

console.log('\nTest 2: Widget with lang=""');
const w2 = createCodeBlockWidget('code', '', 80);
console.log('  label value:', JSON.stringify(w2.label));
console.log('  label type:', typeof w2.label);

console.log('\nTest 3: Widget with lang="python"');
const w3 = createCodeBlockWidget('code', 'python', 80);
console.log('  label value:', JSON.stringify(w3.label));
console.log('  label type:', typeof w3.label);

screen.destroy();
