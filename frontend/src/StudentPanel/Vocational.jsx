import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const logo = "/assets/kongunadulogo.png"; 


const VocationalScores = ({ personalData, setPersonalInfoErrors }) => {
    const navigate = useNavigate();

    const [scores, setScores] = useState([
        { subject: "TAMIL", max: 100, obtained: "" },
        { subject: "ENGLISH", max: 100, obtained: "" },
        { subject: "MATHEMATICS", max: 100, obtained: "" },
        { subject: "", max: 100, obtained: "" },
        { subject: "", max: 100, obtained: "" },
        { subject: "", max: 100, obtained: "" },
    ]);

    const [uploads, setUploads] = useState([]);
    const [mediumOfStudy, setMediumOfStudy] = useState("");
    const [otherMedium, setOtherMedium] = useState("");
    const [schoolName, setSchoolName] = useState("");
    const [registerNumber, setRegisterNumber] = useState("");
    const [yearOfPassing, setYearOfPassing] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // Google Apps Script endpoint
    const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_STUDENT_URL;

    // Get enquiry ID from localStorage (set by PersonalInfo component)
    const enquiryId = localStorage.getItem("enquiryId");

    // Degree list for conversion
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
    ];

    // Helper function to convert full department name to short form
    const getShortForm = (departmentFullName) => {
        if (!departmentFullName) return '';
        const department = degree.find(d => d.department === departmentFullName);
        return department ? department.short : departmentFullName;
    };

    // Field-level validation function
    const validateField = (name, value) => {
        const rules = {
            schoolName: {
                minLength: 3,
                maxLength: 60,
                message: 'School name must be 3-60 characters'
            },
            registerNumber: {
                minLength: 3,
                maxLength: 15,
                pattern: /^[0-9]+$/,
                message: 'Register number must be 3-15 digits only'
            },
            yearOfPassing: {
                pattern: /^[0-9]{4}$/,
                message: 'Year must be exactly 4 digits'
            },
            otherMedium: {
                minLength: 2,
                maxLength: 30,
                message: 'Medium must be 2-30 characters'
            }
        };

        const rule = rules[name];
        if (!rule) return null;

        const trimmedValue = typeof value === 'string' ? value.trim() : value;

        if (!trimmedValue && name !== 'otherMedium' && name !== 'registerNumber') {
            return 'This field is required';
        }

        if ((name === 'otherMedium' || name === 'registerNumber') && !trimmedValue) {
            return null;
        }

        if (rule.minLength && trimmedValue.length < rule.minLength) {
            return rule.message;
        }

        if (rule.maxLength && trimmedValue.length > rule.maxLength) {
            return rule.message;
        }

        if (rule.pattern && !rule.pattern.test(trimmedValue)) {
            return rule.message;
        }

        return null;
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

    const handleScoreChange = (index, value) => {
        // allow empty string for deletion
        if (value === "") {
            const newScores = [...scores];
            newScores[index].obtained = value;
            setScores(newScores);
            return;
        }

        const numVal = parseFloat(value);
        // check if it is a number, within range 0-100, and is an integer (no decimals)
        if (!isNaN(numVal) && numVal >= 0 && numVal <= 100 && Number.isInteger(numVal)) {
            const newScores = [...scores];
            newScores[index].obtained = value;
            setScores(newScores);
        }
    };

    const handleSubjectChange = (index, value) => {
        const newScores = [...scores];
        newScores[index].subject = value;
        setScores(newScores);
    };

    const handleNavigate = async () => {
        // Get personal info from localStorage for submission
        const storedPersonalData = JSON.parse(localStorage.getItem('submittedFormData') || '{}');
        
        // STEP 1: Validate required academic fields first
        const errors = {};
        
        if (!schoolName || schoolName.trim() === '') {
            errors.schoolName = 'School Name is required';
        }
        
        if (!mediumOfStudy) {
            errors.mediumOfStudy = 'Medium of Study is required';
        }
        if (mediumOfStudy === 'Other' && (!otherMedium || otherMedium.trim() === '')) {
            errors.otherMedium = 'Please specify the medium';
        }
        if (!yearOfPassing || yearOfPassing.trim() === '') {
            errors.yearOfPassing = 'Year of Passing is required';
        }

        // Validate dynamic subjects (indices 3, 4, 5) - subject name is mandatory
        for (let i = 3; i <= 5; i++) {
            const subjectName = scores[i].subject.trim();
            
            if (!subjectName) {
                errors[`subject${i + 1}Name`] = `Subject ${i + 1} name is required`;
            }
        }

        // Check for academic validation errors
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            // Scroll to first error within this section
            setTimeout(() => {
                const section = document.getElementById('vocational-scores-form');
                if (section) {
                    const firstErrorField = section.querySelector('.text-red-600');
                    if (firstErrorField) {
                        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 100);
            return;
        }

        // Clear validation errors
        setValidationErrors({});

        // STEP 2: Validate personal info from prop (live data, not localStorage)
        const personalInfoErrors = [];
        const personalInfoErrorsMap = {};
        const requiredPersonalFields = [
            { field: 'fullName', label: 'Full Name' },
            { field: 'dob', label: 'Date of Birth' },
            { field: 'gender', label: 'Gender' },
            { field: 'fatherName', label: 'Father/Guardian Name' },
            { field: 'community', label: 'Community' },
            { field: 'address1', label: 'Address' },
            { field: 'district', label: 'District' },
            { field: 'pincode', label: 'Pin Code' },
            { field: 'fatherContact', label: 'Contact Number' },
            { field: 'sslcMarks', label: 'SSLC Marks' }
        ];

        requiredPersonalFields.forEach(({ field, label }) => {
            if (!personalData || !personalData[field] || (typeof personalData[field] === 'string' && personalData[field].trim() === '')) {
                personalInfoErrors.push(label);
                personalInfoErrorsMap[field] = `${label} is required`;
            }
        });

        if (personalInfoErrors.length > 0) {
            // Use callback to set errors in PersonalInfo component
            if (setPersonalInfoErrors) {
                setPersonalInfoErrors(personalInfoErrorsMap);
            }
            // Scroll to PersonalInfo section
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
            return;
        }

        setIsLoading(true);

        try {
            // Prepare combined data with all fields
            const combinedFullName = `${storedPersonalData.fullName || ''} ${storedPersonalData.initial || ''}`.trim();
            
            // Convert all string fields to uppercase
            const uppercasePersonalData = Object.keys(storedPersonalData).reduce((acc, key) => {
                const value = storedPersonalData[key];
                acc[key] = typeof value === 'string' ? value.toUpperCase() : value;
                return acc;
            }, {});
            
            // Prepare combined data (personal + scores) - ALL IN UPPERCASE
            const combinedData = {
                action: "submitStudentData",
                // Personal info fields - converted to uppercase
                ...uppercasePersonalData,
                fullName: combinedFullName.toUpperCase(),
                initial: (storedPersonalData.initial || '').toUpperCase(),
                motherName: (storedPersonalData.motherName || '').toUpperCase(),
                motherOccupation: (storedPersonalData.motherOccupation || '').toUpperCase(),
                // Convert all preferences to short form
                preference1: getShortForm(storedPersonalData.preference1),
                preference2: getShortForm(storedPersonalData.preference2),
                preference3: getShortForm(storedPersonalData.preference3),
                preference4: getShortForm(storedPersonalData.preference4),
                preference5: getShortForm(storedPersonalData.preference5),
                preference6: getShortForm(storedPersonalData.preference6),
                preference7: getShortForm(storedPersonalData.preference7),
                preference8: getShortForm(storedPersonalData.preference8),
                preference9: getShortForm(storedPersonalData.preference9),
                // SSLC fields (from PersonalInfo form)
                sslcMarks: storedPersonalData.sslcMarks,
                govtSchool: storedPersonalData.govtSchool,
                schoolType: storedPersonalData.schoolType,
                schoolName: schoolName.toUpperCase(),  // ✅ ADDED: Include schoolName from current form
                // Score fields - all text in uppercase
                courseType: "VOCATIONAL",
                registerNumber: registerNumber.toUpperCase(),
                medium: (mediumOfStudy === "Other" ? otherMedium : mediumOfStudy).toUpperCase(),
                yearOfPassing,
                subject1: (scores[0]?.subject || '').toUpperCase(),
                subject1Marks: scores[0]?.obtained || '',
                subject2: (scores[1]?.subject || '').toUpperCase(),
                subject2Marks: scores[1]?.obtained || '',
                subject3: (scores[2]?.subject || '').toUpperCase(),
                subject3Marks: scores[2]?.obtained || '',
                subject4: (scores[3]?.subject || '').toUpperCase(),
                subject4Marks: scores[3]?.obtained || '',
                subject5: (scores[4]?.subject || '').toUpperCase(),
                subject5Marks: scores[4]?.obtained || '',
                subject6: (scores[5]?.subject || '').toUpperCase(),
                subject6Marks: scores[5]?.obtained || '',
                totalMarks,
                percentage,
                cutoff,
                eligibility,
                date: new Date().toISOString()
            };


            // Send to FastAPI Backend
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
            const response = await fetch(`${BACKEND_URL}/api/applications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(combinedData),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log("Response from server:", result);

            if (result.enquiryId) {
                // Save enquiry ID to localStorage
                localStorage.setItem('enquiryId', result.enquiryId);
                localStorage.setItem('studentName', storedPersonalData.fullName);
                
                setIsLoading(false);
                navigate("/success", { state: { enquiryId: result.enquiryId } });
            } else {
                setIsLoading(false);
                alert("Error: " + (result.message || "Failed to save data"));
            }
        } catch (error) {
            console.error("Submit error:", error);
            setIsLoading(false);
            alert("Error: " + error.message);
        }
    }

    const handleUploadChange = (e) => {
        const files = Array.from(e.target.files);
        setUploads(files);
    };

    const totalMarks = scores.reduce(
        (sum, s) => sum + (parseInt(s.obtained) || 0),
        0
    );

    const percentage =
        totalMarks > 0 ? ((totalMarks / (scores.length * 100)) * 100).toFixed(2) : "";

    // --- ADDED CUTOFF LOGIC START ---
    const calculateCutoff = () => {
        // Get Mathematics mark (index 2)
        const math = parseFloat(scores[2]?.obtained) || 0;
        
        // Get editable subject marks (indices 3, 4, 5) - only count filled subjects
        const optionalSubjects = [];
        for (let i = 3; i <= 5; i++) {
            const mark = parseFloat(scores[i]?.obtained);
            if (!isNaN(mark) && scores[i]?.obtained?.trim() !== '') {
                optionalSubjects.push(mark);
            }
        }

        // Cutoff Formula: average of filled optional subjects + Mathematics
        if (optionalSubjects.length === 0 && math === 0) {
            return "0.00";
        }
        
        const optionalAverage = optionalSubjects.length > 0 
            ? optionalSubjects.reduce((a, b) => a + b, 0) / optionalSubjects.length 
            : 0;
        
        const cutoffValue = optionalAverage + math;
        return cutoffValue.toFixed(2);
    };

    const cutoff = calculateCutoff();
    // --- ADDED CUTOFF LOGIC END ---

    // --- ELIGIBILITY LOGIC START ---
    const calculateEligibility = () => {
        // Get Mathematics mark (index 2)
        const math = parseFloat(scores[2]?.obtained) || 0;
        
        // Get editable subject marks (indices 3, 4, 5) - only count filled subjects
        const filledSubjects = [math];
        for (let i = 3; i <= 5; i++) {
            const mark = parseFloat(scores[i]?.obtained);
            if (!isNaN(mark) && scores[i]?.obtained?.trim() !== '') {
                filledSubjects.push(mark);
            }
        }

        // Eligibility Formula: average of Mathematics + filled optional subjects
        if (filledSubjects.every(m => m === 0)) {
            return "";
        }

        const eligibilityScore = filledSubjects.reduce((a, b) => a + b, 0) / filledSubjects.length;
        return eligibilityScore.toFixed(2);
    };

    const eligibility = calculateEligibility();
    // --- ELIGIBILITY LOGIC END ---

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

    {/* Eligibility */ }
    // const eligibility = parseFloat(cutoff) > 40 ? "Eligible" : "Not Eligible";










    return (
        <>
            {/* Hide native number input spinners for consistent UI */}
            <style>{`
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>
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

            <section id="vocational-scores-form" className="bg-white border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-5 border-b border-gray-200">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                        HSC Vocational Scores
                    </h2>
                </div>

                <div className="p-8 sm:p-10 md:p-12 space-y-10 sm:space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">School Name & Place <span className="text-red-600">*</span></label>
                            <input
                                type="text"
                                name="schoolName"
                                value={schoolName}
                                onChange={(e) => {
                                    setSchoolName(e.target.value.toUpperCase());
                                    if (validationErrors.schoolName) {
                                        setValidationErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.schoolName;
                                            return newErrors;
                                        });
                                    }
                                }}
                                onBlur={handleBlur}
                                placeholder="Enter School Name & Place"
                                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-400"
                                style={{ textTransform: 'uppercase' }}
                                minLength={3}
                                maxLength={60}
                                required
                            />
                            <ValidationError fieldName="schoolName" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Register Number </label>
                            <input
                                type="text"
                                name="registerNumber"
                                value={registerNumber}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    setRegisterNumber(value);
                                    if (validationErrors.registerNumber) {
                                        setValidationErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.registerNumber;
                                            return newErrors;
                                        });
                                    }
                                }}
                                onBlur={handleBlur}
                                placeholder="Enter Register Number"
                                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-400"
                                style={{ textTransform: 'uppercase' }}
                                minLength={3}
                                maxLength={15}
                                required
                            />
                            <ValidationError fieldName="registerNumber" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mt-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Medium of Study <span className="text-red-600">*</span></label>
                            <select
                                value={mediumOfStudy}
                                onChange={(e) => {
                                    setMediumOfStudy(e.target.value);
                                    if (validationErrors.mediumOfStudy) {
                                        setValidationErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.mediumOfStudy;
                                            return newErrors;
                                        });
                                    }
                                }}
                                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-400"
                                required
                            >
                                <option value=""disabled>Select Medium</option>
                                <option value="TAMIL">TAMIL</option>
                                <option value="ENGLISH">ENGLISH</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                            <ValidationError fieldName="mediumOfStudy" />
                            {mediumOfStudy === "OTHER" && (
                                <>
                                    <input
                                        type="text"
                                        name="otherMedium"
                                        value={otherMedium}
                                        onChange={(e) => {
                                            setOtherMedium(e.target.value.toUpperCase());
                                            if (validationErrors.otherMedium) {
                                                setValidationErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.otherMedium;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        onBlur={handleBlur}
                                        placeholder="Please Specify Medium"
                                        className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-400 mt-2"
                                        style={{ textTransform: 'uppercase' }}
                                        minLength={2}
                                        maxLength={30}
                                        required
                                    />
                                    <ValidationError fieldName="otherMedium" />
                                </>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Year of Passing <span className="text-red-600">*</span></label>
                            <select
                                name="yearOfPassing"
                                value={yearOfPassing}
                                onChange={(e) => {
                                    setYearOfPassing(e.target.value);
                                    if (validationErrors.yearOfPassing) {
                                        setValidationErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.yearOfPassing;
                                            return newErrors;
                                        });
                                    }
                                }}
                                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-400"
                                required
                            >
                                <option value="" disabled>Select Year</option>
                                {Array.from({ length: 11 }, (_, i) => 2018 + i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <ValidationError fieldName="yearOfPassing" />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full border border-gray-300 rounded-md">
                            <thead className="bg-gray-100 text-left text-sm">
                                <tr>
                                    <th className="p-3 border">Subject</th>
                                    <th className="p-3 border">Maximum Marks</th>
                                    <th className="p-3 border">Marks Obtained</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scores.map((s, idx) => (
                                    <React.Fragment key={idx}>
                                        <tr className="text-sm">
                                            <td className="p-3 border">
                                                {(idx === 0 || idx === 1 || idx === 2) ? (
                                                    <div className="p-3">{s.subject} </div>
                                                ) : (
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={s.subject}
                                                            onChange={(e) => {
                                                                handleSubjectChange(idx, e.target.value);
                                                                if (validationErrors[`subject${idx + 1}Name`]) {
                                                                    setValidationErrors(prev => {
                                                                        const newErrors = { ...prev };
                                                                        delete newErrors[`subject${idx + 1}Name`];
                                                                        return newErrors;
                                                                    });
                                                                }
                                                            }}
                                                            placeholder="Enter Your Subject *"
                                                            className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 p-3"
                                                            style={{ textTransform: 'uppercase' }}
                                                        />
                                                    </>
                                                )}
                                            </td>
                                            <td className="p-3 border text-center">{s.max}</td>
                                            <td className="p-3 border">
                                                <input
                                                    type="text"
                                                    min="0"
                                                    max="100"
                                                    value={s.obtained}
                                                    onChange={(e) => {
                                                        handleScoreChange(idx, e.target.value);
                                                        if (validationErrors[`subject${idx + 1}`]) {
                                                            setValidationErrors(prev => {
                                                                const newErrors = { ...prev };
                                                                delete newErrors[`subject${idx + 1}`];
                                                                return newErrors;
                                                            });
                                                        }
                                                    }}
                                                    placeholder={idx < 3 ? "Enter Marks" : "Enter Marks"}
                                                    className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 p-3"
                                                />
                                            </td>
                                        </tr>
                                        {(validationErrors[`subject${idx + 1}`] || validationErrors[`subject${idx + 1}Name`]) && (
                                            <tr>
                                                <td colSpan="3" className="px-3 pb-3 border-0">
                                                    {validationErrors[`subject${idx + 1}Name`] && <ValidationError fieldName={`subject${idx + 1}Name`} />}
                                                    {validationErrors[`subject${idx + 1}`] && <ValidationError fieldName={`subject${idx + 1}`} />}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 mt-6">
                        {/* Total Marks */}

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                Total Marks
                            </label>
                            <input
                                type="number"
                                value={totalMarks}
                                readOnly
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                    e.preventDefault();
                                  }
                                }}
                                onWheel={(e) => e.target.blur()}
                                className="w-full border-gray-300 bg-gray-100 p-3"
                            />
                        </div>
                        {/* Percentage */}

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                Percentage
                            </label>
                            <input
                                type="number"
                                value={percentage}
                                readOnly
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                    e.preventDefault();
                                  }
                                }}
                                onWheel={(e) => e.target.blur()}
                                className="w-full border-gray-300 bg-gray-100 p-3"
                            />
                        </div>
                        {/* Cutoff */}

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                CutOff
                            </label>
                            <input
                                type="number"
                                value={cutoff}
                                readOnly
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                    e.preventDefault();
                                  }
                                }}
                                onWheel={(e) => e.target.blur()}
                                className="w-full border-gray-300 bg-gray-100 p-3 font-bold text-blue-600"
                            />
                        </div>
                        {/* Eligiblity */}

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                Engineering Eligiblity
                            </label>
                            <input
                                type="number"
                                value={eligibility}
                                readOnly
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                    e.preventDefault();
                                  }
                                }}
                                onWheel={(e) => e.target.blur()}
                                className="w-full border-gray-300 bg-gray-100 p-3 font-bold text-blue-600"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="mt-6 flex justify-end items-center gap-4">
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 cursor-pointer"
                            onClick={handleNavigate}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
};

export default VocationalScores;

