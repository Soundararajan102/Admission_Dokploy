// tests/auth.e2e.spec.cjs
const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test('should signup with valid credentials', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    // Generate unique email for testing
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'TestPass123!';
    
    // Fill signup form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect or success indication
    await page.waitForURL(/\/(admin|\/|feesInfo)/, { timeout: 10000 });
    
    // Verify user is logged in (check for logout or user profile)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/signup');
  });

  test('should show error for duplicate email signup', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    // Use known existing email (from admin tests)
    const existingEmail = 'vishorgunasekaran07@gmail.com';
    const testPassword = 'Vishor@123';
    
    await page.fill('input[name="email"]', existingEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('text=/already in use|already exists/i', { timeout: 5000 });
    const errorVisible = await page.locator('text=/already in use|already exists/i').isVisible();
    expect(errorVisible).toBeTruthy();
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    const testEmail = `test${Date.now()}@example.com`;
    
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPass123!');
    
    await page.click('button[type="submit"]');
    
    // Check for password mismatch error
    await page.waitForSelector('text=/password.*match|passwords.*same/i', { timeout: 5000 });
    const errorVisible = await page.locator('text=/password.*match|passwords.*same/i').isVisible();
    expect(errorVisible).toBeTruthy();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    // Use admin credentials
    await page.fill('input[name="email"]', 'vishorgunasekaran07@gmail.com');
    await page.fill('input[name="password"]', 'Vishor@123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard or home
    await page.waitForURL(/\/(admin|\/|feesInfo)/, { timeout: 10000 });
    
    // Verify login was successful
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('text=/invalid.*password|incorrect.*credentials|wrong.*password/i', { timeout: 5000 });
    const errorVisible = await page.locator('text=/invalid.*password|incorrect.*credentials|wrong.*password/i').isVisible();
    expect(errorVisible).toBeTruthy();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access protected admin route without authentication
    await page.goto('/admin');
    
    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('should redirect to login when accessing protected fees route without auth', async ({ page }) => {
    // Try to access protected fees route without authentication
    await page.goto('/feesInfo');
    
    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    
    const passwordInput = page.locator('input[name="password"]');
    
    // Initially should be password type
    expect(await passwordInput.getAttribute('type')).toBe('password');
    
    // Click show/hide password button
    const toggleButton = page.locator('button:has-text(""), button[type="button"]').filter({ has: page.locator('svg') }).nth(1);
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      
      // Should now be text type
      expect(await passwordInput.getAttribute('type')).toBe('text');
      
      // Click again to hide
      await toggleButton.click();
      expect(await passwordInput.getAttribute('type')).toBe('password');
    }
  });

  test('should navigate between login and signup pages', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('text=/create.*account|sign.*up/i', { timeout: 10000 });
    
    // Click signup link
    await page.click('text=/create.*account|sign.*up/i');
    await page.waitForURL(/\/signup/, { timeout: 5000 });
    expect(page.url()).toContain('/signup');
    
    // Navigate back to login
    await page.waitForSelector('text=/sign.*in|already.*account/i', { timeout: 5000 });
    await page.click('text=/sign.*in|already.*account/i');
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});
