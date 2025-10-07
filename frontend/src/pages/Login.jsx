import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '../components/Form'
import Button from '../components/Button'
import Card from '../components/Card'
import { Users, GraduationCap, UserCheck } from 'lucide-react'

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    role: 'admin'
  })
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    // In a real app, you'd validate credentials here
    // For demo purposes, we'll just navigate based on role
    navigate(`/${credentials.role}`)
  }

  const roles = [
    { value: 'admin', label: 'Admin', icon: UserCheck, color: 'text-red-600' },
    { value: 'teacher', label: 'Teacher', icon: GraduationCap, color: 'text-blue-600' },
    { value: 'student', label: 'Student', icon: Users, color: 'text-green-600' }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Coaching Center
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              placeholder="Enter your username"
              required
            />

            <Input
              label="Password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              placeholder="Enter your password"
              required
            />

            {/* Role Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {roles.map((role) => {
                  const IconComponent = role.icon
                  return (
                    <label key={role.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={credentials.role === role.value}
                        onChange={(e) => setCredentials({ ...credentials, role: e.target.value })}
                        className="sr-only"
                      />
                      <div className={`flex flex-col items-center p-3 border-2 rounded-lg transition-colors ${
                        credentials.role === role.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <IconComponent className={`h-6 w-6 mb-2 ${role.color}`} />
                        <span className="text-sm font-medium text-gray-900">
                          {role.label}
                        </span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              Demo App - Use any credentials to login
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Login