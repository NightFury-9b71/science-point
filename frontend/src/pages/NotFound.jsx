import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, ArrowLeft, Search, BookOpen, GraduationCap, Clock, Users, Award, Bell, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/Button'

const NotFound = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin-dashboard'
      case 'teacher':
        return '/teacher'
      case 'student':
        return '/student'
      default:
        return '/'
    }
  }

  const getAllAvailablePages = () => {
    const commonPages = [
      { name: 'Home', path: '/', icon: Home, description: 'Return to homepage' },
    ]

    if (!user) {
      return [
        ...commonPages,
        { name: 'Login', path: '/login', icon: BookOpen, description: 'Sign in to your account' }
      ]
    }

    switch (user?.role) {
      case 'admin':
        return [
          ...commonPages,
          { name: 'Admin Dashboard', path: '/admin-dashboard', icon: Home, description: 'Admin overview and stats' },
          { name: 'Manage Students', path: '/admin-dashboard/students', icon: Users, description: 'View and manage students' },
          { name: 'Manage Teachers', path: '/admin-dashboard/teachers', icon: GraduationCap, description: 'View and manage teachers' },
          { name: 'Manage Classes', path: '/admin-dashboard/classes', icon: BookOpen, description: 'View and manage classes' },
          { name: 'Class Schedule', path: '/admin-dashboard/schedule', icon: Clock, description: 'Manage class timetables' },
          { name: 'Subjects', path: '/admin-dashboard/subjects', icon: Award, description: 'Manage subjects and curriculum' },
          { name: 'Notices', path: '/admin-dashboard/notices', icon: Bell, description: 'Create and manage notices' }
        ]
      case 'teacher':
        return [
          ...commonPages,
          { name: 'Teacher Dashboard', path: '/teacher', icon: Home, description: 'Teacher overview and stats' },
          { name: 'My Classes', path: '/teacher/classes', icon: BookOpen, description: 'View your assigned classes' },
          { name: 'My Schedule', path: '/teacher/schedule', icon: Clock, description: 'View your teaching schedule' },
          { name: 'My Students', path: '/teacher/students', icon: Users, description: 'View students in your classes' },
          { name: 'Attendance', path: '/teacher/attendance', icon: Search, description: 'Mark and view attendance' },
          { name: 'Exams', path: '/teacher/exams', icon: Award, description: 'Create and manage exams' },
          { name: 'Results', path: '/teacher/results', icon: Award, description: 'View and enter exam results' }
        ]
      case 'student':
        return [
          ...commonPages,
          { name: 'Student Dashboard', path: '/student', icon: Home, description: 'Your academic overview' }
        ]
      default:
        return commonPages
    }
  }

  const getHelpfulLinks = () => {
    const allPages = getAllAvailablePages()
    if (searchTerm) {
      return allPages.filter(page => 
        page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return allPages.slice(0, 6) // Show top 6 by default
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setShowSuggestions(e.target.value.length > 0)
  }

  const helpfulLinks = getHelpfulLinks()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* 404 Illustration */}
        <div className="relative">
          {/* Large 404 Number */}
          <div className="text-8xl sm:text-9xl font-bold text-blue-200 select-none">
            404
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-4 left-8 animate-bounce">
            <BookOpen className="h-8 w-8 text-blue-400 opacity-60" />
          </div>
          <div className="absolute top-12 right-8 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <GraduationCap className="h-10 w-10 text-indigo-400 opacity-60" />
          </div>
          <div className="absolute bottom-8 left-12 animate-bounce" style={{ animationDelay: '1s' }}>
            <Search className="h-6 w-6 text-purple-400 opacity-60" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Oops! Page Not Found
          </h1>
          <div className="space-y-2">
            <p className="text-lg text-gray-600 max-w-sm mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
            {location.pathname && (
              <p className="text-sm text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded max-w-xs mx-auto break-all">
                {location.pathname}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate(getDashboardPath())}
              className="flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              {user ? 'Dashboard' : 'Home'}
            </Button>
          </div>
        </div>

        {/* Search and Navigation */}
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Search Box */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find What You're Looking For
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search pages, features, or content..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setShowSuggestions(false)
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Page Suggestions */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">
              {searchTerm ? `Search Results (${getHelpfulLinks().length})` : 'Available Pages'}
            </h4>
            {getHelpfulLinks().length > 0 ? (
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {getHelpfulLinks().map((link, index) => {
                  const Icon = link.icon
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(link.path)}
                      className="flex items-start gap-3 p-3 text-left rounded-md hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
                    >
                      <Icon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-900 group-hover:text-blue-900 font-medium">
                          {link.name}
                        </div>
                        <div className="text-sm text-gray-500 group-hover:text-gray-700 mt-0.5">
                          {link.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No pages found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Help */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="text-sm text-gray-600 space-y-2">
            <p className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Still can't find what you're looking for?
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                className="text-blue-600 hover:text-blue-800 underline transition-colors"
                onClick={() => navigate('/')}
              >
                Contact Administrator
              </button>
              <button 
                className="text-blue-600 hover:text-blue-800 underline transition-colors"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
              <button 
                className="text-blue-600 hover:text-blue-800 underline transition-colors"
                onClick={() => navigate('/')}
              >
                Report Issue
              </button>
            </div>
          </div>
        </div>

        {/* EduManage Branding */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <GraduationCap className="h-5 w-5" />
            <span className="font-medium">EduManage</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Coaching Center Management System
          </p>
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => navigate('/developer')}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors underline"
            >
              👨‍💻 Meet the Developer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound