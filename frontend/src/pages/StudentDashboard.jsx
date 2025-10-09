import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import withAuthGuard from '../components/withAuthGuard'

// Import student components
import StudentAttendance from './student/StudentAttendance'
import StudentResults from './student/StudentResults'
import StudentMaterials from './student/StudentMaterials'
import StudentNotices from './student/StudentNotices'
import StudentDashboardOverview from './student/StudentDashboardOverview'
import StudentScheduleView from './student/StudentScheduleView'
import NotFound from './NotFound'

const StudentDashboard = () => {
  const { user } = useAuth()
  
  // Verify student authentication
  if (!user?.student_id && !user?.studentId) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-yellow-600 mb-2">
            <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-yellow-900 mb-2">Student Profile Incomplete</h3>
          <p className="text-yellow-700">
            Your student profile is not properly set up. Please contact the administrator.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<StudentDashboardOverview />} />
      <Route path="/results" element={<StudentResults />} />
      <Route path="/schedule" element={<StudentScheduleView />} />
      <Route path="/notices" element={<StudentNotices />} />
      <Route path="/materials" element={<StudentMaterials />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

// Wrap the component with authentication guard
// eslint-disable-next-line react-refresh/only-export-components
export default withAuthGuard(StudentDashboard, ['student', 'admin'])