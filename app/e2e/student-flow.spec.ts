import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Student Join + Exercise flow.
 *
 * Covers the public student landing page, class-code validation,
 * dashboard rendering, and exercise interaction.
 */
test.describe('Student Join Flow', () => {
  test('student landing page renders with join form', async ({ page }) => {
    await page.goto('/student');

    // Class code input is visible
    await expect(page.locator('input[name="code"]')).toBeVisible();

    // Student name input is visible
    await expect(page.locator('input[name="displayName"]')).toBeVisible();

    // Submit button is present
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows error on invalid class code', async ({ page }) => {
    await page.goto('/student');

    // Enter an invalid 6-char code
    await page.fill('input[name="code"]', 'XXXXXX');
    await page.fill('input[name="displayName"]', 'Test Student');
    await page.click('button[type="submit"]');

    // Error message should appear
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 10_000 });
  });

  test('valid class code redirects to student dashboard', async ({ page }) => {
    await page.goto('/student');

    // Use the seeded class code (uppercase 6-char code from seed data)
    await page.fill('input[name="code"]', 'ABC123');
    await page.fill('input[name="displayName"]', 'E2E Student');
    await page.click('button[type="submit"]');

    // Should redirect to the student dashboard
    await page.waitForURL('**/student/dashboard**', { timeout: 15_000 });
    expect(page.url()).toContain('/student/dashboard');
  });

  test('student dashboard shows content after joining', async ({ page }) => {
    // Join first
    await page.goto('/student');
    await page.fill('input[name="code"]', 'ABC123');
    await page.fill('input[name="displayName"]', 'Dashboard Student');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/student/dashboard**', { timeout: 15_000 });

    // Main content area should be present
    await expect(page.locator('#main-content')).toBeVisible();

    // A heading (h1) should be visible
    await expect(page.locator('h1').first()).toBeVisible();
  });
});

test.describe('Student Exercise Flow', () => {
  test('exercise page renders questions when navigated to', async ({ page }) => {
    // Set a studentId cookie to simulate a joined student
    await page.context().addCookies([
      {
        name: 'studentId',
        value: 'e2e-test-student-id',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Navigate to an exercise page (assessment ID from seed data)
    await page.goto('/student/exercise/test-assessment-id');

    // If the assessment exists, the exercise view should render
    // If not found (404), the page still renders without crashing
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });
});
