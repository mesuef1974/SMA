import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration (BL-028 — 2026-04-23).
 *
 * Unit-test runner for server-side logic (API route handlers, DAL scoping).
 * Kept intentionally minimal — Playwright under `e2e/` remains the tool for
 * browser flows, while this runs fast in-process tests with mocked
 * infrastructure.
 *
 * Excludes `e2e/` so `pnpm test` never trips over Playwright files, and
 * mirrors the `@/` alias from tsconfig so imports match production code.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
