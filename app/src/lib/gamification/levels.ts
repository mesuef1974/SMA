// ---------------------------------------------------------------------------
// Level System — 15 levels mapped to Bloom's taxonomy
// Higher cognitive levels require more XP, rewarding deep learning.
// Reference: DEC-SMA-031 educational consultant directive.
// ---------------------------------------------------------------------------

export interface Level {
  level: number;
  nameAr: string;
  xpRequired: number;
  bloomAssociation: string | null;
}

/**
 * 15 levels with escalating XP thresholds.
 * Bloom associations indicate the cognitive tier the student is practising at.
 */
export const LEVELS: readonly Level[] = [
  { level: 1,  nameAr: 'مبتدئ',  xpRequired: 0,    bloomAssociation: null },
  { level: 2,  nameAr: 'متعلم',  xpRequired: 50,   bloomAssociation: 'remember' },
  { level: 3,  nameAr: 'باحث',   xpRequired: 120,  bloomAssociation: 'remember' },
  { level: 4,  nameAr: 'مستكشف', xpRequired: 200,  bloomAssociation: 'understand' },
  { level: 5,  nameAr: 'فاهم',   xpRequired: 300,  bloomAssociation: 'understand' },
  { level: 6,  nameAr: 'مطبّق',  xpRequired: 450,  bloomAssociation: 'apply' },
  { level: 7,  nameAr: 'حلّال',  xpRequired: 650,  bloomAssociation: 'apply' },
  { level: 8,  nameAr: 'محلل',   xpRequired: 900,  bloomAssociation: 'analyze' },
  { level: 9,  nameAr: 'ناقد',   xpRequired: 1200, bloomAssociation: 'analyze' },
  { level: 10, nameAr: 'مفكّر',  xpRequired: 1600, bloomAssociation: 'evaluate' },
  { level: 11, nameAr: 'مبتكر',  xpRequired: 2100, bloomAssociation: 'evaluate' },
  { level: 12, nameAr: 'عالم',   xpRequired: 2700, bloomAssociation: 'create' },
  { level: 13, nameAr: 'خبير',   xpRequired: 3500, bloomAssociation: 'create' },
  { level: 14, nameAr: 'عبقري',  xpRequired: 4500, bloomAssociation: 'create' },
  { level: 15, nameAr: 'أذكى',   xpRequired: 6000, bloomAssociation: 'create' },
] as const;

/**
 * Given a total XP value, returns the corresponding level number (1-15).
 * Walks the table in reverse to find the highest level the XP qualifies for.
 */
export function getLevelForXP(xp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      return LEVELS[i].level;
    }
  }
  return 1;
}

/**
 * Returns the XP required to reach the next level, or null if already at max.
 */
export function getNextLevelXP(currentLevel: number): number | null {
  if (currentLevel >= LEVELS.length) return null;
  return LEVELS[currentLevel].xpRequired; // LEVELS is 0-indexed; level N+1 is at index N
}

/**
 * Returns the full Level object for a given level number.
 */
export function getLevelInfo(level: number): Level {
  return LEVELS[Math.max(0, Math.min(level - 1, LEVELS.length - 1))];
}
