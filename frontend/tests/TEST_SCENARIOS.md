# Student Scenario Tests - Complete Coverage

## Test Scenarios Summary

### Educational Background Scenarios (1-5)
1. **HSC + Hostel** - Male, Management, Boys Hostel Normal
2. **CBSE + Day Scholar + Bus** - Female, Government, College Bus
3. **Vocational + Hostel** - Female, Government, Girls Hostel AC
4. **Diploma + Lateral Entry** - Male, Management, Own Travel
5. **Dropout + Lateral Entry** - Male, Management, Own Travel

### Accommodation & Quota Combinations (6-9)
6. **GQ + Boys Hostel (Normal)** - Male, Government Quota, HSC, Tamil Medium
7. **MQ + Girls Hostel (AC)** - Female, Management Quota, CBSE, English Medium
8. **GQ + Day Scholar + Bus** - Male, Government Quota, HSC, College Bus
9. **MQ + Day Scholar + Own Travel** - Female, Management Quota, CBSE, Private

## Coverage Matrix

| Scenario | Quota | Accommodation | Room/Travel | Board | Gender | Community |
|----------|-------|---------------|-------------|-------|--------|-----------|
| 1 | Management | Boys Hostel | Normal 4 | HSC | Male | BC |
| 2 | Government | Day Scholar | College Bus | CBSE | Female | OC |
| 3 | Government | Girls Hostel | AC 2 | Vocational | Female | SC |
| 4 | Management | Day Scholar | Own Travel | Diploma | Male | MBC |
| 5 | Management | Day Scholar | Own Travel | Dropout | Male | BCM |
| 6 | Government | Boys Hostel | Normal 4 | HSC | Male | SC |
| 7 | Management | Girls Hostel | AC 2 | CBSE | Female | OC |
| 8 | Government | Day Scholar | College Bus | HSC | Male | MBC |
| 9 | Management | Day Scholar | Own Travel | CBSE | Female | BC |

## Key Features Tested

### Quota Types
- ✅ Government Quota (GQ) - Scenarios 2, 3, 6, 8
- ✅ Management Quota (MQ) - Scenarios 1, 4, 5, 7, 9

### Accommodation Types
- ✅ Boys Hostel (Normal 4 Members) - Scenarios 1, 6
- ✅ Girls Hostel (AC 2 Members) - Scenarios 3, 7
- ✅ Day Scholar + College Bus - Scenarios 2, 8
- ✅ Day Scholar + Own Travel - Scenarios 4, 5, 9

### Educational Backgrounds
- ✅ HSC State Board - Scenarios 1, 6, 8
- ✅ CBSE - Scenarios 2, 7, 9
- ✅ Vocational - Scenario 3
- ✅ Diploma (Lateral Entry) - Scenario 4
- ✅ Dropout (Lateral Entry) - Scenario 5

### Study Mediums
- ✅ English Medium - Scenarios 1, 2, 4, 7, 8, 9
- ✅ Tamil Medium - Scenarios 3, 6

### Communities Covered
- ✅ OC (Open Community) - Scenarios 2, 7
- ✅ BC (Backward Class) - Scenarios 1, 9
- ✅ BCM - Scenario 5
- ✅ MBC (Most Backward Class) - Scenarios 4, 8
- ✅ SC (Scheduled Caste) - Scenarios 3, 6

### Income Levels
- ✅ Less than 1 Lakh - Scenarios 3, 6
- ✅ 1-1.5 Lakhs - Scenarios 1, 8
- ✅ 1.5-2.5 Lakhs - Scenario 5
- ✅ 2.5-5 Lakhs - Scenarios 2, 9
- ✅ More than 5 Lakhs - Scenarios 4, 7

## Running Tests

### Run all scenarios
```powershell
npx playwright test tests/user-details.e2e.spec.cjs
```

### Run specific scenario
```powershell
npx playwright test tests/user-details.e2e.spec.cjs -g "Scenario 6"
```

### Run with UI
```powershell
npx playwright test tests/user-details.e2e.spec.cjs --ui
```

### Run in headed mode
```powershell
npx playwright test tests/user-details.e2e.spec.cjs --headed
```

## Expected Results
- ✅ All 9 scenarios should successfully submit
- ✅ Each should navigate to `/success` page
- ✅ Each should display success message with Enquiry ID
- ✅ Total test time: ~3-5 minutes (depending on network/server)

## Notes
- Each scenario uses unique student names for easy identification
- Tests use realistic data combinations
- All required fields are filled
- Helper function `fillCommonPersonalInfo` reduces code duplication
