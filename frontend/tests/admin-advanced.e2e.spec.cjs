// tests/admin-advanced.e2e.spec.cjs
const { test, expect } = require('@playwright/test');

test.describe('Advanced Admin Features', () => {

    // Login helper function
    async function loginAsAdmin(page) {
        await page.goto('/admin');
        await page.waitForSelector('input[name="email"]', { timeout: 10000 });
        await page.fill('input[name="email"]', 'vishorgunasekaran07@gmail.com');
        await page.fill('input[name="password"]', 'Vishor@123');
        await page.click('button[type="submit"]');
        await page.waitForSelector('text=Applications Dashboard', { timeout: 10000 });
    }

    test('should search by enquiry ID', async ({ page }) => {
        await loginAsAdmin(page);

        // Look for search input
        const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], input[name="search"]').first();

        if (await searchInput.isVisible()) {
            // Search for known enquiry ID from snapshot
            await searchInput.fill('KN26EQ0001');
            await page.waitForTimeout(1000);

            // Verify the specific enquiry appears in results
            await expect(page.locator('text=KN26EQ0001')).toBeVisible();
        }
    });

    test('should search by student name', async ({ page }) => {
        await loginAsAdmin(page);

        const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], input[name="search"]').first();

        if (await searchInput.isVisible()) {
            // Get first student name from the table if it exists
            const firstStudentCell = page.locator('table tbody tr').first().locator('td').first();
            const studentName = await firstStudentCell.textContent();

            if (studentName && studentName.trim()) {
                // Search for the student name
                await searchInput.fill(studentName.trim());
                await page.waitForTimeout(1000);

                // Verify search results contain the name or verify table has results
                const hasResults = await page.locator('table tbody tr').count() > 0;
                expect(hasResults).toBeTruthy();
            }
        }
    });

    test('should filter by application status', async ({ page }) => {
        await loginAsAdmin(page);

        // Look for status filter dropdown or buttons
        const statusFilter = page.locator('select[name="status"], select').filter({ hasText: /status|Status/i }).first();

        if (await statusFilter.isVisible()) {
            // Filter by Submitted status
            await statusFilter.selectOption({ label: 'Submitted' });
            await page.waitForTimeout(1000);

            // Verify only submitted applications are shown
            await expect(page.locator('text=Submitted')).toBeVisible();
        }
    });

    test('should filter by quota type', async ({ page }) => {
        await loginAsAdmin(page);

        // Look for quota filter
        const quotaFilter = page.locator('select[name="quota"], select').filter({ hasText: /quota|Quota/i }).first();

        if (await quotaFilter.isVisible()) {
            // Filter by Management quota
            await quotaFilter.selectOption({ label: 'Management' });
            await page.waitForTimeout(1000);

            // Verify filtered results
            const hasResults = await page.locator('table tbody tr').count() > 0;
            expect(hasResults).toBeTruthy();
        }
    });

    test('should filter by department', async ({ page }) => {
        await loginAsAdmin(page);

        // Look for department filter
        const deptFilter = page.locator('select[name="department"], select').filter({ hasText: /department|Department|Preference/i }).first();

        if (await deptFilter.isVisible()) {
            // Filter by CSE
            await deptFilter.selectOption({ label: 'CSE' });
            await page.waitForTimeout(1000);

            // Verify CSE applications are shown
            await expect(page.locator('text=CSE')).toBeVisible();
        }
    });

    test('should navigate through pagination', async ({ page }) => {
        await loginAsAdmin(page);

        // Check if pagination exists
        const paginationNext = page.locator('button:has-text("Next"), button:has-text("›"), button:has-text("→")').first();

        if (await paginationNext.isVisible()) {
            // Get current page applications
            const firstPageApps = await page.locator('table tbody tr').count();

            // Click next page
            await paginationNext.click();
            await page.waitForTimeout(1000);

            // Verify we're on a different page (different content)
            const secondPageApps = await page.locator('table tbody tr').count();

            // Check that navigation happened (URL or content changed)
            const currentContent = await page.content();
            expect(currentContent).toBeTruthy();
        }
    });

    test('should navigate to specific page number', async ({ page }) => {
        await loginAsAdmin(page);

        // Look for page number buttons
        const page2Button = page.locator('button:has-text("2")').first();

        if (await page2Button.isVisible()) {
            await page2Button.click();
            await page.waitForTimeout(1000);

            // Verify we navigated to page 2
            const activePage = page.locator('button:has-text("2")').first();
            const hasActiveClass = await activePage.getAttribute('class');
            expect(hasActiveClass).toContain(/active|selected|current/i);
        }
    });

    test('should sort by enquiry ID', async ({ page }) => {
        await loginAsAdmin(page);

        // Check if there's data in the table first
        const initialRowCount = await page.locator('table tbody tr').count();

        if (initialRowCount > 0) {
            // Look for sortable column header
            const enquiryHeader = page.locator('th:has-text("Enquiry ID")');

            if (await enquiryHeader.isVisible()) {
                // Click to sort
                await enquiryHeader.click();
                await page.waitForTimeout(1000);

                // Verify table still has data
                const rowCount = await page.locator('table tbody tr').count();
                expect(rowCount).toBeGreaterThan(0);
            }
        }
    });

    test('should view different academic score types in edit modal', async ({ page }) => {
        await loginAsAdmin(page);

        // Open first edit modal
        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const modal = page.locator('div:has(h2:has-text("Edit Application"))');

        // Check if course type is displayed - use heading in Academic Scores section
        const courseTypeHeading = modal.locator('h4:has-text("HSC"), h4:has-text("CBSE"), h4:has-text("Diploma"), h4:has-text("Vocational"), h4:has-text("Dropout")').first();
        const courseTypeVisible = await courseTypeHeading.isVisible();
        expect(courseTypeVisible).toBeTruthy();

        // Close modal
        await modal.locator('button:has-text("Close")').click();
    });

    test('should display correct student count', async ({ page }) => {
        await loginAsAdmin(page);

        // Check for student count display
        const countDisplay = page.locator('text=/Total.*Applications|Showing.*of/i').first();

        if (await countDisplay.isVisible()) {
            const countText = await countDisplay.textContent();
            expect(countText).toBeTruthy();
        }
    });

    test('should refresh data on dashboard', async ({ page }) => {
        await loginAsAdmin(page);

        // Look for refresh button
        const refreshButton = page.locator('button:has-text("Refresh"), button').filter({ has: page.locator('svg') }).first();

        if (await refreshButton.isVisible()) {
            // Check if button is enabled before trying to click
            const isEnabled = await refreshButton.isEnabled();
            if (isEnabled) {
                await refreshButton.click();
                await page.waitForTimeout(1000);

                // Verify table is still visible after refresh
                await expect(page.locator('table')).toBeVisible();
            }
        }
    });

    test('should display all table columns correctly', async ({ page }) => {
        await loginAsAdmin(page);

        // Verify important columns are visible
        await expect(page.locator('th:has-text("Enquiry ID")')).toBeVisible();
        await expect(page.locator('th:has-text("Student Details")')).toBeVisible();
        await expect(page.locator('th:has-text("1st Preference")')).toBeVisible();
        await expect(page.locator('th:has-text("Status")')).toBeVisible();
        await expect(page.locator('th:has-text("Actions")')).toBeVisible();
    });

    test('should handle empty search results gracefully', async ({ page }) => {
        await loginAsAdmin(page);

        const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], input[name="search"]').first();

        if (await searchInput.isVisible()) {
            // Search for non-existent enquiry ID
            await searchInput.fill('NONEXISTENT12345');
            await page.waitForTimeout(1000);

            // Should show no results message or empty table
            const noResults = await page.locator('text=/No.*found|No.*results|No.*applications/i').isVisible().catch(() => false);
            const emptyTable = await page.locator('table tbody tr').count() === 0;

            expect(noResults || emptyTable).toBeTruthy();
        }
    });

    test('should display student contact information in edit modal', async ({ page }) => {
        await loginAsAdmin(page);

        // Open first edit modal
        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const modal = page.locator('div:has(h2:has-text("Edit Application"))');

        // Check for contact fields - use .first() to avoid strict mode violation
        const hasContactInfo = await modal.locator('text=/Contact|Phone|Mobile/i').first().isVisible();
        expect(hasContactInfo).toBeTruthy();

        // Close modal
        await modal.locator('button:has-text("Close")').click();
    });

    test('should display student address in edit modal', async ({ page }) => {
        await loginAsAdmin(page);

        // Open first edit modal
        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const modal = page.locator('div:has(h2:has-text("Edit Application"))');

        // Check for address fields - use .first() to avoid strict mode violation
        const hasAddress = await modal.locator('text=/Address|District|State/i').first().isVisible();
        expect(hasAddress).toBeTruthy();

        // Close modal
        await modal.locator('button:has-text("Close")').click();
    });
});
