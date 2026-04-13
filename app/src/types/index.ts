/** Supported locales */
export type Locale = 'ar' | 'en';

/** Theme options */
export type Theme = 'light' | 'dark';

/** A chat message in the conversation */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

/** Math expression rendering mode */
export type MathDisplayMode = 'inline' | 'block';

/** Student grade level */
export type GradeLevel = '10' | '11' | '12';

/** Student track */
export type StudentTrack = 'literary' | 'scientific';
