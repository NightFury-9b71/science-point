import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import withAuthGuard from '../components/withAuthGuard'

// Import separated teacher components
import TeacherOverview from './teacher/TeacherOverview'
import TeacherClasses from './teacher/TeacherClasses'
import TeacherStudents from './teacher/TeacherStudents'
import TeacherAttendance from './teacher/TeacherAttendance'
import TeacherExams from './teacher/TeacherExams'
import TeacherResults from './teacher/TeacherResults'
import TeacherSchedule from './teacher/TeacherSchedule'
import NotFound from './NotFound'

const TeacherDashboard = () => {
  const { user } = useAuth()
  
  // Verify teacher authentication
  if (!user || (user.role !== 'teacher' && !user.teacher_id && !user.teacherId)) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-yellow-600 mb-2">
            <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-yellow-900 mb-2">Teacher Access Required</h3>
          <p className="text-yellow-700">
            You need teacher access to view this dashboard. Please contact the administrator.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<TeacherOverview />} />
      <Route path="/classes" element={<TeacherClasses />} />
      <Route path="/students" element={<TeacherStudents />} />
      <Route path="/attendance" element={<TeacherAttendance />} />
      <Route path="/exams" element={<TeacherExams />} />
      <Route path="/results" element={<TeacherResults />} />
      <Route path="/schedule" element={<TeacherSchedule />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default withAuthGuard(TeacherDashboard, ['teacher'])