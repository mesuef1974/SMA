/**
 * Arabic-Indic numeral utilities.
 *
 * Converts between Western digits (0-9) and Arabic-Indic digits (٠-٩).
 * Handles negative numbers, decimal points, and mixed strings.
 */

const WESTERN = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;
const ARABIC_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

/**
 * Converts Western digits (0-9) in a number or string to Arabic-Indic digits (٠-٩).
 * Preserves decimal points, negative signs, and non-digit characters.
 */
export function toArabicIndic(input: number | string): string {
  const str = String(input);
  return str.replace(/[0-9]/g, (d) => ARABIC_INDIC[parseInt(d, 10)]);
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
