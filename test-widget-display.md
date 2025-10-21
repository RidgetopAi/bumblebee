# Widget Display Test

This document tests code block widgets with language badges.

## TypeScript Code Block

```typescript
interface User {
  id: number;
  name: string;
}

const user: User = {
  id: 1,
  name: "Alice"
};
```

## JavaScript Code Block

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

const message = greet("World");
console.log(message);
```

## JSON Code Block

```json
{
  "name": "bumblebee",
  "version": "1.0.0",
  "description": "TUI Markdown Viewer"
}
```

## Plain Code Block (No Language)

```
This is a plain code block
without any language specification.
It should have a yellow border
but NO language badge.
```

End of test document.
