/**
 * Input Sanitization Utilities
 *
 * Shared text sanitization for user inputs stored in the database.
 * Trims whitespace and enforces a maximum character length.
 */

/**
 * Sanitizes a text input by trimming whitespace and truncating to the
 * specified maximum length.
 *
 * @param input  - The raw user input string.
 * @param maxLength - Maximum allowed character count (default: 500).
 * @returns The sanitized string, or an empty string if input is falsy.
 */
export function sanitizeText(input: string, maxLength: number = 500): string {
  if (!input) return '';
  return input.trim().slice(0, maxLength);
}
