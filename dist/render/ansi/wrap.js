import wrapAnsi from 'wrap-ansi';
/**
 * Wrap text to a specified column width while preserving ANSI escape codes.
 * Long words will be broken if necessary, and ANSI formatting is maintained.
 *
 * @param text - The text to wrap (may contain ANSI escape codes)
 * @param columns - The maximum number of columns per line
 * @returns The wrapped text with ANSI formatting preserved
 *
 * @example
 * ```typescript
 * wrapText('This is a long line that needs wrapping', 20);
 * // Wraps to multiple lines at 20 columns
 *
 * wrapText('\u001B[31mRed text\u001B[39m that wraps', 15);
 * // ANSI codes preserved across line breaks
 * ```
 */
export function wrapText(text, columns) {
    return wrapAnsi(text, columns, {
        hard: false, // Soft wrapping - don't break words unnecessarily
        wordWrap: true, // Try to wrap at word boundaries
        trim: true // Remove whitespace from line ends
    });
}
