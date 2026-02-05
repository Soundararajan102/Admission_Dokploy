import React, { useState, useEffect } from 'react';
import { PDFDocument, PDFName, StandardFonts } from 'pdf-lib';

export default function PDFPreviewModal({ 
  isOpen, 
  onClose, 
  studentData,
  scoresData,
  studentName 
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [generatedPdfBytes, setGeneratedPdfBytes] = useState(null);

  // Cleanup preview URL when component unmounts or closes
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  // Auto-generate PDF when modal opens
  useEffect(() => {
    if (isOpen && studentData) {
     
      
      // Verify critical academic fields
      if (!(scoresData && Object.keys(scoresData).length > 0)) {
        
        console.warn('⚠️ No academic scores data available - will use fallback values');
      }
      
      handleGeneratePreview();
    }
  }, [isOpen, studentData]);

  // Convert date to DD-MM-YYYY format for PDF
  const formatDateForPDF = (dateString) => {
    if (!dateString) return "";
    try {
      // Handle ISO timestamp format (YYYY-MM-DDTHH:mm:ss.sssZ) - avoid timezone issues
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(dateString)) {
        const datePart = dateString.split('T')[0]; // Extract just "2026-01-08"
        const [year, month, day] = datePart.split('-');
        return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
      }
      
      // Check if it's in YYYY-MM-DD format (ISO format from date input)
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
      }
      
      // If it's already in DD-MM-YYYY format, return with proper padding
      if (typeof dateString === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('-');
        return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
      }
      
      // If it's in DD/MM/YYYY format, convert to DD-MM-YYYY
      if (typeof dateString === 'string' && dateString.includes('/') && dateString.split('/').length === 3) {
        const parts = dateString.split('/');
        const [day, month, year] = parts;
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
        }
      }
      
      // Try to parse as Date object - but use UTC methods to avoid timezone shift
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        // Check if it's a UTC date string to avoid timezone issues
        if (typeof dateString === 'string' && dateString.includes('T')) {
          // Use UTC methods for ISO strings
          const day = String(date.getUTCDate()).padStart(2, '0');
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const year = date.getUTCFullYear();
          return `${day}-${month}-${year}`;
        } else {
          // Use local methods for other formats
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }
      }
      
      return "";
    } catch (e) {
      return "";
    }
  };

  /**
   * Fills the PDF admission form with student data
   * Maps all studentData fields to PDF form fields
   */
  const generateFilledPDF = async () => {
    try {
     

      // Load the PDF template
      const templatePath = '/assets/admission-form-template.pdf';
      const existingPdfBytes = await fetch(templatePath).then(res => res.arrayBuffer());
      
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      const defaultFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Resolve actual PDF field names (many are nested like "undefined.name")
      const resolveFieldName = (fieldName) => {
        const exact = fields.find((field) => field.getName() === fieldName);
        if (exact) return exact.getName();

        const suffixMatches = fields.filter((field) => field.getName().endsWith(`.${fieldName}`));
        if (suffixMatches.length === 1) {
          return suffixMatches[0].getName();
        }

        if (suffixMatches.length > 1) {
          console.warn(
            `Field '${fieldName}' matched multiple PDF fields: ${suffixMatches
              .map((field) => field.getName())
              .join(', ')}`
          );
        } else {
          console.warn(`Field '${fieldName}' not found in the PDF template`);
        }
        return null;
      };
      

      const pickValue = (...keys) => {
        for (const key of keys) {
          const value = studentData?.[key];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
        return '';
      };

      const studiesHints = [studentData?.lastStudies, studentData?.typeStudies, studentData?.studyType]
        .map((value) => (typeof value === 'string' ? value.toLowerCase() : ''));
      const isVocational = studiesHints.some((hint) => hint.includes('vocational'));
      const isDiploma = studiesHints.some((hint) => hint.includes('diploma'));

      const chooseDiplomaValue = (diplomaKey, ...otherKeys) => {
        return isDiploma
          ? pickValue(diplomaKey, ...otherKeys)
          : pickValue(...otherKeys, diplomaKey);
      };

      // Helper function to set checkbox in a checkbox group (radio-style)
      const setCheckboxInGroup = (fieldName, exportValue) => {
        try {
          const actualName = resolveFieldName(fieldName);
          if (!actualName) return false;
          const field = form.getField(actualName);
          
          // Use the high-level API to select the radio button
          try {
            field.select(exportValue);
            console.log(`✓ Set ${fieldName} = ${exportValue}`);
            return true;
          } catch (selectError) {
            // If high-level API fails, try low-level approach
            const acroField = field.acroField;
            const kidsArray = acroField.Kids();
            
            if (!kidsArray) {
              console.warn(`No widgets found for ${fieldName}`);
              return false;
            }
            
            const numKids = kidsArray.size();
            let foundMatch = false;
            let availableOptions = []; // Track all available options
            
            for (let i = 0; i < numKids; i++) {
              try {
                const widget = kidsArray.lookup(i);
                
                if (!widget) continue;
                
                const ap = widget.lookup(PDFName.of('AP'));
                
                if (ap) {
                  const n = ap.lookup(PDFName.of('N'));
                  
                  if (n && n.entries) {
                    for (const [key, val] of n.entries()) {
                      const keyStr = key.decodeText ? key.decodeText() : key.toString().replace(/^\//, '');
                      
                      // Collect all available options (excluding 'Off')
                      if (keyStr !== 'Off' && !availableOptions.includes(keyStr)) {
                        availableOptions.push(keyStr);
                      }
                      
                      if (keyStr === exportValue && keyStr !== 'Off') {
                        // Set the appearance state to the export value on the widget
                        widget.set(PDFName.of('AS'), PDFName.of(exportValue));
                        foundMatch = true;
                      } else if (keyStr !== exportValue && keyStr !== 'Off') {
                        // Uncheck other options in the group
                        widget.set(PDFName.of('AS'), PDFName.of('Off'));
                      }
                    }
                  }
                }
              } catch (widgetError) {
                continue;
              }
            }
            
            // Set the field value using the context method
            if (foundMatch) {
              try {
                acroField.dict.set(PDFName.of('V'), PDFName.of(exportValue));
                console.log(`✓ Set ${fieldName} = ${exportValue} (low-level)`);
              } catch (dictError) {
                console.warn(`Could not set field value for ${fieldName}:`, dictError.message);
              }
            }
            
            if (!foundMatch) {
              console.warn(`⚠ Export value '${exportValue}' not found in ${fieldName}`);
              if (availableOptions.length > 0) {
                console.warn(`   Available options in ${fieldName}:`, availableOptions);
              }
            }
            return foundMatch;
          }
        } catch (error) {
          console.warn(`✗ Could not set ${fieldName}:`, error.message);
          return false;
        }
      };

      // Helper function to safely set text field value
      const setTextField = (fieldName, value, options = {}) => {
        try {
          const actualName = resolveFieldName(fieldName);
          if (!actualName) return;
          const field = form.getTextField(actualName);
          if (field && value !== undefined && value !== null && value !== '') {
            const stringValue = String(value);
            field.setText(stringValue);
            
            // Apply font size if specified
            if (options.fontSize !== undefined) {
              const calculatedSize = options.fontSize;
              const finalSize = Math.min(calculatedSize, 12);
              field.setFontSize(finalSize);
            }
          }
        } catch (error) {
          console.warn(`✗ Could not set text field '${fieldName}':`, error.message);
        }
      };

      // Helper function to set checkbox
      const setCheckbox = (fieldName, checked) => {
        try {
          const actualName = resolveFieldName(fieldName);
          if (!actualName) return;
          const field = form.getCheckBox(actualName);
          if (field) {
            if (checked) {
              field.check();
            } else {
              field.uncheck();
            }
          }
        } catch (error) {
          console.warn(`✗ Could not set checkbox '${fieldName}':`, error.message);
        }
      };

      // Map data to PDF fields
      
      // Basic Information
      setTextField('admission-id', studentData.admissionId ||studentData.id || '');
      setTextField('date', formatDateForPDF(studentData.applicationDate || ''));
      setTextField('name', studentData.fullName || ''); 
      const dobValue = formatDateForPDF(studentData.dob);
      const dobFontSize = dobValue.length > 10 ? 10 : 12;
      setTextField('date-of-birth', dobValue, { fontSize: Math.min(dobFontSize, 12) });
      
      // Gender - checkbox group
      if (studentData.gender === 'MALE' || studentData.gender === 'Male') {
        setCheckboxInGroup('gender', 'male');
      } else if (studentData.gender === 'FEMALE' || studentData.gender === 'Female') {
        setCheckboxInGroup('gender', 'female');
      }

      // Department checkboxes - comprehensive mapping
      const deptMapping = {
        // Short forms
        'AD': 'ad-dept',
        'AG': 'age-dept',
        'AI & DS': 'ad-dept',
        'AIDS': 'ad-dept',
        'BME': 'bme-dept',
        'Civil': 'civil-dept',
        'CIVIL': 'civil-dept',
        'CSE': 'cse-dept',
        'ECE': 'ece-dept',
        'EEE': 'eee-dept',
        'IT': 'it-dept',
        'Mechanical': 'mech-dept',
        'MECH': 'mech-dept',
        'Agriculture': 'age-dept',
        'AGRI': 'age-dept',
        // Full degree names from degree array
        'B.Tech - Artificial Intelligence and Data Science Engineering (AD)': 'ad-dept',
        'B.Tech - Agricultural Engineering (AG)': 'age-dept',
        'B.E - Bio-Medical Engineering (BME)': 'bme-dept',
        'B.E - Computer Science and Engineering (CSE)': 'cse-dept',
        'B.E - Civil Engineering (CIVIL)': 'civil-dept',
        'B.E - Electronics and Communication Engineering (ECE)': 'ece-dept',
        'B.E - Electrical and Electronics Engineering (EEE)': 'eee-dept',
        'B.Tech - Information Technology (IT)': 'it-dept',
        'B.E - Mechanical Engineering (MECH)': 'mech-dept',
        // Full forms with parentheses (old format)
        'AD(Artificial and Data Science Engineering)': 'ad-dept',
        'AIDS(Artificial Intelligence and Data Science Engineering)': 'ad-dept',
        'BME(Bio Medical Engineering)': 'bme-dept',
        'BME(Bio-Medical Engineering)': 'bme-dept',
        'CIVIL(Civil Engineering)': 'civil-dept',
        'CSE(Computer Science and Engineering)': 'cse-dept',
        'ECE(Electronics and Communication Engineering)': 'ece-dept',
        'ECE(Electronics and Communication Engineering )': 'ece-dept',
        'EEE(Electrical and Electronics Engineering)': 'eee-dept',
        'IT(Information Technology)': 'it-dept',
        'MECH(Mechanical Engineering)': 'mech-dept',
        'AGRI(Agricultural Engineering)': 'age-dept'
      };
      
      // Check all department preferences (1-9) and mark them as selected
      const selectedDepartments = new Set(); // Track unique departments
      
      for (let i = 1; i <= 9; i++) {
        const preferenceKey = `preference${i}`;
        const preferenceValue = studentData[preferenceKey];
        
        if (preferenceValue && deptMapping[preferenceValue]) {
          const fieldName = deptMapping[preferenceValue];
          
          // Only check if not already checked (avoid duplicates)
          if (!selectedDepartments.has(fieldName)) {
            setCheckbox(fieldName, true);
            selectedDepartments.add(fieldName);
          }
        } else if (preferenceValue) {
          console.warn(`  ⚠ Preference ${i}: Department '${preferenceValue}' not found in mapping`);
        }
      }
      
      
      // Branch awarded
      setTextField('branch-awarded', studentData.branchAwarded  || '');

      // Department Preferences (1-9)
      
      // Map department short codes to PDF field names
      const deptPreferenceFieldMap = {
        'AD': 'ad-prefer',
        'AG': 'ag-prefer',
        'BME': 'bme-prefer',
        'CSE': 'cse-prefer',
        'CIVIL': 'civil-prefer',
        'ECE': 'ece-prefer',
        'EEE': 'eee-prefer',
        'IT': 'it-prefer',
        'MECH': 'mech-prefer'
      };
      
      const extractDeptCode = (preferenceStr) => {
        if (!preferenceStr) return null;
        
      
        const match1 = preferenceStr.match(/\(([A-Z]+)\)$/);
        if (match1) return match1[1];
        
        const match2 = preferenceStr.match(/^([A-Z]+)\(/);
        if (match2) return match2[1];
        
        if (/^[A-Z]+$/.test(preferenceStr)) return preferenceStr;
        
        return null;
      };
      
      for (let i = 1; i <= 9; i++) {
        const preferenceKey = `preference${i}`;
        const preferenceValue = studentData[preferenceKey];
        
        if (preferenceValue) {
          const deptCode = extractDeptCode(preferenceValue);
          
          if (deptCode && deptPreferenceFieldMap[deptCode]) {
            const pdfField = deptPreferenceFieldMap[deptCode];
            setTextField(pdfField, i.toString());
          } else {
            console.warn(`  ⚠ Could not extract department code from preference${i}: ${preferenceValue}`);
          }
        }
      }
      

      // Admission type
      if (studentData.entry === 'I YEAR') {
        setCheckboxInGroup('admission-type', 'I-year');
      } else if (studentData.entry === 'LATERAL ENTRY') {
        setCheckboxInGroup('admission-type', 'lateral-entry');
      }

      // Family Details
      setTextField('father/guardian-name', studentData.fatherName || '');
      setTextField('father/guardian-occupation', studentData.fatherOccupation || '');
      setTextField('family-income', studentData.annualIncome || '');
      
      // Set caste field with dynamic font size
      const casteRawValue = studentData.caste || '';
      const casteValue = casteRawValue.length > 18 
        ? casteRawValue 
        : ((studentData.caste === 'NOT REQUIRED' || studentData.community === 'OC') ? '-' : casteRawValue);
      
      // If length < 18, use fontSize 12; otherwise pass original data without fontSize
      if (casteValue.length < 18) {
        setTextField('caste', casteValue, { fontSize: 12 });
      } else {
        setTextField('caste', casteValue);
      }

      // Community
      const communityMap = {
        'OC': 'oc',
        'BC': 'BC',
        'BCM': 'bcm',
        'MBC': 'mbc',
        'SC': 'sc',
        'SCA': 'sca',
        'SCC': 'scc',
        'ST': 'st'
      };
      if (studentData.community && communityMap[studentData.community]) {
        setCheckboxInGroup('community', communityMap[studentData.community]);
      }

      // Seat Type
      if (studentData.quota === 'GQ') {
        setCheckboxInGroup('seat-type', 'governement');
      } else if (studentData.quota === 'MQ') {
        setCheckboxInGroup('seat-type', 'management');
      }

      // Government eligible
      if (studentData.govtSchool === 'YES') {
        setCheckboxInGroup('govt-eligible', 'yes');
      } else if (studentData.govtSchool === 'NO') {
        setCheckboxInGroup('govt-eligible', 'no');
      }

      // First graduate
      if (studentData.firstGrad === 'YES') {
        setCheckboxInGroup('first-graduate', 'yes');
      } else if (studentData.firstGrad === 'NO') {
        setCheckboxInGroup('first-graduate', 'no');
      }

  
      if (studentData.accommodation === 'BoysHostel' || studentData.accommodation === 'BOYSHOSTEL') {
        setCheckboxInGroup('student-type', 'boys-hostel');
      } else if (studentData.accommodation === 'GirlsHostel' || studentData.accommodation === 'GIRLSHOSTEL') {
        setCheckboxInGroup('student-type', 'girls-hostel');
      } else if (studentData.accommodation === 'DAYSCHOLAR' || studentData.accommodation === 'DAYSCHOLAR') {
        // Day Scholar has a separate checkbox field
        setCheckbox('days-scholar', true);
      }
      
      // Travel type for day scholars (college-bus or out-bus)
      if ((studentData.accommodation === 'DayScholar' || studentData.accommodation === 'DAYSCHOLAR') && studentData.travelType) {
        if (studentData.travelType === 'COLLEGEBUS') {
          setCheckboxInGroup('student-type', 'college-bus');
        } else if (studentData.travelType === 'OUTBUS') {
          setCheckboxInGroup('student-type', 'out-bus');
        }
      }
      

      if (studentData.accommodation === 'BoysHostel' || studentData.accommodation === 'GirlsHostel' || 
          studentData.accommodation === 'BOYSHOSTEL' || studentData.accommodation === 'GIRLSHOSTEL') {
        // Map room type to simplified format for PDF
        let roomTypeText = '';
        const roomType = studentData.roomType || '';
        
        // Check for different room type formats
        // Handle BOYSHOSTEL(N), GIRLSHOSTEL(N), BOYSHOSTEL(A), BOYSHOSTEL(AC), etc.
        if (roomType.includes('(N)') || roomType.toLowerCase().includes('(n)')) {
          roomTypeText = 'NORMAL';
        } else if (roomType.includes('(AC)') || roomType.toLowerCase().includes('(ac)')) {
          roomTypeText = 'ATTACHED AC';
        } else if (roomType.includes('(A)') || roomType.toLowerCase().includes('(a)')) {
          roomTypeText = 'ATTACHED';
        } else if (roomType.toLowerCase().includes('normal') || roomType === 'normal1' || roomType === 'normal2' || roomType === 'normal3' || roomType === 'normal4') {
          roomTypeText = 'NORMAL ROOM';
        } else if (roomType.toLowerCase().includes('ac') || roomType.toLowerCase().includes('a/c')) {
          roomTypeText = 'ATTACHED AC ROOM';
        } else if (roomType.includes('A') && !roomType.includes('a')) {
          roomTypeText = 'ATTACHED ROOM';
        } else if (roomType) {
          // If room type exists but doesn't match patterns, use it as-is
          roomTypeText = roomType;
        }
      
        setTextField('bus-stop', roomTypeText);
        setTextField('bus-stop-room-type', 'Room Type');
      } else {
        // Day scholar - use bus stop name
        setTextField('bus-stop', studentData.busStopName || '');
        setTextField('bus-stop-room-type', 'Bus Stop');
      }
      

      // Address Details
      setTextField('address-line-1', studentData.address1 || '');
      setTextField('address-line-2', studentData.address2 || '');
      setTextField('taluk', studentData.taluk || '');
      setTextField('district', studentData.district || '');
      setTextField('state', studentData.state || '');
      setTextField('pin-code', studentData.pincode || '');

      // Contact Numbers
      setTextField('contact-No-(father)', studentData.fatherContact || '');
      setTextField('contact-No-(mother)', studentData.motherContact || '');
      setTextField('contact-No-(student)', studentData.studentContact || '');

     
      // ====== ACADEMIC INFORMATION SECTION ======
      
      // Academic information - prioritize scoresData from Academic tab
      const academicSchoolName = scoresData?.schoolName || chooseDiplomaValue('diplomaInstitution', 'schoolName', 'vocationalSchoolName', 'nameAndPlaceOfCollege');
      const academicRegisterNo = scoresData?.registerNumber || chooseDiplomaValue('diplomaRegisterNo', 'registrationNo', 'registerNumber', 'registerNo');
      const academicCourseType = scoresData?.courseType || pickValue('lastStudies', 'typeStudies');
      const academicMedium = scoresData?.medium || (chooseDiplomaValue('diplomaProgram', 'mediumOfStudy', 'vocationalMediumOfStudy', 'medium') || 'English');
      const academicYearOfPassing = scoresData?.yearOfPassing || chooseDiplomaValue('diplomaCompletionYear', 'yearOfPassing', 'vocationalYearOfPassing', 'passingYear');
      
      // School name - if length < 29, use fontSize 12; otherwise pass original data without fontSize
      if (academicSchoolName && academicSchoolName.length < 29) {
        setTextField('name-and-place-of-college', academicSchoolName, { fontSize: 12 });
      } else {
        setTextField('name-and-place-of-college', academicSchoolName);
      }
      setTextField('register-no', academicRegisterNo);
      
      // Type studies - if length < 5, use fontSize 12; otherwise pass original data without fontSize
      if (academicCourseType && academicCourseType.length < 5) {
        setTextField('type-studies', academicCourseType, { fontSize: 12 });
      } else {
        setTextField('type-studies', academicCourseType);
      }
      
      // Medium of study - if length < 6, use fontSize 12; otherwise pass original data without fontSize
      if (academicMedium && academicMedium.length < 5) {
        setTextField('medium-of-study', academicMedium, { fontSize: 12 });
      } else {
        setTextField('medium-of-study', academicMedium);
      }
      
      setTextField('year-of-passing', academicYearOfPassing);

      // SSLC Marks
      setTextField('sslc-mark', studentData.sslcMarks || '');
      
      // Calculate SSLC Percentage (divide by 5 and format to 2 decimal points)
      const sslcPercentage = studentData.sslcMarks ? (parseFloat(studentData.sslcMarks) / 5).toFixed(2) : '';
      setTextField('sslc-percentage', sslcPercentage);

      // HSC/CBSE Marks - Use scoresData if available, otherwise fallback to studentData
      const chooseMarks = (vocationalKey, academicKey) => {
        return isVocational
          ? pickValue(vocationalKey, academicKey)
          : pickValue(academicKey, vocationalKey);
      };

     
      
      // Dynamic subject mapping based on actual subject names from scoresData
      const subjectPdfFieldMap = {
        'tamil': 'tamil',
        'english': 'english',
        'mathematics': 'maths',
        'maths': 'maths',
        'physics': 'physics',
        'chemistry': 'chemistry',
        'computer science / biology': 'computer-science/biology',
        'computer science/biology': 'computer-science/biology',
        'COMPUTER SCIENCE / BIOLOGY': 'computer-science/biology',
        'COMPUTER SCIENCE/BIOLOGY': 'computer-science/biology',
        'biology': 'computer-science/biology',
        'computer science': 'computer-science/biology',
        'cs': 'computer-science/biology',
        'bio': 'computer-science/biology'
      };
      
      // Map subjects dynamically
      if (scoresData) {
        for (let i = 1; i <= 6; i++) {
          const subjectName = scoresData[`subject${i}`];
          const subjectMarks = scoresData[`subject${i}Marks`];
          
          if (subjectName && subjectMarks !== undefined && subjectMarks !== null) {
            const normalizedSubject = subjectName.toLowerCase().trim();
            const pdfField = subjectPdfFieldMap[normalizedSubject];
            
            if (pdfField) {
              // Don't display 0 marks - show empty field instead
              const markValue = (subjectMarks === 0 || subjectMarks === '0') ? '' : subjectMarks;
              setTextField(pdfField, markValue);
            } else {
              console.warn(`  ⚠ No PDF field mapping for subject: ${subjectName}`);
            }
          }
        }
      } else {
        // Fallback to old mapping if scoresData not available
        const formatMark = (val) => (val === 0 || val === '0' || !val) ? '' : val;
        const subjectFieldMappings = [
          ['tamil', formatMark(chooseMarks('vocationalTamilMarks', 'tamilMarks'))],
          ['english', formatMark(chooseMarks('vocationalEnglishMarks', 'englishMarks'))],
          ['physics', formatMark(chooseMarks('vocationalSubject3Marks', 'physicsMarks'))],
          ['chemistry', formatMark(chooseMarks('vocationalSubject4Marks', 'chemistryMarks'))],
          ['maths', formatMark(chooseMarks('vocationalSubject5Marks', 'mathsMarks'))],
          ['computer-science/biology', formatMark(chooseMarks('vocationalSubject6Marks', 'csOrBioMarks'))]
        ];

        subjectFieldMappings.forEach(([field, value]) => {
          setTextField(field, value);
        });
      }
      
      // Helper to format values - hide 0 and 0.00
      const formatValue = (val) => {
        if (val === null || val === undefined || val === '' || val === 0 || val === '0' || val === '0.00' || val === 0.00) {
          return '';
        }
        // Also check if it's a string that equals "0" or "0.00" after parsing
        const numVal = parseFloat(val);
        if (!isNaN(numVal) && numVal === 0) {
          return '';
        }
        return val;
      };
      
      // HSC Total and Percentage (use scoresData first, then fallback to vocational/other totals)
      const hscTotalValue = scoresData?.totalMarks || chooseMarks('vocationalTotalMarks', 'hscTotalMarks');
      const hscPercentageValue = scoresData?.percentage || chooseMarks('vocationalPercentage', 'hscPercentage');
      const cutoffValue = scoresData?.cutoff || chooseMarks('vocationalCutoff', 'cutoffMarks');
      
      setTextField('hsc-total-mark', formatValue(hscTotalValue));
      setTextField('hsc-mark-percentage', formatValue(hscPercentageValue));
      setTextField('cutoff', formatValue(cutoffValue));

      // Calculate and set Physics-Chemistry Cutoff and Maths Cutoff
      let physicsMarks = 0;
      let chemistryMarks = 0;
      let mathsMarks = 0;

      if (scoresData) {
        // Extract marks from scoresData by finding physics, chemistry, and maths subjects
        for (let i = 1; i <= 6; i++) {
          const subjectName = scoresData[`subject${i}`];
          const subjectMarks = parseFloat(scoresData[`subject${i}Marks`]) || 0;
          
          if (subjectName) {
            const normalizedSubject = subjectName.toLowerCase().trim();
            if (normalizedSubject === 'physics') {
              physicsMarks = subjectMarks;
            } else if (normalizedSubject === 'chemistry') {
              chemistryMarks = subjectMarks;
            } else if (normalizedSubject === 'mathematics' || normalizedSubject === 'maths') {
              mathsMarks = subjectMarks;
            }
          }
        }
      } else {
        // Fallback to old data structure
        physicsMarks = parseFloat(chooseMarks('vocationalSubject3Marks', 'physicsMarks')) || 0;
        chemistryMarks = parseFloat(chooseMarks('vocationalSubject4Marks', 'chemistryMarks')) || 0;
        mathsMarks = parseFloat(chooseMarks('vocationalSubject5Marks', 'mathsMarks')) || 0;
      }

      // Calculate Physics-Chemistry Cutoff: (Physics + Chemistry) / 2
      const physicsChemistryCutoff = ((physicsMarks + chemistryMarks) / 2).toFixed(2);
      
      // Calculate Engineering Eligibility Mark: Physics + Chemistry + Mathematics
      const engineeringEligibilityMark = (physicsMarks + chemistryMarks + mathsMarks);
     
      setTextField('physics-chemistry-cutoff', formatValue(physicsChemistryCutoff));
      setTextField('maths-cutoff', formatValue(mathsMarks));
      setTextField('engineering-eligibility-mark', formatValue(engineeringEligibilityMark));

      // Reference Information
      const consultingTypeUpper = (studentData.consultingType || '').toString().trim().toUpperCase();
      const consultingCode = consultingTypeUpper === 'CONSULTING'
        ? 'C'
        : (consultingTypeUpper === 'NOT CONSULTING' || consultingTypeUpper === 'NON CONSULTING')
          ? 'NC'
          : (studentData.consultingType || '');
      setTextField('consulting-type', consultingCode);
      setTextField('know-about-this-college', studentData.knowAbout || '');
      
      // Combine referencePrefix and referenceName for display
      const referenceDisplayName = [studentData.referencePrefix, studentData.referenceName]
        .filter(Boolean)
        .join(' ');
      setTextField('reference-name', referenceDisplayName || '');
      setTextField('reference-contact-no', studentData.referenceContact || '');

      // Diploma marks (conditional - only for diploma students)
      if (studentData.lastStudies === 'Diploma') {
        setTextField('diploma-1-to-5-sem', studentData.fifthSemMarks || '');
        setTextField('diploma-1-to-6-sem', studentData.sixthSemMarks || '');
      }

      // Engineering eligibility - prioritize scoresData from Academic tab
      const engineeringEligibility = scoresData?.eligibility || cutoffValue;
      setTextField('engineering-eligibility', formatValue(engineeringEligibility));

      // === FEE STRUCTURE MAPPING ===

      if (studentData.quota === 'Government') {
        // Government seat fees
        setTextField('government-tuition-fee', studentData.tuitionFee || '');
        setTextField('government-development-fee', studentData.developmentFee || '');
        setTextField('government-admission-fee', studentData.admissionFee || '');
        setTextField('government-caution deposit-fee', studentData.cautionDeposit || '');
        setTextField('government-optional-fee', studentData.optionalFees || '');
        
        // Scholarships
        setTextField('government-sc/st-scholorship', studentData.scStScholarship || '');
        setTextField('government-first-graduate-fee', studentData.fgScholarship || '');
        
        // Transportation & Hostel
        setTextField('government-bus-fee', studentData.busFee || '');
        setTextField('government-mess-bill', studentData.messBill || '');
        setTextField('government-room-rent', studentData.roomRent || '');
        setTextField('government-laundry-fee', studentData.laundryCharges || '');
        
        // Totals
        setTextField('government-tuition-total-fee', studentData.feeSubTotal || '');
        setTextField('government-college-total-fee', studentData.feeCollegeTotal || '');
        setTextField('government-total-hostel-fee', studentData.feeHostelTotal || '');
        setTextField('government-overall-fee', studentData.feeOverallTotal || '');
        
        
      } else if (studentData.quota === 'Management') {
        // Management seat fees
        setTextField('management-tuition-fee', studentData.tuitionFee || '');
        setTextField('management-development-fee', studentData.developmentFee || '');
        setTextField('management-admission-fee', studentData.admissionFee || '');
        setTextField('management-caution deposit-fee', studentData.cautionDeposit || '');
        setTextField('management-optional-fee', studentData.optionalFees || '');
        
        // Scholarships
        setTextField('management-sc/st-scholarship', studentData.scStScholarship || '');
        setTextField('management-first-graduate-fee', studentData.fgScholarship || '');
        
        // Transportation & Hostel
        setTextField('management-bus-fee', studentData.busFee || '');
        setTextField('management-mess-bill', studentData.messBill || '');
        setTextField('management-room-rent', studentData.roomRent || '');
        setTextField('management-laundry-fee', studentData.laundryCharges || '');
        
        // Totals
        setTextField('management-tuition-total-fee', studentData.feeSubTotal || '');
        setTextField('management-college-total-fee', studentData.feeCollegeTotal || '');
        setTextField('management-total-hostel-fee', studentData.feeHostelTotal || '');
        setTextField('management-overall-fee', studentData.feeOverallTotal || '');
        
      }

      // CRITICAL: Ensure all radio buttons have proper appearance states set
      // before updating field appearances
      const allFields = form.getFields();
      console.log('=== Verifying Radio Button States Before PDF Generation ===');
      allFields.forEach(field => {
        try {
          const fieldType = field.constructor.name;
          if (fieldType === 'PDFRadioGroup') {
            const acroField = field.acroField;
            const fieldValue = acroField.V();
            const kidsArray = acroField.Kids();
            const fieldName = field.getName();
            
            if (kidsArray && fieldValue) {
              const selectedValue = fieldValue.toString().replace(/^\//, '');
              console.log(`Radio Group '${fieldName}': selected = '${selectedValue}'`);
              const numKids = kidsArray.size();
              
              for (let i = 0; i < numKids; i++) {
                const widget = kidsArray.lookup(i);
                if (!widget) continue;
                
                const currentAS = widget.lookup(PDFName.of('AS'));
                if (currentAS) {
                  const asValue = currentAS.toString().replace(/^\//, '');
                  // Ensure selected widget is marked correctly
                  if (asValue === selectedValue) {
                    widget.set(PDFName.of('AS'), PDFName.of(selectedValue));
                    console.log(`  Widget ${i}: SET to '${selectedValue}'`);
                  } else if (asValue !== 'Off') {
                    widget.set(PDFName.of('AS'), PDFName.of('Off'));
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('Error processing radio field:', err);
        }
      });

      // Force pdf-lib to regenerate widget appearances so text is visible in viewers
      form.updateFieldAppearances(defaultFont);

      
      // CRITICAL: Set the NeedAppearances flag to ensure PDF viewers generate appearances
      // This is the key to making text fields visible
      const acroForm = pdfDoc.catalog.lookup(PDFName.of('AcroForm'));
      if (acroForm) {
        acroForm.set(PDFName.of('NeedAppearances'), pdfDoc.context.obj(true));
      }
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false
      });
      return pdfBytes;

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  /**
   * Flatten a PDF to make all form fields non-editable
   * This creates a static PDF from the fillable form
   */
  const flattenPDF = async (pdfBytes) => {
    try {
      // Load the PDF
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const defaultFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // CRITICAL: Process all radio buttons and checkboxes BEFORE updateFieldAppearances
      const allFields = form.getFields();
      
      // Log all fields for debugging
      console.log('=== Flattening PDF - Processing Fields ===');
      
      allFields.forEach(field => {
        try {
          const fieldType = field.constructor.name;
          const fieldName = field.getName();
          
          if (fieldType === 'PDFRadioGroup') {
            const acroField = field.acroField;
            const fieldValue = acroField.V();
            const kidsArray = acroField.Kids();
            
            if (fieldValue) {
              const selectedValue = fieldValue.toString().replace(/^\//, '');
              console.log(`📻 Radio Group '${fieldName}' selected value: '${selectedValue}'`);
              
              if (kidsArray) {
                const numKids = kidsArray.size();
                let widgetFound = false;
                
                for (let i = 0; i < numKids; i++) {
                  const widget = kidsArray.lookup(i);
                  if (!widget) continue;
                  
                  try {
                    const ap = widget.lookup(PDFName.of('AP'));
                    
                    if (ap) {
                      const n = ap.lookup(PDFName.of('N'));
                      
                      if (n && n.entries) {
                        // Check all appearance entries for this widget
                        for (const [key, val] of n.entries()) {
                          const keyStr = key.toString().replace(/^\//, '');
                          
                          // If this appearance matches the selected value
                          if (keyStr === selectedValue && keyStr !== 'Off') {
                            console.log(`  ✓ Widget ${i}: Found matching appearance '${selectedValue}'`);
                            // Set this widget as selected
                            widget.set(PDFName.of('AS'), PDFName.of(selectedValue));
                            // Make sure field value is set using dict
                            try {
                              acroField.dict.set(PDFName.of('V'), PDFName.of(selectedValue));
                            } catch (e) {
                              // Already set, ignore
                            }
                            widgetFound = true;
                          } else if (keyStr !== 'Off') {
                            // This is a different option - ensure it's not selected
                            const currentAS = widget.lookup(PDFName.of('AS'));
                            if (currentAS) {
                              const currentValue = currentAS.toString().replace(/^\//, '');
                              if (currentValue === keyStr && keyStr !== selectedValue) {
                                widget.set(PDFName.of('AS'), PDFName.of('Off'));
                              }
                            }
                          }
                        }
                      }
                    }
                  } catch (widgetErr) {
                    console.warn(`  ⚠ Error processing widget ${i}:`, widgetErr.message);
                  }
                }
                
                if (!widgetFound) {
                  console.warn(`  ⚠ No widget found with appearance '${selectedValue}' for ${fieldName}`);
                }
              }
            } else {
            }
          } else if (fieldType === 'PDFCheckBox') {
            const acroField = field.acroField;
            const fieldValue = acroField.V();
            const kidsArray = acroField.Kids();
            
            if (fieldValue) {
              const checkValue = fieldValue.toString().replace(/^\//, '');
            }
            
            if (kidsArray) {
              const numKids = kidsArray.size();
              for (let i = 0; i < numKids; i++) {
                const widget = kidsArray.lookup(i);
                if (widget) {
                  const currentAS = widget.lookup(PDFName.of('AS'));
                  if (!currentAS) {
                    widget.set(PDFName.of('AS'), PDFName.of('Off'));
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn(`❌ Error processing field '${field.getName()}':`, err.message);
        }
      });

      // Update field appearances - this generates the visual representation
      form.updateFieldAppearances(defaultFont);

      // Flatten the form to make it static (non-editable)
      form.flatten();

      // Save the flattened PDF
      const flattenedBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false
      });

      return flattenedBytes;
    } catch (error) {
      console.error('Error flattening PDF:', error);
      throw error;
    }
  };

  // Generate a clean filename from admission ID and student name
  const generateFileName = () => {
    const admissionId = studentData.admissionId || studentData.id || 'N/A';
    const fullName = (studentData.fullName || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
    return `${admissionId}_${fullName}.pdf`;
  };

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await generateFilledPDF();
      setGeneratedPdfBytes(pdfBytes);
      
      // Create blob with proper filename for download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Revoke old URL if exists
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
      
      setPdfPreviewUrl(url);
    } catch (error) {
      alert('Error generating PDF preview: ' + error.message);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (generatedPdfBytes) {
      try {
        // Flatten the PDF to make it non-editable before downloading
        const flattenedBytes = await flattenPDF(generatedPdfBytes);
        
        const blob = new Blob([flattenedBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = generateFileName();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Error downloading PDF: ' + error.message);
      }
    }
  };

  const handlePrint = () => {
    if (generatedPdfBytes) {
      const blob = new Blob([generatedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const handleClose = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    setGeneratedPdfBytes(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Preview Header */}
        <div className="bg-blue-600 px-8 py-5 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white">PDF Preview</h2>
            <p className="text-blue-100 text-sm mt-1">
              {studentName || studentData.fullName || 'Student'} - Admission Form
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 p-4 bg-gray-100 overflow-hidden">
          {isGenerating ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600 font-medium">Generating PDF Preview...</p>
              </div>
            </div>
          ) : pdfPreviewUrl ? (
            <iframe
              src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full rounded-lg border-2 border-gray-300 shadow-lg"
              title={generateFileName()}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-600">No preview available</p>
            </div>
          )}
        </div>

        {/* Preview Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex items-center justify-between rounded-b-2xl">
          <p className="text-sm text-gray-600">
            Review the filled form before printing
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={!generatedPdfBytes}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!generatedPdfBytes}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
