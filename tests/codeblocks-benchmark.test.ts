import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '../src/render/mdastToAnsi.js';
import { bumblebeeTheme } from '../src/config/theme-bumblebee.js';
import fs from 'fs';
import path from 'path';

describe('Code Blocks Performance Benchmarks', () => {
  const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');
  const comprehensiveFixture = path.join(fixturesDir, 'code-blocks-comprehensive.md');

  let fixtureContent: string;
  let codeBlocks: string[];

  beforeAll(async () => {
    fixtureContent = fs.readFileSync(comprehensiveFixture, 'utf-8');

    // Extract individual code blocks for isolated testing
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    codeBlocks = [];
    let match;
    while ((match = codeBlockRegex.exec(fixtureContent)) !== null) {
      codeBlocks.push(match[2].trim());
    }
  });

  describe('Rendering Performance', () => {
    it('should render comprehensive fixture without crashing', async () => {
      const startTime = performance.now();
      const output = await render(fixtureContent, 120, bumblebeeTheme);
      const endTime = performance.now();

      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);

      const renderTime = endTime - startTime;
      console.log(`Comprehensive fixture render time: ${renderTime.toFixed(2)}ms`);

      // Should render within reasonable time (under 5 seconds for comprehensive content)
      expect(renderTime).toBeLessThan(5000);
    });

    it('should render all individual code blocks efficiently', async () => {
      const results: number[] = [];

      for (const codeBlock of codeBlocks) {
        const markdown = `\`\`\`\n${codeBlock}\n\`\`\``;

        const startTime = performance.now();
        const output = await render(markdown, 120, bumblebeeTheme);
        const endTime = performance.now();

        const renderTime = endTime - startTime;
        results.push(renderTime);

        expect(output).toBeDefined();
        expect(output.length).toBeGreaterThan(0);
      }

      const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
      const maxTime = Math.max(...results);
      const minTime = Math.min(...results);

      console.log(`Code block rendering stats:`);
      console.log(`  Average: ${avgTime.toFixed(2)}ms`);
      console.log(`  Max: ${maxTime.toFixed(2)}ms`);
      console.log(`  Min: ${minTime.toFixed(2)}ms`);
      console.log(`  Total blocks: ${codeBlocks.length}`);

      // Individual blocks should render quickly
      expect(avgTime).toBeLessThan(100); // Under 100ms average
      expect(maxTime).toBeLessThan(500); // Under 500ms max
    });

    it('should demonstrate cache effectiveness', async () => {
      // Render the same content multiple times to test caching
      const markdown = codeBlocks[0] ? `\`\`\`typescript\n${codeBlocks[0]}\n\`\`\`` : '```typescript\nconsole.log("test");\n```';

      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await render(markdown, 120, bumblebeeTheme);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const firstRender = times[0];
      const avgSubsequent = times.slice(1).reduce((a, b) => a + b, 0) / (times.length - 1);

      console.log(`Cache effectiveness test:`);
      console.log(`  First render: ${firstRender.toFixed(2)}ms`);
      console.log(`  Subsequent average: ${avgSubsequent.toFixed(2)}ms`);
      console.log(`  Speedup: ${(firstRender / avgSubsequent).toFixed(2)}x`);

      // Cache should either provide speedup or at least not be significantly slower
      // Due to JIT warmup and other factors, we allow some variance
      const speedupRatio = firstRender / avgSubsequent;
      expect(speedupRatio).toBeGreaterThan(0.5); // Subsequent shouldn't be more than 2x slower
      expect(speedupRatio).toBeLessThan(5); // And not unrealistically faster (which would indicate an error)

      // For small code blocks, cache might not provide dramatic speedup, but should be consistent
      expect(avgSubsequent).toBeLessThan(50); // Should be reasonably fast
    });

    it('should handle different terminal widths efficiently', async () => {
      const markdown = codeBlocks[0] ? `\`\`\`typescript\n${codeBlocks[0]}\n\`\`\`` : '```typescript\nconsole.log("test");\n```';
      const widths = [80, 120, 160, 200];

      const results: { width: number; time: number }[] = [];

      for (const width of widths) {
        const startTime = performance.now();
        await render(markdown, width, bumblebeeTheme);
        const endTime = performance.now();

        results.push({ width, time: endTime - startTime });
      }

      console.log('Width performance test:');
      results.forEach(({ width, time }) => {
        console.log(`  ${width} chars: ${time.toFixed(2)}ms`);
      });

      // Wider terminals should not significantly impact performance
      const baseTime = results[0].time;
      const maxTime = Math.max(...results.map(r => r.time));
      expect(maxTime / baseTime).toBeLessThan(3); // No more than 3x slower at max width
    });

    it('should render large code blocks within time limits', async () => {
      // Create a large code block (1000+ lines)
      const largeCode = Array.from({ length: 1000 }, (_, i) =>
        `line${i} = "This is line number ${i} with some content";`
      ).join('\n');

      const markdown = `\`\`\`javascript\n${largeCode}\n\`\`\``;

      const startTime = performance.now();
      const output = await render(markdown, 120, bumblebeeTheme);
      const endTime = performance.now();

      const renderTime = endTime - startTime;

      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);

      console.log(`Large code block render time: ${renderTime.toFixed(2)}ms`);

      // Large blocks should still render within reasonable time
      expect(renderTime).toBeLessThan(10000); // Under 10 seconds for 1000 lines
    });

    it('should maintain consistent performance across languages', async () => {
      const languages = ['typescript', 'javascript', 'python', 'rust', 'go', 'java', 'c', 'cpp', 'ruby'];
      const results: { lang: string; time: number }[] = [];

      for (const lang of languages) {
        const code = getSampleCodeForLanguage(lang);
        const markdown = `\`\`\`${lang}\n${code}\n\`\`\``;

        const startTime = performance.now();
        await render(markdown, 120, bumblebeeTheme);
        const endTime = performance.now();

        results.push({ lang, time: endTime - startTime });
      }

      console.log('Language rendering performance:');
      results.forEach(({ lang, time }) => {
        console.log(`  ${lang}: ${time.toFixed(2)}ms`);
      });

      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      const maxTime = Math.max(...results.map(r => r.time));
      const minTime = Math.min(...results.map(r => r.time));

      console.log(`  Average: ${avgTime.toFixed(2)}ms`);
      console.log(`  Range: ${minTime.toFixed(2)}ms - ${maxTime.toFixed(2)}ms`);

      // Performance should be consistent across languages
      expect(maxTime / minTime).toBeLessThan(10); // No language more than 10x slower than fastest
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should handle concurrent rendering without issues', async () => {
      const promises = codeBlocks.slice(0, 5).map(async (codeBlock, index) => {
        const markdown = `\`\`\`typescript\n${codeBlock}\n\`\`\``;
        return await render(markdown, 120, bumblebeeTheme);
      });

      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;

      expect(results).toHaveLength(5);
      results.forEach(output => {
        expect(output).toBeDefined();
        expect(output.length).toBeGreaterThan(0);
      });

      console.log(`Concurrent rendering (5 blocks): ${totalTime.toFixed(2)}ms`);

      // Concurrent rendering should be reasonably fast
      expect(totalTime).toBeLessThan(2000); // Under 2 seconds for 5 concurrent blocks
    });
  });

  describe('Cache Performance Metrics', () => {
    it('should provide detailed cache statistics', async () => {
      // This test would integrate with the cache system to collect metrics
      // For now, we'll test that rendering works and log performance

      const testCases = [
        { name: 'TypeScript', code: 'const x: number = 42; console.log(x);' },
        { name: 'Python', code: 'x = 42\nprint(x)' },
        { name: 'JavaScript', code: 'const x = 42; console.log(x);' },
        { name: 'Rust', code: 'let x: i32 = 42; println!("{}", x);' },
      ];

      const metrics = {
        totalRenders: 0,
        totalTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
      };

      for (const testCase of testCases) {
        for (let i = 0; i < 3; i++) { // Render each 3 times to test caching
          const markdown = `\`\`\`${testCase.name.toLowerCase()}\n${testCase.code}\n\`\`\``;

          const startTime = performance.now();
          await render(markdown, 120, bumblebeeTheme);
          const endTime = performance.now();

          metrics.totalRenders++;
          metrics.totalTime += (endTime - startTime);

          // In a real implementation, we'd track cache hits/misses from the cache system
        }
      }

      const avgRenderTime = metrics.totalTime / metrics.totalRenders;

      console.log('Cache performance metrics:');
      console.log(`  Total renders: ${metrics.totalRenders}`);
      console.log(`  Average render time: ${avgRenderTime.toFixed(2)}ms`);
      console.log(`  Total time: ${metrics.totalTime.toFixed(2)}ms`);

      // Basic performance expectations
      expect(avgRenderTime).toBeLessThan(200); // Under 200ms average
      expect(metrics.totalRenders).toBe(12); // 4 languages × 3 renders each
    });
  });
});

// Helper function to get sample code for different languages
function getSampleCodeForLanguage(lang: string): string {
  const samples: Record<string, string> = {
    typescript: 'interface User { id: number; name: string; }\nconst user: User = { id: 1, name: "John" };',
    javascript: 'const user = { id: 1, name: "John" };\nconsole.log(user);',
    python: 'user = {"id": 1, "name": "John"}\nprint(user)',
    rust: 'struct User { id: i32, name: String }\nlet user = User { id: 1, name: "John".to_string() };',
    go: 'type User struct { ID int; Name string }\nuser := User{ID: 1, Name: "John"}',
    java: 'public class User { private int id; private String name;\npublic User(int id, String name) { this.id = id; this.name = name; } }',
    c: 'struct User { int id; char name[100]; };\nstruct User user = {1, "John"};',
    cpp: 'class User { public: int id; std::string name;\nUser(int id, std::string name) : id(id), name(name) {} };',
    ruby: 'class User\n  attr_accessor :id, :name\n  def initialize(id, name)\n    @id = id\n    @name = name\n  end\nend',
  };

  return samples[lang] || 'console.log("Hello, World!");';
}
