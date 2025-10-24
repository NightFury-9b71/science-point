import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle, Plus, Eye, ArrowLeft, Search, Download, FileText, XCircle, AlertCircle, 
  Users, Phone, Edit, KeyRound, User, BookOpen, Hash, Clock, Calendar, Mail, 
  MapPin, Heart, Key, Shield
} from 'lucide-react'
import { toast } from 'sonner'
import Logger from '../../utils/logger.js'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Table from '../../components/Table'
import { Input, Select } from '../../components/Form'
import { ConfirmationModal, CredentialsModal, FormModal, ViewModal } from '../../components/modals'
import { 
  useStudents, 
  useClasses, 
  useTeachers,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useUpdateStudentPassword
} from '../../services/queries'

const AdminStudents = () => {
  const navigate = useNavigate()
  const { data: students, isLoading } = useStudents()
  const { data: classes } = useClasses()
  const { data: teachers } = useTeachers() // Add teachers data for username generation
  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()
  const deleteStudent = useDeleteStudent()
  const updateStudentPassword = useUpdateStudentPassword()
  
  const [showModal, setShowModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [newStudentCredentials, setNewStudentCredentials] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [editForm, setEditForm] = useState(null)  // Filter and sort students

  const handleFieldChange = (fieldName, value, newFormData) => {
    if (fieldName === 'class_id' && value && classes) {
      const rollNumber = generateRollNumber(value)
      if (rollNumber) {
        // Update the roll_number in the newFormData
        newFormData.roll_number = rollNumber
      }
    }
  }
  const filteredStudents = (students || [])
    .filter(student => {
      const matchesSearch = !searchQuery || 
        student.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.parent_name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesClass = !selectedClass || student.class_id === parseInt(selectedClass)
      
      return matchesSearch && matchesClass
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.user?.full_name || '').localeCompare(b.user?.full_name || '')
        case 'roll':
          return (a.roll_number || '').localeCompare(b.roll_number || '')
        case 'class':
          return a.class_id - b.class_id
        default:
          return 0
      }
    })

  // Generate secure password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Auto-generate unique username from full name
  const generateUsername = (fullName) => {
    try {
      if (!fullName || typeof fullName !== 'string') return ''
      
      const cleanName = fullName.toLowerCase().replace(/[^a-z\s]/g, '').trim()
      const words = cleanName.split(/\s+/).filter(word => word.length > 0)
      
      if (words.length === 0) return `user${Math.floor(Math.random() * 10000)}`
    
      let baseUsername = ''
      if (words.length === 1) {
        baseUsername = words[0]
      } else {
        // Take first name + last name initial
        const firstName = words[0]
        const lastInitial = words[words.length - 1].charAt(0)
        baseUsername = firstName + lastInitial
      }
      
      // Get all existing usernames from students and teachers
      const existingUsernames = new Set()
      
      // Add student usernames
      if (students) {
        students.forEach(student => {
          if (student.user?.username) {
            existingUsernames.add(student.user.username.toLowerCase())
          }
        })
      }
      
      // Add teacher usernames  
      if (teachers) {
        teachers.forEach(teacher => {
          if (teacher.user?.username) {
            existingUsernames.add(teacher.user.username.toLowerCase())
          }
        })
      }
      
      // Check if base username is unique, also check full first+last combination
      let uniqueUsername = baseUsername
      let counter = 1
      
      // Also check full name combinations that might conflict
      const fullNameUsername = words.length > 1 ? words[0] + words[words.length - 1] : baseUsername
      if (existingUsernames.has(fullNameUsername.toLowerCase()) && baseUsername !== fullNameUsername) {
        // If full name combo exists, start with base + number
        uniqueUsername = `${baseUsername}1`
        counter = 2
      }
      
      while (existingUsernames.has(uniqueUsername.toLowerCase())) {
        uniqueUsername = `${baseUsername}${counter}`
        counter++
      }
      
      return uniqueUsername
    } catch (error) {
      Logger.error('Error generating username:', error)
      return `user${Math.floor(Math.random() * 10000)}`
    }
  }

  // Auto-generate short, unique roll number based on class and existing students
  const generateRollNumber = (classId) => {
    if (!classId) return ''
    
    const numericClassId = parseInt(classId)
    if (isNaN(numericClassId)) return ''
    
    // Get students in the same class (handle case when students is not loaded yet)
    const classStudents = students ? students.filter(student => student.class_id === numericClassId) : []
    
    // Find the class details for short prefix
    const selectedClass = classes?.find(cls => cls.id === numericClassId)
    if (!selectedClass) return ''
    
    // Create short class prefix (grade + section initial)
    const grade = selectedClass.grade || 10
    const section = selectedClass.section || 'A'
    const sectionInitial = section.charAt(0).toUpperCase()
    const shortPrefix = `${grade}${sectionInitial}`
    
    // Get all existing roll numbers in this class that match our pattern
    const existingRolls = classStudents
      .map(student => {
        const rollStr = student.roll_number || ''
        // Extract number from patterns like "10A01", "10A1", "10A-01", etc.
        const match = rollStr.match(/(\d+)$/) // Get trailing numbers only
        return match ? parseInt(match[1]) : 0
      })
      .filter(roll => !isNaN(roll) && roll > 0)
    
    // Find the next available roll number (starting from 1)
    let nextRoll = 1
    while (existingRolls.includes(nextRoll)) {
      nextRoll++
    }
    
    // Format: Grade + Section + 2-digit number (e.g., "10A01", "10A02")
    return `${shortPrefix}${nextRoll.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (formData) => {
    try {
      // Validation checks
      if (!formData.user?.full_name?.trim()) {
        toast.error('Full name is required')
        return
      }
      if (!formData.user?.phone?.trim()) {
        toast.error('Phone number is required')
        return
      }
      if (!formData.roll_number?.trim()) {
        toast.error('Roll number is required')
        return
      }
      if (!formData.class_id) {
        toast.error('Class selection is required')
        return
      }
      if (!formData.parent_phone?.trim()) {
        toast.error('Parent phone number is required')
        return
      }

      // Format the form data properly
      const submissionData = {
        user: {
          username: formData.roll_number.trim(), // Use roll number as username
          full_name: formData.user.full_name.trim(),
          phone: formData.user.phone?.trim() || '',
          password: formData.user.password?.trim() || generatePassword(), // Auto-generate if not provided
          role: 'student' // Add required role field
        },
        roll_number: formData.roll_number.trim(),
        parent_name: formData.parent_name?.trim() || '',
        parent_phone: formData.parent_phone?.trim() || '',
        address: formData.address?.trim() || '',
        class_id: parseInt(formData.class_id),
        date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : null
      }

      const result = await createStudent.mutateAsync(submissionData)
      
      // Store credentials for display
      setNewStudentCredentials({
        fullName: formData.user.full_name,
        username: formData.roll_number, // Use roll number as username
        password: formData.user.password || submissionData.user.password, // Use the password that was actually used
        rollNumber: formData.roll_number
      })
      
      setShowModal(false)
      
      // Show credentials modal instead of just toast
      setShowCredentialsModal(true)
      toast.success('Student created successfully!')
      
    } catch (error) {
      Logger.error('Error creating student:', error)
      
      // More detailed error handling
      if (error.response) {
        Logger.error('Server response:', error.response.data)
        let errorMessage = 'Server error occurred'
        
        if (error.response.data?.detail) {
          if (typeof error.response.data.detail === 'string') {
            errorMessage = error.response.data.detail
          } else if (typeof error.response.data.detail === 'object') {
            // Handle validation errors or other object responses
            if (error.response.data.detail.message) {
              errorMessage = error.response.data.detail.message
            } else if (Array.isArray(error.response.data.detail)) {
              errorMessage = error.response.data.detail.map(err => 
                typeof err === 'string' ? err : err.message || JSON.stringify(err)
              ).join(', ')
            } else {
              errorMessage = JSON.stringify(error.response.data.detail)
            }
          }
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid data provided. Please check all required fields.'
        } else if (error.response.status === 409) {
          errorMessage = 'A student with this information already exists.'
        }
        
        toast.error(`Failed to create student: ${errorMessage}`)
      } else if (error.message) {
        toast.error(`Error: ${error.message}`)
      } else {
        toast.error('Failed to create student. Please check the form data and try again.')
      }
    }
  }

  // Copy credentials to clipboard
  const copyCredentials = () => {
    if (!newStudentCredentials) return
    
    const text = `Student Login Credentials
Name: ${newStudentCredentials.fullName}
Username: ${newStudentCredentials.username}
Password: ${newStudentCredentials.password}
Roll Number: ${newStudentCredentials.rollNumber}

Please keep these credentials safe and change the password after first login.`

    navigator.clipboard.writeText(text).then(() => {
      toast.success('Credentials copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy credentials')
    })
  }

  // Print credentials
  const printCredentials = () => {
    if (!newStudentCredentials) return
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Login Credentials</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .credentials { border: 2px solid #000; padding: 20px; margin: 20px 0; }
            .field { margin: 10px 0; font-size: 16px; }
            .label { font-weight: bold; }
            .note { margin-top: 30px; font-style: italic; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Science Point - Student Login Credentials</h1>
          </div>
          <div class="credentials">
            <div class="field"><span class="label">Student Name:</span> ${newStudentCredentials.fullName}</div>
            <div class="field"><span class="label">Roll Number:</span> ${newStudentCredentials.rollNumber}</div>
            <div class="field"><span class="label">Username:</span> ${newStudentCredentials.username}</div>
            <div class="field"><span class="label">Password:</span> ${newStudentCredentials.password}</div>
          </div>
          <div class="note">
            <p><strong>Important:</strong></p>
            <ul>
              <li>Please keep these credentials safe and secure</li>
              <li>Change the password after first login</li>
              <li>Contact administration if you have any login issues</li>
            </ul>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handleViewStudent = (student) => {
    setSelectedStudent(student)
    setShowViewModal(true)
  }

  const handleEditStudent = (student) => {
    setEditForm({
      id: student.id,
      user: {
        full_name: student.user?.full_name || '',
        phone: student.user?.phone || ''
      },
      roll_number: student.roll_number || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      address: student.address || '',
      class_id: student.class_id || '',
      date_of_birth: student.date_of_birth ? student.date_of_birth.split('T')[0] : ''
    })
    setShowEditModal(true)
  }

  const handleUpdateStudent = async (e) => {
    e.preventDefault()
    
    try {
      // Validation checks
      if (!editForm.user.full_name?.trim()) {
        toast.error('Full name is required')
        return
      }
      if (!editForm.roll_number?.trim()) {
        toast.error('Roll number is required')
        return
      }
      if (!editForm.class_id) {
        toast.error('Class selection is required')
        return
      }
      if (!editForm.user.phone?.trim()) {
        toast.error('Phone number is required')
        return
      }
      if (!editForm.parent_phone?.trim()) {
        toast.error('Parent phone number is required')
        return
      }

      // Format the form data properly
      const updateData = {
        user: {
          username: editForm.roll_number.trim(), // Use roll number as username
          full_name: editForm.user.full_name.trim(),
          phone: editForm.user.phone?.trim() || ''
        },
        roll_number: editForm.roll_number.trim(),
        parent_name: editForm.parent_name?.trim() || '',
        parent_phone: editForm.parent_phone?.trim() || '',
        address: editForm.address?.trim() || '',
        class_id: parseInt(editForm.class_id),
        date_of_birth: editForm.date_of_birth ? new Date(editForm.date_of_birth).toISOString() : null
      }

      // Call the actual update mutation
      await updateStudent.mutateAsync({ 
        id: editForm.id, 
        ...updateData 
      })
      
      setShowEditModal(false)
      setEditForm(null)
      toast.success('Student updated successfully!')
      
    } catch (error) {
      Logger.error('Error updating student:', error)
      
      if (error.response) {
        const errorMessage = error.response.data?.detail || error.response.data?.message || 'Server error occurred'
        toast.error(`Failed to update student: ${errorMessage}`)
      } else if (error.message) {
        toast.error(`Error: ${error.message}`)
      } else {
        toast.error('Failed to update student. Please check the form data and try again.')
      }
    }
  }

  const handleDeleteStudent = (student) => {
    setSelectedStudent(student)
    setShowDeleteModal(true)
  }

  const confirmDeleteStudent = async () => {
    try {
      // Call the actual delete mutation
      await deleteStudent.mutateAsync(selectedStudent.id)
      
      setShowDeleteModal(false)
      setSelectedStudent(null)
      toast.success('Student deleted successfully!')
    } catch (error) {
      Logger.error('Error deleting student:', error)
      
      if (error.response) {
        const errorMessage = error.response.data?.detail || error.response.data?.message || 'Server error occurred'
        toast.error(`Failed to delete student: ${errorMessage}`)
      } else if (error.message) {
        toast.error(`Error: ${error.message}`)
      } else {
        toast.error('Failed to delete student. Please try again.')
      }
    }
  }

  const handleResetPassword = (student) => {
    setSelectedStudent(student)
    setShowResetPasswordModal(true)
  }

  const confirmResetPassword = async () => {
    try {
      const newPassword = generatePassword()
      
      // Create credentials object for display
      const credentials = {
        fullName: selectedStudent.user?.full_name || 'Unknown',
        username: selectedStudent.roll_number || 'unknown', // Use roll number as username
        password: newPassword,
        rollNumber: selectedStudent.roll_number || 'N/A'
      }

      // Call the actual password update mutation
      await updateStudentPassword.mutateAsync({ 
        studentId: selectedStudent.id, 
        password: newPassword 
      })
      
      // Set credentials for display
      setNewStudentCredentials(credentials)
      setShowResetPasswordModal(false)
      setSelectedStudent(null)
      setShowCredentialsModal(true)
      
      toast.success('Password reset successfully!')
    } catch (error) {
      Logger.error('Error resetting password:', error)
      toast.error('Failed to reset password. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin-dashboard')}
            className="hidden lg:block"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg sm:text-xl font-semibold">Students</h2>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Add Student</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
      
      {/* Filter Controls */}
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, roll number, username, or parent name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Class Filter */}
            <div className="w-full sm:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes?.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            
            {/* Sort Options */}
            <div className="w-full sm:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Sort by Name</option>
                <option value="roll">Sort by Roll Number</option>
                <option value="class">Sort by Class</option>
              </select>
            </div>
          </div>
          
          {/* Results Count and Clear Filters */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredStudents.length} of {students?.length || 0} students
            </div>
            {(searchQuery || selectedClass || sortBy !== 'name') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedClass('')
                  setSortBy('name')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>
      
      {/* Mobile Cards / Desktop Table */}
        <div className="block sm:hidden space-y-3">
          {filteredStudents && filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
            <Card key={student.id} className="p-4 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start space-x-3">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 ring-2 ring-blue-100">
                  {student.user?.photo_url || (student.user?.photo_path && student.user.photo_path.startsWith('http')) ? (
                    <img 
                      src={student.user.photo_url || student.user.photo_path} 
                      alt={`${student.user?.full_name || 'Student'} profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-blue-600 font-bold text-lg">
                      {(student.user?.full_name || 'S').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-base truncate">{student.user?.full_name || 'N/A'}</h3>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewStudent(student)} className="p-1.5">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditStudent(student)} className="p-1.5">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleResetPassword(student)}
                        className="p-1.5 text-orange-600 hover:bg-orange-50 border-orange-200"
                        title="Reset Password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteStudent(student)} className="p-1.5 text-red-600 hover:bg-red-50 border-red-200">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Key Info Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Roll & Class</div>
                      <div className="text-sm text-gray-900 font-semibold">{student.roll_number}</div>
                      <div className="text-xs text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full inline-block mt-1">
                        {classes?.find(cls => cls.id === student.class_id)?.name || `Class ${student.class_id}` || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</div>
                      <div className="text-sm text-gray-900 truncate">{student.user?.phone || 'N/A'}</div>
                    </div>
                  </div>
                  
                  {/* Parent Info Row */}
                  <div className="bg-gray-50 rounded-lg p-2 mb-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Parent</div>
                    <div className="text-sm text-gray-900 truncate">{student.parent_name || 'N/A'}</div>
                    <div className="text-xs text-gray-600 truncate">{student.parent_phone || 'N/A'}</div>
                  </div>
                  
                  {/* Address */}
                  {student.address && (
                    <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 leading-relaxed">
                      <span className="font-medium">Address:</span> {student.address}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))) : (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No students found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search filters</p>
            </Card>
          )}
        </div>

      {/* Desktop Table */}
      <Card className="hidden sm:block">
        <Card.Content className="p-0">
          {filteredStudents && filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>Photo</Table.Head>
                    <Table.Head>Roll Number</Table.Head>
                    <Table.Head>Full Name</Table.Head>
                    <Table.Head className="hidden lg:table-cell">Phone</Table.Head>
                    <Table.Head>Parent Name</Table.Head>
                    <Table.Head>Parent Phone</Table.Head>
                    <Table.Head>Address</Table.Head>
                    <Table.Head>Class</Table.Head>
                    <Table.Head>Actions</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredStudents.map((student) => (
                  <Table.Row key={student.id}>
                    <Table.Cell>
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {student.user?.photo_url || (student.user?.photo_path && student.user.photo_path.startsWith('http')) ? (
                          <img 
                            src={student.user.photo_url || student.user.photo_path} 
                            alt={`${student.user?.full_name || 'Student'} profile`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-medium text-sm">
                            {(student.user?.full_name || 'S').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>{student.roll_number}</Table.Cell>
                    <Table.Cell>{student.user?.full_name || 'N/A'}</Table.Cell>
                    <Table.Cell className="hidden lg:table-cell">{student.user?.phone || 'N/A'}</Table.Cell>
                    <Table.Cell>{student.parent_name || 'N/A'}</Table.Cell>
                    <Table.Cell>{student.parent_phone || 'N/A'}</Table.Cell>
                    <Table.Cell>{student.address || 'N/A'}</Table.Cell>
                    <Table.Cell>{classes?.find(cls => cls.id === student.class_id)?.name || `Class ${student.class_id}` || 'N/A'}</Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleViewStudent(student)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditStudent(student)}>
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleResetPassword(student)}
                          className="text-orange-600 hover:bg-orange-50"
                          title="Reset Password"
                        >
                          Reset
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteStudent(student)}>
                          Delete
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No students found matching your filters.</p>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Add Student Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        title="Add New Student"
        initialData={{
          user: { full_name: '', phone: '', password: '' },
          roll_number: '', parent_name: '', parent_phone: '', address: '', class_id: '', date_of_birth: ''
        }}
        onFieldChange={handleFieldChange}
        submitText="Create Student"
        isLoading={createStudent.isPending}
        className="sm:max-w-md"
        fields={[
          {
            name: 'user.full_name',
            label: 'Full Name',
            type: 'text',
            required: true,
            placeholder: "Enter student's full name (e.g., John Doe)",
            props: {
              autoComplete: 'name',
              inputMode: 'text',
              spellCheck: true
            }
          },
          {
            name: 'user.phone',
            label: 'Phone Number',
            type: 'tel',
            required: true,
            placeholder: "Enter student's phone number"
          },
          {
            name: 'class_id',
            label: 'Class',
            type: 'select',
            required: true,
            options: classes?.map(cls => ({ value: cls.id, label: cls.name })) || []
          },
          {
            name: 'roll_number',
            label: 'Roll Number',
            type: 'text',
            required: false, // Not required since it's auto-generated
            placeholder: 'Automatically generated when class is selected',
            props: {
              readOnly: true
            }
          },
          {
            name: 'parent_name',
            label: 'Parent Name',
            type: 'text',
            placeholder: "Enter parent's full name"
          },
          {
            name: 'parent_phone',
            label: 'Parent Phone',
            type: 'tel',
            required: true,
            placeholder: "Enter parent's phone number"
          },
          {
            name: 'address',
            label: 'Address',
            type: 'text',
            placeholder: 'Enter full address'
          },
          {
            name: 'date_of_birth',
            label: 'Date of Birth',
            type: 'date'
          },
          {
            name: 'user.password',
            label: 'Password',
            type: 'password',
            placeholder: 'Leave empty to auto-generate secure password'
          }
        ]}
      />

      {/* View Student Modal */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        data={selectedStudent ? {
          ...selectedStudent,
          photo_url: selectedStudent.user?.photo_url || selectedStudent.user?.photo_path,
          full_name: selectedStudent.user?.full_name || 'Student Details',
          subtitle: `Roll: ${selectedStudent.roll_number}`,
          details: `${classes?.find(cls => cls.id === selectedStudent?.class_id)?.name || 'Class N/A'} • ID: #${selectedStudent.id}`
        } : null}
        sections={[
          {
            key: 'personal',
            title: 'Personal Information',
            icon: User,
            fields: [
              { 
                key: 'name', 
                label: 'Full Name', 
                value: selectedStudent?.user?.full_name
              },
              { 
                key: 'roll', 
                label: 'Roll Number', 
                value: selectedStudent?.roll_number
              },
              { 
                key: 'class', 
                label: 'Class', 
                value: classes?.find(cls => cls.id === selectedStudent?.class_id)?.name || `Class ${selectedStudent?.class_id}`
              },
              {
                key: 'dob',
                label: 'Date of Birth',
                value: selectedStudent?.date_of_birth
                  ? new Date(selectedStudent.date_of_birth).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : null
              },
              {
                key: 'age',
                label: 'Age',
                value: selectedStudent?.date_of_birth
                  ? `${new Date().getFullYear() - new Date(selectedStudent.date_of_birth).getFullYear()} years`
                  : null
              }
            ]
          },
          {
            key: 'contact',
            title: 'Contact Information',
            icon: Phone,
            fields: [
              { 
                key: 'phone', 
                label: 'Phone', 
                value: selectedStudent?.user?.phone
              },
              { 
                key: 'email', 
                label: 'Email', 
                value: selectedStudent?.user?.email
              },
              { 
                key: 'address', 
                label: 'Address', 
                value: selectedStudent?.address
              }
            ]
          },
          {
            key: 'parent',
            title: 'Parent Information',
            icon: Users,
            fields: [
              { 
                key: 'parentName', 
                label: 'Parent Name', 
                value: selectedStudent?.parent_name
              },
              { 
                key: 'parentPhone', 
                label: 'Parent Phone', 
                value: selectedStudent?.parent_phone
              }
            ]
          }
        ]}
        actions={[
          {
            label: 'Edit',
            icon: Edit,
            onClick: () => {
              setShowViewModal(false)
              handleEditStudent(selectedStudent)
            },
            className: 'text-xs'
          },
          {
            label: 'Reset Password',
            icon: KeyRound,
            onClick: () => {
              setShowViewModal(false)
              handleResetPassword(selectedStudent)
            },
            variant: 'outline',
            className: 'text-xs text-orange-600 hover:bg-orange-50'
          }
        ]}
      />

      {/* Edit Student Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditForm(null)
        }}
        onSubmit={handleUpdateStudent}
        title="Edit Student"
        initialData={editForm}
        submitText="Update Student"
        isLoading={updateStudent.isPending}
        className="sm:max-w-md"
        fields={[
          {
            name: 'user.full_name',
            label: 'Full Name',
            type: 'text',
            required: true
          },
          {
            name: 'user.phone',
            label: 'Phone',
            type: 'tel',
            required: true
          },
          {
            name: 'roll_number',
            label: 'Roll Number',
            type: 'text',
            required: true
          },
          {
            name: 'class_id',
            label: 'Class',
            type: 'select',
            required: true,
            options: classes?.map(cls => ({ value: cls.id, label: cls.name })) || []
          },
          {
            name: 'parent_name',
            label: 'Parent Name',
            type: 'text'
          },
          {
            name: 'parent_phone',
            label: 'Parent Phone',
            type: 'tel',
            required: true
          },
          {
            name: 'address',
            label: 'Address',
            type: 'text'
          },
          {
            name: 'date_of_birth',
            label: 'Date of Birth',
            type: 'date'
          }
        ]}
      />

      {/* Credentials Display Modal */}
      <CredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => {
          setShowCredentialsModal(false)
          setNewStudentCredentials(null)
          toast.success('Student account ready for use!')
        }}
        credentials={newStudentCredentials}
        entityType="Student"
        onCopy={copyCredentials}
        onPrint={printCredentials}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedStudent(null)
        }}
        onConfirm={confirmDeleteStudent}
        title="Confirm Delete Student"
        confirmText="Delete Student"
        isLoading={deleteStudent.isPending}
        icon={XCircle}
        iconColor="text-red-600"
      >
        {selectedStudent && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">Student Details:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Name:</strong> {selectedStudent.user?.full_name}</p>
              <p><strong>Roll Number:</strong> {selectedStudent.roll_number}</p>
              <p><strong>Class:</strong> {classes?.find(cls => cls.id === selectedStudent.class_id)?.name || `Class ${selectedStudent.class_id}`}</p>
            </div>
          </div>
        )}
        <p className="text-red-800 text-sm">
          Are you sure you want to delete <strong>{selectedStudent?.user?.full_name}</strong>?
          This action cannot be undone and will permanently remove all student data including:
        </p>
        <ul className="text-red-800 text-sm mt-2 ml-4 list-disc">
          <li>Student profile and account</li>
          <li>Academic records and grades</li>
          <li>Attendance history</li>
          <li>Assignment submissions</li>
        </ul>
      </ConfirmationModal>

      {/* Reset Password Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false)
          setSelectedStudent(null)
        }}
        onConfirm={confirmResetPassword}
        title="Reset Student Password"
        confirmText="Reset Password"
        confirmVariant="default"
        isLoading={updateStudentPassword.isPending}
        icon={AlertCircle}
        iconColor="text-orange-600"
      >
        {selectedStudent && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">Student Details:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Name:</strong> {selectedStudent.user?.full_name}</p>
              <p><strong>Username:</strong> {selectedStudent.user?.username}</p>
              <p><strong>Roll Number:</strong> {selectedStudent.roll_number}</p>
            </div>
          </div>
        )}
        <p className="text-orange-800 text-sm">
          Are you sure you want to reset the password for <strong>{selectedStudent?.user?.full_name}</strong>?
        </p>
        <div className="mt-3 text-orange-800 text-sm">
          <p><strong>What will happen:</strong></p>
          <ul className="ml-4 list-disc mt-1">
            <li>A new secure password will be generated</li>
            <li>The student's current password will be invalidated</li>
            <li>New credentials will be displayed for sharing</li>
            <li>Student must use the new password for login</li>
          </ul>
        </div>
      </ConfirmationModal>
    </div>
  )
}

export default AdminStudents;