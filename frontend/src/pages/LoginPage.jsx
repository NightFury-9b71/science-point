import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/Button'
import Card from '../components/Card'
import Form from '../components/Form'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login, loading } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email.trim()) {
      newErrors.email = 'Username or email is required'
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const result = await login(formData)
      if (result.success) {
        // Navigate based on user role from backend
        const userRole = result.user.role
        switch (userRole) {
          case 'admin':
            navigate('/admin-dashboard')
            break
          case 'teacher':
            navigate('/teacher')
            break
          case 'student':
            navigate('/student')
            break
          default:
            navigate('/dashboard')
        }
      }
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const demoCredentials = {
    admin: { email: 'admin', password: 'admin123' },
    teacher: { email: 'math_teacher', password: 'teacher123' },
    student: { email: 'student001', password: 'student123' }
  }

  const fillDemoCredentials = (role) => {
    const credentials = demoCredentials[role]
    setFormData({
      email: credentials.email,
      password: credentials.password
    })
    setErrors({})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Science Point</span>
            </Link>
            <Link to="/">
              <Button variant="outline">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Login Card */}
          <Card className="p-8">
            <div className="text-center mb-8">
              <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-600 mt-2">Sign in to your account</p>
            </div>

            <Form onSubmit={handleSubmit} className="space-y-6">

              {/* Email/Username Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="text"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your username or email"
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center mt-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center mt-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button type="button" className="text-sm text-blue-600 hover:text-blue-500">
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Form>

            {/* Demo Credentials */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center mb-4">
                Demo Credentials (Click to auto-fill):
              </p>
              <div className="space-y-2">
                {Object.entries(demoCredentials).map(([role, credentials]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => fillDemoCredentials(role)}
                    className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                  >
                    <div className="font-medium text-gray-900 capitalize">{role}</div>
                    <div className="text-gray-600">Username: {credentials.email}</div>
                    <div className="text-gray-500 text-xs">Password: {credentials.password}</div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Footer Links */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button className="text-blue-600 hover:text-blue-500 font-medium">
                Contact your administrator
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage