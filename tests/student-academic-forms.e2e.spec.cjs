// tests/student-academic-forms.e2e.spec.cjs
const { test, expect } = require('@playwright/test');

// Helper function to fill personal info form
async function fillPersonalInfo(page) {
    await page.goto('/');
    await page.waitForSelector('form', { timeout: 10000 });

    // Fill personal information
    await page.selectOption('select[name="preference1"]', { label: 'CSE(Computer Science and Engineering)' });
    await page.locator('label:has-text("Management")').click();
    await page.locator('label:has-text("I Year")').click();
    await page.fill('input[name="fullName"]', 'Test Student');
    await page.fill('input[name="initial"]', 'T');
    await page.fill('input[name="dob"]', '2004-05-10');
    await page.locator('label:has-text("Male")').nth(0).click();
    await page.locator('label:has-text("Boys Hostel")').click();
    await page.selectOption('select[name="roomType"]', { label: 'Normal (4 Members)' });
    await page.fill('input[name="fatherName"]', 'Test Father');
    await page.fill('input[name="fatherOccupation"]', 'Engineer');
    await page.selectOption('select[name="community"]', { label: 'BC' });
    await page.fill('input[name="caste"]', 'TestCaste');
    await page.selectOption('select[name="annualIncome"]', { label: '1 Lakh to 1.5 Lakhs' });
    await page.locator('label:has-text("Yes")').first().click(); // First Graduate
    await page.fill('input[name="address1"]', '123 Test St');
    await page.fill('input[name="address2"]', 'Test Town');
    await page.fill('input[name="taluk"]', 'TestTaluk');
    await page.fill('input[name="district"]', 'TestDistrict');
    await page.fill('input[name="state"]', 'TestState');
    await page.fill('input[name="pincode"]', '621215');
    await page.fill('input[name="fatherContact"]', '9876543210');
    await page.fill('input[name="motherContact"]', '9876543211');
    await page.fill('input[name="studentContact"]', '9876543212');
    await page.fill('input[name="sslcMarks"]', '480');
    await page.locator('input[type="radio"][name="govtSchool"][value="NO"]').check();
    await page.selectOption('select[name="schoolType"]', { label: 'GOVT. AIDED' });
}

