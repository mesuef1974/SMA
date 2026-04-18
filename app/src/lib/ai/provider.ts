/**
 * AI Provider — unified interface for switching between Gemini and Claude
 *
 * To switch provider: set AI_PROVIDER env var to 'gemini' or 'anthropic'
 * Default: 'gemini'
 *
 * Gemini:    GOOGLE_GENERATIVE_AI_API_KEY  (free tier via aistudio.google.com)
 * Anthropic: ANTHROPIC_API_KEY             (paid)
 */

import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

const PROVIDER = (process.env.AI_PROVIDER ?? 'gemini') as 'gemini' | 'anthropic';

const GEMINI_MODEL    = 'gemini-2.0-flash';
const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

export function isAIConfigured(): boolean {
  if (PROVIDER === 'gemini') {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    return typeof key === 'string' && key.trim().length > 0;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

export function getAIModel(modelOverride?: string) {
  if (!isAIConfigured()) {
    throw new Error(
      PROVIDER === 'gemini'
        ? 'GOOGLE_GENERATIVE_AI_API_KEY غير مُهيّأ.'
        : 'ANTHROPIC_API_KEY غير مُهيّأ.',
    );
  }

  if (PROVIDER === 'gemini') {
    return google(modelOverride ?? GEMINI_MODEL);
  }

  return anthropic(modelOverride ?? ANTHROPIC_MODEL);
}

export { PROVIDER, GEMINI_MODEL, ANTHROPIC_MODEL };
