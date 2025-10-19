# Complex Markdown Test

This file combines all supported markdown elements to test the renderer comprehensively.

## Headings and Paragraphs

### Subheading

This is a paragraph with **bold text**, *italic text*, and `inline code`. It also contains a [link](https://example.com) to test link rendering.

## Lists

### Unordered List

- Item 1 with **bold**
- Item 2 with *italic*
- Item 3 with `code`
- Nested item
  - Sub item 1
  - Sub item 2

### Ordered List

1. First item
2. Second item with **formatting**
3. Third item
   1. Nested numbered item
   2. Another nested item

## Blockquotes

> This is a blockquote.
> It can span multiple lines.
>
> > Nested blockquote
> > With multiple paragraphs.

## Code Blocks

Here's a TypeScript function:

```typescript
interface Theme {
  current: {
    yellow: string;
    cyan: string;
    gray: string;
  };
}

function renderComplex(markdown: string): string {
  // This function demonstrates complex markdown rendering
  const result = parseAndRender(markdown);
  return result;
}
```

## Tables

| Component | Status | Notes |
|-----------|--------|-------|
| Parser | ✅ Complete | Uses remark-parse |
| Renderer | ✅ Complete | MDAST to ANSI |
| CLI | ✅ Complete | Commander integration |

## Mixed Content

Here's a paragraph that contains **bold**, *italic*, `code`, and a [link](https://github.com).

> Blockquote with **bold** and *italic* text.

- List item with `inline code`
- Another item with [link](https://example.com)

### Final Heading

This concludes the complex test fixture with various combinations of markdown elements.
