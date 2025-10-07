import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import Button from '../components/Button'
import Card from '../components/Card'
import { Input, Select, TextArea } from '../components/Form'
import { useSubmitAdmission, useClasses } from '../services/queries'

const AdmissionForm = () => {
  const navigate = useNavigate()
  const { data: classes = [] } = useClasses()
  const submitAdmission = useSubmitAdmission()

  const [formData, setFormData] = useState({
    // User data
    user: {
      username: '',
      email: '',
      full_name: '',
      phone: '',
      password: '',
      role: 'student' // Fixed for admission
    },
    // Student data
    roll_number: '',
    parent_name: '',
    parent_phone: '',
    address: '',
    date_of_birth: '',
    class_id: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Transform classes data for select options
  const classOptions = classes.map(cls => ({
    value: cls.id.toString(),
    label: `${cls.name} (Grade ${cls.grade}${cls.section ? ` - ${cls.section}` : ''})`
  }))

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // User validation
    if (!formData.user.username.trim()) {
      newErrors['user.username'] = 'Username is required'
    } else if (formData.user.username.length < 3) {
      newErrors['user.username'] = 'Username must be at least 3 characters'
    }

    if (!formData.user.email.trim()) {
      newErrors['user.email'] = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.user.email)) {
      newErrors['user.email'] = 'Please enter a valid email address'
    }

    if (!formData.user.full_name.trim()) {
      newErrors['user.full_name'] = 'Full name is required'
    }

    if (!formData.user.phone.trim()) {
      newErrors['user.phone'] = 'Phone number is required'
    }

    if (!formData.user.password) {
      newErrors['user.password'] = 'Password is required'
    } else if (formData.user.password.length < 6) {
      newErrors['user.password'] = 'Password must be at least 6 characters'
    }

    // Student validation
    if (!formData.roll_number.trim()) {
      newErrors.roll_number = 'Roll number is required'
    }

    if (!formData.class_id) {
      newErrors.class_id = 'Please select a class'
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    try {
      // Prepare the data for submission
      const submissionData = {
        ...formData,
        class_id: parseInt(formData.class_id),
        date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : null
      }

      await submitAdmission.mutateAsync(submissionData)

      setIsSubmitted(true)
      toast.success('Admission request submitted successfully!')

      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login')
      }, 3000)

    } catch (error) {
      console.error('Admission submission error:', error)
      const errorMessage = error.response?.data?.detail || 'Failed to submit admission request. Please try again.'
      toast.error(errorMessage)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admission Submitted!</h2>
            <p className="text-gray-600">
              Your admission request has been submitted successfully. You will be redirected to the login page shortly.
            </p>
          </div>
          <Button onClick={() => navigate('/login')} className="w-full">
            Go to Login
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-slate-600" />
              <span className="text-xl font-bold text-gray-900">Science Point</span>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Admission Form</h1>
          <p className="text-gray-600">Fill out the form below to apply for admission</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={formData.user.full_name}
                  onChange={(e) => handleInputChange('user.full_name', e.target.value)}
                  error={errors['user.full_name']}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.user.email}
                  onChange={(e) => handleInputChange('user.email', e.target.value)}
                  error={errors['user.email']}
                  required
                />
                <Input
                  label="Phone Number"
                  value={formData.user.phone}
                  onChange={(e) => handleInputChange('user.phone', e.target.value)}
                  error={errors['user.phone']}
                  required
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  error={errors.date_of_birth}
                  required
                />
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Username"
                  value={formData.user.username}
                  onChange={(e) => handleInputChange('user.username', e.target.value)}
                  error={errors['user.username']}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={formData.user.password}
                  onChange={(e) => handleInputChange('user.password', e.target.value)}
                  error={errors['user.password']}
                  required
                />
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Roll Number"
                  value={formData.roll_number}
                  onChange={(e) => handleInputChange('roll_number', e.target.value)}
                  error={errors.roll_number}
                  required
                />
                <Select
                  label="Desired Class"
                  options={classOptions}
                  value={formData.class_id}
                  onChange={(e) => handleInputChange('class_id', e.target.value)}
                  error={errors.class_id}
                  placeholder="Select a class"
                  required
                />
              </div>
            </div>

            {/* Parent/Guardian Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent/Guardian Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Parent/Guardian Name"
                  value={formData.parent_name}
                  onChange={(e) => handleInputChange('parent_name', e.target.value)}
                  error={errors.parent_name}
                />
                <Input
                  label="Parent/Guardian Phone"
                  value={formData.parent_phone}
                  onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                  error={errors.parent_phone}
                />
              </div>
              <div className="mt-4">
                <TextArea
                  label="Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  error={errors.address}
                  rows={3}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <Button
                type="submit"
                className="w-full"
                disabled={submitAdmission.isLoading}
              >
                {submitAdmission.isLoading ? 'Submitting...' : 'Submit Admission Request'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default AdmissionForm