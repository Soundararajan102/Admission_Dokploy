# User Form Test Fix

## Issue
The test `user-details.e2e.spec.cjs` was timing out at line 37 when waiting for the HSC School Name field to appear.

## Root Cause
The test was missing the `initial` field which is required by the form. Additionally, the academic section appears AFTER selecting `lastStudies`, and the test was trying to wait for fields using `waitForFunction` which was timing out.

## Fix Applied

### Changes Made:
1. **Added missing `initial` field** - Required by the form validation
2. **Fixed field selection order** - `lastStudies` must be selected BEFORE `schoolType` to trigger the academic section
3. **Improved waiting strategy** - Changed from `waitForFunction` to `waitForSelector` with proper heading text
4. **Updated selectors** - Used more reliable selectors that match the actual DOM structure
5. **Fixed medium select** - Used filter approach instead of complex parent traversal
6. **Updated success assertion** - Changed to wait for URL navigation to `/success` page

### Test Flow:
1. Fill personal information (including `initial`)
2. Select educational background
3. Select "HSC" from `lastStudies` - **This triggers academic section to appear**
4. Wait for "HSC State Board Scores" heading to confirm section loaded
5. Fill HSC-specific fields (school name, register number, medium, year)
6. Fill subject marks (6 subjects)
7. Submit form
8. Verify navigation to success page

### Key Improvements:
- ✅ More reliable waiting mechanism
- ✅ Proper field order matching application logic
- ✅ Better selectors that won't timeout
- ✅ Clearer test structure with comments

## Running the Test

```powershell
npx playwright test tests/user-details.e2e.spec.cjs --headed
```

The test should now complete successfully without timeout errors.
