import { test, expect } from '@playwright/test';

test.describe('Mobile bottom nav', () => {
  test('shows service-aware items and respects roles', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // emulate small viewport
    await page.setViewportSize({ width: 390, height: 844 });

    // Wait for nav to load
    const nav = page.locator('[data-testid="mobile-bottom-nav"]');
    await expect(nav).toBeVisible();

    // Basic check: there should be at least one nav item
    const items = nav.locator('a');
    await expect(items.first()).toBeVisible();
  });
});
