import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
const logo = "/assets/kongunadulogo.png";
import { useNavigate } from "react-router-dom";
import AcademicScores from "./AcadamicScore";
import CBSEScore from "./CBSEScore";
import DiplomaScores from "./DiplomaScores";
import VocationalScores from "./Vocational";
import Footer from "../Footer";

const PersonalInfo = () => {


  const [isLoading, setIsLoading] = useState(false);
  const [showAcademicSection, setShowAcademicSection] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [visiblePreferences, setVisiblePreferences] = useState(3);
  const [dropoutData, setDropoutData] = useState({
    previousCollege: '',
    regNo: '',
    yearOfStudy: ''
  });
  
  const [formData, setFormData] = useState({
    preference1: '',
    preference2: '',
    preference3: '',
    preference4: '',
    preference5: '',
    preference6: '',
    preference7: '',
    preference8: '',
    preference9: '',
    quota: '',
    entry: '',
    initial: '',
    fullName: '',
    dob: '',
    gender: '',
    accommodation: '',
    roomType: '',
    travelType: '',
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: '',
    community: '',
    caste: '',
    annualIncome: '',
    firstGrad: '',
    address1: '',
    address2: '',
    taluk: '',
    district: '',
    state: 'TAMILNADU',
    pincode: '',
    fatherContact: '',
    motherContact: '',
    studentContact: '',
    sslcMarks: '',
    schoolName: '',
    govtSchool: '',
    schoolType: '',
    lastStudies: '',
    // Add more fields as needed
  });

  const navigate = useNavigate();


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

  const districtList = [
    "ARIYALUR",
    "CHENGALPATTU",
    "CHENNAI",
    "COIMBATORE",
    "CUDDALORE",
    "DHARMAPURI",
    "DINDIGUL",
    "ERODE",
    "KALLAKURICHI",
    "KANCHEEPURAM",
    "KANYAKUMARI",
    "KARUR",
    "KRISHNAGIRI",
    "MADURAI",
    "MAYILADUTHURAI",
    "NAGAPATTINAM",
    "NAMAKKAL",
    "NILGIRIS",
    "PERAMBALUR",
    "PUDUKOTTAI",
    "RAMANATHAPURAM",
    "RANIPET",
    "SALEM",
    "SIVAGANGA",
    "TENKASI",
    "THANJAVUR",
    "THENI",
    "THIRUVALLUR",
    "THIRUVARUR",
    "THOOTHUKUDI",
    "TIRUCHIRAPPALLI",
    "TIRUNELVELI",
    "TIRUPATHUR",
    "TIRUPPUR",
    "TIRUVANNAMALAI",
    "VELLORE",
    "VILUPPURAM",
    "VIRUDHUNAGAR"
  ];

  const stateList = [
    "TAMILNADU",
    "ANDHRA PRADESH",
    "ARUNACHAL PRADESH",
    "ASSAM",
    "BIHAR",
    "CHHATTISGARH",
    "GOA",
    "GUJARAT",
    "HARYANA",
    "HIMACHAL PRADESH",
    "JHARKHAND",
    "KARNATAKA",
    "KERALA",
    "MADHYA PRADESH",
    "MAHARASHTRA",
    "MANIPUR",
    "MEGHALAYA",
    "MIZORAM",
    "NAGALAND",
    "ODISHA",
    "PUNJAB",
    "RAJASTHAN",
    "SIKKIM",
    "TELANGANA",
    "TRIPURA",
    "UTTARAKHAND",
    "UTTAR PRADESH",
    "WEST BENGAL",
    "ANDAMAN AND NICOBAR ISLANDS",
    "CHANDIGARH",
    "DADRA AND NAGAR HAVELI AND DAMAN AND DIU",
    "DELHI",
    "JAMMU AND KASHMIR",
    "LADAKH",
    "LAKSHADWEEP",
    "PUDUCHERRY"
  ];

const Address = [
    { label: "Address Line 1 (Door no, Village Name / Street Name)", name: "address1", placeholder: "Enter Door No, Village Name / Street Name", full: true, required: true },
    { label: "Address Line 2 (Panchayat / Town)", name: "address2", placeholder: "Enter Panchayat / Town", full: true, required: true },
    { label: "Taluk", name: "taluk", placeholder: "Enter Taluk", required: true },
    // District and State handled separately
    { label: "Pin Code", name: "pincode", placeholder: "Enter Pin Code", required: true },
    { label: "Contact No. 1", name: "fatherContact", placeholder: "Enter Contact No. 1", required: true },
    { label: "Contact No. 2", name: "motherContact", placeholder: "Enter Contact No. 2", required: true },
    { label: "Contact No. (Student)", name: "studentContact", placeholder: "Enter Contact No. (Student)", full: true, required: false },
  ];
    // For district autocomplete
    const [districtSearch, setDistrictSearch] = useState("");
    const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
    // Filter: only show districts that start with the search term (exact position match)
    const filteredDistricts = (() => {
      if (!districtSearch) return districtList;
      return districtList.filter(d => d.startsWith(districtSearch));
    })();

    // For caste autocomplete based on community
    const [casteData, setCasteData] = useState({});
    const [casteSearch, setCasteSearch] = useState("");
    const [casteDropdownOpen, setCasteDropdownOpen] = useState(false);
    
    // Load caste data from JSON file
    useEffect(() => {
      fetch('/caste.json')
        .then(response => response.json())
        .then(data => setCasteData(data))
        .catch(error => console.error('Error loading caste data:', error));
    }, []);
    
    // Filter castes based on selected community and search term
    const filteredCastes = (() => {
      if (!formData.community || !casteData[formData.community]) return [];
      const castesForCommunity = casteData[formData.community];
      if (!casteSearch) return castesForCommunity;
      return castesForCommunity.filter(c => c.includes(casteSearch));
    })();
  const Community = [
    { id: 1, community: "OC" },
    { id: 2, community: "BC" },
    { id: 3, community: "BCM" },
    { id: 4, community: "MBC" },
    { id: 5, community: "SC" },
    { id: 6, community: "SCA" },
    { id: 7, community: "SCC" },
    { id: 8, community: "ST" }
  ]

  const options = [
    { label: 'TN - HSC', value: 'HSC' },
    { label: 'CBSE', value: 'CBSE' },
    { label: 'TN - HSC(Vocational)', value: 'VOCATIONAL' },
    { label: 'Diploma', value: 'DIPLOMA' },
  ];


  const handleNavigate = () => {
    // Scroll to academic section instead of navigating
    setShowAcademicSection(true);
    setTimeout(() => {
      const academicSection = document.getElementById('academic-scores-section');
      if (academicSection) {
        academicSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  // Callback for academic sections to set personal info validation errors
  const setPersonalInfoErrors = (errors) => {
    setValidationErrors(errors);
    // Scroll to first error in personal info
    setTimeout(() => {
      const firstErrorField = document.querySelector('.text-red-600');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Field-level validation function
  const validateField = (name, value) => {
    // Skip validation for empty optional fields
    const optionalFields = ['motherName', 'motherOccupation', 'studentContact'];
    if (optionalFields.includes(name) && !value) {
      return null; // No error for empty optional fields
    }

    // Skip caste validation if community is OC
    if (name === 'caste' && formData.community === 'OC') {
      return null; // No validation needed for OC community
    }

    // Validation rules for each field
    const rules = {
      fullName: {
        minLength: 3,
        maxLength: 50,
        pattern: /^[A-Za-z ]+$/,
        message: 'Name must be 3-50 characters, letters only'
      },
      initial: {
        minLength: 1,
        maxLength: 10,
        pattern: /^[A-Za-z .]+$/,
        message: 'Initial must be 1-10 characters, letters only'
      },
      fatherName: {
        minLength: 3,
        maxLength: 50,
        pattern: /^[A-Za-z ]+$/,
        message: 'Name must be 3-50 characters, letters only'
      },
      fatherOccupation: {
        minLength: 2,
        maxLength: 50,
        message: 'Occupation must be 2-50 characters'
      },
      motherName: {
        minLength: 3,
        maxLength: 50,
        pattern: /^[A-Za-z ]+$/,
        message: 'Name must be 3-50 characters, letters only'
      },
      motherOccupation: {
        minLength: 2,
        maxLength: 50,
        message: 'Occupation must be 2-50 characters'
      },
      caste: {
        minLength: 2,
        maxLength: 30,
        pattern: /^[A-Za-z ]+$/,
        message: 'Caste must be 2-30 characters, letters only'
      },
      address1: {
        minLength: 5,
        maxLength: 100,
        message: 'Address must be 5-100 characters'
      },
      address2: {
        minLength: 3,
        maxLength: 100,
        message: 'Address must be 3-100 characters'
      },
      taluk: {
        minLength: 2,
        maxLength: 50,
        pattern: /^[A-Za-z ]+$/,
        message: 'Taluk must be 2-50 characters, letters only'
      },
      district: {
        minLength: 3,
        maxLength: 50,
        pattern: /^[A-Za-z ]+$/,
        message: 'District must be 3-50 characters, letters only'
      },
      pincode: {
        pattern: /^[0-9]{6}$/,
        message: 'Pin code must be exactly 6 digits'
      },
      fatherContact: {
        pattern: /^[0-9]{10}$/,
        message: 'Contact number must be exactly 10 digits'
      },
      motherContact: {
        pattern: /^[0-9]{10}$/,
        message: 'Contact number must be exactly 10 digits'
      },
      studentContact: {
        pattern: /^[0-9]{10}$/,
        message: 'Contact number must be exactly 10 digits'
      },
      sslcMarks: {
        pattern: /^[0-9]+$/,
        min: 0,
        max: 500,
        message: 'SSLC marks must be a number between 0-500'
      }
    };

    const rule = rules[name];
    if (!rule) return null; // No validation rule for this field

    const trimmedValue = typeof value === 'string' ? value.trim() : value;

    // Check if field is required but empty
    if (!optionalFields.includes(name) && !trimmedValue) {
      return 'This field is required';
    }

    // Skip further validation if optional field is empty
    if (optionalFields.includes(name) && !trimmedValue) {
      return null;
    }

    // Check minimum length
    if (rule.minLength && trimmedValue.length < rule.minLength) {
      return rule.message;
    }

    // Check maximum length
    if (rule.maxLength && trimmedValue.length > rule.maxLength) {
      return rule.message;
    }

    // Check pattern
    if (rule.pattern && !rule.pattern.test(trimmedValue)) {
      return rule.message;
    }

    // Check numeric range for sslcMarks
    if (name === 'sslcMarks') {
      const num = parseInt(trimmedValue);
      if (isNaN(num) || num < rule.min || num > rule.max) {
        return rule.message;
      }
    }

    return null; // No error
  };

  // Handle field blur for validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    if (error) {
      setValidationErrors(prev => ({ ...prev, [name]: error }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Fields that should be converted to uppercase
    const uppercaseFields = ['fullName', 'initial', 'fatherName', 'fatherOccupation', 'motherName', 'motherOccupation', 'caste', 'address1', 'address2', 'taluk'];
    
    // Convert to uppercase if it's in the uppercaseFields list
    const processedValue = uppercaseFields.includes(name) && typeof value === 'string' 
      ? value.toUpperCase() 
      : value;
    
    // Validate field in real-time and show error if validation fails
    const error = validateField(name, processedValue);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [name]: error }));
    } else {
      // Clear validation error if field is now valid
      if (validationErrors[name]) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
    
    let updatedFormData = { ...formData };
    
    // If preference1 is changed, reset all subsequent preferences
    if (name === 'preference1') {
      updatedFormData = {
        ...formData,
        preference1: processedValue,
        preference2: '',
        preference3: '',
        preference4: '',
        preference5: '',
        preference6: '',
        preference7: '',
        preference8: '',
        preference9: '',
      };
      setFormData(updatedFormData);
    } 
    // If preference2 is changed, reset preference3 onwards onwards
    else if (name === 'preference2') {
      updatedFormData = {
        ...formData,
        preference2: processedValue,
        preference3: '',
        preference4: '',
        preference5: '',
        preference6: '',
        preference7: '',
        preference8: '',
        preference9: '',
      };
      setFormData(updatedFormData);
    }
    else if (name === 'preference3') {
      updatedFormData = {
        ...formData,
        preference3: processedValue,
        preference4: '',
        preference5: '',
        preference6: '',
        preference7: '',
        preference8: '',
        preference9: '',
      };
      setFormData(updatedFormData);
    }
    else if (name === 'preference4') {
      updatedFormData = {
        ...formData,
        preference4: processedValue,
        preference5: '',
        preference6: '',
        preference7: '',
        preference8: '',
        preference9: '',
      };
      setFormData(updatedFormData);
    }
    else if (name === 'preference5') {
      updatedFormData = {
        ...formData,
        preference5: processedValue,
        preference6: '',
        preference7: '',
        preference8: '',
        preference9: '',
      };
      setFormData(updatedFormData);
    }
    else if (name === 'preference6') {
      updatedFormData = {
        ...formData,
        preference6: processedValue,
        preference7: '',
        preference8: '',
        preference9: '',
      };
      setFormData(updatedFormData);
    }
    else if (name === 'preference7') {
      updatedFormData = {
        ...formData,
        preference7: processedValue,
        preference8: '',
        preference9: '',
      };
      setFormData(updatedFormData);
    }
    else if (name === 'preference8') {
      updatedFormData = {
        ...formData,
        preference8: processedValue,
        preference9: '',
      };
      setFormData(updatedFormData);
    } 
    else {
      updatedFormData = {
        ...formData,
        [name]: type === 'checkbox' ? checked : processedValue,
      };
      
      // If community is changed to OC, automatically set caste to "NOT REQUIRED"
      if (name === 'community' && processedValue === 'OC') {
        updatedFormData.caste = 'NOT REQUIRED';
      }
      // If community is changed from OC to something else, clear the caste field
      else if (name === 'community' && processedValue !== 'OC' && formData.caste === 'NOT REQUIRED') {
        updatedFormData.caste = '';
      }
      
      setFormData(updatedFormData);
    }
    
    // Handle Last Studies selection
    if (name === 'lastStudies' && value) {
      // If Dropout is selected, just update the form and show dropout fields
      if (value === 'Dropout') {
        // No validation needed for dropout, fields will show and user can submit
        return;
      }
      
      // For other courses, validate all required fields before proceeding to academic section
      const requiredFields = [
        { field: 'preference1', label: 'First Preference', selector: 'select[name="preference1"]' },
        { field: 'quota', label: 'Seat Type', id: 'seat-type-section' },
        { field: 'entry', label: 'Admission Type', id: 'admission-type-section' },
        { field: 'fullName', label: 'Name', selector: 'input[name="fullName"]' },
        { field: 'initial', label: 'Initial', selector: 'input[name="initial"]' },
        { field: 'dob', label: 'Date of Birth', selector: 'input[name="dob"]' },
        { field: 'gender', label: 'Gender', selector: 'input[name="gender"]' },
        { field: 'accommodation', label: 'Accommodation Type', selector: 'input[name="accommodation"]' },
        { field: 'fatherName', label: 'Father / Guardian Name', selector: 'input[name="fatherName"]' },
        { field: 'fatherOccupation', label: 'Father / Guardian Occupation', selector: 'input[name="fatherOccupation"]' },
        { field: 'community', label: 'Community', selector: 'select[name="community"]' },
        { field: 'caste', label: 'Caste', selector: 'input[name="caste"]' },
        { field: 'annualIncome', label: 'Annual Income', selector: 'select[name="annualIncome"]' },
        { field: 'firstGrad', label: 'First Graduate', selector: 'input[name="firstGrad"]' },
        { field: 'address1', label: 'Address Line 1', selector: 'input[name="address1"]' },
        { field: 'address2', label: 'Address Line 2', selector: 'input[name="address2"]' },
        { field: 'taluk', label: 'Taluk', selector: 'input[name="taluk"]' },
        { field: 'district', label: 'District', selector: 'input[name="district"]' },
        { field: 'state', label: 'State', selector: 'input[name="state"]' },
        { field: 'pincode', label: 'Pin Code', selector: 'input[name="pincode"]' },
        { field: 'fatherContact', label: 'Contact No.1', selector: 'input[name="fatherContact"]' },
        { field: 'motherContact', label: 'ContactNo.2', selector: 'input[name="motherContact"]' },
        { field: 'sslcMarks', label: 'SSLC Marks', selector: 'input[name="sslcMarks"]' },
        { field: 'govtSchool', label: 'Govt 7.5 Eligibility', selector: 'input[name="govtSchool"]' },
        { field: 'schoolType', label: 'School Type (6 to 12)', selector: 'select[name="schoolType"]' },
      ];

      // Additional validation for accommodation-specific fields
      if (formData.accommodation === 'BOYSHOSTEL' || formData.accommodation === 'GIRLSHOSTEL') {
        if (!formData.roomType) {
          requiredFields.push({ field: 'roomType', label: 'Room Type', selector: 'select[name="roomType"]' });
        }
      }

      if (formData.accommodation === 'DAYSCHOLAR') {
        if (!formData.travelType) {
          requiredFields.push({ field: 'travelType', label: 'Travel Type', selector: 'select[name="travelType"]' });
        }
      }

      // Check for ALL missing required fields
      const errors = {};
      let firstMissingField = null;
      
      requiredFields.forEach(({ field, label, selector, id }) => {
        // Skip caste validation if community is OC
        if (field === 'caste' && formData.community === 'OC') {
          return; // Skip this field validation
        }
        
        // Use current formData to get the most up-to-date value
        const fieldValue = formData[field];
        if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
          errors[field] = `${label} is required`;
          if (!firstMissingField) {
            firstMissingField = { field, label, selector, id };
          }
        } else {
          // Validate field using the validateField function for pattern validation
          const validationError = validateField(field, fieldValue);
          if (validationError) {
            errors[field] = validationError;
            if (!firstMissingField) {
              firstMissingField = { field, label, selector, id };
            }
          }
        }
      });

      // If there are validation errors, show them and scroll to first error
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        
        // Reset lastStudies field so user can try again
        setFormData(prev => ({ ...prev, lastStudies: '' }));
        
        // Scroll to the first missing field
        if (firstMissingField) {
          const { selector, id } = firstMissingField;
          setTimeout(() => {
            let element;
            if (id) {
              element = document.getElementById(id);
            } else if (selector) {
              element = document.querySelector(selector);
            }
            
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              if (element.focus) element.focus();
            }
          }, 100);
        }
        
        return; // Stop execution - don't proceed to academic section
      }
      
      // Clear any existing validation errors
      setValidationErrors({});

      // All validations passed - save data to localStorage and show academic section
      // Use updatedFormData to ensure we have the latest values
      setTimeout(() => {
        const combinedFullName = `${updatedFormData.fullName || ''} ${updatedFormData.initial || ''}`.trim();
        
        const personalData = {
          preference1: getShortForm(updatedFormData.preference1),
          preference2: updatedFormData.preference2 ? getShortForm(updatedFormData.preference2) : '',
          preference3: updatedFormData.preference3 ? getShortForm(updatedFormData.preference3) : '',
          preference4: updatedFormData.preference4 ? getShortForm(updatedFormData.preference4) : '',
          preference5: updatedFormData.preference5 ? getShortForm(updatedFormData.preference5) : '',
          preference6: updatedFormData.preference6 ? getShortForm(updatedFormData.preference6) : '',
          preference7: updatedFormData.preference7 ? getShortForm(updatedFormData.preference7) : '',
          preference8: updatedFormData.preference8 ? getShortForm(updatedFormData.preference8) : '',
          preference9: updatedFormData.preference9 ? getShortForm(updatedFormData.preference9) : '',
          quota: updatedFormData.quota,
          entry: updatedFormData.entry,
          fullName: combinedFullName,
          dob: updatedFormData.dob,
          gender: updatedFormData.gender,
          accommodation: updatedFormData.accommodation,
          roomType: updatedFormData.roomType,
          travelType: updatedFormData.travelType,
          fatherName: updatedFormData.fatherName,
          fatherOccupation: updatedFormData.fatherOccupation,
          motherName: updatedFormData.motherName,
          motherOccupation: updatedFormData.motherOccupation,
          community: updatedFormData.community,
          caste: updatedFormData.caste,
          annualIncome: updatedFormData.annualIncome,
          firstGrad: updatedFormData.firstGrad,
          address1: updatedFormData.address1,
          address2: updatedFormData.address2,
          taluk: updatedFormData.taluk,
          district: updatedFormData.district,
          state: updatedFormData.state,
          pincode: updatedFormData.pincode,
          fatherContact: updatedFormData.fatherContact,
          motherContact: updatedFormData.motherContact,
          studentContact: updatedFormData.studentContact,
          sslcMarks: updatedFormData.sslcMarks,
          govtSchool: updatedFormData.govtSchool,
          schoolType: updatedFormData.schoolType,
          lastStudies: value, // Use the newly selected value
        };
        
        localStorage.setItem('submittedFormData', JSON.stringify(personalData));
        
        
        setShowAcademicSection(true);
        const academicSection = document.getElementById('academic-scores-section');
        if (academicSection) {
          academicSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

    }
  };

  // const handleGenderChange = (e) => {
  //   setFormData({ ...formData, gender: e.target.value });
  // };
  // const handleHostelChange = (e) => {
  //   setFormData({ ...formData, BoysHostel: e.target.value });
  // }
  const handleGenderChange = (e) => {
    const { name, value } = e.target;
    
    // Clear validation error for this field when user makes a selection
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleDropoutChange = (e) => {
    const { name, value } = e.target;
    // Convert all dropout fields to uppercase
    setDropoutData({ ...dropoutData, [name]: value.toUpperCase() });
  };

  const handleDropoutSubmit = async () => {
    // Validate dropout fields
    if (!dropoutData.previousCollege || !dropoutData.regNo || !dropoutData.yearOfStudy) {
      alert('Please fill in all dropout details');
      return;
    }

    setIsLoading(true);

    try {
      const combinedFullName = `${formData.fullName || ''} ${formData.initial || ''}`.trim();
      
      const dropoutSubmissionData = {
        action: "submitStudentData",
        // Personal Details - ALL UPPERCASE
        preference1: getShortForm(formData.preference1),
        preference2: formData.preference2 ? getShortForm(formData.preference2) : '',
        preference3: formData.preference3 ? getShortForm(formData.preference3) : '',
        preference4: formData.preference4 ? getShortForm(formData.preference4) : '',
        preference5: formData.preference5 ? getShortForm(formData.preference5) : '',
        preference6: formData.preference6 ? getShortForm(formData.preference6) : '',
        preference7: formData.preference7 ? getShortForm(formData.preference7) : '',
        preference8: formData.preference8 ? getShortForm(formData.preference8) : '',
        preference9: formData.preference9 ? getShortForm(formData.preference9) : '',
        quota: formData.quota.toUpperCase(),
        entry: formData.entry.toUpperCase(),
        initial: formData.initial.toUpperCase(),
        fullName: combinedFullName.toUpperCase(),
        dob: formData.dob,
        gender: formData.gender.toUpperCase(),
        accommodation: formData.accommodation.toUpperCase(),
        roomType: formData.roomType.toUpperCase(),
        travelType: formData.travelType.toUpperCase(),
        fatherName: formData.fatherName.toUpperCase(),
        fatherOccupation: formData.fatherOccupation.toUpperCase(),
        motherName: formData.motherName.toUpperCase(),
        motherOccupation: formData.motherOccupation.toUpperCase(),
        community: formData.community.toUpperCase(),
        caste: formData.caste.toUpperCase(),
        annualIncome: formData.annualIncome.toUpperCase(),
        firstGrad: formData.firstGrad.toUpperCase(),
        address1: formData.address1.toUpperCase(),
        address2: formData.address2.toUpperCase(),
        taluk: formData.taluk.toUpperCase(),
        district: formData.district.toUpperCase(),
        state: formData.state.toUpperCase(),
        pincode: formData.pincode,
        fatherContact: formData.fatherContact,
        studentContact: formData.studentContact,
        motherContact: formData.motherContact,
        sslcMarks: formData.sslcMarks,
        schoolName: formData.schoolName.toUpperCase(),
        govtSchool: formData.govtSchool.toUpperCase(),
        schoolType: formData.schoolType.toUpperCase(),
        lastStudies: 'Dropout',
        // Dropout specific fields
        dropoutCollege: dropoutData.previousCollege.toUpperCase(),
        dropoutRegisterNo: dropoutData.regNo.toUpperCase(),
        dropoutYear: dropoutData.yearOfStudy.toUpperCase(),
        courseType: 'Dropout',
        date: new Date().toISOString()
      };


      // Google Apps Script endpoint
      const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_STUDENT_URL;
      const params = new URLSearchParams(dropoutSubmissionData).toString();
      const url = `${GOOGLE_SCRIPT_URL}?${params}`;

      const response = await fetch(url, { method: 'GET' });
      const result = await response.json();
      

      if (result.success && result.enquiryId) {
        localStorage.setItem('enquiryId', result.enquiryId);
        localStorage.setItem('studentName', combinedFullName);
        setIsLoading(false);
        navigate("/success", { state: { enquiryId: result.enquiryId } });
      } else {
        setIsLoading(false);
        alert('Error: ' + (result.message || 'Failed to save data'));
      }
    } catch (error) {
      console.error('Submit error:', error);
      setIsLoading(false);
      alert('Error: ' + error.message);
    }
  };

  // ==================== HELPER FUNCTION ====================
  // Convert full department name to short form (e.g., "CSE(Computer Science...)" → "CSE")
  const getShortForm = (departmentFullName) => {
    const department = degree.find(d => d.department === departmentFullName);
    return department ? department.short : departmentFullName;
  };

  // ==================== FORM SUBMISSION HANDLER ====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // VALIDATION 1: Check if Seat Type (Quota) is selected
    if (!formData.quota) {
      const quotaSection = document.getElementById('seat-type-section');
      if (quotaSection) {
        quotaSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => alert('Please select a Seat Type (Management or Government)'), 300);
      } else {
        alert('Please select a Seat Type (Management or Government)');
      }
      return;
    }

    // VALIDATION 2: Check if Admission Type (Entry) is selected
    if (!formData.entry) {
      const entrySection = document.getElementById('admission-type-section');
      if (entrySection) {
        entrySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => alert('Please select an Admission Type (I Year or Lateral Entry)'), 300);
      } else {
        alert('Please select an Admission Type (I Year or Lateral Entry)');
      }
      return;
    }

    // VALIDATION 3: Check for any invalid fields (HTML5 validation)
    const firstInvalidField = e.target.querySelector(':invalid');
    if (firstInvalidField) {
      firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalidField.focus();
      return;
    }

    // VALIDATION 4: Check if Full Name is entered
    if (!formData.fullName) {
      alert('Please enter your full name');
      return;
    }

    // VALIDATION 5: Check if Initial is entered
    if (!formData.initial || formData.initial.trim() === '') {
      alert('Please enter your initial');
      const initialField = document.querySelector('input[name="initial"]');
      if (initialField) {
        initialField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        initialField.focus();
      }
      return;
    }

    // ==================== DATA PREPARATION ====================
    // Create cleaned data object with only necessary fields
    // Department preferences are converted to short forms for API
    
    // Concatenate Full Name + Initial
    const combinedFullName = `${formData.fullName || ''} ${formData.initial || ''}`.trim();
    
    
    const personalData = {
      // Department Preferences (Short Forms Only)
      preference1: getShortForm(formData.preference1),
      preference2: formData.preference2 ? getShortForm(formData.preference2) : '',
      preference3: formData.preference3 ? getShortForm(formData.preference3) : '',
      preference4: formData.preference4 ? getShortForm(formData.preference4) : '',
      preference5: formData.preference5 ? getShortForm(formData.preference5) : '',
      preference6: formData.preference6 ? getShortForm(formData.preference6) : '',
      preference7: formData.preference7 ? getShortForm(formData.preference7) : '',
      preference8: formData.preference8 ? getShortForm(formData.preference8) : '',
      preference9: formData.preference9 ? getShortForm(formData.preference9) : '',

      // Admission Details
      quota: formData.quota,
      entry: formData.entry,

      // Personal Details
      fullName: combinedFullName,
      dob: formData.dob,
      gender: formData.gender,

      // Accommodation Details
      accommodation: formData.accommodation,
      roomType: formData.roomType,
      travelType: formData.travelType,

      // Parent Information
      fatherName: formData.fatherName,
      fatherOccupation: formData.fatherOccupation,
      motherName: formData.motherName,
      motherOccupation: formData.motherOccupation,

      // Social Information
      community: formData.community,
      caste: formData.caste,

      // Financial Information
      annualIncome: formData.annualIncome,
      firstGrad: formData.firstGrad,

      // Address Information
      address1: formData.address1,
      address2: formData.address2,
      taluk: formData.taluk,
      district: formData.district,
      state: formData.state,
      pincode: formData.pincode,

      // Contact Information
      fatherContact: formData.fatherContact,
      motherContact: formData.motherContact,
      studentContact: formData.studentContact,

      // Educational Details
      sslcMarks: formData.sslcMarks,
      govtSchool: formData.govtSchool,
      schoolType: formData.schoolType,
      lastStudies: formData.lastStudies,
    };

    // ==================== DATA STORAGE ====================
    // Save cleaned personal data to localStorage for academic section
    localStorage.setItem('submittedFormData', JSON.stringify(personalData));
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


  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 antialiased">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
          <img src={logo} alt="KNCET Logo" className="h-24 w-auto mb-6" />
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-3 border-gray-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-3 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <p className="text-xl font-semibold text-gray-900 mt-5">Saving your information</p>
            <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
          </div>
        </div>
      )}

      {/* Top Navigation / Logo Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4 flex items-center space-x-4">
          <img src={logo} alt="KNCET Logo" className="h-10 sm:h-12 w-auto" />
          <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-gray-900 tracking-tight">
            Kongunadu College of Engineering and Technology
          </h1>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 py-10 sm:py-16">
        {/* College Branding Header */}
        <header className="mb-12 sm:mb-16 text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
            Kongunadu College of Engineering and Technology
          </h1>
          <h2 className="text-base sm:text-lg  text-gray-600 mb-6 tracking-wide font-bold">Autonomous</h2>
          <div className="max-w-2xl mx-auto border-t border-gray-200 pt-6 px-4">
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-2">
              AICTE-New Delhi, Affiliation: Anna University, Chennai, Accreditation: NAAC & NBA
            </p>
            <p className="text-xs text-gray-500">Namakkal - Trichy Main Road, Thottiapatti (Po), Thottiam Taluk, Trichy Dt. 621 215</p>
          </div>


          <div className="mt-8 sm:mt-10 flex justify-center ">
            <h2
              className="  px-15 sm:px-30 py-3 sm:py-4 bg-[#219ebc] text-white  font-semibold text-lg sm:text-xl md:text-2xl tracking-tight px-6 py-3 rounded-md shadow-md"
            >
              Online Admission Form
            </h2>
          </div>
        </header>

        {/* Form Section */}
        <section className="bg-white border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-8 py-5 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 uppercase  ">
              Personal Information
            </h2>
          </div>

          <form className="p-8 sm:p-10 md:p-12 space-y-10 sm:space-y-12" onSubmit={handleSubmit}>
            {/* Top Grid: Degree, Quota */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {/* Left Column: Degree Preferences */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">Degree / Department Preferences <span className="text-red-600">*</span></label>
                <div className="space-y-3">
                  {/* Preference 1 */}
                  <select name="preference1" value={formData.preference1} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none hover:border-gray-400" required>
                    <option value="" disabled>1st Preference</option>
                    {degree.map((dept, index) => (
                      <option key={index} value={dept.department}>{dept.department}</option>
                    ))}
                  </select>
                  
                  {/* Preference 2 */}
                  <select name="preference2" value={formData.preference2} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500" disabled={!formData.preference1}>
                    <option value="" disabled>2nd Preference</option>
                    {degree.map((dept, index) => (
                      <option key={index} value={dept.department} disabled={dept.department === formData.preference1}>{dept.department}</option>
                    ))}
                  </select>
                  
                  {/* Preference 3 */}
                  <select name="preference3" value={formData.preference3} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500" disabled={!formData.preference1 || !formData.preference2}>
                    <option value="" disabled>3rd Preference</option>
                    {degree.map((dept, index) => (
                      <option key={index} value={dept.department} disabled={dept.department === formData.preference1 || dept.department === formData.preference2}>{dept.department}</option>
                    ))}
                  </select>
                  
                  {/* Preference 4 */}
                  {visiblePreferences >= 4 && (
                    <select name="preference4" value={formData.preference4} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500" disabled={!formData.preference1 || !formData.preference2 || !formData.preference3}>
                      <option value="" disabled>4th Preference</option>
                      {degree.map((dept, index) => (
                        <option key={index} value={dept.department} disabled={dept.department === formData.preference1 || dept.department === formData.preference2 || dept.department === formData.preference3}>{dept.department}</option>
                      ))}
                    </select>
                  )}
                  
                  {/* Preference 5 */}
                  {visiblePreferences >= 5 && (
                    <select name="preference5" value={formData.preference5} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500" disabled={!formData.preference1 || !formData.preference2 || !formData.preference3 || !formData.preference4}>
                      <option value="" disabled>5th Preference</option>
                      {degree.map((dept, index) => (
                        <option key={index} value={dept.department} disabled={dept.department === formData.preference1 || dept.department === formData.preference2 || dept.department === formData.preference3 || dept.department === formData.preference4}>{dept.department}</option>
                      ))}
                    </select>
                  )}
                  
                  {/* Preference 6 */}
                  {visiblePreferences >= 6 && (
                    <select name="preference6" value={formData.preference6} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500" disabled={!formData.preference1 || !formData.preference2 || !formData.preference3 || !formData.preference4 || !formData.preference5}>
                      <option value="" disabled>6th Preference</option>
                      {degree.map((dept, index) => (
                        <option key={index} value={dept.department} disabled={dept.department === formData.preference1 || dept.department === formData.preference2 || dept.department === formData.preference3 || dept.department === formData.preference4 || dept.department === formData.preference5}>{dept.department}</option>
                      ))}
                    </select>
                  )}
                  
                  {/* Preference 7 */}
                  {visiblePreferences >= 7 && (
                    <select name="preference7" value={formData.preference7} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500" disabled={!formData.preference1 || !formData.preference2 || !formData.preference3 || !formData.preference4 || !formData.preference5 || !formData.preference6}>
                      <option value="" disabled>7th Preference</option>
                      {degree.map((dept, index) => (
                        <option key={index} value={dept.department} disabled={dept.department === formData.preference1 || dept.department === formData.preference2 || dept.department === formData.preference3 || dept.department === formData.preference4 || dept.department === formData.preference5 || dept.department === formData.preference6}>{dept.department}</option>
                      ))}
                    </select>
                  )}
                  
                  {/* Preference 8 */}
                  {visiblePreferences >= 8 && (
                    <select name="preference8" value={formData.preference8} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500" disabled={!formData.preference1 || !formData.preference2 || !formData.preference3 || !formData.preference4 || !formData.preference5 || !formData.preference6 || !formData.preference7}>
                      <option value="" disabled>8th Preference</option>
                      {degree.map((dept, index) => (
                        <option key={index} value={dept.department} disabled={dept.department === formData.preference1 || dept.department === formData.preference2 || dept.department === formData.preference3 || dept.department === formData.preference4 || dept.department === formData.preference5 || dept.department === formData.preference6 || dept.department === formData.preference7}>{dept.department}</option>
                      ))}
                    </select>
                  )}
                  
                  {/* Preference 9 */}
                  {visiblePreferences >= 9 && (
                    <select name="preference9" value={formData.preference9} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500" disabled={!formData.preference1 || !formData.preference2 || !formData.preference3 || !formData.preference4 || !formData.preference5 || !formData.preference6 || !formData.preference7 || !formData.preference8}>
                      <option value="" disabled>9th Preference</option>
                      {degree.map((dept, index) => (
                        <option key={index} value={dept.department} disabled={dept.department === formData.preference1 || dept.department === formData.preference2 || dept.department === formData.preference3 || dept.department === formData.preference4 || dept.department === formData.preference5 || dept.department === formData.preference6 || dept.department === formData.preference7 || dept.department === formData.preference8}>{dept.department}</option>
                      ))}
                    </select>
                  )}
                  
                  <ValidationError fieldName="preference1" />
                  
                  {/* Add 2 More Preferences Button */}
                  {visiblePreferences < 9 && (
                    <button
                      type="button"
                      onClick={() => setVisiblePreferences(prev => Math.min(prev + 2, 9))}
                      className="w-full px-4 py-2.5 text-sm bg-[#003566] hover:bg-gray-800 text-white font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add 2 More Preferences If needed 
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Seat Type and Admission Type */}
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">Seat Type <span className="text-red-600">*</span></label>
                  <div className="grid grid-cols-2 gap-4" id="seat-type-section">
                    <label className="flex items-center justify-center border border-gray-300 p-3 cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all has-[:checked]:bg-[#0077b6] has-[:checked]:text-white has-[:checked]:border-gray-900">
                      <input type="radio" name="quota" value="MQ" checked={formData.quota === "MQ"} onChange={handleChange} className="hidden" required />
                      <span className="font-medium text-sm">Management</span>
                    </label>
                    <label className="flex items-center justify-center border border-gray-300 p-3 cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all has-[:checked]:bg-[#0077b6] has-[:checked]:text-white has-[:checked]:border-gray-900">
                      <input type="radio" name="quota" value="GQ" checked={formData.quota === "GQ"} onChange={handleChange} className="hidden" required />
                      <span className="font-medium text-sm">Government</span>
                    </label>
                  </div>
                  <ValidationError fieldName="quota" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">Admission Type <span className="text-red-600">*</span></label>
                  <div className="grid grid-cols-2 gap-4" id="admission-type-section">
                    <label className="flex items-center justify-center border border-gray-300 p-3 cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all has-[:checked]:bg-[#0077b6] has-[:checked]:text-white has-[:checked]:border-gray-900">
                      <input type="radio" name="entry" value="I YEAR" checked={formData.entry === "I YEAR"} onChange={handleChange} className="hidden" required />
                      <span className="font-medium text-sm">I Year</span>
                    </label>
                    <label className="flex items-center justify-center border border-gray-300 p-3 cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all has-[:checked]:bg-[#0077b6] has-[:checked]:text-white has-[:checked]:border-gray-900">
                      <input type="radio" name="entry" value="LATERAL ENTRY" checked={formData.entry === "LATERAL ENTRY"} onChange={handleChange} className="hidden" required />
                      <span className="font-medium text-sm">Lateral Entry</span>
                    </label>
                  </div>
                  <ValidationError fieldName="entry" />
                </div>
              </div>
            </div>

            <hr className="border-t border-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
             

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Name <span className="text-red-600">*</span></label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} onBlur={handleBlur} placeholder="Student's Name" className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none hover:border-gray-400" style={{ textTransform: 'uppercase' }} required />
                <ValidationError fieldName="fullName" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Initial <span className="text-red-600">*</span></label>
                <input type="text" name="initial" value={formData.initial} onChange={handleChange} onBlur={handleBlur} placeholder="Initial" className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none hover:border-gray-400" style={{ textTransform: 'uppercase' }} required />
                <ValidationError fieldName="initial" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Date of Birth <span className="text-red-600">*</span></label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    views={["year", "month", "day"]}
                    value={formData.dob ? dayjs(formData.dob, 'DD-MM-YYYY') : null}
                    onChange={(newValue) => {
                      const formattedDate = newValue ? newValue.format('DD-MM-YYYY') : '';
                      handleChange({ target: { name: 'dob', value: formattedDate } });
                    }}
                    format="DD-MM-YYYY"
                    maxDate={dayjs()}
                    slotProps={{
                      textField: {
                        required: true,
                        placeholder: "DD-MM-YYYY",
                        className: "w-full",
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#ffffff',
                            '& fieldset': {
                              borderColor: '#d1d5db',
                              borderWidth: '1px',
                            },
                            '&:hover fieldset': {
                              borderColor: '#9ca3af',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#3b82f6',
                              borderWidth: '2px',
                            },
                          },
                          '& .MuiOutlinedInput-input': {
                            padding: '10px 14px',
                            fontSize: '0.875rem',
                          },
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
                <ValidationError fieldName="dob" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Gender / Accomodation <span className="text-red-600">*</span></label>
                <div className="bg-gray-50 p-5 border border-gray-200 space-y-4">
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="gender" value="MALE" checked={formData.gender === "MALE"} onChange={handleGenderChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" required />
                      <span className="font-medium text-sm">Male</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="gender" value="FEMALE" checked={formData.gender === "FEMALE"} onChange={handleGenderChange} className="w-4 h-4 text-pink-600 focus:ring-pink-500" />
                      <span className="font-medium text-sm">Female</span>
                    </label>
                  </div>

                  {formData.gender && (
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Student Type <span className="text-red-600">*</span></label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center space-x-2 p-2.5 border border-gray-300 hover:border-gray-400 hover:bg-white cursor-pointer transition-all has-[:checked]:border-gray-900 has-[:checked]:bg-[#0077b6] has-[:checked]:text-white">
                          <input type="radio" name="accommodation" value={formData.gender === "MALE" ? "BOYSHOSTEL" : "GIRLSHOSTEL"} checked={formData.accommodation === (formData.gender === "MALE" ? "BOYSHOSTEL" : "GIRLSHOSTEL")} onChange={handleGenderChange} required />
                          <span className="text-xs font-medium">{formData.gender === "MALE" ? "Boys Hostel" : "Girls Hostel"}</span>
                        </label>
                        <label className="flex items-center space-x-2 p-2.5 border border-gray-300 hover:border-gray-400 hover:bg-white cursor-pointer transition-all has-[:checked]:border-gray-900 has-[:checked]:bg-[#0077b6] has-[:checked]:text-white">
                          <input type="radio" name="accommodation" value="DAYSCHOLAR" checked={formData.accommodation === "DAYSCHOLAR"} onChange={handleGenderChange} required />
                          <span className="text-xs font-medium">Day Scholar</span>
                        </label>
                      </div>

                      {/* Room / Travel Details Sub-options */}
                      {(formData.accommodation === "BOYSHOSTEL" || formData.accommodation === "GIRLSHOSTEL") && (
                        <div className="bg-white p-3 border border-gray-300 space-y-2">
                          <select name="roomType" value={formData.roomType} onChange={handleGenderChange} className="w-full text-sm bg-white border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-all" required>
                            <option value="" disabled>Select Room Type</option>
                            <option value={formData.accommodation === "BOYSHOSTEL" ? "BOYS HOSTEL (N)" : "GIRLS HOSTEL (N)"}>Normal Room (4 Members)</option>
                            <option value={formData.accommodation === "BOYSHOSTEL" ? "BOYS HOSTEL (A)" : "GIRLS HOSTEL (A)"}>Attached Room (3 Members)</option>
                            <option value={formData.accommodation === "BOYSHOSTEL" ? "BOYS HOSTEL (AC)" : "GIRLS HOSTEL (AC)"}>Attached AC Room (3 Members)</option>
                          </select>
                        </div>
                      )}

                      {formData.accommodation === "DAYSCHOLAR" && (
                        <div className="bg-white p-3 border border-gray-300 space-y-2">
                          <select name="travelType" value={formData.travelType} onChange={handleGenderChange} className="w-full text-xs bg-white border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400" required>
                            <option value="" disabled>Select Travel Type</option>
                            <option value="COLLEGEBUS">College Bus</option>
                            <option value="OUTBUS">Own/Outside Travel</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                  <ValidationError fieldName="gender" />
                  <ValidationError fieldName="accommodation" />
                  <ValidationError fieldName="roomType" />
                  <ValidationError fieldName="travelType" />
                </div>
              </div>
            </div>

            <hr className="border-t border-gray-200" />

            {/* Parents & Community Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Father / Guardian Name <span className="text-red-600">*</span></label>
                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} onBlur={handleBlur} placeholder="Father / Guardian Name" className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400" style={{ textTransform: 'uppercase' }} minLength={3} maxLength={50} required />
                <ValidationError fieldName="fatherName" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Father's / Guardian's Occupation <span className="text-red-600">*</span></label>
                <select name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400" required>
                  <option value="" disabled>Select Occupation</option>
                  <option value="FARMER">Farmer</option>
                  <option value="STATE GOVT. EMP.">State Govt. Employee</option>
                  <option value="CENTRAL GOVT EMP.">Central Govt Employee</option>
                  <option value="PRIVATE EMP.">Private Employee</option>
                  <option value="BUSINESS">Business</option>
                  <option value="DAILY WAGES">Daily wages</option>
                  <option value="DRIVER">Driver</option>
                  <option value="OTHERS">Others</option>
                  <option value="DECEASED">Deceased</option>
                </select>
                <ValidationError fieldName="fatherOccupation" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Mother Name</label>
                <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} onBlur={handleBlur} placeholder="Mother Name" className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400" style={{ textTransform: 'uppercase' }} minLength={3} maxLength={50} />
                <ValidationError fieldName="motherName" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Mother's Occupation</label>
                <select name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400">
                  <option value="" disabled>Select Occupation</option>
                  <option value="FARMER">Farmer</option>
                  <option value="STATE GOVT. EMP.">State Govt. Employee</option>
                  <option value="CENTRAL GOVT EMP.">Central Govt Employee</option>
                  <option value="PRIVATE EMP.">Private Employee</option>
                  <option value="BUSINESS">Business</option>
                  <option value="DAILY WAGES">Daily wages</option>
                  <option value="DRIVER">Driver</option>
                  <option value="HOMEMAKER">Homemaker</option>
                  <option value="OTHERS">Others</option>
                  <option value="DECEASED">Deceased</option>
                </select>
                <ValidationError fieldName="motherOccupation" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Community <span className="text-red-600">*</span></label>
                <select name="community" value={formData.community} onChange={(e) => {
                  // Clear caste when community changes
                  setFormData({ ...formData, community: e.target.value, caste: '' });
                  setCasteSearch('');
                  if (validationErrors.community) {
                    setValidationErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.community;
                      return newErrors;
                    });
                  }
                }} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400" required>
                  <option value="" disabled>Select Community</option>
                  {Community.map((c, i) => <option key={i} value={c.community}>{c.community}</option>)}
                </select>
                <ValidationError fieldName="community" />
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Caste <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  name="caste"
                  placeholder={formData.community === 'OC' ? "NOT REQUIRED" : formData.community ? "Search or Enter the caste" : "Select community first"}
                  autoComplete="off"
                  value={formData.caste}
                  maxLength={30}
                  onChange={(e) => {
                    // Prevent editing if community is OC
                    if (formData.community === 'OC') return;
                    
                    // Clear validation error for caste
                    if (validationErrors.caste) {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.caste;
                        return newErrors;
                      });
                    }
                    const uppercaseValue = e.target.value.toUpperCase();
                    setFormData({ ...formData, caste: uppercaseValue });
                    setCasteSearch(uppercaseValue);
                    setCasteDropdownOpen(true);
                  }}
                  onFocus={() => formData.community && formData.community !== 'OC' && setCasteDropdownOpen(true)}
                  onBlur={(e) => {
                    setTimeout(() => {
                      setCasteDropdownOpen(false);
                      // Save the typed caste value even if not in the list
                      if (casteSearch && formData.community !== 'OC') {
                        setFormData({ ...formData, caste: casteSearch });
                      }
                    }, 150);
                    handleBlur(e);
                  }}
                  className={`w-full px-4 py-2.5 text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400 ${
                    formData.community === 'OC' ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'
                  }`}
                  style={{ textTransform: 'uppercase' }}
                  disabled={!formData.community || formData.community === 'OC'}
                  readOnly={formData.community === 'OC'}
                  required
                />
                {casteDropdownOpen && filteredCastes.length > 0 && formData.community !== 'OC' && (
                  <ul className="absolute z-20 w-full bg-white border border-gray-300 mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {filteredCastes.map((caste, idx) => (
                      <li
                        key={idx}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-xs transition-colors"
                        onMouseDown={() => {
                          // Clear validation error when selecting from dropdown
                          if (validationErrors.caste) {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.caste;
                              return newErrors;
                            });
                          }
                          setFormData({ ...formData, caste });
                          setCasteSearch(caste);
                          setCasteDropdownOpen(false);
                        }}
                      >
                        {caste}
                      </li>
                    ))}
                  </ul>
                )}
                <ValidationError fieldName="caste" />
              </div>

              {/* Anuual income */}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Annual Family Income <span className="text-red-600">*</span></label>
                <select name="annualIncome" value={formData.annualIncome} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400" required>
                  <option value="" disabled>Select Income Range</option>
                  <option value="Less than 1L">Less than 1 Lakh</option>
                  <option value="1L to 1.5L">1 Lakh to 1.5 Lakhs</option>
                  <option value="1.5L to 2.5L">1.5 Lakhs to 2.5 Lakhs</option>
                  <option value="2.5L to 5L">2.5 Lakhs to 5 Lakhs</option>
                  <option value="More than 5L">More than 5 Lakhs</option>
                  <option value="Nil">Nil</option>
                </select>
                <ValidationError fieldName="annualIncome" />
              </div>

              <div className="bg-gray-50 p-4 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="block text-xs font-semibold text-gray-900 uppercase">First Graduate? <span className="text-red-600">*</span></span>
                  <span className="text-xs text-gray-600 capitalize">Are you the first in family to graduate?</span>
                </div>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="firstGrad" value="YES" checked={formData.firstGrad === "YES"} onChange={handleChange} className="w-4 h-4 text-blue-600" required />
                    <span className="text-sm font-medium text-gray-900">Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="firstGrad" value="NO" checked={formData.firstGrad === "NO"} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">No</span>
                  </label>
                </div>
                <ValidationError fieldName="firstGrad" />
              </div>
            </div>

            <hr className="border-t-2 border-blue-100" />

            {/* Address Grid */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                COMMUNICATION ADDRESS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:p-7 p-5 bg-gray-50  border border-gray-200">
                {/* Address Line 1 */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    Address Line 1 (Door no, Village Name / Street Name) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="address1"
                    placeholder="Enter Door No, Village Name / Street Name"
                    value={formData.address1}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400"
                    style={{ textTransform: 'uppercase' }}
                    minLength={5}
                    maxLength={100}
                    required
                  />
                  <ValidationError fieldName="address1" />
                </div>
                {/* Address Line 2 */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    Address Line 2 (Panchayat / Town) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="address2"
                    placeholder="Enter Panchayat / Town"
                    value={formData.address2}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400"
                    style={{ textTransform: 'uppercase' }}
                    minLength={3}
                    maxLength={100}
                    required
                  />
                  <ValidationError fieldName="address2" />
                </div>
                {/* Taluk */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    Taluk <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="taluk"
                    placeholder="Enter Taluk"
                    value={formData.taluk}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400"
                    style={{ textTransform: 'uppercase' }}
                    minLength={2}
                    maxLength={50}
                    required
                  />
                  <ValidationError fieldName="taluk" />
                </div>
                {/* District Autocomplete */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    District <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    placeholder="Search or select district"
                    autoComplete="off"
                    value={formData.district}
                    maxLength={50}
                    onChange={e => {
                      // Clear validation error for district
                      if (validationErrors.district) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.district;
                          return newErrors;
                        });
                      }
                      const uppercaseValue = e.target.value.toUpperCase();
                      setFormData({ ...formData, district: uppercaseValue });
                      setDistrictSearch(uppercaseValue);
                      setDistrictDropdownOpen(true);
                    }}
                    onFocus={() => setDistrictDropdownOpen(true)}
                    onBlur={(e) => {
                      setTimeout(() => setDistrictDropdownOpen(false), 150);
                      handleBlur(e);
                    }}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400"
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                  {districtDropdownOpen && filteredDistricts.length > 0 && (
                    <ul className="absolute z-20 w-full bg-white border border-gray-300 mt-1 max-h-48 overflow-y-auto shadow-sm">
                      {filteredDistricts.map((district, idx) => (
                        <li
                          key={district}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm capitalize transition-colors"
                          onMouseDown={() => {
                            // Clear validation error when selecting from dropdown
                            if (validationErrors.district) {
                              setValidationErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.district;
                                return newErrors;
                              });
                            }
                            setFormData({ ...formData, district });
                            setDistrictSearch(district);
                            setDistrictDropdownOpen(false);
                          }}
                        >
                          {district}
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <ValidationError fieldName="district" />
                </div>
                {/* State Select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    State <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400"
                    required
                  >
                    {stateList.map((state, idx) => (
                      <option key={idx} value={state}>{state}</option>
                    ))}
                  </select>
                  <ValidationError fieldName="state" />
                </div>
                {/* Pin Code */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    Pin Code <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="pincode"
                    placeholder="Enter Pin Code"
                    value={formData.pincode}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^[0-9]{0,6}$/.test(value)) {
                        handleChange(e);
                      }
                    }}
                    onBlur={handleBlur}
                    maxLength={6}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400"
                    required
                  />
                  <ValidationError fieldName="pincode" />
                </div>
                {/* Contact No. 1 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    Contact No. 1 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="fatherContact"
                    placeholder="Enter Contact No. 1"
                    value={formData.fatherContact}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^[0-9]{0,10}$/.test(value)) {
                        handleChange(e);
                      }
                    }}
                    onBlur={handleBlur}
                    maxLength={10}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400"
                    required
                  />
                  <ValidationError fieldName="fatherContact" />
                </div>
                {/* Contact No. (Mother) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    Contact No. 2 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="motherContact"
                    placeholder="Enter Contact No. 2"
                    value={formData.motherContact}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^[0-9]{0,10}$/.test(value)) {
                        handleChange(e);
                      }
                    }}
                    onBlur={handleBlur}
                    maxLength={10}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400"
                    required
                  />
                  <ValidationError fieldName="motherContact" />
                </div>
                {/* Contact No. (Student) */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    Contact No. (Student)
                  </label>
                  <input
                    type="number"
                    name="studentContact"
                    placeholder="Enter Contact No. (Student)"
                    value={formData.studentContact}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^[0-9]{0,10}$/.test(value)) {
                        handleChange(e);
                      }
                    }}
                    onBlur={handleBlur}
                    maxLength={10}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all outline-none hover:border-gray-400"
                  />
                  <ValidationError fieldName="studentContact" />
                </div>
              </div>
            </div>

            <hr className="border-t border-gray-200" />

            {/* Education Grid */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                Educational Background
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 bg-gray-50 p-5 sm:p-7 border border-gray-200">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">SSLC Total Mark <span className="text-red-600">*</span></label>
                    <input 
                      type="number" 
                      name="sslcMarks" 
                      min="0" 
                      max="500" 
                      value={formData.sslcMarks} 
                      onChange={(e) => {
                        const value = e.target.value;
                        const numVal = parseFloat(value);
                        
                        // Allow empty value for deletion
                        if (value === '') {
                          handleChange(e);
                          return;
                        }
                        
                        // Check if it's a valid integer between 0 and 500
                        if (!isNaN(numVal) && numVal >= 0 && numVal <= 500 && Number.isInteger(numVal)) {
                          handleChange(e);
                        }
                      }}
                      onBlur={handleBlur}
                      onKeyDown={(e) => {
                        // Prevent decimal point, 'e', '+', '-' keys
                        if (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                          e.preventDefault();
                        }
                      }}
                      onWheel={(e) => {
                        e.preventDefault();
                        e.target.blur();
                      }}
                      placeholder="Enter Sslc Marks Out Of 500" 
                      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-400" 
                      style={{ MozAppearance: 'textfield' }}
                      required 
                    />
                    <ValidationError fieldName="sslcMarks" />
                  </div>

                  <div className="bg-gray-50 p-4 sm:p-5 border border-gray-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="block text-xs font-bold text-gray-900 uppercase">Govt 7.5 Eligibility <span className="text-red-600">*</span></span>
                      <span className="text-xs text-gray-600">Are you Studied Govt School (6th-12th)?</span>
                    </div>
                    <div className="flex space-x-3 sm:space-x-4">
                      <label className="flex items-center space-x-1 sm:space-x-2 cursor-pointer group">
                        <input type="radio" name="govtSchool" value="YES" checked={formData.govtSchool === "YES"} onChange={handleChange} className="w-4 h-4 text-blue-600" required />
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center space-x-1 sm:space-x-2 cursor-pointer group">
                        <input type="radio" name="govtSchool" value="NO" checked={formData.govtSchool === "NO"} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">No</span>
                      </label>
                    </div>
                    <ValidationError fieldName="govtSchool" />
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">School Type (6th to 12th)<span className="text-red-600">*</span></label>
                    <select name="schoolType" value={formData.schoolType} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-400" required>
                      <option value="" disabled>Select School Type (6th to 12th)</option>
                      <option value="GOVT">GOVERNMENT</option>
                      <option value="GOVT. AIDED">GOVT. AIDED</option>
                      <option value="PRIVATE">PRIVATE</option>
                    </select>
                    <ValidationError fieldName="schoolType" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Qualifying Examination <span className="text-red-600">*</span></label>
                    <select name="lastStudies" value={formData.lastStudies} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-400" required>
                      <option value="" disabled>Choose your previous course</option>
                      {options.map((opt, i) => <option key={i} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  {formData.lastStudies === 'Dropout' && (
                    <div className="p-4 sm:p-5 bg-gray-50 border border-gray-300 space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-xs font-bold text-gray-900 uppercase">College Dropout Details</h4>
                      <div>
                        <label className="block text-xs text-gray-700 font-bold uppercase mb-3">Previous College & Place <span className="text-red-600">*</span></label>
                        <input 
                          type="text" 
                          name="previousCollege"
                          value={dropoutData.previousCollege}
                          onChange={handleDropoutChange}
                          className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 hover:border-gray-400" 
                          style={{ textTransform: 'uppercase' }} 
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs text-gray-700 font-bold uppercase mb-3">Reg No</label>
                          <input 
                            type="text" 
                            name="regNo"
                            value={dropoutData.regNo}
                            onChange={handleDropoutChange}
                            className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 hover:border-gray-400" 
                            style={{ textTransform: 'uppercase' }} 
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-700 font-bold uppercase mb-3">Year of Study</label>
                          <input 
                            type="text" 
                            name="yearOfStudy"
                            value={dropoutData.yearOfStudy}
                            onChange={handleDropoutChange}
                            className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 hover:border-gray-400" 
                            style={{ textTransform: 'uppercase' }} 
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleDropoutSubmit}
                        className="w-full mt-3 sm:mt-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 px-4 transition-all duration-200"
                      >
                        Submit Application
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </form>
        </section>

        {/* Academic Scores Section - Conditionally Rendered */}
        {showAcademicSection && formData.lastStudies && (
          <div id="academic-scores-section" className="mt-8">
            {formData.lastStudies === 'DIPLOMA' && <DiplomaScores personalData={formData} setPersonalInfoErrors={setPersonalInfoErrors} />}
            {formData.lastStudies === 'CBSE' && <CBSEScore personalData={formData} setPersonalInfoErrors={setPersonalInfoErrors} />}
            {formData.lastStudies === 'VOCATIONAL' && <VocationalScores personalData={formData} setPersonalInfoErrors={setPersonalInfoErrors} />}
            {formData.lastStudies === 'HSC' && <AcademicScores personalData={formData} setPersonalInfoErrors={setPersonalInfoErrors} />}
          </div>
        )}

        {/* Footer Area */}
        {/* <footer className="mt-12 text-center text-gray-400 text-sm">
          &copy; 2024 Kongunadu College of Engineering and Technology. All Rights Reserved.
        </footer> */}
      </main>
      <Footer />
    </div>
  );
};

export default PersonalInfo;