test.describe('Student Academic Forms Flow', () => {

    test('should fill and submit CBSE score form', async ({ page }) => {
        await fillPersonalInfo(page);

        // Select CBSE as last studies
        await page.selectOption('select[name="lastStudies"]', { label: 'CBSE' });

        // Wait for CBSE form to appear
        await page.waitForSelector('#academic-scores-section', { timeout: 10000 });

        // Fill CBSE school details
        await page.waitForFunction(() => {
            const el = document.querySelector('input[placeholder="Enter School Name & Place"]');
            return el && !el.disabled && el.offsetParent !== null && !el.readOnly;
        }, { timeout: 20000 });

        await page.fill('input[placeholder="Enter School Name & Place"]', 'CBSE Test School, Delhi');
        await page.locator('text=Medium of Study').locator('..').locator('select').selectOption({ label: 'English' });
        await page.fill('input[placeholder="Year Of Passing"]', '2024');

        // Fill CBSE subject marks
        const markInputs = await page.locator('input[placeholder="Enter Marks"]').all();
        await markInputs[0].fill('95'); // English
        await markInputs[1].fill('92'); // Mathematics
        await markInputs[2].fill('98'); // Physics
        await markInputs[3].fill('90'); // Chemistry
        await markInputs[4].fill('89'); // Computer Science

        // Submit the form
        await page.getByRole('button', { name: 'Submit' }).click();

        // Verify success
        await expect(page.locator('text=Application submitted successfully')).toBeVisible({ timeout: 15000 });
    });

    test('should fill and submit Diploma score form', async ({ page }) => {
        await fillPersonalInfo(page);

        // Select Diploma as last studies
        await page.selectOption('select[name="lastStudies"]', { label: 'Diploma' });

        // Wait for Diploma form to appear
        await page.waitForSelector('#academic-scores-section', { timeout: 10000 });

        // Fill Diploma details
        await page.waitForFunction(() => {
            const el = document.querySelector('input[placeholder*="College Name"], input[placeholder*="Institute"]');
            return el && !el.disabled && el.offsetParent !== null && !el.readOnly;
        }, { timeout: 20000 });

        // Fill college name (adjust selector based on actual field)
        const collegeInput = page.locator('input[placeholder*="College"], input[placeholder*="Institute"]').first();
        if (await collegeInput.isVisible()) {
            await collegeInput.fill('Diploma Test College');
        }

        // Fill year of passing
        const yearInput = page.locator('input[placeholder*="Year"]').first();
        if (await yearInput.isVisible()) {
            await yearInput.fill('2024');
        }

        // Fill semester marks (typically 6 semesters for diploma)
        const semesterInputs = await page.locator('input[placeholder="Enter Marks"], input[type="text"][name*="sem"]').all();
        for (let i = 0; i < Math.min(6, semesterInputs.length); i++) {
            await semesterInputs[i].fill(`${85 + i}`);
        }

        // Submit the form
        await page.getByRole('button', { name: 'Submit' }).click();

        // Verify success
        await expect(page.locator('text=Application submitted successfully')).toBeVisible({ timeout: 15000 });
    });

    test('should fill and submit Vocational score form', async ({ page }) => {
        await fillPersonalInfo(page);

        // Select Vocational as last studies
        await page.selectOption('select[name="lastStudies"]', { label: 'Vocational' });

        // Wait for Vocational form to appear
        await page.waitForSelector('#academic-scores-section', { timeout: 10000 });

        // Fill Vocational school details
        await page.waitForFunction(() => {
            const el = document.querySelector('input[placeholder="Enter School Name & Place"], input[placeholder*="School"]');
            return el && !el.disabled && el.offsetParent !== null && !el.readOnly;
        }, { timeout: 20000 });

        await page.fill('input[placeholder="Enter School Name & Place"], input[placeholder*="School"]', 'Vocational Test School');

        // Fill medium and year
        const mediumSelect = page.locator('select').filter({ hasText: /medium|Medium/ }).first();
        if (await mediumSelect.isVisible()) {
            await mediumSelect.selectOption({ label: 'English' });
        }

        const yearInput = page.locator('input[placeholder*="Year"]').first();
        if (await yearInput.isVisible()) {
            await yearInput.fill('2024');
        }

        // Fill vocational subject marks
        const markInputs = await page.locator('input[placeholder="Enter Marks"]').all();
        for (let i = 0; i < Math.min(6, markInputs.length); i++) {
            await markInputs[i].fill(`${90 + i}`);
        }

        // Submit the form
        await page.getByRole('button', { name: 'Submit' }).click();

        // Verify success
        await expect(page.locator('text=Application submitted successfully')).toBeVisible({ timeout: 15000 });
    });

    test('should handle Dropout student flow', async ({ page }) => {
        await fillPersonalInfo(page);

        // Select Dropout as last studies
        await page.selectOption('select[name="lastStudies"]', { label: 'Dropout' });

        // Wait for dropout fields to appear
        await page.waitForSelector('input[name="previousCollege"], input[placeholder*="Previous College"]', { timeout: 10000 });

        // Fill dropout details
        await page.fill('input[name="previousCollege"], input[placeholder*="Previous College"]', 'Previous Test College');
        await page.fill('input[name="regNo"], input[placeholder*="Registration"], input[placeholder*="Reg"]', '12345678');

        // Fill year of study dropdown or input
        const yearSelect = page.locator('select[name="yearOfStudy"]');
        const yearInput = page.locator('input[name="yearOfStudy"]');

        if (await yearSelect.isVisible()) {
            await yearSelect.selectOption({ label: 'II Year' });
        } else if (await yearInput.isVisible()) {
            await yearInput.fill('II Year');
        }

        // Submit dropout form
        await page.getByRole('button', { name: /Submit|Save/i }).click();

        // Verify success
        await expect(page.locator('text=Application submitted successfully')).toBeVisible({ timeout: 15000 });
    });

    test('should navigate between personal info and academic sections', async ({ page }) => {
        await fillPersonalInfo(page);

        // Select HSC to trigger academic section
        await page.selectOption('select[name="lastStudies"]', { label: 'HSC' });

        // Wait for academic section to appear
        await page.waitForSelector('#academic-scores-section', { timeout: 10000 });

        // Verify academic section is visible
        const academicSection = page.locator('#academic-scores-section');
        await expect(academicSection).toBeVisible();

        // Verify we can scroll back to personal info
        const personalInfoSection = page.locator('text=Personal Information').first();
        await personalInfoSection.scrollIntoViewIfNeeded();
        await expect(personalInfoSection).toBeVisible();
    });

    test('should preserve personal info when switching between course types', async ({ page }) => {
        await fillPersonalInfo(page);

        const testName = 'Test Student';

        // Select HSC first
        await page.selectOption('select[name="lastStudies"]', { label: 'HSC' });
        await page.waitForTimeout(1000);

        // Change to CBSE
        await page.selectOption('select[name="lastStudies"]', { label: 'CBSE' });
        await page.waitForTimeout(1000);

        // Verify personal info is still filled
        const nameValue = await page.inputValue('input[name="fullName"]');
        expect(nameValue).toBe(testName);

        const dobValue = await page.inputValue('input[name="dob"]');
        expect(dobValue).toBe('2004-05-10');
    });

    test('should validate required fields before showing academic section', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        // Try to select course type without filling personal info
        await page.selectOption('select[name="preference1"]', { label: 'CSE(Computer Science and Engineering)' });
        await page.selectOption('select[name="lastStudies"]', { label: 'HSC' });

        // Should show validation alert or error
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain(/fill|required|enter/i);
            await dialog.accept();
        });

        // Academic section should not appear yet
        const academicSection = page.locator('#academic-scores-section');
        const isVisible = await academicSection.isVisible().catch(() => false);
        expect(isVisible).toBe(false);
    });
});
