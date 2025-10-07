import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import withAuthGuard from '../components/withAuthGuard'
import AdminOverview from './admin/AdminOverview'
import AdminStudents from './admin/AdminStudents'
import AdminTeachers from './admin/AdminTeachers'
import AdminClasses from './admin/AdminClasses'
import AdminSubjects from './admin/AdminSubjects'
import AdminNotices from './admin/AdminNotices'
import AdminProfile from './admin/AdminProfile'
import AdminSchedule from './admin/AdminSchedule'
import NotFound from './NotFound'
// import  --- IGNORE ---

const AdminDashboard = () => {
  const { user } = useAuth()
  
  // Verify admin authentication
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-yellow-600 mb-2">
            <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-yellow-900 mb-2">Admin Access Required</h3>
          <p className="text-yellow-700">
            You need admin access to view this dashboard. Please contact the administrator.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route index element={<AdminOverview />} />
      <Route path="students" element={<AdminStudents />} />
      <Route path="teachers" element={<AdminTeachers />} />
      <Route path="classes" element={<AdminClasses />} />
      <Route path="subjects" element={<AdminSubjects />} />
      <Route path="notices" element={<AdminNotices />} />
      <Route path="schedule" element={<AdminSchedule />} />
      <Route path="profile" element={<AdminProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

// Wrap the component with authentication guard
export default withAuthGuard(AdminDashboard, ['admin'])

