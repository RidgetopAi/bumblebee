#!/usr/bin/env node
/**
 * Check if blessed actually renders labels visually
 */
import blessed from 'neo-blessed';

const screen = (blessed as any).screen({
  smartCSR: true
});

// Create box with label
const box = (blessed as any).box({
  top: 2,
  left: 2,
  width: 40,
  height: 5,
  content: 'Content here',
  label: '┤ TEST LABEL ├',
  border: {
    type: 'line',
    fg: 'yellow'
  }
});

screen.append(box);
screen.render();

console.log('Box label property:', box.label);
console.log('Box _label property:', box._label ? 'exists' : 'undefined');

// Take a "screenshot" by rendering to string
const output = screen.screenshot();
console.log('\n=== Visual Output ===');
console.log(output);

screen.destroy();
