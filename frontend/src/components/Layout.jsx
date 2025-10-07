import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, User, Settings, GraduationCap, BookOpen, Users, Calendar, Award, BarChart3, Home, Clock, Shield, UserCheck, Bell, FileText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Button from './Button'

const Layout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  
  // Close menus when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getUserDisplayName = () => {
    return user?.name || user?.email || 'User'
  }

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'teacher':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'student':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Navigation items based on user role - memoized to prevent re-renders
  const navigationItems = useMemo(() => {
    const currentPath = location.pathname
    
    if (user?.role === 'admin') {
      return [
        {
          name: 'Dashboard',
          href: '/admin-dashboard',
          icon: Home,
          current: currentPath === '/admin-dashboard' || currentPath === '/admin-dashboard/'
        },
        {
          name: 'Students',
          href: '/admin-dashboard/students',
          icon: Users,
          current: currentPath === '/admin-dashboard/students'
        },
        {
          name: 'Teachers',
          href: '/admin-dashboard/teachers',
          icon: UserCheck,
          current: currentPath === '/admin-dashboard/teachers'
        },
        {
          name: 'Classes',
          href: '/admin-dashboard/classes',
          icon: BookOpen,
          current: currentPath === '/admin-dashboard/classes'
        },
        {
          name: 'Performance',
          href: '/admin-dashboard/performance',
          icon: BarChart3,
          current: currentPath === '/admin-dashboard/performance'
        },
        {
          name: 'Subjects',
          href: '/admin-dashboard/subjects',
          icon: Award,
          current: currentPath === '/admin-dashboard/subjects'
        },
        {
          name: 'Notices',
          href: '/admin-dashboard/notices',
          icon: Bell,
          current: currentPath === '/admin-dashboard/notices'
        }
      ]
    }
    
    if (user?.role === 'teacher') {
      return [
        {
          name: 'Dashboard',
          href: '/teacher',
          icon: Home,
          current: currentPath === '/teacher'
        },
        {
          name: 'My Classes',
          href: '/teacher/classes',
          icon: BookOpen,
          current: currentPath === '/teacher/classes'
        },
        {
          name: 'Schedule',
          href: '/teacher/schedule',
          icon: Clock,
          current: currentPath === '/teacher/schedule'
        },
        {
          name: 'Students',
          href: '/teacher/students',
          icon: Users,
          current: currentPath === '/teacher/students'
        },
        {
          name: 'Attendance',
          href: '/teacher/attendance',
          icon: Calendar,
          current: currentPath === '/teacher/attendance'
        },
        {
          name: 'Exams',
          href: '/teacher/exams',
          icon: Award,
          current: currentPath === '/teacher/exams'
        },
        {
          name: 'Results',
          href: '/teacher/results',
          icon: FileText,
          current: currentPath === '/teacher/results'
        },
        {
          name: 'Performance',
          href: '/teacher/performance',
          icon: BarChart3,
          current: currentPath === '/teacher/performance'
        },
        {
          name: 'Notices',
          href: '/teacher/notices',
          icon: Bell,
          current: currentPath === '/teacher/notices'
        }
      ]
    }

    if (user?.role === 'student') {
      // Student dashboard uses internal tab navigation, not routing
      return []
    }
    
    return []
  }, [user?.role, location.pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Science Point
              </h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor()}`}>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </div>
                <span className="text-gray-700 font-medium">
                  {getUserDisplayName()}
                </span>
              </div>

              {/* Desktop User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <User className="h-5 w-5" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                      <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                      <p className={`text-xs font-medium ${getRoleColor()}`}>
                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                      </p>
                    </div>
                    <div className="px-4 py-2 border-b border-gray-100 hidden sm:block">
                      <p className="text-sm text-gray-600">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                    </div>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                type="button"
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white lg:hidden">
            <div className="px-4 py-3 space-y-2">
              <div className="pb-2 mb-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                <p className={`text-xs font-medium ${getRoleColor()}`}>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </p>
              </div>
              
              {/* Mobile Navigation */}
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.name}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      navigate(item.href)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center space-x-2 transition-colors ${
                      item.current
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </button>
                )
              })}
              
              {navigationItems.length > 0 && <div className="border-t border-gray-200 my-2"></div>}
              
              <button
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Navigation Tabs - Desktop */}
      {navigationItems.length > 0 && (
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 overflow-x-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.name}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      navigate(item.href)
                    }}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      item.current
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    type="button"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              © 2024 Science Point. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm">
              <button
                onClick={() => navigate('/developer')}
                className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                👨‍💻 About Developer
              </button>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Made with ❤️ by Abdullah Al Noman</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout