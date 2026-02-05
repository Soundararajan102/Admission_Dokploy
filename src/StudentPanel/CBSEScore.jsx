import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const logo = "/assets/kongunadulogo.png";

const AcademicScores = ({ personalData, setPersonalInfoErrors }) => {
    const navigate = useNavigate();

    const [scores, setScores] = useState([

        { subject: "ENGLISH", max: 100, obtained: "" },
        { subject: "PHYSICS", max: 100, obtained: "" },
        { subject: "CHEMISTRY", max: 100, obtained: "" },
        { subject: "MATHEMATICS", max: 100, obtained: "" },
        { subject: "COMPUTER SCIENCE/BIOLOGY", max: 100, obtained: "" },
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

        if (!trimmedValue && name !== 'otherMedium') {
            return 'This field is required';
        }

        if (name === 'otherMedium' && !trimmedValue) {
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

    const handleNavigate = async () => {
        // STEP 1: Validate required academic fields first
        const errors = {};
        
        if (!schoolName || schoolName.trim() === '') {
            errors.schoolName = 'School Name is required';
        }
        if (!registerNumber || registerNumber.trim() === '') {
            errors.registerNumber = 'Register Number is required';
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

        // Check for academic validation errors
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            // Scroll to first error within this section
            setTimeout(() => {
                const section = document.getElementById('cbse-scores-form');
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

        // Check if all scores are entered
       


        setIsLoading(true);

        try {
            
            // Combine fullName with initial for submission
            const combinedFullName = `${personalData.fullName || ''} ${personalData.initial || ''}`.trim();
            
            // Convert all string fields to uppercase
            const uppercasePersonalData = Object.keys(personalData).reduce((acc, key) => {
                const value = personalData[key];
                acc[key] = typeof value === 'string' ? value.toUpperCase() : value;
                return acc;
            }, {});
            
            // Prepare combined data (personal + scores) - ALL IN UPPERCASE
            const combinedData = {
                action: "submitStudentData",
                // Personal info fields - converted to uppercase
                ...uppercasePersonalData,
                fullName: combinedFullName.toUpperCase(),
                initial: personalData.initial.toUpperCase(),
                motherName: personalData.motherName.toUpperCase(),
                motherOccupation: personalData.motherOccupation.toUpperCase(),
                // Convert all preferences to short form
                preference1: getShortForm(personalData.preference1),
                preference2: getShortForm(personalData.preference2),
                preference3: getShortForm(personalData.preference3),
                preference4: getShortForm(personalData.preference4),
                preference5: getShortForm(personalData.preference5),
                preference6: getShortForm(personalData.preference6),
                preference7: getShortForm(personalData.preference7),
                preference8: getShortForm(personalData.preference8),
                preference9: getShortForm(personalData.preference9),
                // SSLC fields (from PersonalInfo form)
                sslcMarks: personalData.sslcMarks,
                govtSchool: personalData.govtSchool,
                schoolType: personalData.schoolType,
                schoolName: schoolName.toUpperCase(),  // ✅ ADDED: Include schoolName from current form
                // Score fields - all text in uppercase
                courseType: "CBSE",
                registerNumber: registerNumber.toUpperCase(),
                medium: (mediumOfStudy === "Other" ? otherMedium : mediumOfStudy).toUpperCase(),
                yearOfPassing,
                subject2: scores[0].subject.toUpperCase(),
                subject2Marks: scores[0].obtained,
                subject3: scores[1].subject.toUpperCase(),
                subject3Marks: scores[1].obtained,
                subject4: scores[2].subject.toUpperCase(),
                subject4Marks: scores[2].obtained,
                subject5: scores[3].subject.toUpperCase(),
                subject5Marks: scores[3].obtained,
                subject6: scores[4].subject.toUpperCase(),
                subject6Marks: scores[4].obtained,
                totalMarks,
                percentage,
                cutoff,
                eligibility,
                date: new Date().toISOString()
            };


            // Send to Google Apps Script
            const params = new URLSearchParams(combinedData).toString();
            const url = `${GOOGLE_SCRIPT_URL}?${params}`;

            const response = await fetch(url, {
                method: 'GET',
            });

            const result = await response.json();

            if (result.success && result.enquiryId) {
                // Save enquiry ID to localStorage
                localStorage.setItem('enquiryId', result.enquiryId);
                localStorage.setItem('studentName', combinedFullName);
                
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
        const getMark = (subName) => {
            const found = scores.find(s => s.subject === subName);
            return parseFloat(found?.obtained) || 0;
        };

        const math = getMark("MATHEMATICS");
        const physics = getMark("PHYSICS");
        const chemistry = getMark("CHEMISTRY");

        // Engineering Cutoff Formula: Math + (Physics/2) + (Chemistry/2)
        const cutoffValue = math + (physics / 2) + (chemistry / 2);
       
        return cutoffValue > 0 ? cutoffValue.toFixed(2) : "0.00";
    };

    const cutoff = calculateCutoff();
    // --- ADDED CUTOFF LOGIC END ---

    // --- ELIGIBILITY LOGIC START ---
    const calculateEligibility = () => {
        const getMark = (subName) => {
            const found = scores.find(s => s.subject === subName);
            return parseFloat(found?.obtained) || 0;
        };

        const math = getMark("MATHEMATICS");
        const physics = getMark("PHYSICS");
        const chemistry = getMark("CHEMISTRY");

        // Eligibility Formula: (Maths + Physics + Chemistry) / 3
        const eligibilityScore = (math + physics + chemistry) / 3;

        if (math === 0 && physics === 0 && chemistry === 0) {
            return "";
        }

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



    return (
        <>
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

            <section id="cbse-scores-form" className="bg-white border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-5 border-b border-gray-200">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                        CBSE Scores
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
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Register Number <span className="text-red-600">*</span></label>
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
                                <option value="English">ENGLISH</option>
                                <option value="Other">OTHER</option>
                            </select>
                            <ValidationError fieldName="mediumOfStudy" />
                            {mediumOfStudy === "Other" && (
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
                                    <tr key={s.subject} className="text-sm">
                                        <td className="p-3 border">{s.subject}</td>
                                        <td className="p-3 border text-center">{s.max}</td>
                                        <td className="p-3 border">
                                            <input
                                                type=""
                                                min="0"
                                                max="100"
                                                value={s.obtained}
                                                onChange={(e) => handleScoreChange(idx, e.target.value)}
                                                placeholder="Enter Marks"
                                                className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 p-3 "
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 mt-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                Total Marks
                            </label>
                            <input
                                type="number"
                                value={totalMarks}
                                readOnly
                                className="w-full border-gray-300 bg-gray-100 p-3"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                Percentage
                            </label>
                            <input
                                type="number"
                                value={percentage}
                                readOnly
                                className="w-full border-gray-300 bg-gray-100 p-3"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                CutOff
                            </label>
                            <input
                                type="number"
                                value={cutoff} // Corrected: Now displays calculated value
                                readOnly
                                className="w-full border-gray-300 bg-gray-100 p-3 font-bold text-blue-600"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                 Engineering Eligiblity
                            </label>
                            <input
                                type="number"
                                value={eligibility}
                                readOnly
                                // className={`w-full border-gray-300 bg-gray-100 p-3 font-bold ${eligibility.includes('Eligible') && !eligibility.includes('Not') ? 'text-green-600' : 'text-red-600'}`}
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

export default AcademicScores;

