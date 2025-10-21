// Verify that node.lang is being extracted correctly
import { parseMd } from './dist/parser/mdToAst.js';

const markdown = '```typescript\nconst x = 1;\n```';
const ast = parseMd(markdown);

console.log('AST children:', ast.children.length);
console.log('First child type:', ast.children[0].type);
console.log('Code block lang:', ast.children[0].lang);
console.log('Code block value:', ast.children[0].value);
