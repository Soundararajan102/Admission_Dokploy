import React from "react";
const Logo = "/assets/kongunadulogo.png";
import { useLocation } from "react-router-dom";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Nav from "../Nav";
import Footer from "../Footer";

const Sucess = () => {
    const location = useLocation();
    const [showToast, setShowToast] = React.useState(false);
    const [admissionId, setAdmissionId] = React.useState("");
    const [studentStatus, setStudentStatus] = React.useState("");
    const [studentData, setStudentData] = React.useState(null);

    const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_SCORES_URL;

    React.useEffect(() => {
        setShowToast(true);
        const timer = setTimeout(() => {
            setShowToast(false);
        }, 5000); // Hide after 5 seconds

        // Fetch student data to get admission ID and status
        const enquiryId = location.state?.enquiryId;
        if (enquiryId) {
            fetch(GOOGLE_SCRIPT_URL + "?action=getPersonalInfo&enquiryId=" + encodeURIComponent(enquiryId))
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data) {
                        setAdmissionId(data.data.admissionId || "");
                        setStudentStatus(data.data.status || "");
                        setStudentData(data.data);
                    }
                })
                .catch(error => console.error("Error fetching student data:", error));
        }

        return () => clearTimeout(timer);
    }, [location.state?.enquiryId]);

    const handleHome = () => {
        window.location.href = "/";
    }

    const handleDownloadReceipt = () => {
        // Always prioritize localStorage for receipt as it has the latest submitted data
        const localStorageData = JSON.parse(localStorage.getItem('submittedFormData') || '{}');
        const formData = localStorageData;
        const enquiryId = location.state?.enquiryId || localStorage.getItem('enquiryId') || '';
        
        

        // Department mapping from short to full names
        const departmentMap = {
            'AD': 'B.Tech - Artificial Intelligence and Data Science Engineering (AD)',
            'AG': 'B.Tech - Agricultural Engineering (AG)',
            'BME': 'B.E - Bio-Medical Engineering (BME)',
            'CSE': 'B.E - Computer Science and Engineering (CSE)',
            'CIVIL': 'B.E - Civil Engineering (CIVIL)',
            'ECE': 'B.E - Electronics and Communication Engineering (ECE)',
            'EEE': 'B.E - Electrical and Electronics Engineering (EEE)',
            'IT': 'B.Tech - Information Technology (IT)',
            'MECH': 'B.E - Mechanical Engineering (MECH)',
        };

        // Function to get full department name
        const getFullDepartmentName = (deptValue) => {
            if (!deptValue || deptValue === 'N/A' || deptValue.trim() === '') return null;
            
            // If it's already a full name (contains 'B.Tech' or 'B.E'), return as is
            if (deptValue.includes('B.Tech') || deptValue.includes('B.E')) {
                return deptValue;
            }
            
            // Otherwise, treat it as a short code and convert
            return departmentMap[deptValue] || deptValue;
        };

        // Function to get full quota name
        const getFullQuotaName = (quota) => {
            if (quota === 'MQ') return 'Management Quota';
            if (quota === 'GQ') return 'Government Quota';
            return quota;
        };

        const doc = new jsPDF();

        // Add college logo on top left
        const logoImg = new Image();
        logoImg.src = Logo;
        doc.addImage(logoImg, 'PNG', 15, 8, 25, 25); // x, y, width, height

        // Add college header (shifted right to accommodate logo)
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Kongunadu College of Engineering & Technology', 45, 15);
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Autonomous', 105, 23);
        doc.setFontSize(10);
        doc.text('Namakkal - Trichy Main Road, Thottiapatti (Po), Thottiam Taluk, Trichy Dt. 621 215', 45, 28);

        // Add title
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Admission Enquiry Receipt', 105, 42, { align: 'center' });

        // Draw a line
        doc.line(20, 50, 190, 50);

        let yPosition = 60;

        // Add Enquiry ID centered
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Enquiry ID: ${enquiryId}`, 105, yPosition, { align: 'center' });
        yPosition += 10;

        // Personal Information
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Personal Information', 20, yPosition);
        yPosition += 10;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);

        const personalInfo = [
            ['Full Name', formData.fullName || 'N/A'],
            ['Date of Birth', formData.dob || 'N/A'],
            ['Gender', formData.gender || 'N/A'],
            ['Accommodation', formData.accommodation || 'N/A'],
        ];

        personalInfo.forEach(([label, value]) => {
            if (value !== 'N/A' && value !== '') {
                doc.text(`${label}:`, 20, yPosition);
                doc.text(value, 80, yPosition);
                yPosition += 7;
            }
        });

        // Preferences
        yPosition += 5;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('Department Preferences', 20, yPosition);
        yPosition += 10;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        
        // Dynamically build preferences array - only show filled preferences
        const preferences = [];
        const preferenceLabels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
        
        for (let i = 1; i <= 9; i++) {
            const prefKey = `preference${i}`;
            const prefValue = formData[prefKey];
            
            // Only add if preference exists and is not empty
            if (prefValue && prefValue.trim() !== '' && prefValue !== 'N/A') {
                const fullDeptName = getFullDepartmentName(prefValue);
                // Only add if we got a valid full department name
                if (fullDeptName) {
                    preferences.push([`${preferenceLabels[i-1]} Preference`, fullDeptName]);
                }
            }
        }
        
        // Add Seat Type and Admission Type only if they have values
        if (formData.quota && formData.quota.trim() !== '') {
            preferences.push(['Seat Type', getFullQuotaName(formData.quota)]);
        }
        if (formData.entry && formData.entry.trim() !== '') {
            preferences.push(['Admission Type', formData.entry]);
        }

        preferences.forEach(([label, value]) => {
            doc.text(`${label}:`, 20, yPosition);
            doc.text(value, 80, yPosition);
            yPosition += 7;
        });

        // Footer
        yPosition += 10;
 doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Thank you for choosing Kongunadu College of Engineering and Technology', 105, yPosition, { align: 'center' });
        yPosition += 10;
        
        // Contact information
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('For Any Queries Contact Us', 105, yPosition, { align: 'center' });
        yPosition += 6;
        
        doc.text('Mail Id: admission@kongunadu.ac.in', 105, yPosition, { align: 'center' });
        yPosition += 5;
        
        doc.text('Mobile No:8012505000/76/85/86', 105, yPosition, { align: 'center' });
        yPosition += 10;
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, yPosition, { align: 'center' });

        // Save the PDF
        doc.save(`KNCET_Admission_${formData.fullName || 'Receipt'}.pdf`);
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
                {/* Top Navigation / Logo Bar */}
      
                <Nav/>
               

                <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    {/* Success Content */}
                    <div className="grid justify-center gap-5 text-center py-6 sm:py-9">
                        {/* Toast Notification */}
                        {showToast && (
                            <div className="fixed top-5 right-5 flex items-center w-full max-w-xs p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow-lg dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800 transition-opacity duration-300 ease-in-out border-l-4 border-green-500 animate-slide-in-right z-50">
                                <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
                                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                                    </svg>
                                    <span className="sr-only">Check icon</span>
                                </div>
                                <div className="pl-4 text-sm font-normal text-white font-semibold">Data Saved Successfully!</div>
                                <button type="button" className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" onClick={() => setShowToast(false)} aria-label="Close">
                                    <span className="sr-only">Close</span>
                                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                    </svg>
                                </button>
                            </div>
                        )}


                        <div>
                            <div>
                                <img src={Logo} className="mx-auto w-26 mb-2" alt="Logo" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Submitted Successfully!</h1>
                            <h1 className="text-lg text-gray-600 mb-6">Your admission details have been recorded</h1>

                            <div className="mb-8">
                                <h1 className="text-2xl font-bold text-gray-700 mb-3">Enquiry ID</h1>
                                <input
                                    type="text"
                                    value={location.state?.enquiryId || ""}
                                    readOnly
                                    placeholder="Enquiry ID"
                                    className="p-2 border-2 border-blue-200 rounded-lg font-bold text-2xl text-center text-blue-800 focus:outline-none w-full max-w-xs bg-blue-50"
                                />
                            </div>

                            {studentStatus === "Admitted" && admissionId && (
                                <div className="mb-8">
                                    <h1 className="text-2xl font-bold text-gray-700 mb-3">Admission ID</h1>
                                    <input
                                        type="text"
                                        value={admissionId}
                                        readOnly
                                        placeholder="Admission ID"
                                        className="p-2 border-2 border-green-200 rounded-lg font-bold text-2xl text-center text-green-800 focus:outline-none w-full max-w-xs bg-green-50"
                                    />
                                    <p className="text-green-600 font-semibold mt-2">✓ Admitted Successfully!</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-5">
                                <button
                                    type="button"
                                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-all w-full sm:w-auto"
                                    onClick={handleDownloadReceipt}
                                >
                                    Download Receipt
                                </button>
                                <button
                                    type="button"
                                    className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-all w-full sm:w-auto"
                                    onClick={handleHome}
                                >
                                    Go to Home
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </>
    )
}
export default Sucess;

