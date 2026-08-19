// tests/user-details.e2e.spec.cjs
const { test, expect } = require('@playwright/test');

test.describe('Normal User Flow (No Auth)', () => {

  // Helper function to fill common personal details
  async function fillCommonPersonalInfo(page, { fullName, initial, dob, gender, accommodation, roomType, travelType }) {
    await page.fill('input[name="fullName"]', fullName);
    await page.fill('input[name="initial"]', initial);
    await page.fill('input[name="dob"]', dob);

    if (gender === 'Male') {
      await page.locator('label:has-text("Male")').nth(0).click();
    } else {
      await page.locator('label:has-text("Female")').nth(0).click();
    }

    if (accommodation === 'Hostel') {
      const hostelLabel = gender === 'Male' ? 'Boys Hostel' : 'Girls Hostel';
      await page.locator(`label:has-text("${hostelLabel}")`).click();
      if (roomType) {
        await page.waitForSelector('select[name="roomType"]', { state: 'visible' });
        await page.selectOption('select[name="roomType"]', { label: roomType });
      }
    } else {
      await page.locator('label:has-text("Day Scholar")').click();
      if (travelType) {
        await page.selectOption('select[name="travelType"]', { label: travelType });
      }
    }
  }

  test('Scenario 1: HSC student with hostel accommodation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('form', { timeout: 10000 });

    await page.selectOption('select[name="preference1"]', { label: 'CSE(Computer Science and Engineering)' });
    await page.locator('label:has-text("Management")').click();
    await page.locator('label:has-text("I Year")').click();

    await fillCommonPersonalInfo(page, {
      fullName: 'HSC Student One',
      initial: 'H',
      dob: '2004-05-10',
      gender: 'Male',
      accommodation: 'Hostel',
      roomType: 'Normal (4 Members)'
    });

    // Family details
    await page.fill('input[name="fatherName"]', 'Test Father');
    await page.fill('input[name="fatherOccupation"]', 'Engineer');
    await page.selectOption('select[name="community"]', { label: 'BC' });
    await page.fill('input[name="caste"]', 'TestCaste');
    await page.selectOption('select[name="annualIncome"]', { label: '1 Lakh to 1.5 Lakhs' });
    await page.locator('label:has-text("Yes")').first().click();

    // Address
    await page.fill('input[name="address1"]', '123 Test St');
    await page.fill('input[name="address2"]', 'Test Town');
    await page.fill('input[name="taluk"]', 'TestTaluk');
    await page.fill('input[name="district"]', 'TestDistrict');
    await page.fill('input[name="state"]', 'TestState');
    await page.fill('input[name="pincode"]', '621215');

    // Contacts
    await page.fill('input[name="fatherContact"]', '9876543210');
    await page.fill('input[name="motherContact"]', '9876543211');
    await page.fill('input[name="studentContact"]', '9876543212');

    // Education
    await page.fill('input[name="sslcMarks"]', '480');
    await page.locator('input[type="radio"][name="govtSchool"][value="NO"]').check();
    await page.selectOption('select[name="schoolType"]', { label: 'GOVT. AIDED' });
    await page.selectOption('select[name="lastStudies"]', { label: 'HSC' });

    await page.waitForSelector('text=HSC State Board Scores', { timeout: 10000 });

    await page.fill('input[placeholder="Enter School Name & Place"]', 'KNCET School, Trichy');
    await page.fill('input[placeholder="Enter Register Number"]', 'REG123001');

    const mediumSelect = page.locator('select').filter({ hasText: /Select Medium|English|Tamil/ }).first();
    await mediumSelect.selectOption({ label: 'English' });
    await page.fill('input[placeholder="Year Of Passing"]', '2024');

    const markInputs = await page.locator('input[placeholder="Enter Marks"]').all();
    await markInputs[0].fill('95');
    await markInputs[1].fill('92');
    await markInputs[2].fill('98');
    await markInputs[3].fill('90');
    await markInputs[4].fill('89');
    await markInputs[5].fill('96');

    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForURL(/\/success/, { timeout: 15000 });
    await expect(page.locator('text=/Success|Submitted|Enquiry/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Scenario 2: CBSE student with day scholar + college bus', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('form', { timeout: 10000 });

    await page.selectOption('select[name="preference1"]', { label: 'ECE(Electronics and Communication Engineering )' });
    await page.locator('label:has-text("Government")').click();
    await page.locator('label:has-text("I Year")').click();

    await fillCommonPersonalInfo(page, {
      fullName: 'CBSE Student Two',
      initial: 'C',
      dob: '2005-08-15',
      gender: 'Female',
      accommodation: 'Day Scholar',
      travelType: 'College Bus'
    });

    await page.fill('input[name="fatherName"]', 'CBSE Father');
    await page.fill('input[name="fatherOccupation"]', 'Teacher');
    await page.selectOption('select[name="community"]', { label: 'OC' });
    await page.fill('input[name="caste"]', 'General');
    await page.selectOption('select[name="annualIncome"]', { label: '2.5 Lakhs to 5 Lakhs' });
    await page.locator('label:has-text("No")').first().click();

    await page.fill('input[name="address1"]', '456 CBSE Street');
    await page.fill('input[name="address2"]', 'CBSE Town');
    await page.fill('input[name="taluk"]', 'CBSETaluk');
    await page.fill('input[name="district"]', 'CBSEDistrict');
    await page.fill('input[name="state"]', 'TamilNadu');
    await page.fill('input[name="pincode"]', '600001');

    await page.fill('input[name="fatherContact"]', '9123456780');
    await page.fill('input[name="motherContact"]', '9123456781');
    await page.fill('input[name="studentContact"]', '9123456782');

    await page.fill('input[name="sslcMarks"]', '475');
    await page.locator('input[type="radio"][name="govtSchool"][value="YES"]').check();
    await page.selectOption('select[name="schoolType"]', { label: 'GOVERNMENT' });
    await page.selectOption('select[name="lastStudies"]', { label: 'CBSE' });

    await page.waitForSelector('heading:has-text("CBSE Scores")', { timeout: 10000 });

    await page.fill('input[placeholder="Enter School Name & Place"]', 'CBSE School Delhi');
    await page.fill('input[placeholder="Enter Register Number"]', 'CBSE987002');

    const mediumSelect = page.locator('select').filter({ hasText: /Select Medium|English|Tamil/ }).first();
    await mediumSelect.selectOption({ label: 'English' });
    await page.fill('input[placeholder="Year Of Passing"]', '2024');

    const markInputs = await page.locator('input[placeholder="Enter Marks"]').all();
    await markInputs[0].fill('88');
    await markInputs[1].fill('94');
    await markInputs[2].fill('97');
    await markInputs[3].fill('92');
    await markInputs[4].fill('91');
    await markInputs[5].fill('95');

    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForURL(/\/success/, { timeout: 15000 });
    await expect(page.locator('text=/Success|Submitted|Enquiry/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Scenario 3: Vocational student with girls hostel', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('form', { timeout: 10000 });

    await page.selectOption('select[name="preference1"]', { label: 'IT(Information Technology)' });
    await page.locator('label:has-text("Government")').click();
    await page.locator('label:has-text("I Year")').click();

    await fillCommonPersonalInfo(page, {
      fullName: 'Vocational Student Three',
      initial: 'V',
      dob: '2004-11-25',
      gender: 'Female',
      accommodation: 'Hostel',
      roomType: 'AC + Attached (2 Members)'
    });

    await page.fill('input[name="fatherName"]', 'Vocational Father');
    await page.fill('input[name="fatherOccupation"]', 'Farmer');
    await page.selectOption('select[name="community"]', { label: 'SC' });
    await page.fill('input[name="caste"]', 'SCCaste');
    await page.selectOption('select[name="annualIncome"]', { label: 'Less than 1 Lakh' });
    await page.locator('label:has-text("Yes")').first().click();

    await page.fill('input[name="address1"]', '321 Vocational Lane');
    await page.fill('input[name="address2"]', 'Vocational Village');
    await page.fill('input[name="taluk"]', 'VocTaluk');
    await page.fill('input[name="district"]', 'VocDistrict');
    await page.fill('input[name="state"]', 'Andhra Pradesh');
    await page.fill('input[name="pincode"]', '500001');

    await page.fill('input[name="fatherContact"]', '8887776660');
    await page.fill('input[name="motherContact"]', '8887776661');
    await page.fill('input[name="studentContact"]', '8887776662');

    await page.fill('input[name="sslcMarks"]', '465');
    await page.locator('input[type="radio"][name="govtSchool"][value="YES"]').check();
    await page.selectOption('select[name="schoolType"]', { label: 'GOVERNMENT' });
    await page.selectOption('select[name="lastStudies"]', { label: 'Vocational' });

    await page.waitForSelector('heading:has-text("Vocational")', { timeout: 10000 });

    await page.fill('input[placeholder="Enter School Name & Place"]', 'Vocational School Chennai');

    const mediumSelect = page.locator('select').filter({ hasText: /Select Medium|English|Tamil/ }).first();
    await mediumSelect.selectOption({ label: 'Tamil' });
    await page.fill('input[placeholder="Year Of Passing"]', '2024');

    const markInputs = await page.locator('input[placeholder="Enter Marks"]').all();
    for (let i = 0; i < Math.min(6, markInputs.length); i++) {
      await markInputs[i].fill(`${85 + i}`);
    }

    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForURL(/\/success/, { timeout: 15000 });
    await expect(page.locator('text=/Success|Submitted|Enquiry/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Scenario 4: Diploma lateral entry with own travel', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('form', { timeout: 10000 });

    await page.selectOption('select[name="preference1"]', { label: 'MECH(Mechanical Engineering)' });
    await page.locator('label:has-text("Management")').click();
    await page.locator('label:has-text("Lateral Entry")').click();

    await fillCommonPersonalInfo(page, {
      fullName: 'Diploma Student Four',
      initial: 'D',
      dob: '2003-03-20',
      gender: 'Male',
      accommodation: 'Day Scholar',
      travelType: 'Own/Outside Travel'
    });

    await page.fill('input[name="fatherName"]', 'Diploma Father');
    await page.fill('input[name="fatherOccupation"]', 'Businessman');
    await page.selectOption('select[name="community"]', { label: 'MBC' });
    await page.fill('input[name="caste"]', 'MBCCaste');
    await page.selectOption('select[name="annualIncome"]', { label: 'More than 5 Lakhs' });
    await page.locator('label:has-text("Yes")').first().click();

    await page.fill('input[name="address1"]', '789 Diploma Road');
    await page.fill('input[name="address2"]', 'Diploma City');
    await page.fill('input[name="taluk"]', 'DiplomaTaluk');
    await page.fill('input[name="district"]', 'DiplomaDistrict');
    await page.fill('input[name="state"]', 'Karnataka');
    await page.fill('input[name="pincode"]', '560001');

    await page.fill('input[name="fatherContact"]', '9998887770');
    await page.fill('input[name="motherContact"]', '9998887771');
    await page.fill('input[name="studentContact"]', '9998887772');

    await page.fill('input[name="sslcMarks"]', '450');
    await page.locator('input[type="radio"][name="govtSchool"][value="NO"]').check();
    await page.selectOption('select[name="schoolType"]', { label: 'PRIVATE' });
    await page.selectOption('select[name="lastStudies"]', { label: 'Diploma' });

    await page.waitForSelector('heading:has-text("Diploma Scores")', { timeout: 10000 });

    // Fill diploma-specific fields - adjust selectors based on actual form
    const textInputs = await page.locator('input[type="text"]:visible').all();
    for (const input of textInputs) {
      const placeholder = await input.getAttribute('placeholder');
      if (placeholder && placeholder.toLowerCase().includes('college')) {
        await input.fill('Diploma Polytechnic College');
        break;
      }
    }

    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForURL(/\/success/, { timeout: 15000 });
    await expect(page.locator('text=/Success|Submitted|Enquiry/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Scenario 5: Dropout student lateral entry', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('form', { timeout: 10000 });

    await page.selectOption('select[name="preference1"]', { label: 'CIVIL(Civil Engineering)' });
    await page.locator('label:has-text("Management")').click();
    await page.locator('label:has-text("Lateral Entry")').click();

    await fillCommonPersonalInfo(page, {
      fullName: 'Dropout Student Five',
      initial: 'D',
      dob: '2002-07-10',
      gender: 'Male',
      accommodation: 'Day Scholar',
      travelType: 'Own/Outside Travel'
    });

    await page.fill('input[name="fatherName"]', 'Dropout Father');
    await page.fill('input[name="fatherOccupation"]', 'Government Employee');
    await page.selectOption('select[name="community"]', { label: 'BCM' });
    await page.fill('input[name="caste"]', 'BCMCaste');
    await page.selectOption('select[name="annualIncome"]', { label: '1.5 Lakhs to 2.5 Lakhs' });
    await page.locator('label:has-text("No")').first().click();

    await page.fill('input[name="address1"]', '654 Dropout Street');
    await page.fill('input[name="address2"]', 'Dropout Town');
    await page.fill('input[name="taluk"]', 'DropTaluk');
    await page.fill('input[name="district"]', 'DropDistrict');
    await page.fill('input[name="state"]', 'Kerala');
    await page.fill('input[name="pincode"]', '682001');

    await page.fill('input[name="fatherContact"]', '7776665550');
    await page.fill('input[name="motherContact"]', '7776665551');
    await page.fill('input[name="studentContact"]', '7776665552');

    await page.fill('input[name="sslcMarks"]', '440');
    await page.locator('input[type="radio"][name="govtSchool"][value="NO"]').check();
    await page.selectOption('select[name="schoolType"]', { label: 'PRIVATE' });
    await page.selectOption('select[name="lastStudies"]', { label: 'Dropout' });

    await page.waitForSelector('heading:has-text("College Dropout Details")', { timeout: 10000 });

    // Fill dropout-specific fields
    const collegeInput = page.locator('input[placeholder*="college"], input[placeholder*="College"]').first();
    if (await collegeInput.isVisible()) {
      await collegeInput.fill('Previous Engineering College, Chennai');
    }

    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForURL(/\/success/, { timeout: 15000 });
    await expect(page.locator('text=/Success|Submitted|Enquiry/i').first()).toBeVisible({ timeout: 5000 });
  });

  // === ACCOMMODATION & QUOTA SPECIFIC SCENARIOS ===

  test('Scenario 6: Government Quota + Boys Hostel (Normal Room)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('form', { timeout: 10000 });

    // GQ + Hostel combination
    await page.selectOption('select[name="preference1"]', { label: 'EEE(Electrical and Electronics Engineering)' });
    await page.locator('label:has-text("Government")').click(); // GQ
    await page.locator('label:has-text("I Year")').click();

    await fillCommonPersonalInfo(page, {
      fullName: 'GQ Hostel Student Six',
      initial: 'G',
      dob: '2004-09-15',
      gender: 'Male',
      accommodation: 'Hostel',
      roomType: 'Normal (4 Members)'
    });

    await page.fill('input[name="fatherName"]', 'GQ Father Name');
    await page.fill('input[name="fatherOccupation"]', 'Government Officer');
    await page.selectOption('select[name="community"]', { label: 'SC' });
    await page.fill('input[name="caste"]', 'SCCaste');
    await page.selectOption('select[name="annualIncome"]', { label: 'Less than 1 Lakh' });
    await page.locator('label:has-text("Yes")').first().click();

    await page.fill('input[name="address1"]', '100 GQ Hostel Street');
    await page.fill('input[name="address2"]', 'GQ Town');
    await page.fill('input[name="taluk"]', 'GQTaluk');
    await page.fill('input[name="district"]', 'GQDistrict');
    await page.fill('input[name="state"]', 'TamilNadu');
    await page.fill('input[name="pincode"]', '620001');

    await page.fill('input[name="fatherContact"]', '9100000010');
    await page.fill('input[name="motherContact"]', '9100000011');
    await page.fill('input[name="studentContact"]', '9100000012');

    await page.fill('input[name="sslcMarks"]', '490');
    await page.locator('input[type="radio"][name="govtSchool"][value="YES"]').check();
    await page.selectOption('select[name="schoolType"]', { label: 'GOVERNMENT' });
    await page.selectOption('select[name="lastStudies"]', { label: 'HSC' });

    await page.waitForSelector('text=HSC State Board Scores', { timeout: 10000 });

    await page.fill('input[placeholder="Enter School Name & Place"]', 'GQ Government School');
    await page.fill('input[placeholder="Enter Register Number"]', 'GQ006HSC');

    const mediumSelect = page.locator('select').filter({ hasText: /Select Medium|English|Tamil/ }).first();
    await mediumSelect.selectOption({ label: 'Tamil' });
    await page.fill('input[placeholder="Year Of Passing"]', '2024');

    const markInputs = await page.locator('input[placeholder="Enter Marks"]').all();
    await markInputs[0].fill('94');
    await markInputs[1].fill('91');
    await markInputs[2].fill('99');
    await markInputs[3].fill('93');
    await markInputs[4].fill('92');
    await markInputs[5].fill('97');

    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForURL(/\/success/, { timeout: 15000 });
    await expect(page.locator('text=/Success|Submitted|Enquiry/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Scenario 7: Management Quota + Girls Hostel (AC Room)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('form', { timeout: 10000 });

    // MQ + Girls Hostel AC
    await page.selectOption('select[name="preference1"]', { label: 'AIDS(Artificial Intelligence and Data Science Engineering)' });
    await page.locator('label:has-text("Management")').click(); // MQ
    await page.locator('label:has-text("I Year")').click();

    await fillCommonPersonalInfo(page, {
      fullName: 'MQ Hostel Student Seven',
      initial: 'M',
      dob: '2005-02-28',
      gender: 'Female',
      accommodation: 'Hostel',
      roomType: 'AC (2 Members)'
    });

    await page.fill('input[name="fatherName"]', 'MQ Father Name');
    await page.fill('input[name="fatherOccupation"]', 'Business Owner');
    await page.selectOption('select[name="community"]', { label: 'OC' });
    await page.fill('input[name="caste"]', 'OCCaste');
    await page.selectOption('select[name="annualIncome"]', { label: 'More than 5 Lakhs' });
    await page.locator('label:has-text("No")').first().click();

    await page.fill('input[name="address1"]', '200 MQ Hostel Avenue');
    await page.fill('input[name="address2"]', 'MQ City');
    await page.fill('input[name="taluk"]', 'MQTaluk');
    await page.fill('input[name="district"]', 'MQDistrict');
    await page.fill('input[name="state"]', 'Kerala');
    await page.fill('input[name="pincode"]', '680001');

    await page.fill('input[name="fatherContact"]', '9200000020');
    await page.fill('input[name="motherContact"]', '9200000021');
    await page.fill('input[name="studentContact"]', '9200000022');

    await page.fill('input[name="sslcMarks"]', '485');
    await page.locator('input[type="radio"][name="govtSchool"][value="NO"]').check();
    await page.selectOption('select[name="schoolType"]', { label: 'PRIVATE' });
    await page.selectOption('select[name="lastStudies"]', { label: 'CBSE' });

    await page.waitForSelector('text=/CBSE/i', { timeout: 10000 });

    await page.fill('input[placeholder="Enter School Name & Place"]', 'MQ CBSE Private School');
    await page.fill('input[placeholder="Enter Register Number"]', 'MQ007CBSE');

    const mediumSelect = page.locator('select').filter({ hasText: /Select Medium|English|Tamil/ }).first();
    await mediumSelect.selectOption({ label: 'English' });
    await page.fill('input[placeholder="Year Of Passing"]', '2024');

    const markInputs = await page.locator('input[placeholder="Enter Marks"]').all();
    await markInputs[0].fill('96');
    await markInputs[1].fill('98');
    await markInputs[2].fill('99');
    await markInputs[3].fill('97');
    await markInputs[4].fill('95');
    await markInputs[5].fill('98');

    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForURL(/\/success/, { timeout: 15000 });
    await expect(page.locator('text=/Success|Submitted|Enquiry/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Scenario 8: Government Quota + Day Scholar + College Bus', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('form', { timeout: 10000 });

    // GQ + Day Scholar + Bus
    await page.selectOption('select[name="preference1"]', { label: 'BME(Bio-Medical Engineering)' });
    await page.locator('label:has-text("Government")').click(); // GQ
    await page.locator('label:has-text("I Year")').click();

    await fillCommonPersonalInfo(page, {
      fullName: 'GQ Day Scholar Student Eight',
      initial: 'G',
      dob: '2004-06-20',
      gender: 'Male',
      accommodation: 'Day Scholar',
      travelType: 'College Bus'
    });

    await page.fill('input[name="fatherName"]', 'GQ Day Scholar Father');
    await page.fill('input[name="fatherOccupation"]', 'Teacher');
    await page.selectOption('select[name="community"]', { label: 'MBC' });
    await page.fill('input[name="caste"]', 'MBCCaste');
    await page.selectOption('select[name="annualIncome"]', { label: '1 Lakh to 1.5 Lakhs' });
    await page.locator('label:has-text("Yes")').first().click();

    await page.fill('input[name="address1"]', '300 GQ Day Scholar Road');
    await page.fill('input[name="address2"]', 'GQ Village');
    await page.fill('input[name="taluk"]', 'GQDayTaluk');
    await page.fill('input[name="district"]', 'GQDayDistrict');
    await page.fill('input[name="state"]', 'TamilNadu');
    await page.fill('input[name="pincode"]', '621001');

    await page.fill('input[name="fatherContact"]', '9300000030');
    await page.fill('input[name="motherContact"]', '9300000031');
    await page.fill('input[name="studentContact"]', '9300000032');

    await page.fill('input[name="sslcMarks"]', '470');
    await page.locator('input[type="radio"][name="govtSchool"][value="YES"]').check();
    await page.selectOption('select[name="schoolType"]', { label: 'GOVT. AIDED' });
    await page.selectOption('select[name="lastStudies"]', { label: 'HSC' });

    await page.waitForSelector('text=HSC State Board Scores', { timeout: 10000 });

    await page.fill('input[placeholder="Enter School Name & Place"]', 'GQ Aided School');
    await page.fill('input[placeholder="Enter Register Number"]', 'GQ008HSC');

    const mediumSelect = page.locator('select').filter({ hasText: /Select Medium|English|Tamil/ }).first();
    await mediumSelect.selectOption({ label: 'English' });
    await page.fill('input[placeholder="Year Of Passing"]', '2024');

    const markInputs = await page.locator('input[placeholder="Enter Marks"]').all();
    await markInputs[0].fill('87');
    await markInputs[1].fill('90');
    await markInputs[2].fill('95');
    await markInputs[3].fill('89');
    await markInputs[4].fill('88');
    await markInputs[5].fill('93');

    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForURL(/\/success/, { timeout: 15000 });
    await expect(page.locator('text=/Success|Submitted|Enquiry/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Scenario 9: Management Quota + Day Scholar + Own Travel', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('form', { timeout: 10000 });

    // MQ + Day Scholar + Own Travel
    await page.selectOption('select[name="preference1"]', { label: 'AGRI(Agricultural Engineering)' });
    await page.locator('label:has-text("Management")').click(); // MQ
    await page.locator('label:has-text("I Year")').click();

    await fillCommonPersonalInfo(page, {
      fullName: 'MQ Day Scholar Student Nine',
      initial: 'M',
      dob: '2005-12-10',
      gender: 'Female',
      accommodation: 'Day Scholar',
      travelType: 'Own/Outside Travel'
    });

    await page.fill('input[name="fatherName"]', 'MQ Day Scholar Father');
    await page.fill('input[name="fatherOccupation"]', 'Doctor');
    await page.selectOption('select[name="community"]', { label: 'BC' });
    await page.fill('input[name="caste"]', 'BCCaste');
    await page.selectOption('select[name="annualIncome"]', { label: '2.5 Lakhs to 5 Lakhs' });
    await page.locator('label:has-text("No")').first().click();

    await page.fill('input[name="address1"]', '400 MQ Day Scholar Lane');
    await page.fill('input[name="address2"]', 'MQ Town');
    await page.fill('input[name="taluk"]', 'MQDayTaluk');
    await page.fill('input[name="district"]', 'MQDayDistrict');
    await page.fill('input[name="state"]', 'Karnataka');
    await page.fill('input[name="pincode"]', '560002');

    await page.fill('input[name="fatherContact"]', '9400000040');
    await page.fill('input[name="motherContact"]', '9400000041');
    await page.fill('input[name="studentContact"]', '9400000042');

    await page.fill('input[name="sslcMarks"]', '495');
    await page.locator('input[type="radio"][name="govtSchool"][value="NO"]').check();
    await page.selectOption('select[name="schoolType"]', { label: 'PRIVATE' });
    await page.selectOption('select[name="lastStudies"]', { label: 'CBSE' });

    await page.waitForSelector('text=/CBSE/i', { timeout: 10000 });

    await page.fill('input[placeholder="Enter School Name & Place"]', 'MQ Private CBSE School');
    await page.fill('input[placeholder="Enter Register Number"]', 'MQ009CBSE');

    const mediumSelect = page.locator('select').filter({ hasText: /Select Medium|English|Tamil/ }).first();
    await mediumSelect.selectOption({ label: 'English' });
    await page.fill('input[placeholder="Year Of Passing"]', '2024');

    const markInputs = await page.locator('input[placeholder="Enter Marks"]').all();
    await markInputs[0].fill('93');
    await markInputs[1].fill('96');
    await markInputs[2].fill('98');
    await markInputs[3].fill('94');
    await markInputs[4].fill('95');
    await markInputs[5].fill('97');

    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForURL(/\/success/, { timeout: 15000 });
    await expect(page.locator('text=/Success|Submitted|Enquiry/i').first()).toBeVisible({ timeout: 5000 });
  });
});
