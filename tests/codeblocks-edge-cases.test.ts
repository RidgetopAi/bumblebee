import { describe, it, expect } from 'vitest';
import { render } from '../src/render/mdastToAnsi.js';
import { bumblebeeTheme } from '../src/config/theme-bumblebee.js';

describe('Code Blocks Edge Cases', () => {
  describe('Empty and Boundary Cases', () => {
    it('should handle empty code blocks', async () => {
      const markdown = '```\n```';
      const output = await render(markdown, 80, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });

    it('should handle single character code blocks', async () => {
      const markdown = '```\na\n```';
      const output = await render(markdown, 80, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });

    it('should handle very long single lines', async () => {
      const longLine = 'x'.repeat(1000);
      const markdown = `\`\`\`\n${longLine}\n\`\`\``;
      const output = await render(markdown, 80, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
      // Should wrap the long line
      expect(output.split('\n').length).toBeGreaterThan(1);
    });

    it('should handle code blocks with only whitespace', async () => {
      const markdown = '```\n   \n\t\n\n```';
      const output = await render(markdown, 80, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Special Characters and Unicode', () => {
    it('should handle Unicode characters', async () => {
      const unicodeCode = 'const greeting = "Hello, 世界 🌍";\nconsole.log(greeting);';
      const markdown = `\`\`\`javascript\n${unicodeCode}\n\`\`\``;
      const output = await render(markdown, 80, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });

    it('should handle emojis in code', async () => {
      const emojiCode = 'const mood = "😀 happy";\nconst status = "🚀 launched";';
      const markdown = `\`\`\`javascript\n${emojiCode}\n\`\`\``;
      const output = await render(markdown, 80, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });

    it('should handle control characters', async () => {
      const controlCode = 'const str = "line1\\nline2\\t\\ttabbed";';
      const markdown = `\`\`\`javascript\n${controlCode}\n\`\`\``;
      const output = await render(markdown, 80, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });

    it('should handle ANSI escape sequences in code', async () => {
      const ansiCode = 'const colored = "\\x1b[31mRed text\\x1b[0m";';
      const markdown = `\`\`\`javascript\n${ansiCode}\n\`\`\``;
      const output = await render(markdown, 80, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Language Detection Edge Cases', () => {
    it('should handle unknown languages gracefully', async () => {
      const markdown = '```unknownlang\nconsole.log("test");\n```';
      const output = await render(markdown, 80, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
      // Should still render with borders but without syntax highlighting
    });

    it('should handle case variations in language names', async () => {
      const testCases = [
        '```JavaScript\nconsole.log("test");\n```',
        '```JAVASCRIPT\nconsole.log("test");\n```',
        '```js\nconsole.log("test");\n```',
      ];

      for (const markdown of testCases) {
        const output = await render(markdown, 80, bumblebeeTheme);
        expect(output).toBeDefined();
        expect(output.length).toBeGreaterThan(0);
      }
    });

    it('should handle ambiguous code patterns', async () => {
      // Code that could be multiple languages
      const ambiguousCode = 'function test() { return true; }';
      const markdown = `\`\`\`\n${ambiguousCode}\n\`\`\``;
      const output = await render(markdown, 80, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Very Large Content', () => {
    it('should handle 1000+ line code blocks', async () => {
      const largeCode = Array.from({ length: 1000 }, (_, i) =>
        `function line${i}() { return ${i}; }`
      ).join('\n');

      const markdown = `\`\`\`javascript\n${largeCode}\n\`\`\``;

      const startTime = performance.now();
      const output = await render(markdown, 120, bumblebeeTheme);
      const endTime = performance.now();

      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);

      const renderTime = endTime - startTime;
      console.log(`1000-line code block render time: ${renderTime.toFixed(2)}ms`);

      // Should complete within reasonable time
      expect(renderTime).toBeLessThan(15000); // Under 15 seconds
    });

    it('should handle wide code blocks', async () => {
      const wideLine = 'const veryLongVariableNameThatGoesOnAndOn = "This is a very long string literal that should definitely wrap when rendered in a terminal with reasonable width";';
      const markdown = `\`\`\`javascript\n${wideLine}\n\`\`\``;

      const output = await render(markdown, 80, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
      // Should wrap appropriately
      expect(output.split('\n').length).toBeGreaterThan(2); // At least header, wrapped content, footer
    });

    it('should handle mixed content with large code blocks', async () => {
      const largeCode = Array.from({ length: 500 }, (_, i) =>
        `line${i}: console.log("Line ${i}");`
      ).join('\n');

      const markdown = `# Document with Large Code Block

This is regular markdown content.

\`\`\`javascript
${largeCode}
\`\`\`

More regular content after the code block.`;

      const output = await render(markdown, 120, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Concurrent Rendering', () => {
    it('should handle multiple large code blocks concurrently', async () => {
      const createLargeBlock = (lang: string, lines: number) => {
        const code = Array.from({ length: lines }, (_, i) =>
          `// ${lang} line ${i}`
        ).join('\n');
        return `\`\`\`${lang}\n${code}\n\`\`\``;
      };

      const blocks = [
        createLargeBlock('typescript', 200),
        createLargeBlock('javascript', 200),
        createLargeBlock('python', 200),
        createLargeBlock('rust', 200),
        createLargeBlock('go', 200),
      ];

      const startTime = performance.now();
      const promises = blocks.map(block => render(block, 120, bumblebeeTheme));
      const results = await Promise.all(promises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;

      expect(results).toHaveLength(5);
      results.forEach(output => {
        expect(output).toBeDefined();
        expect(output.length).toBeGreaterThan(0);
      });

      console.log(`Concurrent large blocks render time: ${totalTime.toFixed(2)}ms`);

      // Should complete within reasonable time for concurrent rendering
      expect(totalTime).toBeLessThan(10000); // Under 10 seconds for 5 concurrent 200-line blocks
    });

    it('should handle mixed language concurrent rendering', async () => {
      const languages = ['typescript', 'javascript', 'python', 'rust', 'go', 'java', 'c', 'cpp', 'ruby'];
      const blocks = languages.map(lang => {
        const code = `// Sample ${lang} code\nfunction test() { return true; }`;
        return `\`\`\`${lang}\n${code}\n\`\`\``;
      });

      const startTime = performance.now();
      const promises = blocks.map(block => render(block, 120, bumblebeeTheme));
      const results = await Promise.all(promises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;

      expect(results).toHaveLength(languages.length);
      results.forEach(output => {
        expect(output).toBeDefined();
        expect(output.length).toBeGreaterThan(0);
      });

      console.log(`Mixed language concurrent render time: ${totalTime.toFixed(2)}ms`);

      // Should be efficient for mixed language rendering
      expect(totalTime).toBeLessThan(3000); // Under 3 seconds for 9 concurrent blocks
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle malformed code blocks gracefully', async () => {
      const malformedBlocks = [
        '```\nUnclosed code block',
        '```javascript\nCode without closing',
        '```\n```\n```\nExtra backticks',
      ];

      for (const markdown of malformedBlocks) {
        const output = await render(markdown, 80, bumblebeeTheme);
        expect(output).toBeDefined();
        // Should not crash even with malformed input
      }
    });

    it('should handle extreme nesting scenarios', async () => {
      // Code block containing markdown-like syntax
      const nestedCode = `\`\`\`markdown
# This is markdown inside a code block

\`\`\`javascript
// This is JavaScript inside markdown inside a code block
function nested() {
  return "very nested";
}
\`\`\`

Back to markdown in the code block.
\`\`\``;

      const markdown = `\`\`\`markdown\n${nestedCode}\n\`\`\``;
      const output = await render(markdown, 120, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });

    it('should handle memory-intensive operations gracefully', async () => {
      // Create extremely wide content that might cause memory issues
      const wideContent = Array.from({ length: 100 }, (_, i) =>
        'x'.repeat(1000) + ` // Line ${i}`
      ).join('\n');

      const markdown = `\`\`\`javascript\n${wideContent}\n\`\`\``;

      const output = await render(markdown, 80, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);

      // Should handle wrapping of extremely wide content
      const lines = output.split('\n');
      expect(lines.length).toBeGreaterThan(100); // Should wrap extensively
    });
  });

  describe('Theme and Styling Edge Cases', () => {
    it('should handle code blocks with theme color conflicts', async () => {
      // Code that might conflict with theme colors
      const colorConflictCode = `
const colors = {
  yellow: "#F2D638",
  cyan: "#1EC4F2",
  black: "#010600"
};
console.log(colors);
      `.trim();

      const markdown = `\`\`\`javascript\n${colorConflictCode}\n\`\`\``;
      const output = await render(markdown, 80, bumblebeeTheme);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });

    it('should render consistently across different widths', async () => {
      const code = 'const veryLongFunctionNameThatShouldWrapAppropriately = () => { return "test"; };';
      const markdown = `\`\`\`javascript\n${code}\n\`\`\``;

      const widths = [40, 60, 80, 120, 160];

      for (const width of widths) {
        const output = await render(markdown, width, bumblebeeTheme);
        expect(output).toBeDefined();
        expect(output.length).toBeGreaterThan(0);

        // Should always have borders and content
        expect(output).toContain('│'); // Side borders
      }
    });
  });
});
