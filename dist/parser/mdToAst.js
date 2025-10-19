import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
/**
 * Parse markdown content into MDAST (Markdown Abstract Syntax Tree).
 *
 * Supports standard markdown plus GFM extensions:
 * - Tables
 * - Strikethrough
 * - Task lists
 * - Autolinks
 *
 * @param content - Raw markdown string
 * @returns MDAST Root node representing the parsed document
 */
export function parseMd(content) {
    const processor = unified()
        .use(remarkParse)
        .use(remarkGfm);
    return processor.parse(content);
}
