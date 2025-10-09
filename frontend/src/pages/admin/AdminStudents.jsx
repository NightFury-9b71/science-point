import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Plus, Eye, ArrowLeft, Search, Download, FileText, XCircle, AlertCircle, Users, Phone, Edit, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import Logger from '../../utils/logger.js'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { Input, Select } from '../../components/Form'
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
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [newStudentCredentials, setNewStudentCredentials] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [form, setForm] = useState({
    user: { username: '', email: '', full_name: '', phone: '', password: '' },
    roll_number: '', parent_name: '', parent_phone: '', address: '', class_id: '', date_of_birth: ''
  })
  const [editForm, setEditForm] = useState(null)  // Filter and sort students
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
    if (!classId || !students) return ''
    
    // Get students in the same class
    const classStudents = students.filter(student => student.class_id === classId)
    
    // Find the class details for short prefix
    const selectedClass = classes?.find(cls => cls.id === classId)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Validation checks
      if (!form.user.full_name?.trim()) {
        toast.error('Full name is required')
        return
      }
      if (!form.user.username?.trim()) {
        toast.error('Username is required')
        return
      }
      if (!form.user.password?.trim()) {
        toast.error('Password is required')
        return
      }
      if (!form.user.phone?.trim()) {
        toast.error('Phone number is required')
        return
      }
      if (!form.roll_number?.trim()) {
        toast.error('Roll number is required')
        return
      }
      if (!form.class_id) {
        toast.error('Class selection is required')
        return
      }
      if (!form.parent_phone?.trim()) {
        toast.error('Parent phone number is required')
        return
      }

      // Format the form data properly
      const formData = {
        user: {
          username: form.user.username.trim(),
          email: form.user.email.trim(),
          full_name: form.user.full_name.trim(),
          phone: form.user.phone?.trim() || '',
          password: form.user.password.trim(),
          role: 'student' // Add required role field
        },
        roll_number: form.roll_number.trim(),
        parent_name: form.parent_name?.trim() || '',
        parent_phone: form.parent_phone?.trim() || '',
        address: form.address?.trim() || '',
        class_id: parseInt(form.class_id),
        date_of_birth: form.date_of_birth ? new Date(form.date_of_birth).toISOString() : null
      }

      const result = await createStudent.mutateAsync(formData)
      
      // Store credentials for display
      setNewStudentCredentials({
        fullName: form.user.full_name,
        username: form.user.username,
        password: form.user.password,
        rollNumber: form.roll_number,
        email: form.user.email
      })
      
      setShowModal(false)
      setForm({
        user: { username: '', email: '', full_name: '', phone: '', password: '' },
        roll_number: '', parent_name: '', parent_phone: '', address: '', class_id: '', date_of_birth: ''
      })
      
      // Show credentials modal instead of just toast
      setShowCredentialsModal(true)
      toast.success('Student created successfully!')
      
    } catch (error) {
      Logger.error('Error creating student:', error)
      
      // More detailed error handling
      if (error.response) {
        Logger.error('Server response:', error.response.data)
        const errorMessage = error.response.data?.detail || error.response.data?.message || 'Server error occurred'
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
        username: student.user?.username || '',
        email: student.user?.email || '',
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
          username: editForm.user.username.trim(),
          email: editForm.user.email.trim(),
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
        username: selectedStudent.user?.username || 'unknown',
        password: newPassword,
        rollNumber: selectedStudent.roll_number || 'N/A',
        email: selectedStudent.user?.email || 'N/A'
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
            onClick={() => navigate('/admin')}
            className="lg:hidden"
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
            <Card key={student.id} className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {student.user?.photo_path ? (
                    <img 
                      src={`/uploads/${student.user.photo_path}`} 
                      alt={`${student.user?.full_name || 'Student'} profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-medium">
                      {(student.user?.full_name || 'S').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{student.user?.full_name || 'N/A'}</h3>
                      <p className="text-sm text-gray-600">Roll: {student.roll_number}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap ml-2">
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
                        Reset PWD
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteStudent(student)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1 mt-2">
                    <p>Email: {student.user?.email || 'N/A'}</p>
                    <p>Username: {student.user?.username || 'N/A'}</p>
                    <p>Phone: {student.user?.phone || 'N/A'}</p>
                    <p>Parent Name: {student.parent_name || 'N/A'}</p>
                    <p>Parent Phone: {student.parent_phone || 'N/A'}</p>
                    <p>Address: {student.address || 'N/A'}</p>
                    <p>Class: {classes?.find(cls => cls.id === student.class_id)?.name || `Class ${student.class_id}` || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No students found matching your filters.</p>
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
                    <Table.Head className="hidden md:table-cell">Username</Table.Head>
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
                        {student.user?.photo_path ? (
                          <img 
                            src={`/uploads/${student.user.photo_path}`} 
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
                    <Table.Cell className="hidden md:table-cell">{student.user?.username || 'N/A'}</Table.Cell>
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

      {/* Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Add New Student"
        className="sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            name="full_name"
            id="student_full_name"
            autoComplete="name"
            inputMode="text"
            spellCheck="true"
            placeholder="Enter student's full name (e.g., John Doe)"
            value={form.user.full_name || ''}
            onChange={(e) => {
              const fullName = e.target.value
              
              // Immediate state update for responsive UI
              setForm(prev => ({
                ...prev,
                user: { 
                  ...prev.user, 
                  full_name: fullName
                }
              }))
              
              // Debounced username generation to avoid blocking input
              if (fullName && fullName.trim().length > 1) {
                setTimeout(() => {
                  try {
                    const username = generateUsername(fullName)
                    if (username) {
                      setForm(prev => ({
                        ...prev,
                        user: { 
                          ...prev.user, 
                          username: username
                        }
                      }))
                    }
                  } catch (err) {
                    Logger.error('Username generation error:', err)
                  }
                }, 300)
              }
            }}
            required
          />
          
          <div className="space-y-2">
            <Input
              label="Username"
              type="text"
              value={form.user.username}
              onChange={(e) => setForm({
                ...form,
                user: { ...form.user, username: e.target.value }
              })}
              required
              placeholder="Auto-generated from full name"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm({
                ...form,
                user: { ...form.user, username: generateUsername(form.user.full_name) }
              })}
              className="text-xs"
              disabled={!form.user.full_name}
            >
              {!form.user.full_name ? 'Enter name first' : 'Generate unique username'}
            </Button>
          </div>

          <Input
            label="Email"
            type="email"
            value={form.user.email}
            onChange={(e) => setForm({
              ...form,
              user: { ...form.user, email: e.target.value }
            })}
          />
          
          <Input
            label="Phone Number"
            type="tel"
            value={form.user.phone}
            onChange={(e) => setForm({
              ...form,
              user: { ...form.user, phone: e.target.value }
            })}
            required
            placeholder="Enter student's phone number"
          />
          
          <div className="space-y-2">
            <Input
              label="Password"
              type="password"
              value={form.user.password}
              onChange={(e) => setForm({
                ...form,
                user: { ...form.user, password: e.target.value }
              })}
              required
              placeholder="Enter password or generate one"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForm({
                  ...form,
                  user: { ...form.user, password: generatePassword() }
                })}
                className="text-xs"
              >
                Generate Secure Password
              </Button>
              {form.user.password && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(form.user.password)
                    toast.success('Password copied!')
                  }}
                  className="text-xs"
                >
                  Copy Password
                </Button>
              )}
            </div>
            {form.user.password && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                <strong>Password:</strong> {form.user.password}
              </div>
            )}
          </div>

                    <Select
            label="Class"
            value={form.class_id}
            onChange={(e) => {
              const classId = parseInt(e.target.value)
              setForm({
                ...form,
                class_id: classId,
                // Auto-generate roll number if it's empty
                roll_number: !form.roll_number ? generateRollNumber(classId) : form.roll_number
              })
            }}
            options={classes?.map(cls => ({ value: cls.id, label: cls.name })) || []}
            required
          />
          
          <div className="space-y-2">
            <Input
              label="Roll Number"
              type="text"
              value={form.roll_number}
              onChange={(e) => setForm({ ...form, roll_number: e.target.value })}
              required
              placeholder="e.g., 10A01, 9B03 (auto-generated)"
            />
            {form.roll_number && !/^\d{1,2}[A-Z]{1,2}\d{1,2}$/.test(form.roll_number) && (
              <div className="text-xs text-orange-600">
                Roll number format: GradeSection + Number (e.g., 10A01, 9B03)
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm({
                ...form,
                roll_number: generateRollNumber(form.class_id)
              })}
              disabled={!form.class_id}
              className="text-xs"
            >
              {!form.class_id ? 'Select class first' : 'Generate next roll number'}
            </Button>
          </div>
          
          <Input
            label="Parent Name"
            type="text"
            placeholder="Enter parent's full name"
            value={form.parent_name}
            onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
          />
          
          <Input
            label="Parent Phone"
            type="tel"
            placeholder="Enter parent's phone number"
            value={form.parent_phone}
            onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
            required
          />
          
          <Input
            label="Address"
            type="text"
            placeholder="Enter full address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          
          <Input
            label="Date of Birth"
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
          />
          
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createStudent.isPending}>
              Create Student
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Student Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title=""
        className="sm:max-w-xl"
      >
        {selectedStudent ? (
          <div>
            {/* Compact Header */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-4 -m-6 mb-3 rounded-t-lg relative overflow-hidden">
              <div className="relative flex items-center space-x-3">
                {/* Small Profile Photo */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg bg-white">
                    {selectedStudent.user?.photo_path ? (
                      <img
                        src={`/uploads/${selectedStudent.user.photo_path}`}
                        alt={`${selectedStudent.user?.full_name || 'Student'} profile`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-600">
                          {(selectedStudent.user?.full_name || 'S').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">{selectedStudent.user?.full_name || 'Student Details'}</h2>
                  <p className="text-sm text-blue-100">Roll: {selectedStudent.roll_number}</p>
                  <p className="text-sm text-blue-200 truncate">
                    {classes?.find(cls => cls.id === selectedStudent?.class_id)?.name || `Class ${selectedStudent?.class_id}` || 'N/A'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">Active</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">#{selectedStudent.id}</span>
                    {selectedStudent.date_of_birth && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded">
                        {new Date().getFullYear() - new Date(selectedStudent.date_of_birth).getFullYear()} yrs
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Content */}
            <div className="space-y-3 px-2">
              {/* Personal Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-center mb-2">
                  <Users className="h-4 w-4 text-blue-600 mr-2" />
                  <h3 className="text-sm font-bold text-gray-800">Personal Info</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="text-xs text-blue-600 font-semibold">Name</label>
                    <p className="text-gray-900 font-medium truncate">{selectedStudent.user?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-blue-600 font-semibold">Username</label>
                    <p className="text-gray-900 font-mono text-xs bg-gray-50 px-1 py-0.5 rounded inline-block">
                      {selectedStudent.user?.username || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-blue-600 font-semibold">Roll Number</label>
                    <p className="text-gray-900 font-bold">{selectedStudent.roll_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-blue-600 font-semibold">Class</label>
                    <p className="text-gray-900 font-medium truncate">
                      {classes?.find(cls => cls.id === selectedStudent?.class_id)?.name || `Class ${selectedStudent?.class_id}` || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-blue-600 font-semibold">DOB</label>
                    <p className="text-gray-900 text-xs">
                      {selectedStudent.date_of_birth
                        ? new Date(selectedStudent.date_of_birth).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-blue-600 font-semibold">Age</label>
                    <p className="text-gray-900 font-medium">
                      {selectedStudent.date_of_birth
                        ? `${new Date().getFullYear() - new Date(selectedStudent.date_of_birth).getFullYear()} yrs`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                <div className="flex items-center mb-2">
                  <Phone className="h-4 w-4 text-green-600 mr-2" />
                  <h3 className="text-sm font-bold text-gray-800">Contact Info</h3>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <label className="text-xs text-green-600 font-semibold">Email</label>
                    <p className="text-gray-900 text-xs break-all">{selectedStudent.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-green-600 font-semibold">Phone</label>
                    <p className="text-gray-900 font-medium">{selectedStudent.user?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-green-600 font-semibold">Address</label>
                    <p className="text-gray-900 text-xs bg-gray-50 p-2 rounded border leading-relaxed">
                      {selectedStudent.address || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                <div className="flex items-center mb-2">
                  <Users className="h-4 w-4 text-purple-600 mr-2" />
                  <h3 className="text-sm font-bold text-gray-800">Parent Info</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="text-xs text-purple-600 font-semibold">Parent Name</label>
                    <p className="text-gray-900 font-medium truncate">{selectedStudent.parent_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-purple-600 font-semibold">Parent Phone</label>
                    <p className="text-gray-900 font-medium">{selectedStudent.parent_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-100">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-4 w-4 text-indigo-600 mr-2" />
                  <h3 className="text-sm font-bold text-gray-800">Account Status</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-semibold text-gray-900">Active</span>
                  </div>
                  <span className="text-xs text-gray-500">#{selectedStudent.id}</span>
                </div>
              </div>
            </div>

            {/* Compact Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-end pt-4 mt-4 border-t border-gray-200 px-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowViewModal(false)
                  handleEditStudent(selectedStudent)
                }}
                className="text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowViewModal(false)
                  handleResetPassword(selectedStudent)
                }}
                className="text-xs text-orange-600 hover:bg-orange-50"
              >
                <KeyRound className="h-3 w-3 mr-1" />
                Reset Password
              </Button>
              <Button
                size="sm"
                onClick={() => setShowViewModal(false)}
                className="text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false)
          setEditForm(null)
        }}
        title="Edit Student"
        className="sm:max-w-md"
      >
        {editForm && (
          <form onSubmit={handleUpdateStudent} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={editForm.user.full_name || ''}
              onChange={(e) => setEditForm({
                ...editForm,
                user: { ...editForm.user, full_name: e.target.value }
              })}
              required
            />
            
            <Input
              label="Username"
              type="text"
              value={editForm.user.username || ''}
              onChange={(e) => setEditForm({
                ...editForm,
                user: { ...editForm.user, username: e.target.value }
              })}
              required
            />

            <Input
              label="Email"
              type="email"
              value={editForm.user.email || ''}
              onChange={(e) => setEditForm({
                ...editForm,
                user: { ...editForm.user, email: e.target.value }
              })}
            />
            
            <Input
              label="Phone"
              type="tel"
              value={editForm.user.phone || ''}
              onChange={(e) => setEditForm({
                ...editForm,
                user: { ...editForm.user, phone: e.target.value }
              })}
              required
            />
            
            <Input
              label="Roll Number"
              type="text"
              value={editForm.roll_number || ''}
              onChange={(e) => setEditForm({ ...editForm, roll_number: e.target.value })}
              required
            />
            
            <Select
              label="Class"
              value={editForm.class_id || ''}
              onChange={(e) => setEditForm({ ...editForm, class_id: parseInt(e.target.value) })}
              options={classes?.map(cls => ({ value: cls.id, label: cls.name })) || []}
              required
            />
            
            <Input
              label="Parent Name"
              type="text"
              value={editForm.parent_name || ''}
              onChange={(e) => setEditForm({ ...editForm, parent_name: e.target.value })}
            />
            
            <Input
              label="Parent Phone"
              type="tel"
              value={editForm.parent_phone || ''}
              onChange={(e) => setEditForm({ ...editForm, parent_phone: e.target.value })}
              required
            />
            
            <Input
              label="Address"
              type="text"
              value={editForm.address || ''}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
            
            <Input
              label="Date of Birth"
              type="date"
              value={editForm.date_of_birth || ''}
              onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
            />
            
            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false)
                  setEditForm(null)
                }}
                disabled={updateStudent.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={updateStudent.isPending}
              >
                Update Student
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Credentials Display Modal */}
      <Modal 
        isOpen={showCredentialsModal} 
        onClose={() => {
          setShowCredentialsModal(false)
          setNewStudentCredentials(null)
        }}
        title="Student Account Created Successfully!"
        className="sm:max-w-lg"
      >
        {newStudentCredentials && (
          <div className="space-y-6 p-2 sm:p-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-lg font-medium text-green-900">Account Created</h3>
              </div>
              <p className="text-green-800 text-sm">
                Student account has been created successfully. Please share these login credentials with the student.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">Login Credentials</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Student Name:</span>
                  <span className="text-gray-900">{newStudentCredentials.fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Roll Number:</span>
                  <span className="text-gray-900">{newStudentCredentials.rollNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Username:</span>
                  <span className="text-gray-900 font-mono">{newStudentCredentials.username}</span>
                </div>
                <div className="flex justify-between items-center bg-yellow-50 p-2 rounded border">
                  <span className="font-medium text-gray-700">Password:</span>
                  <span className="text-gray-900 font-mono">{newStudentCredentials.password}</span>
                </div>
              </div>
            </div>

            {/* <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-900 mb-2">Important Instructions</h4>
              <ul className="text-amber-800 text-sm space-y-1">
                <li>• Share these credentials securely with the student</li>
                <li>• Ask student to change password after first login</li>
                <li>• Keep a secure copy for your records</li>
                <li>• Student can login at: <span className="font-mono">your-school-portal.com</span></li>
              </ul>
            </div> */}

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={copyCredentials}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Copy Credentials
              </Button>
              <Button
                variant="outline"
                onClick={printCredentials}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Print Credentials
              </Button>
              <Button
                onClick={() => {
                  setShowCredentialsModal(false)
                  setNewStudentCredentials(null)
                  toast.success('Student account ready for use!')
                }}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedStudent(null)
        }}
        title="Confirm Delete Student"
        className="sm:max-w-md"
      >
        {selectedStudent && (
          <div className="space-y-4 p-2 sm:p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-900">Delete Student</h3>
                </div>
              </div>
              <p className="text-red-800 text-sm">
                Are you sure you want to delete <strong>{selectedStudent.user?.full_name}</strong>? 
                This action cannot be undone and will permanently remove all student data including:
              </p>
              <ul className="text-red-800 text-sm mt-2 ml-4 list-disc">
                <li>Student profile and account</li>
                <li>Academic records and grades</li>
                <li>Attendance history</li>
                <li>Assignment submissions</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-2">Student Details:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Name:</strong> {selectedStudent.user?.full_name}</p>
                <p><strong>Roll Number:</strong> {selectedStudent.roll_number}</p>
                <p><strong>Class:</strong> {selectedStudent.class_id}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedStudent(null)
                }}
                disabled={deleteStudent.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteStudent}
                loading={deleteStudent.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Student
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset Password Confirmation Modal */}
      <Modal 
        isOpen={showResetPasswordModal} 
        onClose={() => {
          setShowResetPasswordModal(false)
          setSelectedStudent(null)
        }}
        title="Reset Student Password"
        className="sm:max-w-md"
      >
        {selectedStudent && (
          <div className="space-y-4 p-2 sm:p-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-orange-900">Reset Password</h3>
                </div>
              </div>
              <p className="text-orange-800 text-sm">
                Are you sure you want to reset the password for <strong>{selectedStudent.user?.full_name}</strong>?
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
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-2">Student Details:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Name:</strong> {selectedStudent.user?.full_name}</p>
                <p><strong>Username:</strong> {selectedStudent.user?.username}</p>
                <p><strong>Roll Number:</strong> {selectedStudent.roll_number}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setSelectedStudent(null)
                }}
                disabled={updateStudentPassword.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmResetPassword}
                loading={updateStudentPassword.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Reset Password
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminStudents