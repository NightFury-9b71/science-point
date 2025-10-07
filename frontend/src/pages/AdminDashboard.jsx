import React from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Users, GraduationCap, BookOpen, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import withAuthGuard from '../components/withAuthGuard'
import Button from '../components/Button'
import { useSeedDatabase } from '../services/queries'
import AdminOverview from './admin/AdminOverview'
import AdminStudents from './admin/AdminStudents'
import AdminTeachers from './admin/AdminTeachers'
import AdminClasses from './admin/AdminClasses'
import AdminSubjects from './admin/AdminSubjects'
import AdminNotices from './admin/AdminNotices'
import AdminProfile from './admin/AdminProfile'
import AdminSchedule from './admin/AdminSchedule'

const AdminDashboard = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const seedDatabase = useSeedDatabase()

  const isOverview = location.pathname.includes('/admin') && 
    (location.pathname === '/admin-dashboard' || 
     location.pathname === '/admin-dashboard/' || 
     location.pathname.match(/\/admin-dashboard\/?$/))

  // Show welcome message with user's actual name
  const welcomeMessage = user?.full_name ? `Welcome back, ${user.full_name}!` : 'Welcome back, Administrator!'

  const handleSeedDatabase = async () => {
    try {
      await seedDatabase.mutateAsync()
      toast.success('Database seeded successfully!')
    } catch (error) {
      console.error('Error seeding database:', error)
      toast.error('Failed to seed database. Please try again.')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">{welcomeMessage}</p>
        </div>
        {isOverview && (
          <Button 
            onClick={handleSeedDatabase} 
            variant="secondary"
            loading={seedDatabase.isPending}
            size="sm"
          >
            Seed Database
          </Button>
        )}
      </div>

      {/* Mobile Navigation */}
      {isOverview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 lg:hidden">
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto space-y-2"
            onClick={() => navigate('/admin-dashboard/students')}
          >
            <Users className="h-6 w-6 text-blue-600" />
            <span className="text-xs font-medium">Students</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto space-y-2"
            onClick={() => navigate('/admin-dashboard/teachers')}
          >
            <GraduationCap className="h-6 w-6 text-green-600" />
            <span className="text-xs font-medium">Teachers</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto space-y-2"
            onClick={() => navigate('/admin-dashboard/classes')}
          >
            <BookOpen className="h-6 w-6 text-purple-600" />
            <span className="text-xs font-medium">Classes</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto space-y-2"
            onClick={() => navigate('/admin-dashboard/subjects')}
          >
            <BookOpen className="h-6 w-6 text-orange-600" />
            <span className="text-xs font-medium">Subjects</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto space-y-2"
            onClick={() => navigate('/admin-dashboard/notices')}
          >
            <Calendar className="h-6 w-6 text-red-600" />
            <span className="text-xs font-medium">Notices</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-4 h-auto space-y-2"
            onClick={() => navigate('/admin-dashboard/profile')}
          >
            <Users className="h-6 w-6 text-indigo-600" />
            <span className="text-xs font-medium">Profile</span>
          </Button>
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="hidden lg:block border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => navigate('/admin-dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              isOverview 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          {[
            { key: 'students', label: 'Students', path: '/admin-dashboard/students' },
            { key: 'teachers', label: 'Teachers', path: '/admin-dashboard/teachers' },
            { key: 'classes', label: 'Classes', path: '/admin-dashboard/classes' },
            { key: 'subjects', label: 'Subjects', path: '/admin-dashboard/subjects' },
            { key: 'notices', label: 'Notices', path: '/admin-dashboard/notices' },
            { key: 'schedule', label: 'Schedule', path: '/admin-dashboard/schedule' },
            { key: 'profile', label: 'Profile', path: '/admin-dashboard/profile' }
          ].map((tab) => {
            const isActive = location.pathname === tab.path
            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.path)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Routes */}
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="teachers" element={<AdminTeachers />} />
        <Route path="classes" element={<AdminClasses />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="notices" element={<AdminNotices />} />
        <Route path="schedule" element={<AdminSchedule />} />
        <Route path="profile" element={<AdminProfile />} />
      </Routes>
    </div>
  )
}

// Wrap the component with authentication guard
export default withAuthGuard(AdminDashboard, ['admin'])

