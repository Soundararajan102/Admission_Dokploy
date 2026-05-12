import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "@heroicons/react/solid";
import { useAuth } from "../contexts/AuthContext";

import Nav from "../Nav";
import EditApplicationModal from "./EditApplicationModal";
import BusFeeModal from "./BusFeeModal";
import Footer from "../Footer";

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_ADMIN_URL;

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

export default function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [showDeptFilter, setShowDeptFilter] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBusFeeModalOpen, setIsBusFeeModalOpen] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [loadingEditId, setLoadingEditId] = useState(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Fetch all applications
  const fetchApplications = async () => {
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL);
      const data = await res.json();
      
      // Ensure data is an array, not an error object
      if (Array.isArray(data)) {
        // Reverse to show latest submissions first (stack/LIFO method)
        const reversedData = data.reverse();
        setApplications(reversedData);
        return reversedData;
      } else if (data && data.error) {
        setApplications([]);
        return [];
      } else {
        setApplications([]);
        return [];
      }
    } catch (err) {
      setApplications([]);
      return [];
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApps = Array.isArray(applications) ? applications.filter((app) => {
    // Search filter (only apply if there's a search term)
    const matchesSearch = search === "" || 
      (app.fullName && app.fullName.toLowerCase().includes(search.toLowerCase())) ||
      (app.email && app.email.toLowerCase().includes(search.toLowerCase())) ||
      (app.enquiryId && app.enquiryId.toLowerCase().includes(search.toLowerCase())) ||
      (app.admissionId && app.admissionId.toLowerCase().includes(search.toLowerCase())) ||
      (app.firstPreference && app.firstPreference.toLowerCase().includes(search.toLowerCase())) ||
      (app.preference1 && app.preference1.toLowerCase().includes(search.toLowerCase())) ||
      (app.department && app.department.toLowerCase().includes(search.toLowerCase()));
    
    // Handle different filter statuses
    let matchesStatus = true;
    if (filterStatus === "All") {
      matchesStatus = true;
    } else if (filterStatus === "AdmittedList") {
      // Admitted List: Show all applications that have admission ID (ever admitted)
      matchesStatus = app.admissionId && app.admissionId.trim() !== "";
    } else if (filterStatus === "Live") {
      // Live: Show only currently admitted students
      matchesStatus = app.status === "Admitted";
    } else {
      // For other statuses (Pending, cancel)
      matchesStatus = app.status === filterStatus;
    }
    
    // Department filter
    const appDept = app.firstPreference || app.preference1 || app.department || "";
    const matchesDepartment = selectedDepartments.length === 0 || 
      selectedDepartments.some(dept => appDept.toLowerCase().includes(dept.toLowerCase()));
    
    return matchesSearch && matchesStatus && matchesDepartment;
  }) : [];

  // Extract unique departments from applications
  const allDepartments = Array.from(new Set(
    applications.map(app => app.firstPreference || app.preference1 || app.department)
      .filter(dept => dept && dept.trim() !== "")
  )).sort();

  // Toggle department selection
  const toggleDepartment = (dept) => {
    setSelectedDepartments(prev => 
      prev.includes(dept) 
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    );
  };

  const clearDepartmentFilter = () => {
    setSelectedDepartments([]);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredApps.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEntries = filteredApps.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, selectedDepartments, entriesPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Dynamic counts
  const totalCount = applications.length;
  const registeredCount = totalCount; // All data coming in are registered students
  const AdmittedCount = applications.filter(app => app.admissionId && app.admissionId !== "").length; // Ever admitted (has admission ID)
  const LiveCount = applications.filter(app => app.status === "Admitted").length; // Currently admitted students
  const PendingCount = applications.filter(app => app.status === "Pending").length;
  const cancelCount = applications.filter(app => app.status === "cancelled").length;

  const handleApplicationClick = () => {
    // Empty for now
  }

  const handleEditClick = async (app) => {
    setLoadingEditId(app.enquiryId || app.email);
    
    // Fetch fresh data from Google Sheet
    const freshData = await fetchApplications();
    
    // Find the updated application by enquiryId or email
    const updatedApp = freshData.find(a => 
      a.enquiryId === app.enquiryId || a.email === app.email
    );
    
    // Set the updated app and open modal
    setCurrentApp(updatedApp || app);
    setIsModalOpen(true);
    setLoadingEditId(null);
  }

  const handleViewClick = (app) => {
    setCurrentApp(app);
    setIsModalOpen(true);
  }

  const handleUpdateSuccess = (updatedData) => {
 
    // Refresh the applications list from server to get latest data
    // This ensures status, admission ID, and all fee information are current
    setTimeout(() => {
      fetchApplications();
    }, 500); // Small delay to ensure backend has committed all changes
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentApp(null);
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Top Navigation / Logo Bar */}
      <Nav/>
      {/* <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center space-x-4">
          <img src={logo} alt="KNCET Logo" className="h-12 w-auto" />
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">
            Kongunadu College of Engineering and Technology
          </h1>
          
        </div>
      </nav> */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-8">
          {/* Dashboard Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
            <div onClick={handleApplicationClick} className="cursor-pointer group">
              <h1 className="text-3xl font-extrabold text-blue-900 group-hover:text-blue-700 transition-colors tracking-tight">Admission Dashboard</h1>
              <p className="text-gray-500 mt-1">
                Manage and review student applications 
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
              <span className="text-sm text-gray-400">|</span>
              <div className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">
                Total: <span className="font-bold text-gray-900">{totalCount}</span>
              </div>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <>
              <div
                onClick={(e) => { e.stopPropagation(); setFilterStatus("All"); }}
                className={`bg-white p-6 rounded-2xl shadow-sm border ${filterStatus === "All" ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-100"} flex items-center space-x-4 transition-all hover:translate-y-[-2px] cursor-pointer hover:shadow-md`}
              >
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Registered Students</p>
                  <p className="text-2xl font-bold text-gray-900">{registeredCount}</p>
                </div>
              </div>

              <div
                onClick={(e) => { e.stopPropagation(); setFilterStatus("Pending"); }}
                className={`bg-white p-6 rounded-2xl shadow-sm border ${filterStatus === "Pending" ? "border-yellow-500 ring-2 ring-yellow-200" : "border-gray-100"} flex items-center space-x-4 transition-all hover:translate-y-[-2px] cursor-pointer hover:shadow-md`}
              >
                <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{PendingCount}</p>
                </div>
              </div>

              <div
                onClick={(e) => { e.stopPropagation(); setFilterStatus("AdmittedList"); }}
                className={`bg-white p-6 rounded-2xl shadow-sm border ${filterStatus === "AdmittedList" ? "border-green-500 ring-2 ring-green-200" : "border-gray-100"} flex items-center space-x-4 transition-all hover:translate-y-[-2px] cursor-pointer hover:shadow-md`}
              >
                <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Admitted List</p>
                  <p className="text-2xl font-bold text-green-600">{AdmittedCount}</p>
                </div>
              </div>

              <div
                onClick={(e) => { e.stopPropagation(); setFilterStatus("Live"); }}
                className={`bg-white p-6 rounded-2xl shadow-sm border ${filterStatus === "Live" ? "border-emerald-500 ring-2 ring-emerald-200" : "border-gray-100"} flex items-center space-x-4 transition-all hover:translate-y-[-2px] cursor-pointer hover:shadow-md`}
              >
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Live</p>
                  <p className="text-2xl font-bold text-emerald-600">{LiveCount}</p>
                </div>
              </div>

              <div
                onClick={(e) => { e.stopPropagation(); setFilterStatus("cancelled"); }}
                className={`bg-white p-6 rounded-2xl shadow-sm border ${filterStatus === "cancelled" ? "border-red-500 ring-2 ring-red-200" : "border-gray-100"} flex items-center space-x-4 transition-all hover:translate-y-[-2px] cursor-pointer hover:shadow-md`}
              >
                <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">{cancelCount}</p>
                </div>
              </div>
            </>
          </div>

          {/* Search and Table Section */}
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search Student Name, Enquiry ID, Admission ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border-gray-200 pl-11 pr-4 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm placeholder:text-gray-400"
                />
                <SearchIcon className="w-5 h-5 text-gray-400 absolute left-4 top-2.5" />
              </div>

              <div className="flex items-center space-x-3 text-sm text-gray-500">
                {/* Bus Fee Button */}
                <button
                  onClick={() => setIsBusFeeModalOpen(true)}
                  className="flex items-center space-x-2 hover:text-blue-600 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50 border border-gray-200 hover:border-blue-300 shadow-sm bg-white font-medium"
                >
                  <span>Bus Fee</span>
                </button>
                {/* Department Filter Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowDeptFilter(!showDeptFilter)}
                    className="flex items-center space-x-2 hover:text-blue-600 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50 border border-gray-200 hover:border-blue-300 shadow-sm bg-white font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    <span>Department</span>
                    {selectedDepartments.length > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {selectedDepartments.length}
                      </span>
                    )}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showDeptFilter && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                        <span className="font-bold text-gray-700 text-sm">Filter by Department</span>
                        {selectedDepartments.length > 0 && (
                          <button 
                            onClick={clearDepartmentFilter}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="p-2">
                        {allDepartments.length === 0 ? (
                          <div className="text-center text-gray-400 py-4 text-sm">No departments found</div>
                        ) : (
                          allDepartments.map((dept, idx) => (
                            <label 
                              key={idx}
                              className="flex items-center space-x-3 px-3 py-2.5 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors group"
                            >
                              <input
                                type="checkbox"
                                checked={selectedDepartments.includes(dept)}
                                onChange={() => toggleDepartment(dept)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-sm text-gray-700 group-hover:text-blue-700 font-medium flex-1">
                                {dept}
                              </span>
                              <span className="text-xs text-gray-400 font-medium">
                                {applications.filter(app => 
                                  (app.firstPreference || app.preference1 || app.department) === dept
                                ).length}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Student Details</th>
                    <th className="px-6 py-4">Enquiry ID</th>
                    <th className="px-6 py-4">Admission ID</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Quota</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Submitted</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {currentEntries.map((app, idx) => (
                    <tr key={(app.enquiryId || app.email) + '-' + idx} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-5 py-5">
                        <div className="flex items-center">
                          {/* <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {(app.fullName && app.fullName.charAt(0)) || "?"}
                          </div> */}
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">{app.fullName || "No Name"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="font-mono text-xm font-bold text-gray-400 bg-gray-150 px-4 py-1 rounded-md border border-gray-200">
                          {app.enquiryId || "N/A"}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <span className="font-mono text-xl font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-md border border-green-100">
                          {app.admissionId || "N/A"}
                        </span>
                      </td>
                      <td className="px-11 py-5">
                        <div className="text-xm font-medium px-2.0 py-1">{app.firstPreference || app.preference1 || app.department || "N/A"}</div>
                      </td>
                      <td className="px-9 py-5">
                        <span className="text-xm font-medium px-2.0 py-1">
                          {(app.quota === 'MQ' || app.quota === 'Management') ? 'MQ' : (app.quota === 'GQ' || app.quota === 'Government') ? 'GQ' : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`flex items-center text-xs font-bold ${app.status === "Admitted" ? "text-green-600 bg-green-50 border-green-100" :
                          app.status === "Pending" ? "text-yellow-600 bg-yellow-50 border-yellow-100" :
                            app.status === "cancelled" ? "text-red-600 bg-red-50 border-red-100" :
                              "text-blue-600 bg-blue-50 border-blue-100"
                          } px-2 py-1 rounded-full w-max border`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${app.status === "Admitted" ? "bg-green-500" :
                            app.status === "Pending" ? "bg-yellow-500" :
                              app.status === "cancelled" ? "bg-red-500" :
                                "bg-blue-500"
                            } mr-2 animate-pulse`}></span>
                          {app.status}
                        </span>
                      </td>


                      <td className="px-6 py-5 text-sm text-gray-500 font-medium">{formatDate(app.applicationDate || app.date)}</td>


                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center space-x-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors border ${
                              loadingEditId === (app.enquiryId || app.email)
                                ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                                : 'text-yellow-600 hover:bg-yellow-100 border border-transparent hover:border-yellow-200'
                            }`}
                            title={loadingEditId === (app.enquiryId || app.email) ? "Loading..." : "Edit"}
                            onClick={() => handleEditClick(app)}
                            disabled={loadingEditId === (app.enquiryId || app.email)}
                          >
                            {loadingEditId === (app.enquiryId || app.email) ? (
                              <>
                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="font-medium">Loading...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                <span className="font-medium">Edit</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <p className="text-xs text-gray-400 font-medium tracking-tight">
                  Showing <span className="text-gray-600 font-bold">{startIndex + 1}</span> to <span className="text-gray-600 font-bold">{Math.min(endIndex, filteredApps.length)}</span> of <span className="text-gray-600 font-bold">{filteredApps.length}</span> entries
                </p>
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-500 font-medium">Show:</label>
                  <select
                    value={entriesPerPage}
                    onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-xs text-gray-500 font-medium">entries</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-400'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex space-x-1 px-2">
                  {getPageNumbers().map((page, idx) => (
                    page === '...' ? (
                      <span key={`ellipsis-${idx}`} className="text-gray-300 self-end px-1">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-400'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      {/* Bus Fee Modal */}
      {isBusFeeModalOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900 opacity-50 pointer-events-none"></div>
      )}
      <BusFeeModal isOpen={isBusFeeModalOpen} onClose={() => setIsBusFeeModalOpen(false)} />
      </main>

      {/* Edit Application Modal */}
      <EditApplicationModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        applicationData={currentApp}
        onUpdateSuccess={handleUpdateSuccess}
      />
      
      <Footer />
    </div>
  );
}