import React from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import PersonalInfo from './StudentPanel/PersonalInfo'
import AcademicScores from './StudentPanel/AcadamicScore'
import VocationalScores from './StudentPanel/Vocational'
import Sucess from './StudentPanel/success'
import AdminSuccess from './AdminPanel/success'
import DiplomaScores from './StudentPanel/DiplomaScores'
import AdminDashboard from "./AdminPanel/AdminDashboard";
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';


function App() {

  return (
    <>
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
      
    </>
  )
}

export default App
