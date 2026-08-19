import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PDFDocument, StandardFonts, PDFName } from 'pdf-lib';
import PDFPreviewModal from './PDFPreviewModal';
import DiplomaScoresEdit from './DiplomaScoresEdit';
import Nav from "../Nav";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Convert date to DD-MM-YYYY format for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  
  // If already in DD-MM-YYYY format, return as is
  if (typeof dateString === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    return dateString;
  }
  
  // Handle ISO timestamp format (2026-02-05T18:30:00.000Z)
  // Extract date part and add timezone offset to get correct date
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(dateString)) {
    const date = new Date(dateString);
    // Use IST timezone (UTC+5:30) to get correct date
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  
  // Handle YYYY-MM-DD format
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  }
  
  return dateString;
};

export default function EditApplicationModal({
  isOpen,
  onClose,
  applicationData,
  onUpdateSuccess
}) {
  const navigate = useNavigate();
  const [editData, setEditData] = useState(applicationData || {});
  const [scoresData, setScoresData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Bus stop autocomplete states
  const [busStopsData, setBusStopsData] = useState([]);
  const [busStopSearch, setBusStopSearch] = useState('');
  const [busStopSuggestions, setBusStopSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // District autocomplete states
  const [districtSearch, setDistrictSearch] = useState("");
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);

  // Caste autocomplete states
  const [casteData, setCasteData] = useState({});
  const [casteSearch, setCasteSearch] = useState("");
  const [casteDropdownOpen, setCasteDropdownOpen] = useState(false);

  // College autocomplete states
  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegeDropdownOpen, setCollegeDropdownOpen] = useState(false);

  // Drag and drop state for preferences
  const [draggedItem, setDraggedItem] = useState(null);

  // Helper: keep only latest score row per courseType (or per index fallback)
  const getLatestScoresByCourse = (rows) => {
    if (!Array.isArray(rows)) return [];

    const latestByKey = {};

    rows.forEach((row, index) => {
      const key = row.courseType || `row-${index}`;
      const existing = latestByKey[key];

      if (!existing) {
        latestByKey[key] = row;
        return;
      }

      const existingTime = new Date(existing.date || 0).getTime();
      const currentTime = new Date(row.date || 0).getTime();

      // If both dates invalid, prefer the later row in the sheet
      if (isNaN(existingTime) && isNaN(currentTime)) {
        latestByKey[key] = row;
      } else if (currentTime >= existingTime || isNaN(existingTime)) {
        latestByKey[key] = row;
      }
    });

    return Object.values(latestByKey);
  };

  const degree = [
    { id: 1, department: "B.Tech - Artificial Intelligence and Data Science Engineering (AD)", short: "AD" },
    { id: 2, department: "B.Tech - Agricultural Engineering (AG)", short: "AG" },
    { id: 3, department: "B.E - Bio-Medical Engineering (BME)", short: "BME" },
    { id: 4, department: "B.E - Computer Science and Engineering (CSE)", short: "CSE" },
    { id: 5, department: "B.E - Civil Engineering (CIVIL)", short: "CIVIL" },
    { id: 6, department: "B.E - Electronics and Communication Engineering (ECE)", short: "ECE" },
    { id: 7, department: "B.E - Electrical and Electronics Engineering (EEE)", short: "EEE" },
    { id: 8, department: "B.Tech - Information Technology (IT)", short: "IT" },
    { id: 9, department: "B.E - Mechanical Engineering (MECH)", short: "MECH" },
  ]

  // Get current preferences as an array
  const getCurrentPreferences = () => {
    const prefs = [];
    for (let i = 1; i <= 9; i++) {
      const pref = editData[`preference${i}`];
      if (pref) prefs.push(pref);
    }
    return prefs;
  };

  // Handle drag start
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === dropIndex) return;

    const preferences = getCurrentPreferences();
    const draggedValue = preferences[draggedItem];
    
    // Remove from old position
    preferences.splice(draggedItem, 1);
    // Insert at new position
    preferences.splice(dropIndex, 0, draggedValue);

    // Update editData with new order
    const newEditData = { ...editData };
    preferences.forEach((pref, idx) => {
      newEditData[`preference${idx + 1}`] = pref;
    });
    
    // Clear any remaining preferences
    for (let i = preferences.length + 1; i <= 9; i++) {
      newEditData[`preference${i}`] = '';
    }

    setEditData(newEditData);
    setDraggedItem(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Handle removing a preference
  const handleRemovePreference = (index) => {
    const preferences = getCurrentPreferences();
    preferences.splice(index, 1);
    
    const newEditData = { ...editData };
    preferences.forEach((pref, idx) => {
      newEditData[`preference${idx + 1}`] = pref;
    });
    
    // Clear remaining preferences
    for (let i = preferences.length + 1; i <= 9; i++) {
      newEditData[`preference${i}`] = '';
    }
    
    setEditData(newEditData);
  };

  // Handle adding a new preference
  const handleAddPreference = (value) => {
    if (!value) return;
    const preferences = getCurrentPreferences();
    if (preferences.length >= 9) return;
    
    const newEditData = { ...editData };
    newEditData[`preference${preferences.length + 1}`] = value;
    setEditData(newEditData);
  };

  const districtList = [
    "ARIYALUR", "CHENGALPATTU", "CHENNAI", "COIMBATORE", "CUDDALORE", "DHARMAPURI",
    "DINDIGUL", "ERODE", "KALLAKURICHI", "KANCHEEPURAM", "KANYAKUMARI", "KARUR",
    "KRISHNAGIRI", "MADURAI", "MAYILADUTHURAI", "NAGAPATTINAM", "NAMAKKAL", "NILGIRIS",
    "PERAMBALUR", "PUDUKOTTAI", "RAMANATHAPURAM", "RANIPET", "SALEM", "SIVAGANGA",
    "TENKASI", "THANJAVUR", "THENI", "THIRUVALLUR", "THIRUVARUR", "THOOTHUKUDI",
    "TIRUCHIRAPPALLI", "TIRUNELVELI", "TIRUPATHUR", "TIRUPPUR", "TIRUVANNAMALAI",
    "VELLORE", "VILUPPURAM", "VIRUDHUNAGAR"
  ];

  const stateList = [
    "TAMILNADU", "ANDHRA PRADESH", "ARUNACHAL PRADESH", "ASSAM", "BIHAR", "CHHATTISGARH",
    "GOA", "GUJARAT", "HARYANA", "HIMACHAL PRADESH", "JHARKHAND", "KARNATAKA", "KERALA",
    "MADHYA PRADESH", "MAHARASHTRA", "MANIPUR", "MEGHALAYA", "MIZORAM", "NAGALAND",
    "ODISHA", "PUNJAB", "RAJASTHAN", "SIKKIM", "TELANGANA", "TRIPURA", "UTTARAKHAND",
    "UTTAR PRADESH", "WEST BENGAL", "ANDAMAN AND NICOBAR ISLANDS", "CHANDIGARH",
    "DADRA AND NAGAR HAVELI AND DAMAN AND DIU", "DELHI", "JAMMU AND KASHMIR", "LADAKH",
    "LAKSHADWEEP", "PUDUCHERRY"
  ];

  const collegeList = [
    "SELF",
    "MANAGEMENT",
    "STAFF ENGINEERING",
    "STAFF POLY",
    "STAFF B.Ed",
    "TRUST",
    "ALUMNI",
    "SPORTS",
    "OLD STAFFS",
    "STUDENTS ENGINEERING",
    "STUDENTS POLYTECHNIC",
    "STUDENTS-B.Ed",
    "CONSULTANT",
    "ADVERTISEMENT",
    "CST",
    "OTHERS"
  ];

  // Filter districts based on search
  const filteredDistricts = (() => {
    if (!districtSearch) return districtList;
    return districtList.filter(d => d.startsWith(districtSearch));
  })();

  // Filter colleges based on search
  const filteredColleges = (() => {
    if (!collegeSearch) return collegeList;
    return collegeList.filter(c => c.includes(collegeSearch.toUpperCase()));
  })();

  // Filter castes based on selected community and search term
  const filteredCastes = (() => {
    if (!editData.community || !casteData[editData.community]) return [];
    const castesForCommunity = casteData[editData.community];
    if (!casteSearch) return castesForCommunity;
    return castesForCommunity.filter(c => c.includes(casteSearch));
  })();

  // Sync editData with applicationData when modal opens or data changes
  useEffect(() => {
    if (applicationData) {
      // Normalize quota values (keep MQ/GQ format)
      const normalizedData = { ...applicationData };
      
      // Map applicationDate to date field if exists
      if (normalizedData.applicationDate && !normalizedData.date) {
        normalizedData.date = normalizedData.applicationDate;
      }
      
      if (normalizedData.quota === 'Management') {
        normalizedData.quota = 'MQ';
      } else if (normalizedData.quota === 'Government') {
        normalizedData.quota = 'GQ';
      }
      
      // Normalize firstGrad and govtSchool (keep uppercase format)
      if (normalizedData.firstGrad === 'Yes') {
        normalizedData.firstGrad = 'YES';
      } else if (normalizedData.firstGrad === 'No') {
        normalizedData.firstGrad = 'NO';
      }
      
      if (normalizedData.govtSchool === 'Yes') {
        normalizedData.govtSchool = 'YES';
      } else if (normalizedData.govtSchool === 'No') {
        normalizedData.govtSchool = 'NO';
      }
      
      // ✅ FIX: Normalize gender values to uppercase
      if (normalizedData.gender === 'Male' || normalizedData.gender === 'male') {
        normalizedData.gender = 'MALE';
      } else if (normalizedData.gender === 'Female' || normalizedData.gender === 'female') {
        normalizedData.gender = 'FEMALE';
      }
      
      // ✅ FIX: Normalize accommodation values to uppercase format
      if (normalizedData.accommodation === 'BoysHostel' || normalizedData.accommodation === 'boyshostel') {
        normalizedData.accommodation = 'BOYSHOSTEL';
      } else if (normalizedData.accommodation === 'GirlsHostel' || normalizedData.accommodation === 'girlshostel') {
        normalizedData.accommodation = 'GIRLSHOSTEL';
      } else if (normalizedData.accommodation === 'DayScholar' || normalizedData.accommodation === 'dayscholar') {
        normalizedData.accommodation = 'DAYSCHOLAR';
      }
      
      // ✅ FIX: Normalize roomType values to StudentPanel format
      if (normalizedData.roomType && normalizedData.gender) {
        const genderPrefix = normalizedData.gender === 'MALE' ? 'BOYS HOSTEL' : 'GIRLS HOSTEL';
        
        // Handle old format to new format
        if (normalizedData.roomType === 'Normal4' || normalizedData.roomType === 'normal4' || normalizedData.roomType === 'Normal (4 Members)') {
          normalizedData.roomType = `${genderPrefix} (N)`;
        } else if (normalizedData.roomType === 'Attach3' || normalizedData.roomType === 'attach3' || normalizedData.roomType === 'Attached Bath (3 Members)') {
          normalizedData.roomType = `${genderPrefix} (A)`;
        } else if (normalizedData.roomType === 'AC2' || normalizedData.roomType === 'ac2' || normalizedData.roomType === 'AC + Attached (2 Members)') {
          normalizedData.roomType = `${genderPrefix} (AC)`;
        }
        // Already in correct format - no change needed
      }
      
      // ✅ FIX: Normalize travelType values to uppercase format
      if (normalizedData.travelType === 'COLLEGEBUS' || normalizedData.travelType === 'collegebus') {
        normalizedData.travelType = 'COLLEGEBUS';
      } else if (normalizedData.travelType === 'OUTBUS' || normalizedData.travelType === 'outbus') {
        normalizedData.travelType = 'OUTBUS';
      }

      if (typeof normalizedData.consultingType === 'string') {
        normalizedData.consultingType = normalizedData.consultingType.toUpperCase();
      }
      
      // ✅ FIX: Convert short department codes to full names for preferences (handles case variations)
      const convertShortToFull = (shortCode) => {
        if (!shortCode) return '';
        
        // If it's already a full department name, return as-is
        const isFullName = degree.find(d => d.department === shortCode);
        if (isFullName) return shortCode;
        
        // Try case-insensitive match on short code
        const upperCode = shortCode.toUpperCase().trim();
        const dept = degree.find(d => d.short.toUpperCase() === upperCode);
        
        if (dept) return dept.department;
        
        // If no match found, return original (might be old format or invalid)
        return shortCode;
      };
      
      // Convert all preferences from short codes to full department names
      normalizedData.preference1 = convertShortToFull(normalizedData.preference1);
      normalizedData.preference2 = convertShortToFull(normalizedData.preference2);
      normalizedData.preference3 = convertShortToFull(normalizedData.preference3);
      normalizedData.preference4 = convertShortToFull(normalizedData.preference4);
      normalizedData.preference5 = convertShortToFull(normalizedData.preference5);
      normalizedData.preference6 = convertShortToFull(normalizedData.preference6);
      normalizedData.preference7 = convertShortToFull(normalizedData.preference7);
      normalizedData.preference8 = convertShortToFull(normalizedData.preference8);
      normalizedData.preference9 = convertShortToFull(normalizedData.preference9);
      
      // Split combined reference name back into prefix and name for display
      if (normalizedData.referenceName && !normalizedData.referencePrefix) {
        const refName = normalizedData.referenceName.trim();
        const refNameUpper = refName.toUpperCase();
        const prefixes = [
          { value: 'Mr', upper: 'MR' },
          { value: 'Mrs', upper: 'MRS' },
          { value: 'Ms', upper: 'MS' },
          { value: 'Dr', upper: 'DR' }
        ];
        
        // Check if the reference name starts with any prefix (case-insensitive)
        for (const prefix of prefixes) {
          // Check for "MR ", "MR.", "Mr ", "Mr." etc.
          const patterns = [
            prefix.upper + ' ',
            prefix.upper + '.',
            prefix.value + ' ',
            prefix.value + '.'
          ];
          
          for (const pattern of patterns) {
            if (refNameUpper.startsWith(pattern.toUpperCase())) {
              normalizedData.referencePrefix = prefix.value;
              // Remove the prefix and any following space/dot from the name
              normalizedData.referenceName = refName
                .substring(pattern.length - 1)
                .replace(/^[\s.]+/, '')
                .trim();
              break;
            }
          }
          
          if (normalizedData.referencePrefix) break;
        }
      }
      
      setEditData(normalizedData);
      // Set bus stop search to existing value
      setBusStopSearch(normalizedData.busStopName || '');
      
      // Log all loaded data for debugging

      

      // Populate scoresData from applicationData (all in one sheet now)
      const scoresObj = {
        courseType: normalizedData.courseType || '',
        registerNumber: normalizedData.registerNumber || '',
        medium: normalizedData.medium || '',
        yearOfPassing: normalizedData.yearOfPassing || '',
        schoolName: normalizedData.schoolName || '',
        subject1: normalizedData.subject1 || '',
        subject1Marks: normalizedData.subject1Marks || '',
        subject2: normalizedData.subject2 || '',
        subject2Marks: normalizedData.subject2Marks || '',
        subject3: normalizedData.subject3 || '',
        subject3Marks: normalizedData.subject3Marks || '',
        subject4: normalizedData.subject4 || '',
        subject4Marks: normalizedData.subject4Marks || '',
        subject5: normalizedData.subject5 || '',
        subject5Marks: normalizedData.subject5Marks || '',
        subject6: normalizedData.subject6 || '',
        subject6Marks: normalizedData.subject6Marks || '',
        totalMarks: normalizedData.totalMarks || '',
        percentage: normalizedData.percentage || '',
        cutoff: normalizedData.cutoff || '',
        eligibility: normalizedData.eligibility || '',
        date: normalizedData.date || ''
      };
      
      // ✅ FIX: Ensure CBSE subject names and marks are correctly mapped
      if (normalizedData.lastStudies === 'CBSE' || normalizedData.courseType === 'CBSE') {
        // Check if data was saved with HSC structure (subject2 = ENGLISH)
        // If subject2 is ENGLISH, we need to shift marks by one position
        if (normalizedData.subject2 && normalizedData.subject2.toUpperCase().includes('ENGLISH')) {
          // Data saved in HSC format, shift marks
          scoresObj.subject1 = 'ENGLISH';
          scoresObj.subject1Marks = normalizedData.subject2Marks || '';
          scoresObj.subject2 = 'PHYSICS';
          scoresObj.subject2Marks = normalizedData.subject3Marks || '';
          scoresObj.subject3 = 'CHEMISTRY';
          scoresObj.subject3Marks = normalizedData.subject4Marks || '';
          scoresObj.subject4 = 'MATHEMATICS';
          scoresObj.subject4Marks = normalizedData.subject5Marks || '';
          scoresObj.subject5 = 'COMPUTER SCIENCE / BIOLOGY';
          scoresObj.subject5Marks = normalizedData.subject6Marks || '';
          scoresObj.subject6 = '';
          scoresObj.subject6Marks = '';
        } else {
          // Data already in correct CBSE format, just set subject names
          scoresObj.subject1 = 'ENGLISH';
          scoresObj.subject2 = 'PHYSICS';
          scoresObj.subject3 = 'CHEMISTRY';
          scoresObj.subject4 = 'MATHEMATICS';
          scoresObj.subject5 = 'COMPUTER SCIENCE / BIOLOGY';
          scoresObj.subject6 = '';
        }
      }
      
      setScoresData(scoresObj);
    }
  }, [applicationData]);

  // Auto-calculate academic totals/cutoff/eligibility when subject marks change
  useEffect(() => {
    // Skip calculations for Vocational students (only calculate total and percentage)
    const isVocational = scoresData.courseType === 'VOCATIONAL' || editData.lastStudies === 'VOCATIONAL';
    const { totalMarks, percentage, cutoff, eligibility } = computeDerivedScores(scoresData, isVocational);

    const updates = {};
    if (totalMarks !== (scoresData.totalMarks ?? 0)) updates.totalMarks = totalMarks;
    if (percentage !== (scoresData.percentage ?? "")) updates.percentage = percentage;
    
    // Only auto-calculate cutoff and eligibility for non-Vocational students
    if (!isVocational) {
      if (cutoff !== (scoresData.cutoff ?? "")) updates.cutoff = cutoff;
      if (eligibility !== (scoresData.eligibility ?? "")) updates.eligibility = eligibility;
    }

    if (Object.keys(updates).length > 0) {
      setScoresData((prev) => ({ ...prev, ...updates }));
    }
  }, [
    scoresData.subject1Marks,
    scoresData.subject2Marks,
    scoresData.subject3Marks,
    scoresData.subject4Marks,
    scoresData.subject5Marks,
    scoresData.subject6Marks,
    scoresData.subject1,
    scoresData.subject2,
    scoresData.subject3,
    scoresData.subject4,
    scoresData.subject5,
    scoresData.subject6,
    scoresData.courseType,
    editData.lastStudies,
  ]);

  // Fetch scores data from Google Sheet
  const fetchStudentScores = async (enquiryId) => {
    try {
      const url = BACKEND_URL + "/api/applications/by-enquiry/" + encodeURIComponent(enquiryId);
      const response = await fetch(url);
      const responseData = await response.json();
      
      let rawScores = [];

      if (responseData && !responseData.detail) {
        rawScores = [responseData];
      } else {
        setScoresData({});
        return;
      }

      const latestScores = getLatestScoresByCourse(rawScores);
      // Convert array to object, using the first (latest) score
      let scoresObject = latestScores.length > 0 ? latestScores[0] : {};
      
      // Map subjects correctly based on course type
      if (scoresObject.courseType) {
        const courseType = scoresObject.courseType;
        
        // Define subject mappings for each course type
        const hscSubjects = ['TAMIL', 'ENGLISH', 'PHYSICS', 'CHEMISTRY', 'MATHEMATICS', 'COMPUTER SCIENCE/BIOLOGY'];
        const cbseSubjects = ['ENGLISH', 'PHYSICS', 'CHEMISTRY', 'MATHEMATICS', 'COMPUTER SCIENCE/BIOLOGY'];
        const vocationalSubjects = ['TAMIL', 'ENGLISH',  'MATHEMATICS', '', '',''];
        
        const mappedScores = { ...scoresObject };
        
        if (courseType === 'HSC') {
          // Ensure HSC subjects are properly mapped
          hscSubjects.forEach((subjectName, index) => {
            const num = index + 1;
            if (!mappedScores[`subject${num}`] || mappedScores[`subject${num}`] !== subjectName) {
              mappedScores[`subject${num}`] = subjectName;
            }
          });
        } else if (courseType === 'CBSE') {
          // Ensure CBSE subjects are properly mapped
          cbseSubjects.forEach((subjectName, index) => {
            const num = index + 1;
            if (!mappedScores[`subject${num}`] || mappedScores[`subject${num}`] !== subjectName) {
              mappedScores[`subject${num}`] = subjectName;
            }
          });
        } else if (courseType === 'Vocational') {
          // Ensure Vocational first 2 subjects are static
          vocationalSubjects.forEach((subjectName, index) => {
            const num = index + 1;
            if (!mappedScores[`subject${num}`] || mappedScores[`subject${num}`] !== subjectName) {
              mappedScores[`subject${num}`] = subjectName;
            }
          });
          // Keep subjects 3-6 as they are (custom subjects)
        }
        
        scoresObject = mappedScores;
      }
      
      setScoresData(scoresObject);
    } catch (error) {
      console.error("Error fetching scores:", error);
      setScoresData({});
    }
  };

  // Display date in DD-MM-YYYY format
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";
    
    // If already in DD-MM-YYYY format, return as is
    if (typeof dateString === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // Handle ISO timestamp format (2026-02-05T18:30:00.000Z)
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(dateString)) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    // Handle YYYY-MM-DD format
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}-${month}-${year}`;
    }
    
    return dateString;
  };

  // Load bus stops data from csv.json
  useEffect(() => {
    const loadBusStops = async () => {
      try {
        const response = await fetch('/busData.json');
        const data = await response.json();
        setBusStopsData(data);
      } catch (error) {
        console.error('Error loading bus stops data:', error);
      }
    };
    loadBusStops();
  }, []);

  // Load caste data from JSON file
  useEffect(() => {
    fetch('/caste.json')
      .then(response => response.json())
      .then(data => setCasteData(data))
      .catch(error => console.error('Error loading caste data:', error));
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.bus-stop-autocomplete')) {
        setShowSuggestions(false);
      }
      if (!e.target.closest('.district-autocomplete')) {
        setDistrictDropdownOpen(false);
      }
      if (!e.target.closest('.caste-autocomplete')) {
        setCasteDropdownOpen(false);
      }
      if (!e.target.closest('.college-autocomplete')) {
        setCollegeDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Hide native number input spinners for a cleaner UI
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input.no-spin::-webkit-outer-spin-button,
      input.no-spin::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input.no-spin {
        -moz-appearance: textfield;
        appearance: textfield;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Handle bus stop search input
  const handleBusStopSearch = (e) => {
    const searchValue = e.target.value;
    setBusStopSearch(searchValue);
    
    // Update editData.busStopName in real-time as user types
    setEditData(prev => ({
      ...prev,
      busStopName: searchValue
    }));
    
    // Clear validation error when user starts typing
    if (searchValue.length > 0) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.busStopName;
        return newErrors;
      });
    }
    
    if (searchValue.length >= 3) {
      const filtered = busStopsData.filter(stop => 
        stop.busStopName && stop.busStopName.toLowerCase().includes(searchValue.toLowerCase())
      );
      setBusStopSuggestions(filtered.slice(0, 10));
      setShowSuggestions(true);
    } else {
      setBusStopSuggestions([]);
      setShowSuggestions(false);
      if (searchValue.length === 0) {
        setEditData(prev => ({
          ...prev,
          busStopName: '',
          busRoute: '',
          busNo: '',
          busFees: ''
        }));
      }
    }
  };

  // Handle bus stop selection from suggestions
  const handleBusStopSelect = (stop) => {
    setBusStopSearch(stop.busStopName);
    setEditData(prev => ({
      ...prev,
      busStopName: stop.busStopName,
      busRoute: stop.route,
      busNo: stop.routeNo.toString(),
      busFees: stop.semFees.toString()
    }));
    setShowSuggestions(false);
    setBusStopSuggestions([]);
    
    // Clear validation error for busStopName when a bus stop is selected
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.busStopName;
      return newErrors;
    });
  };

  // Field validation function
  const validateField = (fieldName, value) => {
    const validationRules = {
      // Name fields
      fullName: {
        required: true,
        minLength: 3,
        maxLength: 100,
        message: {
          required: 'Full name is required',
          minLength: 'Full name must be at least 3 characters',
          maxLength: 'Full name must not exceed 100 characters'
        }
      },
      initial: {
        required: true,
        minLength: 1,
        maxLength: 10,
        message: {
          required: 'Initial is required',
          minLength: 'Initial must be at least 1 character',
          maxLength: 'Initial must not exceed 10 characters'
        }
      },
      fatherName: {
        required: true,
        minLength: 3,
        maxLength: 100,
        message: {
          required: 'Father/Guardian name is required',
          minLength: 'Name must be at least 3 characters',
          maxLength: 'Name must not exceed 100 characters'
        }
      },
      fatherOccupation: {
        required: true,
        minLength: 2,
        maxLength: 50,
        message: {
          required: 'Father\'s occupation is required',
          minLength: 'Occupation must be at least 2 characters',
          maxLength: 'Occupation must not exceed 50 characters'
        }
      },
      caste: {
        required: true,
        minLength: 2,
        maxLength: 50,
        message: {
          required: 'Caste is required',
          minLength: 'Caste must be at least 2 characters',
          maxLength: 'Caste must not exceed 50 characters'
        }
      },
      annualIncome: {
        required: true,
        message: {
          required: 'Annual income range is required'
        }
      },
      // Address fields
      address1: {
        required: true,
        minLength: 5,
        maxLength: 200,
        message: {
          required: 'Address line 1 is required',
          minLength: 'Address must be at least 5 characters',
          maxLength: 'Address must not exceed 200 characters'
        }
      },
      address2: {
        required: true,
        minLength: 3,
        maxLength: 100,
        message: {
          required: 'Address line 2 is required',
          minLength: 'Address must be at least 3 characters',
          maxLength: 'Address must not exceed 100 characters'
        }
      },
      taluk: {
        required: true,
        minLength: 2,
        maxLength: 50,
        message: {
          required: 'Taluk is required',
          minLength: 'Taluk must be at least 2 characters',
          maxLength: 'Taluk must not exceed 50 characters'
        }
      },
      district: {
        required: true,
        minLength: 2,
        maxLength: 50,
        message: {
          required: 'District is required',
          minLength: 'District must be at least 2 characters',
          maxLength: 'District must not exceed 50 characters'
        }
      },
      pincode: {
        required: true,
        pattern: /^\d{6}$/,
        message: {
          required: 'Pin code is required',
          pattern: 'Pin code must be exactly 6 digits'
        }
      },
      // Contact fields
      fatherContact: {
        required: true,
        pattern: /^\d{10}$/,
        message: {
          required: 'Contact number is required',
          pattern: 'Contact number must be exactly 10 digits'
        }
      },
      motherContact: {
        required: true,
        pattern: /^\d{10}$/,
        message: {
          required: 'Contact number is required',
          pattern: 'Contact number must be exactly 10 digits'
        }
      },
      // Academic fields
      sslcMarks: {
        required: true,
        pattern: /^\d+$/,
        minLength: 1,
        maxLength: 4,
        message: {
          required: 'SSLC marks are required',
          pattern: 'Only numbers allowed',
          maxLength: 'Marks must not exceed 4 digits'
        }
      },
      schoolName: {
        required: true,
        minLength: 3,
        maxLength: 150,
        message: {
          required: 'School/College/Board name is required',
          minLength: 'Name must be at least 3 characters',
          maxLength: 'Name must not exceed 150 characters'
        }
      },
      registerNo: {
        minLength: 3,
        maxLength: 50,
        message: {
          minLength: 'Register number must be at least 3 characters',
          maxLength: 'Register number must not exceed 50 characters'
        }
      },
      medium: {
        required: true,
        message: {
          required: 'Medium of study is required'
        }
      },
      yearOfPassing: {
        required: true,
        pattern: /^\d{4}$/,
        message: {
          required: 'Year of passing is required',
          pattern: 'Year must be 4 digits'
        }
      },
      // Reference fields
      knowAbout: {
        required: true,
        minLength: 2,
        maxLength: 500,
        message: {
          required: 'This field is required',
          minLength: 'Please provide at least 5 characters',
          maxLength: 'Must not exceed 500 characters'
        }
      },
      consultingType: {
        required: true,
        message: {
          required: 'Consulting type is required'
        }
      },
      referenceContact: {
        required: true,
        pattern: /^\d{10}$/,
        message: {
          pattern: 'Contact number must be exactly 10 digits'
        }
      },
      // Dropdown/Radio required validations
      quota: {
        required: true,
        message: {
          required: 'Seat type is required'
        }
      },
      entry: {
        required: true,
        message: {
          required: 'Admission type is required'
        }
      },
      preference1: {
        required: true,
        message: {
          required: 'At least one department preference is required'
        }
      },
      gender: {
        required: true,
        message: {
          required: 'Gender is required'
        }
      },
      accommodation: {
        required: true,
        message: {
          required: 'Student type is required'
        }
      },
      dob: {
        required: true,
        message: {
          required: 'Date of birth is required'
        }
      },
      firstGrad: {
        required: true,
        message: {
          required: 'First graduate status is required'
        }
      },
      community: {
        required: true,
        message: {
          required: 'Community is required'
        }
      },
      schoolType: {
        required: true,
        message: {
          required: 'School type is required'
        }
      },
      govtSchool: {
        required: true,
        message: {
          required: 'Government school status is required'
        }
      },
      lastStudies: {
        required: true,
        message: {
          required: 'Qualifying examination is required'
        }
      },
      date: {
        required: true,
        message: {
          required: 'Application date is required'
        }
      },
      applicationDate: {
        required: true,
        message: {
          required: 'Application date is required'
        }
      },
      busStopName: {
        required: true,
        minLength: 3,
        maxLength: 50,
        message: {
          required: 'Bus stop name is required',
          minLength: 'Bus stop name must be at least 3 characters',
          maxLength: 'Bus stop name must not exceed 50 characters'
        }
      },
      status: {
        required: true,
        message: {
          required: 'Application status is required'
        }
      }
    };

    const rules = validationRules[fieldName];
    if (!rules) return null;

    // Special case: Caste is not required when Community is OC
    if (fieldName === 'caste' && editData.community === 'OC') {
      // Skip required validation for OC community
      // But still validate minLength/maxLength if value is provided
      const trimmedValue = typeof value === 'string' ? value.trim() : value;
      
      // If empty, it's valid for OC
      if (!trimmedValue) return null;
      
      // If value is provided, validate length
      if (rules.minLength && trimmedValue.length < rules.minLength) {
        return rules.message.minLength;
      }
      if (rules.maxLength && trimmedValue.length > rules.maxLength) {
        return rules.message.maxLength;
      }
      
      return null;
    }

    // Special case: knowAbout is only required when consultingType is CONSULTING
    if (fieldName === 'knowAbout') {
      const trimmedValue = typeof value === 'string' ? value.trim() : value;
      const consultingTypeUpper = (editData.consultingType || '').toString().trim().toUpperCase();
      
      // Only require knowAbout when consultingType is CONSULTING
      if (consultingTypeUpper === 'CONSULTING') {
        if (!trimmedValue || trimmedValue === '') {
          return rules.message.required;
        }
        // Validate length if value is provided
        if (rules.minLength && trimmedValue.length < rules.minLength) {
          return rules.message.minLength;
        }
        if (rules.maxLength && trimmedValue.length > rules.maxLength) {
          return rules.message.maxLength;
        }
      } else {
        // For NOT CONSULTING, field is optional but validate length if provided
        if (trimmedValue) {
          if (rules.minLength && trimmedValue.length < rules.minLength) {
            return rules.message.minLength;
          }
          if (rules.maxLength && trimmedValue.length > rules.maxLength) {
            return rules.message.maxLength;
          }
        }
      }
      return null;
    }

    const trimmedValue = typeof value === 'string' ? value.trim() : value;

    // Required validation
    if (rules.required && (!trimmedValue || trimmedValue === '')) {
      return rules.message.required;
    }

    // Skip other validations if field is empty and not required
    if (!trimmedValue) return null;

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(trimmedValue)) {
      return rules.message.pattern;
    }

    // Min length validation
    if (rules.minLength && trimmedValue.length < rules.minLength) {
      return rules.message.minLength;
    }

    // Max length validation
    if (rules.maxLength && trimmedValue.length > rules.maxLength) {
      return rules.message.maxLength;
    }

    return null;
  };

  // Handle field blur for validation
  const handleBlur = (fieldName) => {
    const error = validateField(fieldName, editData[fieldName]);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [fieldName]: error }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Validate ALL required fields before saving
  const validateAllFields = () => {
    const errors = {};
    let firstErrorField = null;
    
    // List of required fields from editData (personal info)
    const requiredPersonalFields = [
      'fullName', 'dob', 'gender', 'studentContact', 'community', 'caste',
      'fatherName', 'fatherOccupation', 'fatherContact', 'motherContact', 'annualIncome',
      'address1', 'address2', 'taluk', 'district', 'pincode',
      'lastStudies', 'sslcMarks', 'schoolName', 'govtSchool', 'schoolType', 'firstGrad',
      'preference1', 'quota', 'entry', 'consultingType', 'accommodation', 'status',
      'applicationDate'
    ];

    // Validate personal fields from editData
    for (const fieldName of requiredPersonalFields) {
      const error = validateField(fieldName, editData[fieldName]);
      if (error) {
        errors[fieldName] = error;
        if (!firstErrorField) {
          firstErrorField = fieldName;
        }
      }
    }
    
    // Conditionally validate knowAbout only when consultingType is CONSULTING
    const consultingTypeUpper = (editData.consultingType || '').toString().trim().toUpperCase();
    if (consultingTypeUpper === 'CONSULTING') {
      const knowAboutError = validateField('knowAbout', editData.knowAbout);
      if (knowAboutError) {
        errors['knowAbout'] = knowAboutError;
        if (!firstErrorField) {
          firstErrorField = 'knowAbout';
        }
      }
    }
    
    // Conditionally validate busStopName only for College Bus users
    if (editData.travelType === 'COLLEGEBUS') {
      const busStopError = validateField('busStopName', editData.busStopName);
      if (busStopError) {
        errors['busStopName'] = busStopError;
        if (!firstErrorField) {
          firstErrorField = 'busStopName';
        }
      }
    }

    // Validate academic fields from scoresData (only if not Diploma)
    if (editData.lastStudies !== 'DIPLOMA') {
      const requiredScoresFields = ['courseType', 'medium', 'yearOfPassing'];
      
      for (const fieldName of requiredScoresFields) {
        const value = scoresData[fieldName];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors[fieldName] = `${fieldName} is required`;
          if (!firstErrorField) {
            firstErrorField = fieldName;
          }
        }
      }
    }

    // Log all validation errors
    if (Object.keys(errors).length > 0) {
      console.error('❌ Validation failed. Errors:', errors);
      setValidationErrors(errors);
      
      // Scroll to the first error field
      if (firstErrorField) {
        setTimeout(() => {
          let element = document.querySelector(`[name="${firstErrorField}"]`);
          
          // Special handling for busStopName (uses busStopSearch state)
          if (firstErrorField === 'busStopName' && !element) {
            // Find the bus stop input by its value binding
            const inputs = document.querySelectorAll('input[type="text"]');
            for (const input of inputs) {
              if (input.placeholder && input.placeholder.includes('Type at least 3 characters')) {
                element = input;
                break;
              }
            }
          }
          
          // Special handling for applicationDate (date input field)
          if (firstErrorField === 'applicationDate' && !element) {
            // Try to find by type="date"
            const dateInputs = document.querySelectorAll('input[type="date"]');
            for (const input of dateInputs) {
              // Match by checking the value binding to editData.applicationDate
              const parentDiv = input.closest('div');
              if (parentDiv) {
                const label = parentDiv.parentElement?.querySelector('label');
                if (label && label.textContent.trim().toLowerCase().includes('application date')) {
                  element = input;
                  break;
                }
              }
            }
          }
          
          // Special handling for academic fields (courseType, medium, yearOfPassing)
          if (!element && ['courseType', 'medium', 'yearOfPassing'].includes(firstErrorField)) {
            const selects = document.querySelectorAll('select');
            for (const select of selects) {
              const parentDiv = select.closest('div');
              if (parentDiv) {
                const label = parentDiv.querySelector('label');
                if (label) {
                  const labelText = label.textContent.trim().toLowerCase();
                  if (
                    (firstErrorField === 'courseType' && labelText.includes('qualifying examination')) ||
                    (firstErrorField === 'medium' && labelText.includes('medium')) ||
                    (firstErrorField === 'yearOfPassing' && labelText.includes('year of passing'))
                  ) {
                    element = select;
                    break;
                  }
                }
              }
            }
          }
          
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
            // Add visual highlight
            element.style.borderColor = '#ef4444';
            element.style.borderWidth = '2px';
            setTimeout(() => {
              element.style.borderColor = '';
              element.style.borderWidth = '';
            }, 3000);
          }
          // No else clause - inline error will show via ValidationError component
        }, 100);
      }
      
      return false;
    }

    setValidationErrors({});
    return true;
  };

  const handleInputChange = (field, value) => {
    // Fields that should NOT be converted to uppercase
    const excludeFromUppercase = [
      'preference1', 'preference2', 'preference3', 'preference4', 
      'preference5', 'preference6', 'preference7', 'preference8', 'preference9',
      'status', 'branchAwarded', 'referencePrefix', 'feesPaid'
    ];
    
    // Convert date from YYYY-MM-DD (HTML date input format) to DD/MM/YYYY for storage (matches server)
    let processedValue = value;
    if ((field === 'dob' || field === 'date' || field === 'applicationDate') && value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // Convert YYYY-MM-DD to DD/MM/YYYY format for storage (with slashes to match server)
      const [year, month, day] = value.split('-');
      processedValue = `${day}/${month}/${year}`;
    }
    
    // Convert string values to uppercase for text fields (except excluded fields and dob)
    const uppercaseValue = typeof processedValue === 'string' && !excludeFromUppercase.includes(field) && field !== 'dob' && field !== 'applicationDate'
      ? processedValue.toUpperCase() 
      : processedValue;
    
    // Clear validation error for this field when value changes
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    setEditData(prev => {
      const updated = { ...prev, [field]: uppercaseValue };

      // If community is changed to OC, automatically set caste to "NOT REQUIRED"
      if (field === 'community' && uppercaseValue === 'OC') {
        updated.caste = 'NOT REQUIRED';
      }
      // If community is changed from OC to something else, clear the caste field
      else if (field === 'community' && uppercaseValue !== 'OC' && prev.caste === 'NOT REQUIRED') {
        updated.caste = '';
      }

      // Reset subsequent preferences when a preference is changed (1-9)
      if (field === 'preference1') {
        updated.preference2 = '';
        updated.preference3 = '';
        updated.preference4 = '';
        updated.preference5 = '';
        updated.preference6 = '';
        updated.preference7 = '';
        updated.preference8 = '';
        updated.preference9 = '';
      } else if (field === 'preference2') {
        updated.preference3 = '';
        updated.preference4 = '';
        updated.preference5 = '';
        updated.preference6 = '';
        updated.preference7 = '';
        updated.preference8 = '';
        updated.preference9 = '';
      } else if (field === 'preference3') {
        updated.preference4 = '';
        updated.preference5 = '';
        updated.preference6 = '';
        updated.preference7 = '';
        updated.preference8 = '';
        updated.preference9 = '';
      } else if (field === 'preference4') {
        updated.preference5 = '';
        updated.preference6 = '';
        updated.preference7 = '';
        updated.preference8 = '';
        updated.preference9 = '';
      } else if (field === 'preference5') {
        updated.preference6 = '';
        updated.preference7 = '';
        updated.preference8 = '';
        updated.preference9 = '';
      } else if (field === 'preference6') {
        updated.preference7 = '';
        updated.preference8 = '';
        updated.preference9 = '';
      } else if (field === 'preference7') {
        updated.preference8 = '';
        updated.preference9 = '';
      } else if (field === 'preference8') {
        updated.preference9 = '';
      }

      // Handle gender-based accommodation logic
      if (field === 'gender') {
        // Reset accommodation when gender changes
        updated.accommodation = '';
        updated.roomType = '';
        updated.travelType = '';
      }

      // Clear dropout specifics when study type changes away from dropout
      if (field === 'lastStudies' && value !== 'Dropout') {
        updated.dropoutCollege = '';
        updated.dropoutRegisterNo = '';
        updated.dropoutYear = '';
      }

      // When lastStudies changes, update the academic section to match
      if (field === 'lastStudies') {
        // Update scoresData courseType to match lastStudies
        setScoresData(prev => ({ ...prev, courseType: value }));
      }

      // Handle accommodation changes
      if (field === 'accommodation') {
        if (value === 'DAYSCHOLAR') {
          updated.roomType = '';
        } else if (value === 'BOYSHOSTEL' || value === 'GIRLSHOSTEL') {
          updated.travelType = '';
        }
      }

      // When consultingType changes, clear validation errors for knowAbout
      if (field === 'consultingType') {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors['knowAbout'];
          return newErrors;
        });
        
        // If changing to NOT CONSULTING, optionally clear knowAbout field
        // (user can still fill it if they want, but it's not required)
        const upperValue = typeof value === 'string' ? value.toUpperCase() : value;
        if (upperValue === 'NOT CONSULTING') {
          // Don't clear the field, just make it optional
          // This allows users to keep existing data if they change their mind
        }
      }

      return updated;
    });
  };

  // Convert date to yyyy-MM-dd format for HTML date input
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    
    // If already in yyyy-MM-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    
    // Handle DD-MM-YYYY format (with hyphens)
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('-');
      return `${year}-${month}-${day}`;
    }
    
    // Handle DD/MM/YYYY format (with slashes)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month}-${day}`;
    }
    
    // Handle ISO timestamp format (2026-02-05T18:30:00.000Z)
    if (/^\d{4}-\d{2}-\d{2}T/.test(dateString)) {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return "";
  };

  // Convert date to DD-MM-YYYY format for PDF
  const formatDateForPDF = (dateString) => {
    if (!dateString) return "";
    
    // If already in DD-MM-YYYY format, return as is
    if (typeof dateString === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // Handle YYYY-MM-DD format (from date input)
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}-${month}-${year}`;
    }
    
    // Handle ISO timestamp format (2026-02-05T18:30:00.000Z)
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(dateString)) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    return dateString;
  };

  // --- Academic scores derived metrics (admin tab) ---
  const parseMark = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const computeDerivedScores = (data, isVocational = false) => {
    // Return empty values if data is not available
    if (!data || typeof data !== 'object') {
      return { totalMarks: 0, percentage: "", cutoff: "", eligibility: "" };
    }

    const subjectIndexes = [1, 2, 3, 4, 5, 6];

    // Helper function to find mark by subject name
    const getMarkBySubject = (subjectName) => {
      if (!subjectName) return 0;
      for (let i = 1; i <= 6; i++) {
        const subject = data[`subject${i}`];
        if (subject && typeof subject === 'string' && subject.toUpperCase().includes(subjectName.toUpperCase())) {
          return parseMark(data[`subject${i}Marks`]);
        }
      }
      return 0;
    };

    // Consider only subjects that have a name; fallback to all six if none named
    const availableSubjects = subjectIndexes.filter((i) => data[`subject${i}`]);
    const subjectsToUse = availableSubjects.length > 0 ? availableSubjects : subjectIndexes;

    const marks = subjectsToUse.map((i) => parseMark(data[`subject${i}Marks`]));
    const totalMarks = marks.reduce((sum, m) => sum + m, 0);

    const maxPossible = subjectsToUse.length * 100;
    const percentage = maxPossible > 0 ? ((totalMarks / maxPossible) * 100).toFixed(2) : "";

    // Get marks by subject name instead of position
    const math = getMarkBySubject('MATHEMATICS');
    const physics = getMarkBySubject('PHYSICS');
    const chemistry = getMarkBySubject('CHEMISTRY');

    // Vocational-specific calculations
    if (isVocational) {
      // Get all non-core subject marks (subjects other than TAMIL, ENGLISH, MATHEMATICS)
      const vocationalSubjectMarks = [];
      for (let i = 1; i <= 6; i++) {
        const subject = data[`subject${i}`];
        if (subject) {
          const subjectUpper = subject.toUpperCase();
          if (!subjectUpper.includes('TAMIL') && !subjectUpper.includes('ENGLISH') && !subjectUpper.includes('MATHEMATICS')) {
            vocationalSubjectMarks.push(parseMark(data[`subject${i}Marks`]));
          }
        }
      }

      // Vocational Cutoff Formula: (average of vocational subjects) + Mathematics
      const vocationalAvg = vocationalSubjectMarks.length > 0 
        ? vocationalSubjectMarks.reduce((sum, m) => sum + m, 0) / vocationalSubjectMarks.length
        : 0;
      const cutoffValue = vocationalAvg + math;
      const cutoff = cutoffValue > 0 ? cutoffValue.toFixed(2) : "";

      // Vocational Engineering Eligibility: (Mathematics + all vocational subjects) / total subjects
      const allVocMarks = [math, ...vocationalSubjectMarks];
      const eligibilityScore = allVocMarks.length > 0
        ? allVocMarks.reduce((sum, m) => sum + m, 0) / allVocMarks.length
        : 0;
      const eligibility = eligibilityScore > 0 ? eligibilityScore.toFixed(2) : "";

      return { totalMarks, percentage, cutoff, eligibility };
    }

    // HSC/CBSE/Diploma Cutoff: Maths + (Physics/2) + (Chemistry/2)
    const cutoff = math || physics || chemistry ? (math + physics / 2 + chemistry / 2).toFixed(2) : "";

    // HSC/CBSE/Diploma Engineering Eligibility: (Maths + Physics + Chemistry) / 3
    const eligibility = math || physics || chemistry ? ((math + physics + chemistry) / 3).toFixed(2) : "";

    return { totalMarks, percentage, cutoff, eligibility };
  };

  const generateFilledPDF = async () => {
    /*
     */
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
          const value = editData?.[key];
          if (value !== undefined && value !== null && value !== '') {
            return String(value);
          }
        }
        return '';
      };

      const studiesHints = [editData?.lastStudies, editData?.typeStudies, editData?.studyType]
        .map((value) => (typeof value === 'string' ? value.toLowerCase() : ''));
      const isVocational = studiesHints.some((hint) => hint.includes('VOCATIONAL'));
      const isDiploma = studiesHints.some((hint) => hint.includes('DIPLOMA'));

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
          const acroField = field.acroField;
          const kidsArray = acroField.Kids();

          if (!kidsArray) {
            console.warn(`No widgets found for ${fieldName}`);
            return false;
          }

          const numKids = kidsArray.size();
          let foundMatch = false;

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
                    if (keyStr === exportValue && keyStr !== 'Off') {
                      widget.set(PDFName.of('AS'), PDFName.of(exportValue));
                      foundMatch = true;
                      break;
                    }
                  }
                }
              }
            } catch (widgetError) {
              continue;
            }
          }

          
          return foundMatch;
        } catch (error) {
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
            field.setText(String(value));
            
            // Apply font size if specified
            if (options.fontSize !== undefined) {
              field.setFontSize(options.fontSize);
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
      setTextField('admission-id', editData.id || '');
      setTextField('date', formatDateForPDF(editData.date || new Date()));
      setTextField('name', editData.fullName || '');
      setTextField('date-of-birth', formatDateForPDF(editData.dob));

      // Gender - checkbox group
      if (editData.gender === 'MALE') {
        setCheckboxInGroup('gender', 'male');
      } else if (editData.gender === 'FEMALE') {
        setCheckboxInGroup('gender', 'female');
      }

      // Department checkboxes - Each has its own unique field name
      const deptMapping = {
        // Short format
        'AD': 'ad-dept',
        'BME': 'bme-dept',
        'CIVIL': 'civil-dept',
        'CSE': 'cse-dept',
        'ECE': 'ece-dept',
        'EEE': 'eee-dept',
        'IT': 'it-dept',
        'MECH': 'mech-dept',
        'AG': 'age-dept',
        // Full format (with descriptions)
        'AD(Artificial Intelligence and Data Science Engineering)': 'ad-dept',
        'BME(Bio Medical Engineering)': 'bme-dept',
        'BME(Bio-Medical Engineering)': 'bme-dept',
        'CIVIL(Civil Engineering)': 'civil-dept',
        'CSE(Computer Science and Engineering)': 'cse-dept',
        'ECE(Electronics and Communication Engineering)': 'ece-dept',
        'EEE(Electrical and Electronics Engineering)': 'eee-dept',
        'IT(Information Technology)': 'it-dept',
        'MECH(Mechanical Engineering)': 'mech-dept',
        'AG(Agricultural Engineering)': 'age-dept'
      };

      

      // Check the selected department checkboxes (like Python: widget.field_value = True)
      const preferences = [editData.preference1, editData.preference2, editData.preference3];

      preferences.forEach((pref, index) => {
        if (pref && deptMapping[pref]) {
          const fieldName = deptMapping[pref];

          try {
            const checkbox = form.getCheckBox(fieldName);
            checkbox.check();
          } catch (error) {
            console.warn(`✗ Could not check ${fieldName}:`, error.message);
          }
        }
      });

      // Branch awarded text field
      setTextField('branch-awarded', editData.branchAwarded || '');

      // Admission type - checkbox group
      if (editData.entry === 'I YEAR') {
        setCheckboxInGroup('admission-type', 'I-year');
      } else if (editData.entry === 'LATERAL ENTRY') {
        setCheckboxInGroup('admission-type', 'lateral-entry');
      }

      // Family Details
      setTextField('father/guardian-name', editData.fatherName || '');
      
      // Set father occupation with font size adjustment for "CENTRAL GOVT. EMP."
      const fatherOccupationValue = editData.fatherOccupation || '';
      if (fatherOccupationValue === 'CENTRAL GOVT. EMP.') {
        setTextField('father/guardian-occupation', fatherOccupationValue, { fontSize: 9 });
      } else {
        setTextField('father/guardian-occupation', fatherOccupationValue);
      }
      
      setTextField('family-income', editData.annualIncome || '');
      setTextField('caste', editData.caste || '');

      // Community - checkbox group (like Python: check 'bc' for BC community)
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
      if (editData.community && communityMap[editData.community]) {
        setCheckboxInGroup('community', communityMap[editData.community]);
      }

      // Seat Type - checkbox group (government/management)
      if (editData.quota === 'GQ' || editData.quota === 'Government') {
        setCheckboxInGroup('seat-type', 'governement');
      } else if (editData.quota === 'MQ' || editData.quota === 'Management') {
        setCheckboxInGroup('seat-type', 'management');
      }

      // Government eligible (Govt School 6th-12th) - checkbox group
      if (editData.govtSchool === 'YES' || editData.govtSchool === 'Yes') {
        setCheckboxInGroup('govt-eligible', 'yes');
      } else if (editData.govtSchool === 'NO' || editData.govtSchool === 'No') {
        setCheckboxInGroup('govt-eligible', 'no');
      }

      // First graduate - checkbox group
      if (editData.firstGrad === 'YES' || editData.firstGrad === 'Yes') {
        setCheckboxInGroup('first-graduate', 'yes');
      } else if (editData.firstGrad === 'NO' || editData.firstGrad === 'No') {
        setCheckboxInGroup('first-graduate', 'no');
      }

      // Student type - checkbox group (like Python: check 'college-bus')
      // Note: days-scholar does not exist in PDF, only: boys-hostel, girls-hostel, out-bus, college-bus
      const studentTypeMap = {
        'BoysHostel': 'boys-hostel',
        'GirlsHostel': 'girls-hostel'
      };

      if (editData.accommodation && studentTypeMap[editData.accommodation]) {
        setCheckboxInGroup('student-type', studentTypeMap[editData.accommodation]);
      }
      
      // Day Scholar checkbox
      if (editData.accommodation === 'DAYSCHOLAR') {
        setCheckbox('days-scholar', true);
      }

      // Travel type (college-bus or out-bus)
      if (editData.travelType === 'COLLEGEBUS') {
        setCheckboxInGroup('student-type', 'college-bus');
      } else if (editData.travelType === 'OUTBUS') {
        setCheckboxInGroup('student-type', 'out-bus');
      }

      setTextField('bus-stop', editData.busStopName || editData.busStop || '');

      // Address Details
      setTextField('address-line-1', editData.address1 || '');
      setTextField('address-line-2', editData.address2 || '');
      setTextField('taluk', editData.taluk || '');
      setTextField('district', editData.district || '');
      setTextField('state', editData.state || '');
      setTextField('pin-code', editData.pincode || '');

      // Contact Numbers
      setTextField('contact-No-(father)', editData.fatherContact || '');
      setTextField('contact-No-(mother)', editData.motherContact || '');
      setTextField('contact-No-(student)', editData.studentContact || '');

      // === ACADEMIC DETAILS MAPPING ===
      
      // Educational institution details (use scoresData if available, otherwise fallback to editData)
      setTextField(
        'name-and-place-of-college',
        scoresData?.schoolName || chooseDiplomaValue('diplomaInstitution', 'schoolName', 'vocationalSchoolName', 'nameAndPlaceOfCollege')
      );
      setTextField(
        'register-no',
        scoresData?.registerNumber || chooseDiplomaValue('diplomaRegisterNo', 'registrationNo', 'registerNumber', 'registerNo')
      );
      setTextField('type-studies', scoresData?.courseType || pickValue('lastStudies', 'typeStudies'));
      setTextField(
        'medium-of-study',
        scoresData?.medium || (chooseDiplomaValue('diplomaProgram', 'mediumOfStudy', 'vocationalMediumOfStudy', 'medium') || 'English')
      );
      setTextField(
        'year-of-passing',
        scoresData?.yearOfPassing || chooseDiplomaValue('diplomaCompletionYear', 'yearOfPassing', 'vocationalYearOfPassing', 'passingYear')
      );

      // SSLC Marks
      setTextField('sslc-mark', editData.sslcMarks || '');
      
      // Calculate SSLC Percentage (divide by 5 and format to 2 decimal points)
      const sslcPercentage = editData.sslcMarks ? (parseFloat(editData.sslcMarks) / 5).toFixed(2) : '';
      setTextField('sslc-percentage', sslcPercentage);

      // HSC/CBSE Marks - Use scoresData if available, otherwise fallback to editData
      const chooseMarks = (vocationalKey, academicKey) => {
        return isVocational
          ? pickValue(vocationalKey, academicKey)
          : pickValue(academicKey, vocationalKey);
      };

      // Helper function to get mark by subject name from scoresData
      const getMarkBySubjectName = (subjectName) => {
        if (!subjectName || !scoresData) return '';
        for (let i = 1; i <= 6; i++) {
          const subject = scoresData[`subject${i}`];
          if (subject && typeof subject === 'string' && subject.toUpperCase().includes(subjectName.toUpperCase())) {
            return scoresData[`subject${i}Marks`] || '';
          }
        }
        return '';
      };

      // Map subject marks from scoresData object based on subject name, not position
      // Don't display 0 marks - show empty field instead
      const formatMark = (val) => (val === 0 || val === '0' || !val) ? '' : val;
      const subjectFieldMappings = [
        ['TAMIL', formatMark(getMarkBySubjectName('TAMIL') || chooseMarks('vocationalTamilMarks', 'tamilMarks'))],
        ['ENGLISH', formatMark(getMarkBySubjectName('ENGLISH') || chooseMarks('vocationalEnglishMarks', 'englishMarks'))],
        ['physics', formatMark(getMarkBySubjectName('PHYSICS') || chooseMarks('vocationalSubject3Marks', 'physicsMarks'))],
        ['chemistry', formatMark(getMarkBySubjectName('CHEMISTRY') || chooseMarks('vocationalSubject4Marks', 'chemistryMarks'))],
        ['maths', formatMark(getMarkBySubjectName('MATHEMATICS') || chooseMarks('vocationalSubject5Marks', 'mathsMarks'))],
        ['computer-science/biology', formatMark(getMarkBySubjectName('COMPUTER SCIENCE') || getMarkBySubjectName('BIOLOGY') || chooseMarks('vocationalSubject6Marks', 'csOrBioMarks'))]
      ];

      subjectFieldMappings.forEach(([field, value]) => {
        setTextField(field, value);
      });
      
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

      // Diploma marks (conditional - only for diploma students)
      if (editData.lastStudies === 'DIPLOMA') {
        setTextField('diploma-1-to-5-sem', editData.fifthSemMarks || '');
        setTextField('diploma-1-to-6-sem', editData.sixthSemMarks || '');
      }

      // Engineering eligibility/cutoff
      setTextField('engineering-eligibility', formatValue(scoresData?.eligibility || cutoffValue));

      // Reference Information
      const consultingTypeUpper = (editData.consultingType || '').toString().trim().toUpperCase();
      const consultingCode = consultingTypeUpper === 'CONSULTING'
        ? 'C'
        : (consultingTypeUpper === 'NOT CONSULTING' || consultingTypeUpper === 'NON CONSULTING')
          ? 'NC'
          : (editData.consultingType || '');
      setTextField('consulting-type', consultingCode);
      setTextField('know-about-this-college', editData.knowAbout || '');
      const referenceDisplayName = [editData.referencePrefix, editData.referenceName]
        .filter(Boolean)
        .join(' ');
      setTextField('reference-name', referenceDisplayName || '');
      setTextField('reference-contact-no', editData.referenceContact || '');


      if (editData.quota === 'Government') {
        // Government seat fees
        setTextField('government-tuition-fee', editData.tuitionFee || '');
        setTextField('government-development-fee', editData.developmentFee || '');
        setTextField('government-admission-fee', editData.admissionFee || '');
        setTextField('government-caution deposit-fee', editData.cautionDeposit || '');
        setTextField('government-optional-fee', editData.optionalFees || '');
        
        // Scholarships
        setTextField('government-sc/st-scholorship', editData.scStScholarship || '');
        setTextField('government-first-graduate-fee', editData.fgScholarship || '');
        
        // Transportation & Hostel
        setTextField('government-bus-fee', editData.busFee || '');
        setTextField('government-mess-bill', editData.messBill || '');
        setTextField('government-room-rent', editData.roomRent || '');
        setTextField('government-laundry-fee', editData.laundryCharges || '');
        
        // Totals
        setTextField('government-tuition-total-fee', editData.feeSubTotal || '');
        setTextField('government-college-total-fee', editData.feeCollegeTotal || '');
        setTextField('government-total-hostel-fee', editData.feeHostelTotal || '');
        setTextField('government-overall-fee', editData.feeOverallTotal || '');
        
        
      } else if (editData.quota === 'Management') {
        // Management seat fees
        setTextField('management-tuition-fee', editData.tuitionFee || '');
        setTextField('management-development-fee', editData.developmentFee || '');
        setTextField('management-admission-fee', editData.admissionFee || '');
        setTextField('management-caution deposit-fee', editData.cautionDeposit || '');
        setTextField('management-optional-fee', editData.optionalFees || '');
        
        // Scholarships
        setTextField('management-sc/st-scholorship', editData.scStScholarship || '');
        setTextField('management-first-graduate-fee', editData.fgScholarship || '');
        
        // Transportation & Hostel
        setTextField('management-bus-fee', editData.busFee || '');
        setTextField('management-mess-bill', editData.messBill || '');
        setTextField('management-room-rent', editData.roomRent || '');
        setTextField('management-laundry-fee', editData.laundryCharges || '');
        
        // Totals
        setTextField('management-tuition-total-fee', editData.feeSubTotal || '');
        setTextField('management-college-total-fee', editData.feeCollegeTotal || '');
        setTextField('management-total-hostel-fee', editData.feeHostelTotal || '');
        setTextField('management-overall-fee', editData.feeOverallTotal || '');
        
      }

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

  const handlePreviewPDF = () => {
    
    setShowPDFPreview(true);
  };

  const handleSave = async () => {
    // Validate all required fields first
    if (!validateAllFields()) {
      console.error("❌ Please fill in all required fields correctly before saving.");
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    
    try {
      // Helper function to convert all string values to uppercase
      const convertToUppercase = (data) => {
        const excludeFields = ['status', 'branchAwarded', 'gender', 'preference1', 'preference2', 'preference3', 'preference4', 'preference5', 'preference6', 'preference7', 'preference8', 'preference9', 'referencePrefix', 'referenceName', 'feesPaid', 'applicationDate'];
        const result = {};
        for (const [key, value] of Object.entries(data)) {
          // Cast numbers and other types to string to satisfy Pydantic strict string validation
          const safeValue = (value !== null && value !== undefined) ? String(value) : value;
          
          if (typeof safeValue === 'string' && !excludeFields.includes(key) && safeValue !== null) {
            result[key] = safeValue.toUpperCase();
          } else {
            result[key] = safeValue;
          }
        }
        return result;
      };

      // Helper function to convert full department name to short code
      const convertFullToShort = (fullName) => {
        if (!fullName) return '';
        
        // Check if it's already a short code (case-insensitive)
        const upperName = fullName.toUpperCase().trim();
        const isShortCode = degree.find(d => d.short.toUpperCase() === upperName);
        if (isShortCode) return isShortCode.short;
        
        // Try to find by full department name
        const dept = degree.find(d => d.department === fullName);
        return dept ? dept.short : fullName;
      };

      // Helper function to format date to DD/MM/YYYY (matches server format)
      const formatDateForServer = (dateString) => {
        if (!dateString) {
          const today = new Date();
          const day = String(today.getDate()).padStart(2, '0');
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const year = today.getFullYear();
          return `${day}/${month}/${year}`;
        }
        // If already in DD/MM/YYYY format, return as-is
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
          return dateString;
        }
        // If in DD-MM-YYYY format, convert to DD/MM/YYYY
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
          const [day, month, year] = dateString.split('-');
          return `${day}/${month}/${year}`;
        }
        // If in YYYY-MM-DD format, convert to DD/MM/YYYY
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          const [year, month, day] = dateString.split('-');
          return `${day}/${month}/${year}`;
        }
        // Try to parse as Date object
        try {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          }
        } catch (e) {
          // If parsing fails, return today's date
          const today = new Date();
          const day = String(today.getDate()).padStart(2, '0');
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const year = today.getFullYear();
          return `${day}/${month}/${year}`;
        }
        return dateString;
      };
      
      // Step 1: Save personal info using GET method with updatePersonalInfo action
      const params = new URLSearchParams();
      params.append("action", "updatePersonalInfo");
      
      // Prepare all data including admin-only fields
      // Combine referencePrefix and referenceName
      const combinedReferenceName = [editData.referencePrefix, editData.referenceName]
        .filter(Boolean)
        .join(' ');
      
      const dataToSend = {
        ...editData,
        // Include schoolName from scoresData
        schoolName: scoresData.schoolName || editData.schoolName || "",
        // Convert preferences from full names to short codes
        preference1: convertFullToShort(editData.preference1),
        preference2: convertFullToShort(editData.preference2),
        preference3: convertFullToShort(editData.preference3),
        preference4: convertFullToShort(editData.preference4),
        preference5: convertFullToShort(editData.preference5),
        preference6: convertFullToShort(editData.preference6),
        preference7: convertFullToShort(editData.preference7),
        preference8: convertFullToShort(editData.preference8),
        preference9: convertFullToShort(editData.preference9),
        // Ensure all admin-editable fields are included
        status: editData.status || "Pending",
        date: formatDateForServer(editData.date),
        applicationDate: formatDateForServer(editData.applicationDate),
        updatedDate: formatDateForServer(new Date().toISOString()),
        admissionId: editData.admissionId || "",
        branchAwarded: editData.branchAwarded || "",
        feesPaid: editData.feesPaid || "",
        busStopName: editData.busStopName || "",
        busRoute: editData.busRoute || "",
        busNo: editData.busNo || "",
        busFees: editData.busFees || "",
        consultingType: editData.consultingType || "",
        knowAbout: editData.knowAbout || "",
        referencePrefix: "",
        referenceName: combinedReferenceName || "",
        referenceContact: editData.referenceContact || "",
        dropoutCollege: editData.dropoutCollege || "",
        dropoutRegisterNo: editData.dropoutRegisterNo || "",
        dropoutYear: editData.dropoutYear || ""
      };

      // Convert all string values to uppercase before sending
      const uppercaseData = convertToUppercase(dataToSend);
      
      // Step 2: Save scores if they were edited (only when data exists)
      if (Object.keys(scoresData).length > 0) {
        const uppercaseScoresData = convertToUppercase(scoresData);
        // Merge scores into the main data
        Object.assign(uppercaseData, uppercaseScoresData);
      }
      
      const response = await fetch(`${BACKEND_URL}/api/applications/by-enquiry/${editData.enquiryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(uppercaseData)
      });
      const responseData = await response.json();
      

      // Check if the response indicates success
      if (!response.ok) {
        console.error("Failed to update personal info: " + (responseData.detail || "Unknown error"));
        setIsSaving(false);
        return;
      }
      // For compatibility with old code expectation
      responseData.success = true;

      // Update editData with server-returned admission ID (if generated)
      let updatedEditData = { ...editData };
      if (responseData.admissionId) {
        updatedEditData.admissionId = responseData.admissionId;
        setEditData(prev => ({
          ...prev,
          admissionId: responseData.admissionId
        }));
      }



      if (responseData.success) {
        onUpdateSuccess(updatedEditData);

        // Show PDF Preview directly instead of navigating to fees-success
        setShowPDFPreview(true);
      } else {
        console.error('❌ Update failed:', responseData);
      }
    } catch (error) {
      console.error("❌ Error during save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOnly = async () => {
    // No validation - save whatever data is present
    setIsSaving(true);
    
    try {
      // Helper function to convert all string values to uppercase
      const convertToUppercase = (data) => {
        const excludeFields = ['status', 'branchAwarded', 'gender', 'preference1', 'preference2', 'preference3', 'preference4', 'preference5', 'preference6', 'preference7', 'preference8', 'preference9', 'referencePrefix', 'referenceName', 'feesPaid', 'applicationDate'];
        const result = {};
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string' && !excludeFields.includes(key)) {
            result[key] = value.toUpperCase();
          } else {
            result[key] = value;
          }
        }
        return result;
      };

      // Helper function to convert full department name to short code
      const convertFullToShort = (fullName) => {
        if (!fullName) return '';
        
        // Check if it's already a short code (case-insensitive)
        const upperName = fullName.toUpperCase().trim();
        const isShortCode = degree.find(d => d.short.toUpperCase() === upperName);
        if (isShortCode) return isShortCode.short;
        
        // Try to find by full department name
        const dept = degree.find(d => d.department === fullName);
        return dept ? dept.short : fullName;
      };

      // Helper function to format date to DD/MM/YYYY (matches server format)
      const formatDateForServer = (dateString) => {
        if (!dateString) {
          const today = new Date();
          const day = String(today.getDate()).padStart(2, '0');
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const year = today.getFullYear();
          return `${day}/${month}/${year}`;
        }
        // If already in DD/MM/YYYY format, return as-is
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
          return dateString;
        }
        // If in DD-MM-YYYY format, convert to DD/MM/YYYY
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
          const [day, month, year] = dateString.split('-');
          return `${day}/${month}/${year}`;
        }
        // If in YYYY-MM-DD format, convert to DD/MM/YYYY
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          const [year, month, day] = dateString.split('-');
          return `${day}/${month}/${year}`;
        }
        // Try to parse as Date object
        try {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          }
        } catch (e) {
          // If parsing fails, return today's date
          const today = new Date();
          const day = String(today.getDate()).padStart(2, '0');
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const year = today.getFullYear();
          return `${day}/${month}/${year}`;
        }
        return dateString;
      };
      
      // Step 1: Save personal info using GET method with updatePersonalInfo action
      const params = new URLSearchParams();
      params.append("action", "updatePersonalInfo");
      
      // Prepare all data including admin-only fields
      // Combine referencePrefix and referenceName
      const combinedReferenceName = [editData.referencePrefix, editData.referenceName]
        .filter(Boolean)
        .join(' ');
      
      const dataToSend = {
        ...editData,
        // Include schoolName from scoresData
        schoolName: scoresData.schoolName || editData.schoolName || "",
        // Convert preferences from full names to short codes
        preference1: convertFullToShort(editData.preference1),
        preference2: convertFullToShort(editData.preference2),
        preference3: convertFullToShort(editData.preference3),
        preference4: convertFullToShort(editData.preference4),
        preference5: convertFullToShort(editData.preference5),
        preference6: convertFullToShort(editData.preference6),
        preference7: convertFullToShort(editData.preference7),
        preference8: convertFullToShort(editData.preference8),
        preference9: convertFullToShort(editData.preference9),
        // Ensure all admin-editable fields are included
        status: editData.status || "Pending",
        date: formatDateForServer(editData.date),
        applicationDate: formatDateForServer(editData.applicationDate),
        updatedDate: formatDateForServer(new Date().toISOString()),
        admissionId: editData.admissionId || "",
        branchAwarded: editData.branchAwarded || "",
        feesPaid: editData.feesPaid || "",
        busStopName: editData.busStopName || "",
        busRoute: editData.busRoute || "",
        busNo: editData.busNo || "",
        busFees: editData.busFees || "",
        consultingType: editData.consultingType || "",
        knowAbout: editData.knowAbout || "",
        referencePrefix: "",
        referenceName: combinedReferenceName || "",
        referenceContact: editData.referenceContact || "",
        dropoutCollege: editData.dropoutCollege || "",
        dropoutRegisterNo: editData.dropoutRegisterNo || "",
        dropoutYear: editData.dropoutYear || ""
      };

      // Convert all string values to uppercase before sending
      const uppercaseData = convertToUppercase(dataToSend);
      
      // Step 2: Save scores if they were edited (only when data exists)
      if (Object.keys(scoresData).length > 0) {
        const uppercaseScoresData = convertToUppercase(scoresData);
        // Merge scores into the main data
        Object.assign(uppercaseData, uppercaseScoresData);
      }
      
      const response = await fetch(`${BACKEND_URL}/api/applications/by-enquiry/${editData.enquiryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(uppercaseData)
      });
      const responseData = await response.json();
      

      // Check if the response indicates success
      if (!response.ok) {
        console.error("Failed to update personal info: " + (responseData.detail || "Unknown error"));
        setIsSaving(false);
        return;
      }
      // For compatibility with old code expectation
      responseData.success = true;

      // Update editData with server-returned admission ID (if generated)
      let updatedEditData = { ...editData };
      if (responseData.admissionId) {
        updatedEditData.admissionId = responseData.admissionId;
        setEditData(prev => ({
          ...prev,
          admissionId: responseData.admissionId
        }));
      }


      if (responseData.success) {
        onUpdateSuccess(updatedEditData);

        // Show inline success modal
        setShowSuccessModal(true);
      } else {
        console.error('❌ Update failed:', responseData);
      }
    } catch (error) {
      console.error("❌ Error during save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessOk = () => {
    setShowSuccessModal(false);
    onClose();
  };

  const handleNavigateToScores = () => {
    const lastStudies = editData.lastStudies;

    if (lastStudies === 'HSC') {
      navigate('/admin/academic-score', { state: { applicationData: editData } });
    } else if (lastStudies === 'VOCATIONAL') {
      navigate('/admin/vocational-score', { state: { applicationData: editData } });
    } else if (lastStudies === 'CBSE') {
      navigate('/admin/cbse-score', { state: { applicationData: editData } });
    } else if (lastStudies === 'DIPLOMA') {
      navigate('/admin/diploma-score', { state: { applicationData: editData } });
    } else if (lastStudies === 'Dropout') {
      navigate('/feesInfo', { state: { applicationData: editData } });
    }

    setShowSuccessModal(false);
    onClose();
  };

  // Validation Error Display Component
  const ValidationError = ({ fieldName }) => {
    if (!validationErrors[fieldName]) return null;
    return (
      <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>{validationErrors[fieldName]}</span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div>
        <Nav />
      </div>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-lg sm:rounded-2xl shadow-xl max-w-7xl w-full my-4 sm:my-8">
          {/* Modal Header */}
          <div className="bg-blue-600 px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 flex items-center justify-between rounded-t-lg sm:rounded-t-2xl">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              Edit Application
            </h2>
            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Single Scrollable Content */}
          <div className="max-h-[70vh] sm:max-h-[75vh] overflow-y-auto">
          {/* Personal Info Section */}
          <div className="bg-blue-50 px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-blue-100">
            <h3 className="text-base sm:text-lg font-bold text-blue-900">Personal Information</h3>
          </div>
          <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
            {/* Row 1: Seat Type & Admission Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-8 md:gap-x-12 gap-y-4 sm:gap-y-6 md:gap-y-10">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Seat Type <span className="text-red-600">*</span></label>
                <div className="bg-gray-50 p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl space-y-3">
                  <div className="flex flex-wrap gap-3 sm:gap-4 md:space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="quota"
                        value="GQ"
                        checked={editData.quota === "GQ"}
                        onChange={(e) => handleInputChange("quota", e.target.value)}
                        onBlur={() => handleBlur("quota")}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium">Government</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="quota"
                        value="MQ"
                        checked={editData.quota === "MQ"}
                        onChange={(e) => handleInputChange("quota", e.target.value)}
                        onBlur={() => handleBlur("quota")}
                        className="w-5 h-5 text-green-600 focus:ring-green-500"
                      />
                      <span className="font-medium">Management</span>
                    </label>
                  </div>
                  <ValidationError fieldName="quota" />
                </div>
              </div>

              {/* Admission Type */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Admission Type <span className="text-red-600">*</span></label>
                <select
                  value={editData.entry || ""}
                  onChange={(e) => handleInputChange("entry", e.target.value)}
                  onBlur={() => handleBlur("entry")}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                >
                  <option value="" disabled>Select Entry Type</option>
                  <option value="I YEAR">I YEAR</option>
                  <option value="LATERAL ENTRY">LATERAL ENTRY</option>
                </select>
                <ValidationError fieldName="entry" />
              </div>
    {/* 2. Enquiry ID Field (New ReadOnly Input) */}
    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
        Enquiry ID
      </label>
      <input
        type="text"
        value={editData.enquiryId || "ENQ-PENDING"} /* Replace with your actual data variable */
        readOnly
        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-200 text-gray-500 border border-gray-300 rounded-lg cursor-not-allowed outline-none select-none"
      />
    </div>
    {/* 3. Admission ID Field (Auto-generated when status is Admitted) */}
    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
        Admission ID
      </label>
      <input
        type="text"
        value={editData.admissionId || "Not Generated"}
        readOnly
        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg cursor-not-allowed outline-none select-none ${
          editData.admissionId
            ? "bg-green-100 text-green-700 font-semibold border-green-300"
            : "bg-gray-200 text-gray-500"
        }`}
      />
    </div>
            </div>

            <hr className="border-gray-100" />

            {/* Row 2: DOB & Gender/Accommodation */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-8 md:gap-x-12 gap-y-4 sm:gap-y-6 md:gap-y-10">
  
  {/* LEFT COLUMN WRAPPER: Holds Full Name and Enquiry ID vertically */}
  <div className="space-y-4 sm:space-y-6 md:space-y-8">
    
    {/* 1. Full Name Field */}
    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Name with Initial <span className="text-red-600">*</span></label>
      <input
        type="text"
        value={editData.fullName || ""}
        onChange={(e) => handleInputChange("fullName", e.target.value)}
        onBlur={() => handleBlur("fullName")}
        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
        style={{ textTransform: 'uppercase' }}
      />
      <ValidationError fieldName="fullName" />
    </div>
     {/* Row 3: Department Preferences (Drag & Drop) */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Degree / Department Preferences <span className="text-red-600">*</span>
                <span className="ml-2 text-xs text-gray-500 font-normal">(Drag to reorder)</span>
              </label>
              <div className="space-y-2 sm:space-y-3">
                {/* Display current preferences with drag and drop */}
                {getCurrentPreferences().map((pref, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`group flex items-center gap-2 p-3 bg-white border-2 rounded-lg transition-all cursor-move ${
                      draggedItem === index 
                        ? 'border-blue-500 opacity-50 scale-95' 
                        : 'border-gray-300 hover:border-blue-400 hover:shadow-md'
                    }`}
                  >
                    {/* Preference Number Badge */}
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-bold rounded-full text-sm">
                      {index + 1}
                    </div>
                    
                    {/* Department Name */}
                    <div className="flex-grow text-sm sm:text-base font-medium text-gray-800">
                      {pref}
                    </div>
                    
                    {/* Remove Button - Only visible on hover */}
                    <button
                      type="button"
                      onClick={() => handleRemovePreference(index)}
                      className="flex-shrink-0 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Remove this preference"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {/* Validation Error for preference1 */}
                {getCurrentPreferences().length === 0 && <ValidationError fieldName="preference1" />}
                
                {/* Add New Preference Dropdown */}
                {getCurrentPreferences().length < 9 && (
                  <select
                    value=""
                    onChange={(e) => {
                      handleAddPreference(e.target.value);
                      handleInputChange(`preference${getCurrentPreferences().length + 1}`, e.target.value);
                    }}
                    onBlur={() => handleBlur("preference1")}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none hover:border-blue-400"
                  >
                    <option value="" disabled>
                      {getCurrentPreferences().length === 0 
                        ? '+ Select 1st Preference' 
                        : `+ Add ${getCurrentPreferences().length + 1}${['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'][getCurrentPreferences().length]} Preference`}
                    </option>
                    {degree
                      .filter(dept => !getCurrentPreferences().includes(dept.department))
                      .map((dept, index) => (
                        <option key={index} value={dept.department}>
                          {dept.department}
                        </option>
                      ))}
                  </select>
                )}
                
                {/* Info message */}
                {getCurrentPreferences().length > 0 && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Showing {getCurrentPreferences().length} of 9 preferences. Drag to reorder.
                  </p>
                )}
              </div>
            </div>



   

  </div>

  {/* RIGHT COLUMN: Gender / Accommodation (Unchanged) */}
  <div>
    <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
      Gender / Accommodation <span className="text-red-600">*</span>
    </label>
    <div className="bg-gray-50 p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4">
      <div className="flex flex-wrap gap-3 sm:gap-4 md:space-x-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="gender"
            value="MALE"
            checked={editData.gender === "MALE"}
            onChange={(e) => handleInputChange("gender", e.target.value)}
            onBlur={() => handleBlur("gender")}
            className="w-5 h-5 text-blue-600 focus:ring-blue-500"
          />
          <span className="font-medium">MALE</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="gender"
            value="FEMALE"
            checked={editData.gender === "FEMALE"}
            onChange={(e) => handleInputChange("gender", e.target.value)}
            onBlur={() => handleBlur("gender")}
            className="w-5 h-5 text-pink-600 focus:ring-pink-500"
          />
          <span className="font-medium">FEMALE</span>
        </label>
      </div>
      <ValidationError fieldName="gender" />



      {editData.gender && (
        <div className="pt-3 sm:pt-4 border-t border-gray-200 space-y-2 sm:space-y-3">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
            STUDENT TYPE <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <label className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:border-blue-400 cursor-pointer">
              <input
                type="radio"
                name="accommodation"
                value={editData.gender === "MALE" ? "BOYSHOSTEL" : "GIRLSHOSTEL"}
                checked={
                  editData.accommodation ===
                  (editData.gender === "MALE" ? "BOYSHOSTEL" : "GIRLSHOSTEL")
                }
                onChange={(e) => handleInputChange("accommodation", e.target.value)}
                onBlur={() => handleBlur("accommodation")}
              />
              <span className="text-sm">Hostel</span>
            </label>
            <label className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:border-blue-400 cursor-pointer">
              <input
                type="radio"
                name="accommodation"
                value="DAYSCHOLAR"
                checked={editData.accommodation === "DAYSCHOLAR"}
                onChange={(e) => handleInputChange("accommodation", e.target.value)}
                onBlur={() => handleBlur("accommodation")}
              />
              <span className="text-sm">Day Scholar</span>
            </label>
          </div>
          <ValidationError fieldName="accommodation" />
          <ValidationError fieldName="accommodation" />

          {/* Room / Travel Details Sub-options */}
          {(editData.accommodation === "BOYSHOSTEL" ||
            editData.accommodation === "GIRLSHOSTEL") && (
            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 space-y-2">
              <select
                name="roomType"
                value={editData.roomType || ""}
                onChange={(e) => handleInputChange("roomType", e.target.value)}
                className="w-full text-sm bg-transparent border-none outline-none focus:ring-0"
                required
              >
                <option value="" disabled>Select Room Type</option>
                <option value={editData.accommodation === "BOYSHOSTEL" ? "BOYS HOSTEL (N)" : "GIRLS HOSTEL (N)"}>Normal Room (4 Members)</option>
                <option value={editData.accommodation === "BOYSHOSTEL" ? "BOYS HOSTEL (A)" : "GIRLS HOSTEL (A)"}>Attached Room (3 Members)</option>
                <option value={editData.accommodation === "BOYSHOSTEL" ? "BOYS HOSTEL (AC)" : "GIRLS HOSTEL (AC)"}>Attached AC Room (3 Members)</option>
              </select>
            </div>
          )}


          {editData.accommodation === "DAYSCHOLAR" && (
            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 space-y-2">
              <select
                name="travelType"
                value={editData.travelType || ""}
                onChange={(e) => handleInputChange("travelType", e.target.value)}
                className="w-full text-sm bg-transparent border-none outline-none focus:ring-0"
                required
              >
                <option value="">Select Travel Type</option>
                <option value="COLLEGEBUS">COLLEGE BUS</option>
                <option value="OUTBUS">OWN/OUTSIDE TRAVEL</option>
              </select>
              
              {/* Bus Stop Autocomplete - Only shown when College Bus is selected */}
              {editData.travelType === "COLLEGEBUS" && (
                <div className="mt-3 space-y-3 bus-stop-autocomplete">
                  {/* Bus Stop Name with Autocomplete */}
                  <div className="relative">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Bus Stop Name</label>
                    <input
                      type="text"
                      value={busStopSearch}
                      onChange={handleBusStopSearch}
                      onFocus={() => busStopSearch.length >= 3 && setShowSuggestions(true)}
                      onBlur={() => {
                        // Delay to allow click on suggestion
                        setTimeout(() => {
                          setShowSuggestions(false);
                          handleBlur("busStopName");
                        }, 200);
                      }}
                      placeholder="Type at least 3 characters to search..."
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      style={{ textTransform: 'uppercase' }}
                    />
                    {/* Suggestions Dropdown */}
                    {showSuggestions && busStopSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {busStopSuggestions.map((stop, index) => (
                          <div
                            key={index}
                            onClick={() => handleBusStopSelect(stop)}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                          >
                            <span className="font-medium">{stop.busStopName}</span>
                            <span className="text-xs text-gray-500 ml-2">({stop.route})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <ValidationError fieldName="busStopName" />
                  </div>

                  {/* Route - Auto-populated */}
                  {editData.busStopName && (
                    <>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Route</label>
                        <input
                          type="text"
                          value={editData.busRoute || ''}
                          onChange={(e) => handleInputChange('busRoute', e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>

                      {/* Bus No - Auto-populated */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Bus No</label>
                        <input
                          type="text"
                          value={editData.busNo || ''}
                          onChange={(e) => handleInputChange('busNo', e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>

                      {/* Bus Fees - Auto-populated */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Bus Fees (Per Year)</label>
                        <input
                          type="text"
                          value={editData.busFees || ''}
                          onChange={(e) => handleInputChange('busFees', e.target.value)}
                          placeholder="₹"
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-green-700"
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
</div>

           

            <hr className="border-gray-100" />

       

            <hr className="border-gray-100" />

            {/* Row 4: DOB & Entry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Date of Birth <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={formatDateForInput(editData.dob)}
                  onChange={(e) => handleInputChange("dob", e.target.value)}
                  onBlur={() => handleBlur("dob")}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
                <ValidationError fieldName="dob" />
              </div>
              <div className="bg-blue-50 p-4 border border-blue-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">First Graduate? <span className="text-red-600">*</span></span>
                  <span className="text-xs text-blue-700/70 capitalize">Are you the first in family to graduate?</span>
                </div>
                <div className="flex space-x-3">
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input type="radio" name="firstGrad" value="YES" checked={editData.firstGrad === "YES"} onChange={(e) => handleInputChange("firstGrad", e.target.value)} onBlur={() => handleBlur("firstGrad")} className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">YES</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input type="radio" name="firstGrad" value="NO" checked={editData.firstGrad === "NO"} onChange={(e) => handleInputChange("firstGrad", e.target.value)} onBlur={() => handleBlur("firstGrad")} className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">NO</span>
                  </label>
                </div>
                <ValidationError fieldName="firstGrad" />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Father's Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Father / Guardian Name <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  value={editData.fatherName || ""}
                  onChange={(e) => handleInputChange("fatherName", e.target.value)}
                  onBlur={() => handleBlur("fatherName")}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
                <ValidationError fieldName="fatherName" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Father's / Guardian's Occupation <span className="text-red-600">*</span></label>
                <select
                  value={editData.fatherOccupation || ""}
                  onChange={(e) => handleInputChange("fatherOccupation", e.target.value)}
                  onBlur={() => handleBlur("fatherOccupation")}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                >
                  <option value="" disabled>Select Occupation</option>
                  <option value="FARMER">Farmer</option>
                  <option value="STATE GOVT. EMP.">State Govt. Employee</option>
                  <option value="CENTRAL GOVT. EMP.">Central Govt Employee</option>
                  <option value="PRIVATE EMP.">Private Employee</option>
                  <option value="BUSINESS">Business</option>
                  <option value="DAILY WAGES">Daily wages</option>
                  <option value="DRIVER">Driver</option>
                  <option value="OTHERS">Others</option>
                  <option value="DECEASED">Deceased</option>
                </select>
                <ValidationError fieldName="fatherOccupation" />
              </div>
            </div>


 {/* Mother's Details     validation js pending */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Mother</label>
                <input
                  type="text"
                  value={editData.motherName || ""}
                  onChange={(e) => handleInputChange("motherName", e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Mother's Occupation</label>
                <select
                  value={editData.motherOccupation || ""}
                  onChange={(e) => handleInputChange("motherOccupation", e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                >
                  <option value="" disabled>Select Occupation</option>
                  <option value="FARMER">Farmer</option>
                  <option value="STATE GOVT. EMPLOYEE">State Govt. Employee</option>
                  <option value="CENTRAL GOVT EMPLOYEE">Central Govt Employee</option>
                  <option value="PRIVATE EMPLOYEE">Private Employee</option>
                  <option value="BUSINESS">Business</option>
                  <option value="DAILY WAGES">Daily wages</option>
                  <option value="DRIVER">Driver</option>
                  <option value="HOMEMAKER">Homemaker</option>
                  <option value="OTHERS">Others</option>
                  <option value="DECEASED">Deceased</option>
                </select>
              </div>
            </div>


            <hr className="border-gray-100" />

            {/* Community & Caste */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Community <span className="text-red-600">*</span></label>
                <select
                  value={editData.community || ""}
                  onChange={(e) => handleInputChange("community", e.target.value)}
                  onBlur={() => handleBlur("community")}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                >
                  <option value=""disabled>Select Community</option>
                  <option value="OC">OC</option>
                  <option value="BC">BC</option>
                  <option value="BCM">BCM</option>
                  <option value="MBC">MBC</option>
                  <option value="SC">SC</option>
                  <option value="SCA">SCA</option>
                  <option value="SCC">SCC</option>
                  <option value="ST">ST</option>
                </select>
                <ValidationError fieldName="community" />
              </div>
              <div className="caste-autocomplete relative">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Caste <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  value={editData.community === 'OC' ? 'NOT REQUIRED' : (casteDropdownOpen ? casteSearch : (editData.caste || ""))}
                  onChange={(e) => {
                    if (editData.community === 'OC') return; // Don't allow changes for OC
                    const uppercaseValue = e.target.value.toUpperCase();
                    setCasteSearch(uppercaseValue);
                    // Update editData in real-time as user types
                    handleInputChange("caste", uppercaseValue);
                    setCasteDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (editData.community === 'OC') return; // Don't allow focus for OC
                    setCasteSearch(editData.caste || "");
                    setCasteDropdownOpen(true);
                  }}
                  onBlur={() => {
                    // Save the typed caste value even if not in the list
                    if (casteSearch && editData.community !== 'OC') {
                      handleInputChange("caste", casteSearch);
                    }
                    setTimeout(() => setCasteDropdownOpen(false), 150);
                    handleBlur("caste");
                  }}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none ${
                    editData.community === 'OC' ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50'
                  }`}
                  style={{ textTransform: 'uppercase' }}
                  placeholder={editData.community ? "Type to search caste" : "  community first"}
                  disabled={!editData.community || editData.community === 'OC'}
                  readOnly={editData.community === 'OC'}
                />
                {casteDropdownOpen && filteredCastes.length > 0 && editData.community !== 'OC' && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCastes.map((caste, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          handleInputChange("caste", caste);
                          setCasteSearch("");
                          setCasteDropdownOpen(false);
                        }}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        {caste}
                      </div>
                    ))}
                  </div>
                )}
                <ValidationError fieldName="caste" />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Annual Income */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Annual Family Income <span className="text-red-600">*</span></label>
              <select
                value={editData.annualIncome || ""}
                onChange={(e) => handleInputChange("annualIncome", e.target.value)}
                onBlur={() => handleBlur("annualIncome")}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              >
                <option value="" disabled>Select Income Range</option>
                <option value="Less than 1L">Less than 1 Lakh</option>
                <option value="1 Lakh to 1.5L">1 Lakh to 1.5 Lakhs</option>
                <option value="1.5L to 2.5L">1.5 Lakhs to 2.5 Lakhs</option>
                <option value="2.5L to 5L">2.5 Lakhs to 5 Lakhs</option>
                <option value="More than 5L">More than 5 Lakhs</option>
                <option value="Nil">Nil</option>
              </select>
              <ValidationError fieldName="annualIncome" />
              
            </div>
            

            <hr className="border-gray-100" />

            {/* Address Details */}
            <div className="space-y-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Communication Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Address Line 1 (Door no, Village Name / Street Name) <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={editData.address1 || ""}
                    onChange={(e) => handleInputChange("address1", e.target.value)}
                    onBlur={() => handleBlur("address1")}
                    placeholder="Enter Door no, Village Name / Street Name"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <ValidationError fieldName="address1" />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Address Line 2 (Panchayat / Town) <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={editData.address2 || ""}
                    onChange={(e) => handleInputChange("address2", e.target.value)}
                    onBlur={() => handleBlur("address2")}
                    placeholder="Enter Panchayat / Town"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <ValidationError fieldName="address2" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Taluk <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={editData.taluk || ""}
                    onChange={(e) => handleInputChange("taluk", e.target.value)}
                    onBlur={() => handleBlur("taluk")}
                    placeholder="Enter Taluk"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <ValidationError fieldName="taluk" />
                </div>
                <div className="district-autocomplete relative">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">District <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={districtDropdownOpen ? districtSearch : (editData.district || "")}
                    onChange={(e) => {
                      setDistrictSearch(e.target.value.toUpperCase());
                      setDistrictDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setDistrictSearch(editData.district || "");
                      setDistrictDropdownOpen(true);
                    }}
                    onBlur={() => handleBlur("district")}
                    placeholder="Enter District"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                    style={{ textTransform: 'uppercase' }}
                  />
                  {districtDropdownOpen && filteredDistricts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredDistricts.map((district, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            handleInputChange("district", district);
                            setDistrictSearch("");
                            setDistrictDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                        >
                          {district}
                        </div>
                      ))}
                    </div>
                  )}
                  <ValidationError fieldName="district" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">State</label>
                  <select
                    value={editData.state || ""}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                  >
                    <option value="">Select State</option>
                    {stateList.map((state, index) => (
                      <option key={index} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Pin Code <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={editData.pincode || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) {
                        handleInputChange("pincode", value);
                      }
                    }}
                    onBlur={() => handleBlur("pincode")}
                    maxLength="6"
                    placeholder="Enter Pin Code"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                  />
                  <ValidationError fieldName="pincode" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Contact No. 1 <span className="text-red-600">*</span></label>
                  <input
                    type="tel"
                    value={editData.fatherContact || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        handleInputChange("fatherContact", value);
                      }
                    }}
                    onBlur={() => handleBlur("fatherContact")}
                    maxLength="10"
                    placeholder="Enter Contact No. 1"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                  />
                  <ValidationError fieldName="fatherContact" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Contact No. 2 <span className="text-red-600">*</span></label>
                  <input
                    type="tel"
                    value={editData.motherContact || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        handleInputChange("motherContact", value);
                      }
                    }}
                    onBlur={() => handleBlur("motherContact")}
                    maxLength="10"
                    placeholder="Enter Contact No. 2"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                  />
                  <ValidationError fieldName="motherContact" />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Contact No. (Student)</label>
                  <input
                    type="tel"
                    value={editData.studentContact || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        handleInputChange("studentContact", value);
                      }
                    }}
                    maxLength="10"
                    placeholder="Enter Contact No. (Student)"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Education Details */}
            <div className="space-y-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                Educational Background
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                
                <div className="space-y-6 ">

                  {/* sslc marks */}

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">SSLC Marks <span className="text-red-600">*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editData.sslcMarks || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          handleInputChange("sslcMarks", "");
                          return;
                        }
                        // Only allow integers
                        if (/^\d+$/.test(value)) {
                          handleInputChange("sslcMarks", value);
                        }
                      }}
                      onBlur={() => handleBlur("sslcMarks")}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                          e.preventDefault();
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      placeholder="Enter SSLC Marks"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    />
                    <ValidationError fieldName="sslcMarks" />
                  </div>
                  
                  

                 
                </div>

              
                {/* school type */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">School Type (6 <sup>th</sup> to 12 <sup>th</sup> ) <span className="text-red-600">*</span></label>
                    <select
                      value={editData.schoolType || ""}
                      onChange={(e) => handleInputChange("schoolType", e.target.value)}
                      onBlur={() => handleBlur("schoolType")}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                      required
                    >
                      <option value="" disabled>Select School Type (6th to 12th)</option>
                      <option value="GOVT">GOVERNMENT</option>
                      <option value="GOVT. AIDED">GOVT. AIDED</option>
                      <option value="PRIVATE">PRIVATE</option>
                    </select>
                    <ValidationError fieldName="schoolType" />
                  </div>

                 {/* govt school type */}
                  <div className="bg-blue-50 p-4 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Govt School (6th-12th)? <span className="text-red-600">*</span></span>
                      <span className="text-xs text-blue-700/70 capitalize">Did you study in government school from 6th to 12th?</span>
                    </div>
                    <div className="flex space-x-3">
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input type="radio" name="govtSchool" value="YES" checked={editData.govtSchool === "YES"} onChange={(e) => handleInputChange("govtSchool", e.target.value)} onBlur={() => handleBlur("govtSchool")} className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900">Yes</span>
                      </label>
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input type="radio" name="govtSchool" value="NO" checked={editData.govtSchool === "NO"} onChange={(e) => handleInputChange("govtSchool", e.target.value)} onBlur={() => handleBlur("govtSchool")} className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900">No</span>
                      </label>
                    </div>
                  </div>
                  <ValidationError fieldName="govtSchool" />

                    {/* Qualify Examination */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Qualifying Examination <span className="text-red-600">*</span></label>
                    <select
                      value={editData.lastStudies || ""}
                      onChange={(e) => handleInputChange("lastStudies", e.target.value)}
                      onBlur={() => handleBlur("lastStudies")}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    >
                      <option value="">Choose your previous course</option>
                      <option value="HSC">HSC</option>
                      <option value="VOCATIONAL">VOCATIONAL</option>
                      <option value="CBSE">CBSE</option>
                      <option value="DIPLOMA">DIPLOMA</option>
                    </select>
                    <ValidationError fieldName="lastStudies" />
                  </div>

                  {editData.lastStudies === 'Dropout' && (
                    <div className="p-5 bg-orange-50 rounded-xl border border-orange-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-xs font-bold text-orange-800 uppercase">College Dropout Details</h4>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Previous College & Place</label>
                        <input
                          type="text"
                          value={editData.dropoutCollege || ''}
                          onChange={(e) => handleInputChange('dropoutCollege', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm focus:ring-orange-500"
                          placeholder="Enter college name and location"
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Register Number</label>
                          <input
                            type="text"
                            value={editData.dropoutRegisterNo || ''}
                            onChange={(e) => handleInputChange('dropoutRegisterNo', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm focus:ring-orange-500"
                            placeholder="Enter register number"
                            style={{ textTransform: 'uppercase' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Year of Study</label>
                          <input
                            type="text"
                            value={editData.dropoutYear || ''}
                            onChange={(e) => handleInputChange('dropoutYear', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm focus:ring-orange-500"
                            placeholder=""
                            style={{ textTransform: 'uppercase' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div> 

              </div>
            </div>

            <hr className="border-gray-100" />

              {/* Academic Scores Section */}
          {editData.lastStudies !== 'DIPLOMA' && editData.lastStudies && (
          <>
          <div className="bg-green-50 px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-green-100">
            <h3 className="text-base sm:text-lg font-bold text-green-900">Academic Scores</h3>
          </div>
          <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 bg-gray-50">
                  {/* Score Header */}
                  <div className="mb-4">
                    <h4 className="text-base sm:text-lg font-bold text-gray-800">
                      {scoresData.courseType || editData.lastStudies}
                    </h4>
                  </div>

                  {/* Course Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-white p-3 sm:p-4 rounded-lg">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">School/Board Name <span className="text-red-600">*</span></label>
                      <input
                        type="text"
                        value={scoresData.schoolName || ""}
                        onChange={(e) => {
                          setScoresData(prev => ({ ...prev, schoolName: e.target.value.toUpperCase() }));
                          if (validationErrors.schoolName) {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.schoolName;
                              return newErrors;
                            });
                          }
                        }}
                        onBlur={() => {
                          const error = validateField("schoolName", scoresData.schoolName);
                          if (error) {
                            setValidationErrors(prev => ({ ...prev, schoolName: error }));
                          } else {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.schoolName;
                              return newErrors;
                            });
                          }
                        }}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        style={{ textTransform: 'uppercase' }}
                      />
                      <ValidationError fieldName="schoolName" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Register Number</label>
                      <input
                        type="text"
                        value={scoresData.registerNumber || ""}
                        onChange={(e) => {
                          setScoresData(prev => ({ ...prev, registerNumber: e.target.value.toUpperCase() }));
                          if (validationErrors.registerNo) {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.registerNo;
                              return newErrors;
                            });
                          }
                        }}
                        onBlur={() => {
                          const error = validateField("registerNo", scoresData.registerNumber);
                          if (error) {
                            setValidationErrors(prev => ({ ...prev, registerNo: error }));
                          } else {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.registerNo;
                              return newErrors;
                            });
                          }
                        }}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        style={{ textTransform: 'uppercase' }}
                      />
                      <ValidationError fieldName="registerNo" />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Medium of Study <span className="text-red-600">*</span></label>
                      <select
                        value={["ENGLISH", "TAMIL"].includes(scoresData.medium) ? scoresData.medium : scoresData.medium ? "Other" : ""}
                        onChange={(e) => {
                          const nextVal = e.target.value;
                          // If Other is selected, keep current custom value or empty to let user type
                          setScoresData(prev => ({ ...prev, medium: nextVal === "OTHER" ? (prev.medium && !["ENGLISH", "TAMIL"].includes(prev.medium) ? prev.medium : "") : nextVal }));
                          if (validationErrors.medium) {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.medium;
                              return newErrors;
                            });
                          }
                        }}
                        onBlur={() => {
                          const error = validateField("medium", scoresData.medium);
                          if (error) {
                            setValidationErrors(prev => ({ ...prev, medium: error }));
                          } else {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.medium;
                              return newErrors;
                            });
                          }
                        }}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Select Medium</option>
                        <option value="ENGLISH">ENGLISH</option>
                        <option value="TAMIL">TAMIL</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                      <ValidationError fieldName="medium" />
                      {((scoresData.medium && !["ENGLISH", "TAMIL"].includes(scoresData.medium)) || (scoresData.medium === "" && scoresData.medium !== null && scoresData.medium !== undefined)) && (
                        <input
                          type="text"
                          value={scoresData.medium || ""}
                          onChange={(e) => {
                            setScoresData(prev => ({ ...prev, medium: e.target.value.toUpperCase() }));
                          }}
                          placeholder="Enter medium"
                          className="mt-2 w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          style={{ textTransform: 'uppercase' }}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Year of Passing <span className="text-red-600">*</span></label>
                      <select
                        value={scoresData.yearOfPassing || ""}
                        onChange={(e) => {
                          setScoresData(prev => ({ ...prev, yearOfPassing: e.target.value }));
                          if (validationErrors.yearOfPassing) {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.yearOfPassing;
                              return newErrors;
                            });
                          }
                        }}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="" disabled>Select Year</option>
                        {Array.from({ length: 11 }, (_, i) => 2018 + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <ValidationError fieldName="yearOfPassing" />
                    </div>
                  </div>

                  {/* Subject Marks */}
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-bold text-gray-800 mb-4">Subject Marks</h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-300 text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Subject</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Maximum Marks</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Marks Obtained</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editData.lastStudies === 'HSC' ? (
                            <>
                              {/* HSC - 6 static subjects */}
                              {[
                                { num: 1, name: 'TAMIL' },
                                { num: 2, name: 'ENGLISH' },
                                { num: 3, name: 'PHYSICS' },
                                { num: 4, name: 'CHEMISTRY' },
                                 { num: 5, name: 'MATHEMATICS' },
                                { num: 6, name: 'COMPUTER SCIENCE / BIOLOGY' }
                              ].map(({ num, name }) => (
                                <tr key={num} className={num % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <input
                                      type="text"
                                      value={scoresData[`subject${num}`] || name}
                                      readOnly
                                      tabIndex="-1"
                                      className="w-full px-2 py-1 bg-gray-50 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-center text-gray-800">100</td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={scoresData[`subject${num}Marks`] || ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "") {
                                          setScoresData(prev => ({ ...prev, [`subject${num}`]: name, [`subject${num}Marks`]: value }));
                                          return;
                                        }
                                        const numVal = parseInt(value, 10);
                                        if (!isNaN(numVal) && numVal >= 0 && numVal <= 100) {
                                          setScoresData(prev => ({ ...prev, [`subject${num}`]: name, [`subject${num}Marks`]: String(numVal) }));
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                                          e.preventDefault();
                                        }
                                      }}
                                      onWheel={(e) => e.target.blur()}
                                      className="w-full px-2 py-1 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-center no-spin"
                                      placeholder="0-100"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </>
                          ) : editData.lastStudies === 'CBSE' ? (
                            <>
                              {/* CBSE - 5 static subjects (no Tamil) */}
                              {[
                                { num: 1, name: 'ENGLISH' },
                                { num: 2, name: 'PHYSICS' },
                                { num: 3, name: 'CHEMISTRY' },
                                 { num: 4, name: 'MATHEMATICS' },
                                { num: 5, name: 'COMPUTER SCIENCE / BIOLOGY' }
                              ].map(({ num, name }) => (
                                <tr key={num} className={num % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <input
                                      type="text"
                                      value={name}
                                      readOnly
                                      tabIndex="-1"
                                      className="w-full px-2 py-1 bg-gray-50 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-center text-gray-800">100</td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={scoresData[`subject${num}Marks`] || ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "") {
                                          setScoresData(prev => ({ ...prev, [`subject${num}`]: name, [`subject${num}Marks`]: value }));
                                          return;
                                        }
                                        const numVal = parseFloat(value);
                                        if (!isNaN(numVal) && numVal >= 0 && numVal <= 100 && Number.isInteger(numVal)) {
                                          setScoresData(prev => ({ ...prev, [`subject${num}`]: name, [`subject${num}Marks`]: value }));
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                                          e.preventDefault();
                                        }
                                      }}
                                      onWheel={(e) => e.target.blur()}
                                      className="w-full px-2 py-1 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-center no-spin"
                                      placeholder="Enter marks (0-100)"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </>
                          ) : editData.lastStudies === 'VOCATIONAL' ? (
                            <>
                              {/* Vocational - Tamil and English static, 4 typable fields */}
                              {[
                                { num: 1, name: 'Tamil', static: true },
                                { num: 2, name: 'English', static: true },
                                { num: 3, name: 'Matematics', static: false },
                                { num: 4, name: '', static: false },
                                { num: 5, name: '', static: false },
                                { num: 6, name: '', static: false }
                              ].map(({ num, name, static: isStatic }) => (
                                <tr key={num} className={num % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <input
                                      type="text"
                                      value={scoresData[`subject${num}`] || name}
                                      onChange={(e) => {
                                        if (!isStatic) {
                                          setScoresData(prev => ({ ...prev, [`subject${num}`]: e.target.value }));
                                        }
                                      }}
                                      readOnly={isStatic}
                                      tabIndex={isStatic ? "-1" : "0"}
                                      className={`w-full px-2 py-1 ${isStatic ? 'bg-gray-50' : 'bg-white'} border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none`}
                                      placeholder={isStatic ? '' : `Subject ${num}`}
                                    />
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-center text-gray-800">100</td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={scoresData[`subject${num}Marks`] || ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "") {
                                          setScoresData(prev => ({ 
                                            ...prev, 
                                            [`subject${num}`]: isStatic ? name : (prev[`subject${num}`] || ''),
                                            [`subject${num}Marks`]: value 
                                          }));
                                          return;
                                        }
                                        const numVal = parseFloat(value);
                                        if (!isNaN(numVal) && numVal >= 0 && numVal <= 100 && Number.isInteger(numVal)) {
                                          setScoresData(prev => ({ 
                                            ...prev, 
                                            [`subject${num}`]: isStatic ? name : (prev[`subject${num}`] || ''),
                                            [`subject${num}Marks`]: value 
                                          }));
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                                          e.preventDefault();
                                        }
                                      }}
                                      onWheel={(e) => e.target.blur()}
                                      className="w-full px-2 py-1 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-center no-spin"
                                      placeholder="Enter marks (0-100)"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Overall Marks & Eligibility */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-white p-3 sm:p-4 rounded-lg">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Total Marks</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={scoresData.totalMarks || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setScoresData(prev => ({ ...prev, totalMarks: "" }));
                            return;
                          }
                          if (/^\d+$/.test(value)) {
                            setScoresData(prev => ({ ...prev, totalMarks: value }));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                            e.preventDefault();
                          }
                        }}
                        onWheel={(e) => e.target.blur()}
                        placeholder="Enter total marks "
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Percentage</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={scoresData.percentage || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setScoresData(prev => ({ ...prev, percentage: "" }));
                            return;
                          }
                          if (/^\d+$/.test(value)) {
                            setScoresData(prev => ({ ...prev, percentage: value }));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                            e.preventDefault();
                          }
                        }}
                        onWheel={(e) => e.target.blur()}
                        placeholder="Enter percentage"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">CutOff</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={scoresData.cutoff || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setScoresData(prev => ({ ...prev, cutoff: "" }));
                            return;
                          }
                          if (/^\d+$/.test(value)) {
                            setScoresData(prev => ({ ...prev, cutoff: value }));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                            e.preventDefault();
                          }
                        }}
                        onWheel={(e) => e.target.blur()}
                        placeholder="Enter cutoff "
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Engineering Eligibility</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={scoresData.eligibility || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setScoresData(prev => ({ ...prev, eligibility: "" }));
                            return;
                          }
                          if (/^\d+$/.test(value)) {
                            setScoresData(prev => ({ ...prev, eligibility: value }));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                            e.preventDefault();
                          }
                        }}
                        onWheel={(e) => e.target.blur()}
                        placeholder="Enter eligibility"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
          </div>
          </>
          )}

          {/* Diploma Scores Section */}
          {editData.lastStudies === 'DIPLOMA' && (
          <>
          <div className="bg-purple-50 px-8 py-4 border-b border-purple-100">
            <h3 className="text-lg font-bold text-purple-900">Diploma Scores</h3>
          </div>
          <DiplomaScoresEdit 
            applicationData={editData}
            scoresData={scoresData}
            onSave={(updatedData) => {
              setEditData(updatedData);
              if (onUpdateSuccess) {
                onUpdateSuccess(updatedData);
              }
            }}
          />
          </>
          )}

            {/* Reference Information */}
            <div className="bg-white px-4 sm:px-6 md:px-8 py-6 space-y-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Reference Information
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Consulting Type <span className="text-red-600">*</span></label>
                    <select
                      name="consultingType"
                      value={editData.consultingType || ""}
                      onChange={(e) => handleInputChange("consultingType", e.target.value)}
                      onBlur={() => handleBlur("consultingType")}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    >
                      <option value="" disabled>Select Consulting Type</option>
                      <option value="CONSULTING">Consulting</option>
                      <option value="NOT CONSULTING">Not Consulting</option>
                    </select>
                    <ValidationError fieldName="consultingType" />
                  </div>
                  <div className="college-autocomplete relative">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">How did you know about this college?<span className="text-red-600">*</span></label>
                    <input
                      type="text"
                      name="knowAbout"
                      value={editData.knowAbout || ""}
                      onChange={(e) => {
                        const upperValue = e.target.value.toUpperCase();
                        handleInputChange("knowAbout", upperValue);
                        setCollegeSearch(upperValue);
                        setCollegeDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setCollegeSearch(editData.knowAbout || "");
                        setCollegeDropdownOpen(true);
                      }}
                      onBlur={(e) => {
                        handleBlur("knowAbout");
                        // Small delay to allow click on dropdown items to register
                        setTimeout(() => {
                          setCollegeDropdownOpen(false);
                        }, 300);
                      }}
                      placeholder="Search or select how you know about this college"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      style={{ textTransform: 'uppercase' }}
                    />
                    {collegeDropdownOpen && filteredColleges.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredColleges.map((college, index) => (
                          <div
                            key={index}
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent input blur
                              handleInputChange("knowAbout", college);
                              setCollegeSearch("");
                              setCollegeDropdownOpen(false);
                            }}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                          >
                            {college}
                          </div>
                        ))}
                      </div>
                    )}
                    <ValidationError fieldName="knowAbout" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Reference Name</label>
                    <div className="flex gap-2">
                      <select
                        name="referencePrefix"
                        value={editData.referencePrefix || ""}
                        onChange={(e) => handleInputChange("referencePrefix", e.target.value)}
                        className="w-20 sm:w-24 px-2 sm:px-3 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      >
                        <option value="">Title</option>
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Ms">Ms</option>
                        <option value="Dr">Dr</option>
                      </select>
                      <input
                        type="text"
                        name="referenceName"
                        value={editData.referenceName || ""}
                        onChange={(e) => handleInputChange("referenceName", e.target.value)}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                        placeholder="Reference person name"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Reference Contact</label>
                    <input
                      type="tel"
                      value={editData.referenceContact || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 10) {
                          handleInputChange("referenceContact", value);
                        }
                      }}
                      onBlur={() => handleBlur("referenceContact")}
                      maxLength="10"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                      placeholder="Reference contact number"
                    />
                    <ValidationError fieldName="referenceContact" />
                  </div>
                </div>
              </div>
            </div>
            

           {/* Application Status & Date Section */}
           <div className="bg-white px-4 sm:px-6 md:px-8 py-6 space-y-6">
             <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center mb-4">
               <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Application Status & Details
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {/* Application Date Field (Admin Editable) */}
    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
        Application Date<span className="text-red-600">*</span>
      </label>
      <div className="relative">
        <input
          type="date"
          value={formatDateForInput(editData.applicationDate)}
          onChange={(e) => handleInputChange("applicationDate", e.target.value)}
          onBlur={() => handleBlur("applicationDate")}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          style={{ paddingRight: '80px' }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            const today = new Date().toISOString().split('T')[0];
            handleInputChange("applicationDate", today);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-all shadow-sm"
          title="Set to today's date"
        >
          Today
        </button>
      </div>
      <ValidationError fieldName="applicationDate" />
    </div>
    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
        Application Status
      </label>
      <select
        value={editData.status || ""}
        onChange={(e) => handleInputChange("status", e.target.value)}
        onBlur={() => handleBlur("status")}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
      >
        <option value="Registered" disabled>Registered</option>
        <option value="Admitted">Admitted</option>
        <option value="Pending">Pending</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <ValidationError fieldName="status" />
    </div>
    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Branch Awarded</label>
      <select
        name="branchAwarded"
        value={editData.branchAwarded || ""}
        onChange={(e) => handleInputChange("branchAwarded", e.target.value)}
        onBlur={() => handleBlur("branchAwarded")}
        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
      >
        <option value="">Select Branch</option>
        <option value="AD">AD</option>
        <option value="AG">AG</option>
        <option value="BME">BME</option>
        <option value="CIVIL">CIVIL</option>
        <option value="CSE">CSE</option>
        <option value="ECE">ECE</option>
        <option value="EEE">EEE</option>
        <option value="IT">IT</option>
        <option value="MECH">MECH</option>
      </select>
      <ValidationError fieldName="branchAwarded" />
    </div>
    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Fees Paid</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        name="feesPaid"
        value={editData.feesPaid || ""}
        onChange={(e) => {
          const numericValue = e.target.value.replace(/[^0-9]/g, '');
          handleInputChange("feesPaid", numericValue);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
          }
        }}
        onWheel={(e) => e.preventDefault()}
        onBlur={() => handleBlur("feesPaid")}
        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
        placeholder="Enter amount"
      />
      <ValidationError fieldName="feesPaid" />
    </div>

         
    </div>
          </div>
          </div>



        

         
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 rounded-b-lg sm:rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleSaveOnly}
              disabled={isSaving}
              className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>

            {/* Submit and Preview */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base bg-blue-600 text-white rounded-lg sm:rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 sm:hover:translate-y-[-2px] transition-all active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Submitting..." : "Submit and Preview"}
            </button>
          </div>
        </div>
      </div>





      {/* Success Modal - Simple Format */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
                <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Success Message */}
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Success</h3>
              <p className="text-base text-gray-600 mb-6">
                A record was saved successfully
              </p>

              {/* OK Button */}
              <button
                onClick={handleSuccessOk}
                className="w-full px-6 py-3 text-base bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPDFPreview}
        onClose={() => {
          setShowPDFPreview(false);
          onClose(); // Close the edit modal
          navigate('/admin'); // Navigate to admin dashboard
        }}
        studentData={editData}
        scoresData={scoresData}
        studentName={editData.fullName}
      />
    </>
  );
}
