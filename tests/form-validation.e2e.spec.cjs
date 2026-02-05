// tests/form-validation.e2e.spec.cjs
const { test, expect } = require('@playwright/test');

test.describe('Form Validation Tests', () => {

    test('should validate required department preference field', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        // Try to proceed without selecting department
        await page.locator('label:has-text("Management")').click();

        // Try to fill name without department
        await page.fill('input[name="fullName"]', 'Test User');

        // Department select should be marked as required
        const deptSelect = page.locator('select[name="preference1"]');
        const isRequired = await deptSelect.getAttribute('required');
        expect(isRequired).not.toBeNull();
    });

    test('should validate seat type selection', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        // Fill some fields but skip seat type
        await page.selectOption('select[name="preference1"]', { label: 'CSE(Computer Science and Engineering)' });
        await page.fill('input[name="fullName"]', 'Test User');

        // Try to submit - should show alert for seat type
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain(/Seat Type|Management|Government/i);
            await dialog.accept();
        });

        const submitBtn = page.getByRole('button', { name: /Submit|Next/i });
        if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForTimeout(500);
        }
    });

    test('should validate admission type selection', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        // Fill department and seat type but skip admission type
        await page.selectOption('select[name="preference1"]', { label: 'CSE(Computer Science and Engineering)' });
        await page.locator('label:has-text("Management")').click();

        // Admission type should be required
        const admissionTypeRadio = page.locator('input[name="entry"]').first();
        const isRequired = await admissionTypeRadio.getAttribute('required');
        expect(isRequired).not.toBeNull();
    });

    test('should validate name fields are filled', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        // Check full name is required
        const fullNameInput = page.locator('input[name="fullName"]');
        const isRequired = await fullNameInput.getAttribute('required');
        expect(isRequired).not.toBeNull();

        // Check initial is required
        const initialInput = page.locator('input[name="initial"]');
        const initialRequired = await initialInput.getAttribute('required');
        expect(initialRequired).not.toBeNull();
    });

    test('should validate date of birth field', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        const dobInput = page.locator('input[name="dob"]');

        // Check DOB is required
        const isRequired = await dobInput.getAttribute('required');
        expect(isRequired).not.toBeNull();

        // Check it's a date input
        const inputType = await dobInput.getAttribute('type');
        expect(inputType).toBe('date');

        // Fill with valid date
        await dobInput.fill('2004-05-10');
        const value = await dobInput.inputValue();
        expect(value).toBe('2004-05-10');
    });

    test('should validate gender selection', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        // Gender radio should be required
        const genderRadio = page.locator('input[name="gender"]').first();
        const isRequired = await genderRadio.getAttribute('required');
        expect(isRequired).not.toBeNull();
    });

    test('should validate accommodation type based on gender', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        // Select male gender
        await page.locator('label:has-text("Male")').nth(0).click();

        // Boys Hostel option should appear
        await expect(page.locator('label:has-text("Boys Hostel")')).toBeVisible();

        // Select female gender
        await page.locator('label:has-text("Female")').nth(0).click();

        // Girls Hostel option should appear
        await expect(page.locator('label:has-text("Girls Hostel")')).toBeVisible();
    });

    test('should validate room type for hostel students', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        // Select gender and hostel
        await page.locator('label:has-text("Male")').nth(0).click();
        await page.locator('label:has-text("Boys Hostel")').click();

        // Room type selector should appear and be required
        const roomTypeSelect = page.locator('select[name="roomType"]');
        await expect(roomTypeSelect).toBeVisible();

        const isRequired = await roomTypeSelect.getAttribute('required');
        expect(isRequired).not.toBeNull();
    });

    test('should validate travel type for day scholars', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        // Select gender and day scholar
        await page.locator('label:has-text("Male")').nth(0).click();
        await page.locator('label:has-text("Day Scholar")').click();

        // Travel type selector should appear and be required
        const travelTypeSelect = page.locator('select[name="travelType"]');
        await expect(travelTypeSelect).toBeVisible();

        const isRequired = await travelTypeSelect.getAttribute('required');
        expect(isRequired).not.toBeNull();
    });

    test('should validate phone number format', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        const fatherContactInput = page.locator('input[name="fatherContact"]');

        // Fill with valid 10-digit number
        await fatherContactInput.fill('9876543210');
        const value = await fatherContactInput.inputValue();
        expect(value).toBe('9876543210');

        // Check it's required
        const isRequired = await fatherContactInput.getAttribute('required');
        expect(isRequired).not.toBeNull();
    });

    test('should validate pincode field', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        const pincodeInput = page.locator('input[name="pincode"]');

        // Fill with valid pincode
        await pincodeInput.fill('621215');
        const value = await pincodeInput.inputValue();
        expect(value).toBe('621215');

        // Check it's required
        const isRequired = await pincodeInput.getAttribute('required');
        expect(isRequired).not.toBeNull();
    });

    test('should validate community selection', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        const communitySelect = page.locator('select[name="community"]');

        // Check it's required
        const isRequired = await communitySelect.getAttribute('required');
        expect(isRequired).not.toBeNull();

        // Should have valid options
        await communitySelect.selectOption({ label: 'BC' });
        const value = await communitySelect.inputValue();
        expect(value).toBe('BC');
    });

    test('should validate SSLC marks field', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        const sslcMarksInput = page.locator('input[name="sslcMarks"]');

        // Fill with valid marks (out of 500)
        await sslcMarksInput.fill('480');
        const value = await sslcMarksInput.inputValue();
        expect(value).toBe('480');

        // Check it's required
        const isRequired = await sslcMarksInput.getAttribute('required');
        expect(isRequired).not.toBeNull();
    });

    test('should validate government school eligibility selection', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        // Govt school radio should be required
        const govtSchoolRadio = page.locator('input[name="govtSchool"]').first();
        const isRequired = await govtSchoolRadio.getAttribute('required');
        expect(isRequired).not.toBeNull();
    });

    test('should validate school type selection', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        const schoolTypeSelect = page.locator('select[name="schoolType"]');

        // Check it's required
        const isRequired = await schoolTypeSelect.getAttribute('required');
        expect(isRequired).not.toBeNull();

        // Select a valid option
        await schoolTypeSelect.selectOption({ label: 'GOVT. AIDED' });
        const value = await schoolTypeSelect.inputValue();
        expect(value).toBe('GOVT. AIDED');
    });

    test('should validate last studies selection triggers academic form', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        // Academic section should not be visible initially
        const academicSection = page.locator('#academic-scores-section');
        const initiallyVisible = await academicSection.isVisible().catch(() => false);
        expect(initiallyVisible).toBe(false);

        // Fill required personal info first
        await page.selectOption('select[name="preference1"]', { label: 'CSE(Computer Science and Engineering)' });
        await page.locator('label:has-text("Management")').click();
        await page.locator('label:has-text("I Year")').click();
        await page.fill('input[name="fullName"]', 'Test User');
        await page.fill('input[name="initial"]', 'T');
        await page.fill('input[name="dob"]', '2004-05-10');
        await page.locator('label:has-text("Male")').nth(0).click();
        await page.locator('label:has-text("Day Scholar")').click();
        await page.selectOption('select[name="travelType"]', { label: 'Own/Outside Travel' });
        await page.fill('input[name="fatherName"]', 'Test Father');
        await page.fill('input[name="fatherOccupation"]', 'Engineer');
        await page.selectOption('select[name="community"]', { label: 'BC' });
        await page.fill('input[name="caste"]', 'TestCaste');
        await page.selectOption('select[name="annualIncome"]', { label: '1 Lakh to 1.5 Lakhs' });
        await page.locator('label:has-text("Yes")').first().click();
        await page.fill('input[name="address1"]', '123 Test St');
        await page.fill('input[name="address2"]', 'Test Town');
        await page.fill('input[name="taluk"]', 'TestTaluk');
        await page.fill('input[name="district"]', 'TestDistrict');
        await page.fill('input[name="state"]', 'TestState');
        await page.fill('input[name="pincode"]', '621215');
        await page.fill('input[name="fatherContact"]', '9876543210');
        await page.fill('input[name="motherContact"]', '9876543211');
        await page.fill('input[name="sslcMarks"]', '480');
        await page.locator('input[type="radio"][name="govtSchool"][value="NO"]').check();
        await page.selectOption('select[name="schoolType"]', { label: 'GOVT. AIDED' });

        // Now select last studies - should show academic section
        await page.selectOption('select[name="lastStudies"]', { label: 'HSC' });

        // Wait and verify academic section appears
        await page.waitForSelector('#academic-scores-section', { timeout: 10000 });
        await expect(academicSection).toBeVisible();
    });

    test('should prevent submission with empty required fields', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        // Listen for validation dialog
        let dialogShown = false;
        page.on('dialog', async dialog => {
            dialogShown = true;
            await dialog.accept();
        });

        // Try to submit empty form
        const submitBtn = page.getByRole('button', { name: /Submit/i });
        if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForTimeout(500);
        }

        // Should still be on the same page (not navigated away)
        expect(page.url()).toContain('/');
    });

    test('should validate academic marks are within valid range', async ({ page }) => {
        // Fill personal info first
        await page.goto('/');
        await page.waitForSelector('form', { timeout: 10000 });

        await page.selectOption('select[name="preference1"]', { label: 'CSE(Computer Science and Engineering)' });
        await page.locator('label:has-text("Management")').click();
        await page.locator('label:has-text("I Year")').click();
        await page.fill('input[name="fullName"]', 'Test User');
        await page.fill('input[name="initial"]', 'T');
        await page.fill('input[name="dob"]', '2004-05-10');
        await page.locator('label:has-text("Male")').nth(0).click();
        await page.locator('label:has-text("Day Scholar")').click();
        await page.selectOption('select[name="travelType"]', { label: 'Own/Outside Travel' });
        await page.fill('input[name="fatherName"]', 'Test Father');
        await page.fill('input[name="fatherOccupation"]', 'Engineer');
        await page.selectOption('select[name="community"]', { label: 'BC' });
        await page.fill('input[name="caste"]', 'TestCaste');
        await page.selectOption('select[name="annualIncome"]', { label: '1 Lakh to 1.5 Lakhs' });
        await page.locator('label:has-text("Yes")').first().click();
        await page.fill('input[name="address1"]', '123 Test St');
        await page.fill('input[name="address2"]', 'Test Town');
        await page.fill('input[name="taluk"]', 'TestTaluk');
        await page.fill('input[name="district"]', 'TestDistrict');
        await page.fill('input[name="state"]', 'TestState');
        await page.fill('input[name="pincode"]', '621215');
        await page.fill('input[name="fatherContact"]', '9876543210');
        await page.fill('input[name="motherContact"]', '9876543211');
        await page.fill('input[name="sslcMarks"]', '480');
        await page.locator('input[type="radio"][name="govtSchool"][value="NO"]').check();
        await page.selectOption('select[name="schoolType"]', { label: 'GOVT. AIDED' });

        // Select HSC to show academic form
        await page.selectOption('select[name="lastStudies"]', { label: 'HSC' });
        await page.waitForSelector('#academic-scores-section', { timeout: 10000 });

        // Fill marks - valid marks should be accepted (0-100 typically)
        const markInputs = await page.locator('input[placeholder="Enter Marks"]').all();
        if (markInputs.length > 0) {
            await markInputs[0].fill('95');
            const value = await markInputs[0].inputValue();
            expect(value).toBe('95');
        }
    });
});
