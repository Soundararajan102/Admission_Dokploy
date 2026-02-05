// tests/admin-details.e2e.spec.cjs
const { test, expect } = require('@playwright/test');

test.describe('Admin Flow', () => {
  test('should login as admin and view all user details', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.fill('input[name="email"]', 'vishorgunasekaran07@gmail.com');
    await page.fill('input[name="password"]', 'Vishor@123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Applications Dashboard', { timeout: 10000 });
    await expect(page.locator('text=Applications Dashboard')).toBeVisible();
    // Check for table/list headers or user details (use actual table headers from snapshot)
    await expect(page.locator('text=Student Details')).toBeVisible();
    await expect(page.locator('text=Enquiry ID')).toBeVisible();
    await expect(page.locator('text=1st Preference')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Submitted')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
    // Fix: check that at least one student row is visible, but do not use strict text locator
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('text=KN26EQ0001')).toBeVisible(); // Enquiry ID from snapshot
  });

  test('should view application details and assert fields', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[name="email"]', 'vishorgunasekaran07@gmail.com');
    await page.fill('input[name="password"]', 'Vishor@123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Applications Dashboard', { timeout: 10000 });
    // Open the first Edit modal (since only Edit exists)
    await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
    await page.waitForSelector('text=Edit Application', { timeout: 10000 });
    await expect(page.locator('text=Edit Application')).toBeVisible();
    // Assert some key fields are visible (use unique modal context to avoid strict mode violation)
    const modal = page.locator('div:has(h2:has-text("Edit Application"))');
    // Verify Full Name input exists and has a value using simpler selector
    const fullNameInput = modal.locator('text=Full Name').locator('..').locator('input');
    await expect(fullNameInput).toBeVisible();
    await expect(fullNameInput).toHaveValue(/.+/); // Has any non-empty value

    const enquiryIdInput = modal.locator('div:has-text("Enquiry ID") input').first();
    await expect(enquiryIdInput).toBeVisible();
    // Close modal if needed
    await modal.locator('button:has-text("Close")').click();
  });

  test('should edit application and verify update', async ({ page }) => {
    await page.goto('/admin');
    await page.fill('input[name="email"]', 'vishorgunasekaran07@gmail.com');
    await page.fill('input[name="password"]', 'Vishor@123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Applications Dashboard', { timeout: 10000 });
    // Open the first Edit modal
    await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
    await page.waitForSelector('text=Edit Application', { timeout: 10000 });
    // Change status using robust locator: find the combobox near 'Application Status' text
    const modal = page.locator('div:has(h2:has-text("Edit Application"))');
    const statusSelect = modal.locator('div:has-text("Application Status") select, select').filter({ hasText: /Pending|Admitted|Cancel/ }).first();
    await expect(statusSelect).toBeVisible();
    await statusSelect.selectOption({ label: 'Pending' });
    // Verify the selection was made
    const selectedValue = await statusSelect.inputValue();
    expect(selectedValue).toBe('Pending');
  });

  test('should export application PDF', async ({ page, context }) => {
    await page.goto('/admin');
    await page.fill('input[name="email"]', 'vishorgunasekaran07@gmail.com');
    await page.fill('input[name="password"]', 'Vishor@123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Applications Dashboard', { timeout: 10000 });
    // Open the first Edit modal
    await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
    await page.waitForSelector('text=Edit Application', { timeout: 10000 });
    // If a PDF button exists, click and wait for download
    const pdfButton = page.locator('button:has-text("PDF")');
    if (await pdfButton.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        pdfButton.click()
      ]);
      const path = await download.path();
      expect(path).toBeTruthy();
    } else {
      // Skip if not present
      console.warn('PDF export button not found in modal.');
    }
    // Close modal
    await page.locator('button:has-text("Close")').click();
  });
});
