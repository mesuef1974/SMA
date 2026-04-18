import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility smoke test: public routes must satisfy WCAG 2.1 AA.
 * Run via `pnpm test:a11y` with a dev server running on :3000.
 */
const PUBLIC_ROUTES = ['/ar', '/en'];

for (const route of PUBLIC_ROUTES) {
  test(`a11y: ${route} has no WCAG AA violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
