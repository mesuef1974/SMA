// Shared role → Arabic label mapping for the teacher UI chrome.
// Kept small and dependency-free so server components (and, if needed,
// client components) can import it without bundling surprises.

export type UserRole = 'teacher' | 'advisor' | 'admin' | 'student';

export function roleToArabic(role: UserRole | string | null | undefined): string {
  switch (role) {
    case 'teacher':
      return 'معلم · الصف 10';
    case 'admin':
      return 'مدير';
    case 'advisor':
      return 'موجّه';
    case 'student':
      return 'طالب';
    default:
      return 'معلم';
  }
}
