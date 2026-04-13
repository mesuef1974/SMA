import { test, expect } from '@playwright/test';

/**
 * E2E tests for Teacher Authentication flows.
 *
 * Covers login form rendering, credential validation,
 * redirect behaviour on success/failure, and sign-out.
 */
test.describe('Teacher Authentication', () => {
  test('login page renders with form elements', async ({ page }) => {
    await page.goto('/login');

    // Form inputs are present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // Submit button is present
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Registration link is present
    await expect(page.locator('a[href*="/register"]')).toBeVisible();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Error alert should appear
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 10_000 });
  });

  test('redirects to dashboard on valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'teacher@sma.qa');
    await page.fill('input[name="password"]', 'Teacher1234!');
    await page.click('button[type="submit"]');

    // Should redirect to the dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('unauthenticated visit to /dashboard redirects to /login', async ({ page }) => {
    // Clear any cookies first
    await page.context().clearCookies();

    await page.goto('/dashboard');

    // The app should redirect unauthenticated users to login
    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('sign out redirects to login page', async ({ page }) => {
    // First, log in
    await page.goto('/login');
    await page.fill('input[name="email"]', 'teacher@sma.qa');
    await page.fill('input[name="password"]', 'Teacher1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15_000 });

    // Look for a sign-out button/link and click it
    const signOutButton = page.locator(
      'button:has-text("خروج"), button:has-text("تسجيل الخروج"), a:has-text("خروج")',
    );

    if (await signOutButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await signOutButton.first().click();
      await page.waitForURL('**/login**', { timeout: 10_000 });
      expect(page.url()).toContain('/login');
    } else {
      // If there is no visible sign-out button on the dashboard,
      // navigate to the sign-out API directly
      await page.goto('/api/auth/signout');
      await page.waitForURL('**/login**', { timeout: 10_000 });
      expect(page.url()).toContain('/login');
    }
  });
});
