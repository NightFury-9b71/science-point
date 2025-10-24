import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Custom hook for safe navigation that handles mobile back navigation issues
 * Provides a fallback route when history.back() is not available or fails
 */
export const useSafeNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

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

  const getDefaultFallback = () => {
    // Check if we came from a specific route
    const fromPath = location.state?.from?.pathname
    if (fromPath && fromPath !== location.pathname) {
      return fromPath
    }
    
    // Get appropriate dashboard based on user role
    return getDashboardPath()
  }

  /**
   * Safe back navigation that works reliably on mobile devices
   * @param {string} fallbackPath - Optional fallback path if back navigation fails
   */
  const goBack = (fallbackPath = null) => {
    const fallback = fallbackPath || getDefaultFallback()
    
    // Check if there's actual history to go back to
    if (window.history.length > 1) {
      try {
        // For mobile compatibility, we'll use a combination approach
        const canGoBack = document.referrer && document.referrer !== window.location.href
        
        if (canGoBack) {
          // Use navigate(-1) for React Router managed navigation
          navigate(-1)
        } else {
          // No valid history, go to fallback
          navigate(fallback, { replace: true })
        }
      } catch (error) {
        console.warn('Navigation error, using fallback:', error)
        navigate(fallback, { replace: true })
      }
    } else {
      // No history available, go to fallback
      navigate(fallback, { replace: true })
    }
  }

  /**
   * Navigate to dashboard based on user role
   */
  const goToDashboard = () => {
    navigate(getDashboardPath())
  }

  /**
   * Navigate to home page
   */
  const goHome = () => {
    navigate('/')
  }

  /**
   * Safe navigation with error handling
   * @param {string} path - Path to navigate to
   * @param {object} options - Navigation options
   */
  const safeNavigate = (path, options = {}) => {
    try {
      navigate(path, options)
    } catch (error) {
      console.error('Navigation error:', error)
      // Fallback to dashboard or home
      navigate(getDashboardPath(), { replace: true })
    }
  }

  return {
    goBack,
    goToDashboard,
    goHome,
    safeNavigate,
    getDashboardPath,
  }
}
