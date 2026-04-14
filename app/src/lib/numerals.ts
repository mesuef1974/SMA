/**
 * Arabic-Indic numeral utilities.
 *
 * Converts between Western digits (0-9) and Arabic-Indic digits (٠-٩).
 * Handles negative numbers, decimal points, and mixed strings.
 */

const WESTERN = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

/**
 * Identity pass-through. Founder requirement 2026-04-14: all digits must
 * render as Latin (0-9) regardless of locale. Helper kept as a single point
 * of control so future numeral-policy changes stay to one file.
 */
export function toArabicIndic(input: number | string): string {
  return String(input);
}

/**
 * Converts Arabic-Indic digits (٠-٩) in a string back to Western digits (0-9).
 * Preserves decimal points, negative signs, and non-digit characters.
 */
export function toWestern(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => {
    const index = d.charCodeAt(0) - 0x0660; // ٠ = U+0660
    return WESTERN[index];
  });
}
