// @ts-check
const { test, expect } = require('@playwright/test');

test('homepage has title and get started link', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/InstaFlow/);

  // Expect get started link
  const getStarted = page.getByRole('link', { name: 'Get Started' });
  await expect(getStarted).toBeVisible();
});

test('login page loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // Navigate to login
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Check if login form elements are present
  await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
  await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test('can navigate to dashboard after login', async ({ page }) => {
  await page.goto('/');
  
  // Mock successful login
  await page.route('**/api/auth/signin', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        token: 'mock-jwt-token',
        user: { id: 1, email: 'test@example.com', name: 'Test User' }
      })
    });
  });

  // Perform login
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
  await page.getByRole('textbox', { name: /password/i }).fill('password123');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
});