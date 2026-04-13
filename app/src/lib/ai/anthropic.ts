/**
 * Anthropic AI Client — Vercel AI SDK wrapper
 *
 * Uses the already-installed @ai-sdk/anthropic provider, which is the
 * standard integration for this Next.js project.
 *
 * Exports:
 *   - getAnthropicModel()  — returns a configured model instance
 *   - isAIConfigured()     — checks if the API key is available
 *
 * Environment:
 *   ANTHROPIC_API_KEY must be set in .env.local
 */

import { anthropic } from '@ai-sdk/anthropic';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Default model for structured generation (lesson plans, etc.).
 * Claude Sonnet 4.5 — faster and cheaper for generation tasks.
 */
const DEFAULT_MODEL_ID = 'claude-sonnet-4-5-20250929';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether the Anthropic API key is configured.
 * Call this before making AI requests to provide a graceful error
 * instead of crashing.
 */
export function isAIConfigured(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

/**
 * Return a Vercel AI SDK model instance configured for Anthropic.
 *
 * @param modelId - Override the default model (e.g. for testing).
 * @throws Error if ANTHROPIC_API_KEY is not set.
 */
export function getAnthropicModel(modelId?: string) {
  if (!isAIConfigured()) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. ' +
        'Set it in .env.local to enable AI features.',
    );
  }

  return anthropic(modelId ?? DEFAULT_MODEL_ID);
}
