# Tables Test Fixtures

This file contains various GFM table structures to test table rendering.

## Basic Table

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Row 2-1  | Row 2-2  | Row 2-3  |

## Table with Different Alignments

| Left | Center | Right |
|------|:------:|------:|
| Left 1 | Center 1 | Right 1 |
| Left 2 | Center 2 | Right 2 |

## Complex Table with Long Content

| Feature | Description | Status |
|---------|-------------|--------|
| Markdown Parsing | Parse markdown using remark-parse | ✅ Complete |
| ANSI Rendering | Convert MDAST to ANSI escape codes | ✅ Complete |
| Text Wrapping | Handle long lines and terminal width | ✅ Complete |
| Code Blocks | Render fenced code blocks | 🔄 In Progress |

## Table with Empty Cells

| Column A | Column B | Column C |
|----------|----------|----------|
| Data A1  |          | Data C1  |
|          | Data B2  | Data C2  |
| Data A3  | Data B3  |          |

## Wide Table (Testing Wrapping)

| Very Long Column Header Name | Another Very Long Column Header | Third Column |
|-----------------------------|---------------------------------|--------------|
| This is a very long cell content that should test text wrapping behavior | Shorter | Medium length |
| Short | This cell has quite a bit of content that might need to wrap depending on terminal width | Normal |
