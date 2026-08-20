import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'

// Lazy load components to enable code splitting
const PersonalInfo = lazy(() => import('./StudentPanel/PersonalInfo'))
const AcademicScores = lazy(() => import('./StudentPanel/AcadamicScore'))
const VocationalScores = lazy(() => import('./StudentPanel/Vocational'))
const Sucess = lazy(() => import('./StudentPanel/success'))
const AdminSuccess = lazy(() => import('./AdminPanel/success'))
const DiplomaScores = lazy(() => import('./StudentPanel/DiplomaScores'))
const AdminDashboard = lazy(() => import('./AdminPanel/AdminDashboard'))
const Login = lazy(() => import('./components/Login'))
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'))

// Loading fallback component
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh', 
    width: '100vw',
    backgroundColor: '#ffffff'
  }}>
    <style>
      {`
        @keyframes fillCircle {
          0% { stroke-dashoffset: 534; }
          100% { stroke-dashoffset: 0; }
        }
        .spinner-container {
          position: relative;
          width: 180px;
          height: 180px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .loading-logo {
          width: 90px;
          height: auto;
          z-index: 10;
        }
        .svg-ring {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transform: rotate(-90deg); /* Start from top */
        }
        .loading-text {
          margin-top: 30px;
          font-size: 1.1rem;
          color: #222;
          font-weight: 400;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          letter-spacing: 0.2px;
        }
      `}
    </style>
    <div className="spinner-container">
      <svg className="svg-ring" viewBox="0 0 180 180">
        {/* Background track */}
        <circle cx="90" cy="90" r="85" fill="none" stroke="#e0e0e0" strokeWidth="4" />
        {/* Animated fill (534 is 2 * pi * 85 approx) */}
        <circle cx="90" cy="90" r="85" fill="none" stroke="#b71c1c" strokeWidth="4" 
          strokeDasharray="534" 
          strokeDashoffset="534" 
          style={{ animation: 'fillCircle 1.2s forwards ease-in-out' }} 
        />
      </svg>
      <img src="/assets/logo1.png" alt="Kongunadu Logo" className="loading-logo" />
    </div>
    <div className="loading-text">
      Learn Innovate Explore From Dreams to Success!
    </div>
  </div>
);


function App() {

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path='/login' element={<Login/>} />
        <Route path='/' element={<PersonalInfo/>} />
        <Route path='/HSCInfo' element={<AcademicScores/>} />
        <Route path='/VocationalInfo' element={<VocationalScores/>} />
        <Route path='/success' element={<Sucess/>} />

        {/* Protected AdminPanel Routes */}
        <Route path='/admin' element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path='/application-success' element={
          <ProtectedRoute>
            <AdminSuccess />
          </ProtectedRoute>
        } />

      </Routes>
      
    </Suspense>
  )
}

export default App
