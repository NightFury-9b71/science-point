import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'

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

  // Check if user is logged in on app start - simple check without backend validation
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials) => {
    try {
      setIsLoading(true)
      
      // Real API call
      const response = await apiLogin(credentials)
      
      if (response.success) {
        const { user: userData, token } = response.data
        
        // Store in localStorage
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(userData))
        
        // Update state
        setUser(userData)
        setIsAuthenticated(true)
        
        toast.success(`Welcome back, ${userData.full_name}!`)
        return { success: true, user: userData }
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed. Please try again.')
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    try {
      // Clear storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Clear state
      setUser(null)
      setIsAuthenticated(false)
      
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
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
    isAuthenticated,
    login,
    logout,
    hasPermission
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Real API login function
const apiLogin = async (credentials) => {
  const { email, password } = credentials
  
  const response = await fetch('http://localhost:8000/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: email, // Backend expects username, but we can use email as username
      password: password
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Login failed')
  }
  
  const data = await response.json()
  return {
    success: true,
    data: {
      user: data.user,
      token: data.access_token
    }
  }
}

export default AuthContext