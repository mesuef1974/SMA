/**
 * AI Provider — unified interface for switching between Gemini, Claude, and Ollama
 *
 * To switch provider: set AI_PROVIDER env var to 'gemini', 'anthropic', or 'ollama'
 * Default: 'gemini'
 *
 * Gemini:    GOOGLE_GENERATIVE_AI_API_KEY  (free tier via aistudio.google.com)
 * Anthropic: ANTHROPIC_API_KEY             (paid)
 * Ollama:    no API key needed — local server at http://localhost:11434
 */

import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';

const PROVIDER = (process.env.AI_PROVIDER ?? 'gemini') as 'gemini' | 'anthropic' | 'ollama';

const GEMINI_MODEL    = 'gemini-2.0-flash';
const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const OLLAMA_MODEL    = 'qwen3.5:9b';

export function isAIConfigured(): boolean {
  if (PROVIDER === 'ollama') return true; // local server, no key needed
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

  if (PROVIDER === 'ollama') {
    const ollamaClient = createOpenAI({
      baseURL: 'http://localhost:11434/v1',
      apiKey: 'ollama',
    });
    return ollamaClient(modelOverride ?? OLLAMA_MODEL);
  }

  if (PROVIDER === 'gemini') {
    return google(modelOverride ?? GEMINI_MODEL);
  }

  return anthropic(modelOverride ?? ANTHROPIC_MODEL);
}

export { PROVIDER, GEMINI_MODEL, ANTHROPIC_MODEL, OLLAMA_MODEL };
