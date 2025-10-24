import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import Logger from '../utils/logger.js'
import config from '../config/index.js'
import tokenManager from '../utils/tokenManager.js'
import TokenExpirationWarning from '../components/modals/TokenExpirationWarning'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [showTokenWarning, setShowTokenWarning] = useState(false)
  const [tokenTimeRemaining, setTokenTimeRemaining] = useState(0)

  // Handle logout when token expires
  const handleLogout = useCallback(() => {
    try {
      const userName = user?.full_name || user?.username || 'User'
      
      // Clear all auth data
      tokenManager.clearAuth()
      
      // Clear state
      setUser(null)
      setIsAuthenticated(false)
      setShowTokenWarning(false)
      
      // Only show goodbye message if not due to expiration
      if (!tokenManager.validateToken().isExpired) {
        toast.success(`Goodbye, ${userName}! 👋`)
      }
    } catch (error) {
      Logger.error('Logout error:', error)
      toast.info('You have been logged out.')
    }
  }, [user])

  // Token monitoring and validation
  const checkTokenStatus = useCallback(() => {
    const tokenStatus = tokenManager.validateToken()
    
    if (!tokenStatus.isValid) {
      // Token is expired or invalid
      if (isAuthenticated) {
        const userName = user?.full_name || user?.username || 'User'
        toast.error(`Your session has expired. Please log in again.`)
        handleLogout()
      }
      return false
    }

    if (tokenStatus.isExpiringSoon && !tokenManager.hasShownExpirationWarning()) {
      // Token is expiring soon, show warning
      setTokenTimeRemaining(tokenStatus.timeRemaining)
      setShowTokenWarning(true)
      tokenManager.markExpirationWarningShown()
    }

    return true
  }, [isAuthenticated, user, handleLogout])

  // Check authentication on app start
  useEffect(() => {
    const checkAuth = () => {
      try {
        const shouldStayLoggedIn = tokenManager.shouldStayLoggedIn()
        
        if (shouldStayLoggedIn) {
          const token = tokenManager.getToken()
          const userData = tokenManager.getUser()
          
          if (token && userData) {
            setUser(userData)
            setIsAuthenticated(true)
            Logger.info('User session restored')
          }
        } else {
          // Clear expired or invalid tokens
          tokenManager.clearAuth()
        }
      } catch (error) {
        Logger.error('Error checking auth:', error)
        tokenManager.clearAuth()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Token monitoring interval
  useEffect(() => {
    if (!isAuthenticated) return

    // Initial check
    checkTokenStatus()

    // Set up interval to check token status every 30 seconds
    const interval = setInterval(() => {
      checkTokenStatus()
    }, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated, checkTokenStatus])

  // Listen for 401 errors from API interceptor
  useEffect(() => {
    const handleAuthError = (event) => {
      if (event.detail.status === 401 && isAuthenticated) {
        Logger.warn('Received 401 error - logging out user')
        toast.error('Your session has expired. Please log in again.')
        handleLogout()
      }
    }

    window.addEventListener('authError', handleAuthError)
    return () => window.removeEventListener('authError', handleAuthError)
  }, [isAuthenticated, handleLogout])

  const login = async (credentials, rememberMe = false) => {
    try {
      setLoginLoading(true)
      
      // Real API call with remember me flag
      const response = await apiLogin(credentials, rememberMe)
      
      if (response.success) {
        const { user: userData, token } = response.data
        
        // Store token and user data with remember me preference
        tokenManager.storeToken(token, userData, rememberMe)
        
        // Update state
        setUser(userData)
        setIsAuthenticated(true)
        
        const welcomeMessage = rememberMe 
          ? `Welcome back, ${userData.full_name || userData.username}! You'll stay signed in for 15 days. 🎉`
          : `Welcome back, ${userData.full_name || userData.username}! 🎉`
        
        toast.success(welcomeMessage)
        return { success: true, user: userData }
      } else {
        throw new Error(response.message || 'Unable to sign in. Please check your credentials.')
      }
    } catch (error) {
      Logger.error('Login error:', error)
      
      // Provide user-friendly error messages
      let errorMessage = 'Something went wrong. Please try again.'
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.'
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Invalid username or password. Please check your credentials and try again.'
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'Access denied. Please contact your administrator for assistance.'
      } else if (error.message.includes('404')) {
        errorMessage = 'Login service not found. Please contact support if this issue persists.'
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error occurred. Please try again in a few moments.'
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network connection issue. Please check your internet and try again.'
      } else if (error.message && !error.message.includes('fetch')) {
        // Use the actual error message if it's meaningful
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoginLoading(false)
    }
  }

  const logout = () => {
    handleLogout()
  }

  // Refresh session (for extending expiring tokens)
  const refreshSession = async () => {
    try {
      const currentToken = tokenManager.getToken()
      if (!currentToken) {
        throw new Error('No token available to refresh')
      }

      // Try to get a new token by calling the auth/me endpoint
      const response = await fetch(`${config.api.baseURL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // If the current token is still valid, we can continue using it
        // In a real implementation, you might want to call a specific refresh endpoint
        const userData = await response.json()
        
        // Update user data and reset warning flag
        setUser(userData)
        tokenManager.storeToken(currentToken, userData, tokenManager.isRememberMeEnabled())
        
        toast.success('Session refreshed successfully!')
        return true
      } else {
        throw new Error('Failed to refresh session')
      }
    } catch (error) {
      Logger.error('Session refresh error:', error)
      toast.error('Failed to refresh session. Please log in again.')
      handleLogout()
      return false
    }
  }

  const updateUser = (updatedUserData) => {
    try {
      // Merge updated data with existing user data
      const currentUserData = user || {}
      const newUserData = { ...currentUserData, ...updatedUserData }
      
      // Update localStorage
      localStorage.setItem(config.auth.userKey, JSON.stringify(newUserData))
      
      // Update state
      setUser(newUserData)
      
      Logger.info('User data updated successfully')
    } catch (error) {
      Logger.error('Error updating user data:', error)
    }
  }

  // Function to check if user has permission for a specific action
  const hasPermission = (requiredRole) => {
    if (!isAuthenticated || !user) return false
    
    // Admin has access to everything
    if (user.role === 'admin') return true
    
    // Check specific role permission
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role)
    }
    
    return user.role === requiredRole
  }

  const value = {
    user,
    isLoading,
    loading: loginLoading, // Use loginLoading for button states
    loginLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    hasPermission,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Token Expiration Warning Modal */}
      <TokenExpirationWarning
        isOpen={showTokenWarning}
        onClose={() => setShowTokenWarning(false)}
        onRefreshSession={refreshSession}
        onLogout={handleLogout}
        timeRemaining={tokenTimeRemaining}
      />
    </AuthContext.Provider>
  )
}

// Real API login function
const apiLogin = async (credentials, rememberMe = false) => {
  const { username, password } = credentials
  
  try {
    const response = await fetch(`${config.api.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
        remember_me: rememberMe
      })
    })
    
    if (!response.ok) {
      let errorMessage = 'Unable to sign in. Please try again.'
      
      try {
        const errorData = await response.json()
        if (response.status === 401) {
          errorMessage = 'Invalid username or password. Please check your credentials.'
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Please contact your administrator.'
        } else if (response.status === 404) {
          errorMessage = 'Login service not available. Please try again later.'
        } else if (response.status >= 500) {
          errorMessage = 'Server is temporarily unavailable. Please try again in a few moments.'
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage
        }
      } catch (parseError) {
        // If we can't parse the error response, use status-based messages
        if (response.status === 401) {
          errorMessage = 'Invalid username or password. Please check your credentials.'
        } else if (response.status >= 500) {
          errorMessage = 'Server is temporarily unavailable. Please try again in a few moments.'
        }
      }
      
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    return {
      success: true,
      data: {
        user: data.user,
        token: data.access_token
      }
    }
  } catch (error) {
    // Handle network errors and other fetch-related issues
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      throw new Error('Unable to connect to the server. Please check your internet connection and try again.')
    }
    // Re-throw API errors as-is
    throw error
  }
}

export default AuthContext