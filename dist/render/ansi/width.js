import stringWidth from 'string-width';
/**
 * Calculate the visual width of a string, excluding ANSI escape codes.
 * This is the number of columns required to display the text in a terminal.
 *
 * @param text - The text to measure
 * @returns The visual width in columns
 *
 * @example
 * ```typescript
 * getTextWidth('Hello World'); // => 11
 * getTextWidth('\u001B[31mRed Text\u001B[39m'); // => 8 (ANSI codes ignored)
 * ```
 */
export function getTextWidth(text) {
    return stringWidth(text);
}
