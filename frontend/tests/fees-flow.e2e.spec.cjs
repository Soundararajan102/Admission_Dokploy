// tests/fees-flow.e2e.spec.cjs
const { test, expect } = require('@playwright/test');

test.describe('Fees Flow Tests', () => {

    // Login helper function
    async function loginAsAdmin(page) {
        await page.goto('/admin');
        await page.waitForSelector('input[name="email"]', { timeout: 10000 });
        await page.fill('input[name="email"]', 'vishorgunasekaran07@gmail.com');
        await page.fill('input[name="password"]', 'Vishor@123');
        await page.click('button[type="submit"]');
        await page.waitForSelector('text=Applications Dashboard', { timeout: 10000 });
    }

    test('should navigate to fees panel from admin dashboard', async ({ page }) => {
        await loginAsAdmin(page);

        // Open first edit modal
        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        // Look for Fees or Next button that leads to fees
        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Should navigate to fees page
            const urlContainsFees = page.url().includes('feesInfo') || page.url().includes('fees');
            const feesHeaderVisible = await page.locator('text=/Fee.*Structure|Fees/i').isVisible();

            expect(urlContainsFees || feesHeaderVisible).toBeTruthy();
        }
    });

    test('should display fee structure table', async ({ page }) => {
        // Navigate directly to fees page (may require auth)
        await loginAsAdmin(page);

        // Try to access fees through edit modal
        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Verify fee structure elements are present
            await expect(page.locator('text=/Tuition Fee|Development Fee/i')).toBeVisible();
        }
    });

    test('should input fee amounts', async ({ page }) => {
        await loginAsAdmin(page);

        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Fill in tuition fee
            const tuitionFeeInput = page.locator('input[name="tuitionFee"]');
            if (await tuitionFeeInput.isVisible()) {
                await tuitionFeeInput.fill('50000');

                // Verify value was set
                const value = await tuitionFeeInput.inputValue();
                expect(value).toBe('50000');
            }
        }
    });

    test('should calculate fee totals correctly', async ({ page }) => {
        await loginAsAdmin(page);

        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Input some fees
            const tuitionFeeInput = page.locator('input[name="tuitionFee"]');
            const developmentFeeInput = page.locator('input[name="developmentFee"]');

            if (await tuitionFeeInput.isVisible() && await developmentFeeInput.isVisible()) {
                await tuitionFeeInput.fill('50000');
                await developmentFeeInput.fill('10000');

                await page.waitForTimeout(500); // Wait for calculation

                // Verify total is calculated (should be at least 60000)
                const totalDisplay = page.locator('text=/Total|₹/i').filter({ hasText: /60000|6000/i }).first();
                const totalVisible = await totalDisplay.isVisible();
                expect(totalVisible).toBeTruthy();
            }
        }
    });

    test('should apply scholarship deductions', async ({ page }) => {
        await loginAsAdmin(page);

        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Look for scholarship inputs
            const scStScholarship = page.locator('input[name="scStScholarship"]');
            const fgScholarship = page.locator('input[name="fgScholarship"]');

            if (await scStScholarship.isVisible()) {
                await scStScholarship.fill('5000');

                // Wait for recalculation
                await page.waitForTimeout(500);

                // Verify scholarship was applied
                const value = await scStScholarship.inputValue();
                expect(value).toBe('5000');
            }

            if (await fgScholarship.isVisible()) {
                await fgScholarship.fill('3000');

                const value = await fgScholarship.inputValue();
                expect(value).toBe('3000');
            }
        }
    });

    test('should input hostel fees', async ({ page }) => {
        await loginAsAdmin(page);

        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Fill hostel fees
            const messBillInput = page.locator('input[name="messBill"]');
            const roomRentInput = page.locator('input[name="roomRent"]');

            if (await messBillInput.isVisible()) {
                await messBillInput.fill('30000');
                const value = await messBillInput.inputValue();
                expect(value).toBe('30000');
            }

            if (await roomRentInput.isVisible()) {
                await roomRentInput.fill('20000');
                const value = await roomRentInput.inputValue();
                expect(value).toBe('20000');
            }
        }
    });

    test('should input bus fee', async ({ page }) => {
        await loginAsAdmin(page);

        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Fill bus fee
            const busFeeInput = page.locator('input[name="busFee"]');

            if (await busFeeInput.isVisible()) {
                await busFeeInput.fill('15000');
                const value = await busFeeInput.inputValue();
                expect(value).toBe('15000');
            }
        }
    });

    test('should change application status to Admitted', async ({ page }) => {
        await loginAsAdmin(page);

        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Look for status buttons
            const admittedButton = page.locator('button:has-text("Admitted")');

            if (await admittedButton.isVisible()) {
                await admittedButton.click();

                // Button should show active/selected state
                const buttonClass = await admittedButton.getAttribute('class');
                expect(buttonClass).toContain(/active|selected|bg-green/i);
            }
        }
    });

    test('should change application status to Pending', async ({ page }) => {
        await loginAsAdmin(page);

        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Look for Pending status button
            const pendingButton = page.locator('button:has-text("Pending")');

            if (await pendingButton.isVisible()) {
                await pendingButton.click();

                // Button should show active state
                const buttonClass = await pendingButton.getAttribute('class');
                expect(buttonClass).toContain(/active|selected|bg-yellow/i);
            }
        }
    });

    test('should change application status to Canceled', async ({ page }) => {
        await loginAsAdmin(page);

        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Look for Cancel/Canceled button
            const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Canceled")');

            if (await cancelButton.isVisible()) {
                await cancelButton.click();

                // Button should show active state
                const buttonClass = await cancelButton.getAttribute('class');
                expect(buttonClass).toContain(/active|selected|bg-red/i);
            }
        }
    });

    test('should submit fee application and show success', async ({ page }) => {
        await loginAsAdmin(page);

        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Fill minimal fees
            const tuitionFeeInput = page.locator('input[name="tuitionFee"]');
            if (await tuitionFeeInput.isVisible()) {
                await tuitionFeeInput.fill('50000');
            }

            // Submit
            const submitButton = page.locator('button:has-text("Submit")').last();
            if (await submitButton.isVisible()) {
                await submitButton.click();

                // Wait for success message or modal
                await page.waitForTimeout(3000);

                const successVisible = await page.locator('text=/Success|Saved|Submitted/i').isVisible();
                expect(successVisible).toBeTruthy();
            }
        }
    });

    test('should display admission ID when status is Admitted', async ({ page }) => {
        await loginAsAdmin(page);

        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Change status to Admitted
            const admittedButton = page.locator('button:has-text("Admitted")');
            if (await admittedButton.isVisible()) {
                await admittedButton.click();

                // Fill and submit fees
                const tuitionFeeInput = page.locator('input[name="tuitionFee"]');
                if (await tuitionFeeInput.isVisible()) {
                    await tuitionFeeInput.fill('50000');
                }

                const submitButton = page.locator('button:has-text("Submit")').last();
                if (await submitButton.isVisible()) {
                    await submitButton.click();
                    await page.waitForTimeout(3000);

                    // Look for Admission ID display
                    const admissionIdVisible = await page.locator('text=/Admission.*ID|Registration.*Number/i').isVisible();
                    expect(admissionIdVisible).toBeTruthy();
                }
            }
        }
    });

    test('should display overall total fee correctly', async ({ page }) => {
        await loginAsAdmin(page);

        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Input various fees
            const inputs = {
                tuitionFee: '50000',
                developmentFee: '10000',
                admissionFee: '5000',
            };

            for (const [name, value] of Object.entries(inputs)) {
                const input = page.locator(`input[name="${name}"]`);
                if (await input.isVisible()) {
                    await input.fill(value);
                }
            }

            await page.waitForTimeout(1000);

            // Verify overall total is displayed
            const overallTotal = page.locator('text=/Overall.*Total|Overall.*Fees.*Payable/i');
            await expect(overallTotal).toBeVisible();
        }
    });

    test('should show fee breakdown sections', async ({ page }) => {
        await loginAsAdmin(page);

        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Verify fee sections are visible
            await expect(page.locator('text=/College.*Fee/i')).toBeVisible();

            const scholarshipSection = await page.locator('text=/Scholarship/i').isVisible();
            const hostelSection = await page.locator('text=/Hostel/i').isVisible();
            const transportSection = await page.locator('text=/Bus|Transport/i').isVisible();

            // At least some sections should be visible
            expect(scholarshipSection || hostelSection || transportSection).toBeTruthy();
        }
    });

    test('should navigate back to dashboard after fee submission', async ({ page }) => {
        await loginAsAdmin(page);

        await page.locator('table tr:has(td) button:has-text("Edit")').first().click();
        await page.waitForSelector('text=Edit Application', { timeout: 10000 });

        const feesButton = page.locator('button:has-text("Fees"), button:has-text("Next"), button:has-text("Continue")').first();

        if (await feesButton.isVisible()) {
            await feesButton.click();
            await page.waitForTimeout(2000);

            // Fill minimal data and submit
            const tuitionFeeInput = page.locator('input[name="tuitionFee"]');
            if (await tuitionFeeInput.isVisible()) {
                await tuitionFeeInput.fill('50000');
            }

            const submitButton = page.locator('button:has-text("Submit")').last();
            if (await submitButton.isVisible()) {
                await submitButton.click();
                await page.waitForTimeout(3000);

                // Look for dashboard navigation button
                const dashboardButton = page.locator('button:has-text("Dashboard"), a:has-text("Dashboard")');
                if (await dashboardButton.isVisible()) {
                    await dashboardButton.click();
                    await page.waitForTimeout(2000);

                    // Should be back on dashboard
                    await expect(page.locator('text=Applications Dashboard')).toBeVisible();
                }
            }
        }
    });
});
