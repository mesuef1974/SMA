import { test, expect } from '@playwright/test';

/**
 * Visual-regression snapshots of the /brand-demo page across the four
 * brand matrix cells: {light, dark} × {ltr, rtl}.
 *
 * Baseline images live alongside this spec (first run creates them with
 * `--update-snapshots`). A 2% pixel-diff tolerance absorbs font-hinting jitter.
 */
const THEMES = ['light', 'dark'] as const;
const DIRS = [
  { name: 'ltr', locale: 'en' },
  { name: 'rtl', locale: 'ar' },
] as const;

for (const theme of THEMES) {
  for (const dir of DIRS) {
    test(`brand-demo snapshot — ${theme}/${dir.name}`, async ({ page }) => {
      await page.goto('/brand-demo');
      await page.evaluate((t) => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(t);
      }, theme);
      await page.evaluate((d) => {
        document.documentElement.dir = d;
      }, dir.name);
      await expect(page).toHaveScreenshot(`brand-demo-${theme}-${dir.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    });
  }
}
