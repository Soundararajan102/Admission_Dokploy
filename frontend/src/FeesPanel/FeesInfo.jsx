import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Nav from "../Nav";
import PDFPreviewModal from '../AdminPanel/PDFPreviewModal';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const FeeStructure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const applicationData = location.state?.applicationData || {};
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [admissionId, setAdmissionId] = useState("");
  const [scoresData, setScoresData] = useState({}); // Add scoresData state
  const [formData, setFormData] = useState({
    // College Fees
    tuitionFee: 0,
    developmentFee: 0,
    admissionFee: 0,
    cautionDeposit: 0,
    optionalFees: 0,
    // Scholarships
    scStScholarship: 0,
    fgScholarship: 0,
    // Add-ons
    busFee: 0,
    messBill: 0,
    roomRent: 0,
    laundryCharges: 0,
    quota: "Management",
    status: "Pending",
  });

  const [totals, setTotals] = useState({
    subTotal: 0,
    collegeTotal: 0,
    hostelTotal: 0,
    overallTotal: 0,
  });

  // Use scoresData from navigation state if available, otherwise fetch from backend
  useEffect(() => {
    // Check if scoresData was passed from EditApplicationModal
    if (location.state?.scoresData && Object.keys(location.state.scoresData).length > 0) {
      
      setScoresData(location.state.scoresData);
      return;
    }

    // Otherwise fetch from backend
    const fetchStudentScores = async () => {
      if (applicationData.enquiryId) {
        try {
          
          const url = BACKEND_URL + "/api/applications/by-enquiry/" + encodeURIComponent(applicationData.enquiryId);
          
          const response = await fetch(url);
          const responseData = await response.json();
          
          if (responseData && !responseData.detail) {
            setScoresData(responseData);
          } else {
            setScoresData({});
          }
          
        } catch (error) {
          
          setScoresData({});
        }
      }
    };

    fetchStudentScores();
  }, [applicationData.enquiryId, location.state]);

  // Fetch existing fee data from FeesData sheet
  useEffect(() => {
    const fetchFeesData = async () => {
      if (applicationData.enquiryId) {
        try {
          
          const url = BACKEND_URL + "/api/applications/by-enquiry/" + encodeURIComponent(applicationData.enquiryId);
          
          const response = await fetch(url);
          const responseData = await response.json();
          
          if (responseData && !responseData.detail) {
            const feeRecord = responseData;
            
            // Populate form with existing fee data
            const updatedFormData = {
              tuitionFee: feeRecord.tuitionFee || 0,
              developmentFee: feeRecord.developmentFee || 0,
              admissionFee: feeRecord.admissionFee || 0,
              cautionDeposit: feeRecord.cautionDeposit || 0,
              optionalFees: feeRecord.optionalFees || 0,
              scStScholarship: feeRecord.scStScholarship || 0,
              fgScholarship: feeRecord.fgScholarship || 0,
              busFee: feeRecord.busFee || 0,
              messBill: feeRecord.messBill || 0,
              roomRent: feeRecord.roomRent || 0,
              laundryCharges: feeRecord.laundryCharges || 0,
              quota: feeRecord.quota || "Management",
              status: feeRecord.status || "Pending",
            };
            
            setFormData(updatedFormData);
            
          } else {
            
          }
        } catch (error) {
          
          // Continue with empty form if fetch fails
        }
      }
    };

    fetchFeesData();
  }, [applicationData.enquiryId]);

  useEffect(() => {
    const subTotal = Number(formData.tuitionFee) + Number(formData.developmentFee) +
      Number(formData.admissionFee) + Number(formData.cautionDeposit) +
      Number(formData.optionalFees);

    const deductions = Number(formData.scStScholarship) + Number(formData.fgScholarship);
    const collegeTotal = subTotal - deductions;

    const hostelTotal = Number(formData.messBill) + Number(formData.roomRent) +
      Number(formData.laundryCharges);

    const overallTotal = collegeTotal + Number(formData.busFee) + hostelTotal;

    setTotals({ subTotal, collegeTotal, hostelTotal, overallTotal });
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const [selectedDepartment, setSelectedDepartment] = useState("");

  const departments = [
    "AD", "AGRI", "BME", "CSE", "CIVIL", "ECE", "EEE", "IT", "MECH"
  ];

  const handleSubmit = async () => {
    setIsSaving(true);
    
    
    try {
      // Check if status is changing to "Admitted"
      const statusChangingToAdmitted = formData.status === "Admitted" && (applicationData.status !== "Admitted");
      if (statusChangingToAdmitted) {
        
      }
      
      // Prepare data to save (merge applicationData with formData)
      const dataToSave = {
        ...applicationData,
        ...formData,
        // Fee details
        tuitionFee: formData.tuitionFee,
        developmentFee: formData.developmentFee,
        admissionFee: formData.admissionFee,
        cautionDeposit: formData.cautionDeposit,
        optionalFees: formData.optionalFees,
        scStScholarship: formData.scStScholarship,
        fgScholarship: formData.fgScholarship,
        busFee: formData.busFee,
        messBill: formData.messBill,
        roomRent: formData.roomRent,
        laundryCharges: formData.laundryCharges,
        quota: formData.quota,
        status: formData.status,
        // Totals
        feeSubTotal: totals.subTotal,
        feeCollegeTotal: totals.collegeTotal,
        feeHostelTotal: totals.hostelTotal,
        feeOverallTotal: totals.overallTotal,
      };

      // Save to backend via PUT method with JSON body
      const response = await fetch(`${BACKEND_URL}/api/applications/by-enquiry/${applicationData.enquiryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(dataToSave)
      });
      
      const responseData = await response.json();

      if (response.ok) {
        // Update local applicationData with all changes
        Object.assign(applicationData, dataToSave);
        
        // If admission ID was generated, capture it
        if (responseData.admissionId) {
          
          // Update formData with the generated admission ID for display
          setFormData(prev => ({
            ...prev,
            admissionId: responseData.admissionId
          }));
          // Also update applicationData to persist it
          applicationData.admissionId = responseData.admissionId;
        }
        
        
        setShowSuccessModal(true);
      } else {
        
        alert("Failed to save data: " + (responseData.message || "Unknown error"));
      }
    } catch (error) {
      
      alert("Error saving data: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setFormData({ ...formData, status: newStatus });
  };

  return (
    <>
      {/* Internal Style to hide the up/down arrows (spinners) on number inputs */}
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

      <Nav />
      <div className="min-h-screen bg-gray-100 p-8 flex justify-center pb-20">

        <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg overflow-hidden mb-10">

          {/* Header */}
          <div className="bg-[#e91e63] text-white p-4 flex items-center justify-between">
            <div className="flex-1 text-center font-bold text-xl uppercase tracking-wider">
              Fee Structure
            </div>
            <div className="bg-white text-[#e91e63] px-4 py-2 rounded-lg font-bold text-sm uppercase border-2 border-white shadow-md">
              {applicationData.quota || ''}
            </div>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#fce4ec] text-[#e91e63]">
                <th className="p-3 border text-left w-2/3">Particulars (Per Year)</th>
                <th className="p-3 border text-center">Fees Amount (₹)</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {/* Section 1: Basic College Fees */}
              <tr className="bg-pink-50 font-semibold">
                <td colSpan="2" className="p-2 border">College Fees</td>
              </tr>
              {[
                { label: "Tuition Fee", name: "tuitionFee" },
                { label: "Development Fee", name: "developmentFee" },
                { label: "Admission Fee (One Time)", name: "admissionFee" },
                { label: "Caution Deposit (One Time)", name: "cautionDeposit" },
                { label: "Optional Fees (Text Books, Note Books, Lab Manual, Lab Coat, ID, Insurance, etc.)", name: "optionalFees" },
              ].map((item) => (
                <tr key={item.name} className={formData[item.name] && Number(formData[item.name]) > 0 ? "bg-pink-50" : "bg-green-50"}>
                  <td className="p-3 border">{item.label}</td>
                  <td className="p-3 border">
                    <input
                      type="number"
                      name={item.name}
                      min="0"
                      value={formData[item.name]}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                          e.preventDefault();
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      className="w-full p-1 border rounded text-center"
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-green-100 font-bold">
                <td className="p-3 border text-right">Total Sub-Total</td>
                <td className="p-3 border text-center text-blue-700">₹{totals.subTotal}</td>
              </tr>

              {/* Section 2: Deductions (Less -) */}
              <tr className="bg-red-50 font-bold text-red-600">
                <td colSpan="2" className="p-2 border">(Less -) Scholarships</td>
              </tr>
              <tr className={formData.scStScholarship && Number(formData.scStScholarship) > 0 ? "bg-pink-50" : "bg-green-50"}>
                <td className="p-3 border">SC / ST Scholarship (Income &lt; 2.5L)</td>
                <td className="p-3 border">
                  <input type="number" name="scStScholarship" min="0" value={formData.scStScholarship} onChange={handleInputChange} onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); } }} onWheel={(e) => e.target.blur()} className="w-full p-1 border rounded text-center" placeholder="0" />
                </td>
              </tr>
              <tr className={formData.fgScholarship && Number(formData.fgScholarship) > 0 ? "bg-pink-50" : "bg-green-50"}>
                <td className="p-3 border">FG - First Graduate Scholarship</td>
                <td className="p-3 border">
                  <input type="number" name="fgScholarship" min="0" value={formData.fgScholarship} onChange={handleInputChange} onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); } }} onWheel={(e) => e.target.blur()} className="w-full p-1 border rounded text-center" placeholder="0" />
                </td>
              </tr>
              <tr className="bg-gray-800 text-white font-bold">
                <td className="p-3 border text-right uppercase">Total College Fees</td>
                <td className="p-3 border text-center">₹{totals.collegeTotal}</td>
              </tr>

              {/* Section 3: Transportation */}
              <tr className="bg-pink-50 font-bold text-pink-600">
                <td colSpan="2" className="p-2 border">(Plus +) Transportation</td>
              </tr>
              <tr className={formData.busFee && Number(formData.busFee) > 0 ? "bg-pink-50" : "bg-green-50"}>
                <td className="p-3 border font-semibold italic">Bus Fee (Per Year)</td>
                <td className="p-3 border">
                  <input type="number" name="busFee" min="0" value={formData.busFee} onChange={handleInputChange} onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); } }} onWheel={(e) => e.target.blur()} className="w-full p-1 border rounded text-center" placeholder="0" />
                </td>
              </tr>

              {/* Section 4: Hostel Fees */}
              <tr className="bg-pink-50 font-bold text-pink-600">
                <td colSpan="2" className="p-2 border">(Plus +) Boys / Girls Hostel Fee</td>
              </tr>
              {[
                { label: "Mess Bill", name: "messBill" },
                { label: "Room Rent (Normal / Attached / AC)", name: "roomRent" },
                { label: "Laundry Charges", name: "laundryCharges" },
              ].map((item) => (
                <tr key={item.name} className="bg-green-50">
                  <td className="p-3 border">{item.label}</td>
                  <td className="p-3 border">
                    <input type="number" name={item.name} min="0" value={formData[item.name]} onChange={handleInputChange} onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); } }} onWheel={(e) => e.target.blur()} className="w-full p-1 border rounded text-center" placeholder="0" />
                  </td>
                </tr>
              ))}
              <tr className="bg-green-100 font-bold">
                <td className="p-3 border text-right uppercase">Total Hostel Fees</td>
                <td className="p-3 border text-center text-blue-700">₹{totals.hostelTotal}</td>
              </tr>

              {/* Final Overall Total */}
              <tr className="bg-[#e91e63] text-white font-extrabold text-lg">
                <td className="p-4 border text-right uppercase tracking-widest">Overall Fees Payable</td>
                <td className="p-4 border text-center">₹{totals.overallTotal}</td>
              </tr>
            </tbody>
          </table>

          {/* Admission ID Display - Show when status is Admitted and ID exists */}
          {formData.status === "Admitted" && (applicationData.admissionId || formData.admissionId) && (
            <div className="p-4 bg-green-50 border-t-4 border-green-500 border-l-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Admission ID (Registration Number)</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {applicationData.admissionId || formData.admissionId}
                  </p>
                </div>
                <div className="text-green-500">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Status Buttons and Submit Section */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Application Status</label>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={() => handleStatusChange("Admitted")}
                className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all border-2 ${formData.status === "Admitted"
                  ? "bg-green-600 text-white border-green-600 shadow-md transform scale-105"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600"
                  }`}
              >
                Admitted
              </button>
              <button
                onClick={() => handleStatusChange("Pending")}
                className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all border-2 ${formData.status === "Pending"
                  ? "bg-yellow-500 text-white border-yellow-500 shadow-md transform scale-105"
                  : "bg-white text-gray-600 border-gray-200 hover:border-yellow-400 hover:text-yellow-600"
                  }`}
              >
                Pending
              </button>
              <button
                onClick={() => handleStatusChange("cancel")}
                className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all border-2 ${formData.status === "cancel"
                  ? "bg-red-600 text-white border-red-600 shadow-md transform scale-105"
                  : "bg-white text-gray-600 border-gray-200 hover:border-red-400 hover:text-red-600"
                  }`}
              >
                Canceled
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className={`px-8 py-3 text-white font-bold rounded-lg shadow-lg transition duration-300 ${isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                {isSaving ? "Saving..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Data Successfully Stored!</h3>
              <p className="text-gray-600 mb-4">
                Fee information has been saved successfully.
              </p>

              {formData.status === 'Admitted' && admissionId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-1">Admission ID</p>
                  <p className="text-2xl font-bold text-green-700">{admissionId}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/admin');
                  }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setShowPDFPreview(true);
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Preview PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPDFPreview}
        onClose={() => {
          setShowPDFPreview(false);
          navigate('/admin');
        }}
        studentData={applicationData}
        scoresData={scoresData}
        studentName={applicationData.fullName}
      />
    </>
  );
};

export default FeeStructure;