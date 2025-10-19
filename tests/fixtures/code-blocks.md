# Code Blocks Test Fixtures

This file tests fenced code blocks rendering.

## Fenced Code Block with Language

```typescript
function render(markdown: string, width: number, theme: Theme): string {
  const ast = parseMd(markdown);
  return renderMdast(ast, width, theme);
}
```

## Fenced Code Block without Language

```
This is a code block without language specification.
It should render as plain text.
```

## Inline Code

This is `inline code` within a paragraph. It should be rendered differently from regular text.

## Multiple Code Blocks

```javascript
console.log("Hello World");
```

```python
def hello():
    print("Hello from Python")
```

## Code Block with Special Characters

```bash
#!/bin/bash
echo "Testing special characters: & < > \" '"
npm run build
```

## Empty Code Block

```

```

## Code Block with Indentation

```json
{
  "name": "bumblebee",
  "version": "1.0.0",
  "scripts": {
    "build": "bun build --target bun --outdir dist src/cli.ts"
  }
}
```
