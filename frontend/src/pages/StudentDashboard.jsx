import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import withAuthGuard from '../components/withAuthGuard'
import {
  User,
  Award,
  BookOpen,
  Bell,
  Calendar,
  FileText,
  BarChart3
} from 'lucide-react'

import Card from '../components/Card'
import Button from '../components/Button'

// Import student components
import StudentProfile from './student/StudentProfile'
import StudentAttendance from './student/StudentAttendance'
import StudentResults from './student/StudentResults'
import StudentMaterials from './student/StudentMaterials'
import StudentNotices from './student/StudentNotices'
import StudentDashboardOverview from './student/StudentDashboardOverview'
import StudentScheduleView from './student/StudentScheduleView'
import NotFound from './NotFound'

const StudentDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

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

  const studentId = user?.student_id || user?.studentId

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'notices', label: 'Notices', icon: Bell },
    { id: 'materials', label: 'Study Materials', icon: FileText }
  ]

  const TabButton = ({ tab, activeTab, onClick }) => {
    const Icon = tab.icon
    return (
      <button
        onClick={() => onClick(tab.id)}
        className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
          activeTab === tab.id
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <Icon className="h-5 w-5" />
        {tab.label}
      </button>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <StudentDashboardOverview studentId={studentId} />
      case 'results':
        return <StudentResults studentId={studentId} />
      case 'schedule':
        return <StudentScheduleView studentId={studentId} />
      case 'notices':
        return <StudentNotices studentId={studentId} />
      case 'materials':
        return <StudentMaterials />
      default:
        return <StudentDashboardOverview studentId={studentId} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name || 'Student'}!</h1>
        <p className="text-blue-100">Here's your learning dashboard</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              activeTab={activeTab}
              onClick={setActiveTab}
            />
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  )
}

// Wrap the component with authentication guard
// eslint-disable-next-line react-refresh/only-export-components
export default withAuthGuard(StudentDashboard, ['student', 'admin'])