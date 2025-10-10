import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus,Users,Edit, Briefcase, Eye, ArrowLeft, Search, KeyRound, CheckCircle, Download, FileText, Copy, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Table from '../../components/Table'
import { Input, Select } from '../../components/Form'
import { ConfirmationModal, CredentialsModal, FormModal, ViewModal } from '../../components/modals'
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher, useUpdateTeacherPassword, useStudents } from '../../services/queries'

const AdminTeachers = () => {
  const navigate = useNavigate()
  const { data: teachers, isLoading } = useTeachers()
  const { data: students } = useStudents()
  const createTeacher = useCreateTeacher()
  const updateTeacher = useUpdateTeacher()
  const deleteTeacher = useDeleteTeacher()
  const updateTeacherPassword = useUpdateTeacherPassword()
  
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [newTeacherCredentials, setNewTeacherCredentials] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [editForm, setEditForm] = useState(() => ({
    user: { full_name: '', phone: '' },
    employee_id: '', salary: 200
  }))

  // Filter and sort teachers
  const filteredTeachers = (teachers || [])
    .filter(teacher => {
      const matchesSearch = !searchQuery || 
        teacher.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.user?.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.user?.full_name || '').localeCompare(b.user?.full_name || '')
        case 'employee_id':
          return (a.employee_id || '').localeCompare(b.employee_id || '')
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
      
      // Get all existing usernames from teachers and students
      const existingUsernames = new Set()
      
      // Add teacher usernames  
      if (teachers) {
        teachers.forEach(teacher => {
          if (teacher.user?.username) {
            existingUsernames.add(teacher.user.username.toLowerCase())
          }
        })
      }
      
      // Add student usernames
      if (students) {
        students.forEach(student => {
          if (student.user?.username) {
            existingUsernames.add(student.user.username.toLowerCase())
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
      console.error('Error generating username:', error)
      return `user${Math.floor(Math.random() * 10000)}`
    }
  }

  // Auto-generate employee ID for teachers
  const generateEmployeeId = () => {
    if (!teachers) return ''
    
    // Get all existing employee IDs
    const existingIds = teachers
      .map(teacher => {
        const idStr = teacher.employee_id || ''
        const match = idStr.match(/T(\d+)$/) // Get trailing numbers after 'T'
        return match ? parseInt(match[1]) : 0
      })
      .filter(id => !isNaN(id))
    
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0
    const nextId = maxId + 1
    
    return `T${nextId.toString().padStart(3, '0')}`
  }

  const handleSubmit = async (formData) => {
    try {
      // Generate employee ID if not provided
      const employeeId = formData.employee_id?.trim() || generateEmployeeId()
      
      // Validation checks
      if (!formData.user?.full_name?.trim()) {
        toast.error('Full name is required')
        return
      }
      if (!formData.user?.phone?.trim()) {
        toast.error('Phone number is required')
        return
      }
      if (!employeeId) {
        toast.error('Employee ID is required')
        return
      }
      if (!formData.salary || formData.salary <= 0) {
        toast.error('Salary must be greater than 0')
        return
      }

      // Format the form data properly
      const submissionData = {
        user: {
          username: generateUsername(formData.user.full_name.trim()), // Auto-generate username
          full_name: formData.user.full_name.trim(),
          phone: formData.user.phone?.trim() || '',
          password: formData.user.password?.trim() || generatePassword(), // Auto-generate if not provided
          role: 'teacher' // Add required role field
        },
        employee_id: employeeId,
        salary: parseFloat(formData.salary),
        qualification: '', // Empty since removed
        experience_years: 0 // Default since removed
      }

      const result = await createTeacher.mutateAsync(submissionData)
      
      // Store credentials for display
      setNewTeacherCredentials({
        fullName: formData.user.full_name,
        username: submissionData.user.username,
        password: formData.user.password || submissionData.user.password,
        employeeId: employeeId
      })
      
      setShowModal(false)
      
      // Show credentials modal instead of just toast
      setShowCredentialsModal(true)
      toast.success('Teacher created successfully!')
      
    } catch (error) {
      Logger.error('Error creating teacher:', error)
      
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
          errorMessage = 'A teacher with this information already exists.'
        }
        
        toast.error(`Failed to create teacher: ${errorMessage}`)
      } else if (error.message) {
        toast.error(`Error: ${error.message}`)
      } else {
        toast.error('Failed to create teacher. Please check the form data and try again.')
      }
    }
  }

  const handleViewTeacher = (teacher) => {
    setSelectedTeacher(teacher)
    setShowViewModal(true)
  }

  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher)
    setEditForm({
      id: teacher.id,
      user: {
        full_name: teacher.user?.full_name || '',
        phone: teacher.user?.phone || ''
      },
      employee_id: teacher.employee_id || '',
      salary: teacher.salary || 200
    })
    setShowEditModal(true)
  }

  const handleDeleteTeacher = (teacher) => {
    setSelectedTeacher(teacher)
    setShowDeleteModal(true)
  }

  const handleResetPassword = (teacher) => {
    setSelectedTeacher(teacher)
    setShowPasswordModal(true)
  }

  const confirmResetPassword = async () => {
    try {
      const newPassword = generatePassword()
      
      // Create credentials object for display
      const credentials = {
        fullName: selectedTeacher.user?.full_name || 'Unknown',
        username: selectedTeacher.user?.username || 'unknown',
        password: newPassword,
        employeeId: selectedTeacher.employee_id || 'N/A'
      }

      // Call the actual password update mutation
      await updateTeacherPassword.mutateAsync({ 
        teacherId: selectedTeacher.id, 
        password: newPassword 
      })
      
      // Set credentials for display
      setNewTeacherCredentials(credentials)
      setShowPasswordModal(false)
      setSelectedTeacher(null)
      setShowCredentialsModal(true)
      
      toast.success('Password reset successfully!')
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('Failed to reset password. Please try again.')
    }
  }

  const handleUpdateTeacher = async (formData) => {
    try {
      // Validation checks
      if (!formData.user?.full_name?.trim()) {
        toast.error('Full name is required')
        return
      }
      if (!formData.employee_id?.trim()) {
        toast.error('Employee ID is required')
        return
      }
      if (!formData.user?.phone?.trim()) {
        toast.error('Phone number is required')
        return
      }
      if (!formData.salary || formData.salary <= 0) {
        toast.error('Salary must be greater than 0')
        return
      }

      // Format the form data properly
      const updateData = {
        user: {
          username: generateUsername(formData.user.full_name.trim()), // Auto-generate username
          full_name: formData.user.full_name.trim(),
          phone: formData.user.phone?.trim() || ''
        },
        employee_id: formData.employee_id.trim(),
        salary: parseFloat(formData.salary),
        qualification: '', // Empty since removed
        experience_years: 0 // Default since removed
      }

      // Call the actual update mutation
      await updateTeacher.mutateAsync({ 
        id: editForm.id, 
        ...updateData 
      })
      
      setShowEditModal(false)
      setEditForm(null)
      toast.success('Teacher updated successfully!')
      
    } catch (error) {
      Logger.error('Error updating teacher:', error)
      
      if (error.response) {
        const errorMessage = error.response.data?.detail || error.response.data?.message || 'Server error occurred'
        toast.error(`Failed to update teacher: ${errorMessage}`)
      } else if (error.message) {
        toast.error(`Error: ${error.message}`)
      } else {
        toast.error('Failed to update teacher. Please check the form data and try again.')
      }
    }
  }

  const confirmDelete = async () => {
    try {
      await deleteTeacher.mutateAsync(selectedTeacher.id)
      setShowDeleteModal(false)
      setSelectedTeacher(null)
      toast.success('Teacher deleted successfully!')
    } catch (error) {
      console.error('Error deleting teacher:', error)
      toast.error('Failed to delete teacher. Please try again.')
    }
  }

  const copyCredentials = () => {
    if (!newTeacherCredentials) return
    
    const credentialsText = `Teacher Login Credentials
Name: ${newTeacherCredentials.fullName}
Employee ID: ${newTeacherCredentials.employeeId}
Username: ${newTeacherCredentials.username}
Password: ${newTeacherCredentials.password}

Please keep these credentials secure and share them with the teacher.`
    
    navigator.clipboard.writeText(credentialsText).then(() => {
      toast.success('Credentials copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy credentials')
    })
  }

  const printCredentials = () => {
    if (!newTeacherCredentials) return
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Teacher Login Credentials</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .credentials { border: 2px solid #333; padding: 20px; margin: 20px 0; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; }
            .value { margin-left: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Teacher Login Credentials</h2>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="credentials">
            <div class="field"><span class="label">Name:</span><span class="value">${newTeacherCredentials.fullName}</span></div>
            <div class="field"><span class="label">Employee ID:</span><span class="value">${newTeacherCredentials.employeeId}</span></div>
            <div class="field"><span class="label">Username:</span><span class="value">${newTeacherCredentials.username}</span></div>
            <div class="field"><span class="label">Password:</span><span class="value">${newTeacherCredentials.password}</span></div>
          </div>
          <p><strong>Note:</strong> Please keep these credentials secure and ask the teacher to change the password after first login.</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
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
            className="hidden lg:block"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg sm:text-xl font-semibold">Teachers</h2>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Add Teacher</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
      
      {/* Filter Controls */}
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or employee ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Sort Options */}
            <div className="w-full lg:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Sort by Name</option>
                <option value="employee_id">Sort by ID</option>
              </select>
            </div>
          </div>
          
          {/* Results Count and Clear Filters */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredTeachers.length} of {teachers?.length || 0} teachers
            </div>
            {(searchQuery || sortBy !== 'name') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
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
        {filteredTeachers?.map((teacher) => (
          <Card key={teacher.id} className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                {teacher.user?.photo_url || teacher.user?.photo_path ? (
                  <img 
                    src={teacher.user.photo_url || (teacher.user.photo_path.startsWith('http') ? teacher.user.photo_path : null)} 
                    alt={`${teacher.user?.full_name || 'Teacher'} profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-medium">
                    {(teacher.user?.full_name || 'T').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">{teacher.user?.full_name || 'N/A'}</h3>
                    <p className="text-sm text-gray-600">ID: {teacher.employee_id}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleViewTeacher(teacher)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetPassword(teacher)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      title="Reset Password"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 space-y-1 mt-2">
                  <p>Phone: {teacher.user?.phone || 'N/A'}</p>
                  <p>Salary: {teacher.salary || 200} BDT per class</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <Card className="hidden sm:block">
        <Card.Content className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Photo</Table.Head>
                  <Table.Head>Employee ID</Table.Head>
                  <Table.Head>Full Name</Table.Head>
                  <Table.Head className="hidden md:table-cell">Phone</Table.Head>
                  <Table.Head>Salary per Class</Table.Head>
                  <Table.Head>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredTeachers?.map((teacher) => (
                  <Table.Row key={teacher.id}>
                    <Table.Cell>
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {teacher.user?.photo_url || teacher.user?.photo_path ? (
                          <img 
                            src={teacher.user.photo_url || (teacher.user.photo_path.startsWith('http') ? teacher.user.photo_path : null)} 
                            alt={`${teacher.user?.full_name || 'Teacher'} profile`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-medium text-sm">
                            {(teacher.user?.full_name || 'T').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>{teacher.employee_id}</Table.Cell>
                    <Table.Cell>{teacher.user?.full_name || 'N/A'}</Table.Cell>
                    <Table.Cell className="hidden md:table-cell">{teacher.user?.phone || 'N/A'}</Table.Cell>
                    <Table.Cell>{teacher.salary || 200} BDT</Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleViewTeacher(teacher)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditTeacher(teacher)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResetPassword(teacher)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Reset Password"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteTeacher(teacher)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          Delete
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </Card.Content>
      </Card>

      {/* Add Teacher Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        title="Add New Teacher"
        initialData={{
          user: { full_name: '', phone: '', password: '' },
          employee_id: generateEmployeeId(), salary: 200
        }}
        submitText="Create Teacher"
        isLoading={createTeacher.isPending}
        className="sm:max-w-md"
        fields={[
          {
            name: 'user.full_name',
            label: 'Full Name',
            type: 'text',
            required: true,
            placeholder: "Enter teacher's full name (e.g., John Doe)",
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
            placeholder: "Enter teacher's phone number"
          },
          {
            name: 'employee_id',
            label: 'Employee ID',
            type: 'text',
            required: false, // Not required since it's auto-generated
            placeholder: 'Automatically generated (e.g., T001, T002)',
            props: {
              readOnly: true
            }
          },
          {
            name: 'salary',
            label: 'Salary per Class (BDT)',
            type: 'number',
            required: true,
            placeholder: 'Enter salary per class',
            props: {
              min: 0,
              step: 1
            }
          },
          {
            name: 'user.password',
            label: 'Password',
            type: 'password',
            placeholder: 'Leave empty to auto-generate secure password'
          }
        ]}
      />

      {/* View Teacher Modal */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title=""
        data={selectedTeacher}
        className="sm:max-w-xl"
        customHeader={
          selectedTeacher ? (
            <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 text-white p-4 -m-6 mb-3 rounded-t-lg relative overflow-hidden">
              <div className="relative flex items-center space-x-3">
                {/* Small Profile Photo */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg bg-white">
                    {selectedTeacher.user?.photo_url || selectedTeacher.user?.photo_path ? (
                      <img
                        src={selectedTeacher.user.photo_url || (selectedTeacher.user.photo_path.startsWith('http') ? selectedTeacher.user.photo_path : null)}
                        alt={`${selectedTeacher.user?.full_name || 'Teacher'} profile`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-600">
                          {(selectedTeacher.user?.full_name || 'T').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Teacher Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">{selectedTeacher.user?.full_name || 'Teacher Details'}</h2>
                  <p className="text-sm text-emerald-100">ID: {selectedTeacher.employee_id}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">{selectedTeacher.salary || 200} BDT/class</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      selectedTeacher.user?.is_active ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
                    }`}>
                      {selectedTeacher.user?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null
        }
        sections={[
          {
            title: 'Personal Info',
            icon: Users,
            iconColor: 'text-emerald-600',
            bgColor: 'from-emerald-50 to-teal-50',
            borderColor: 'border-emerald-100',
            fields: [
              { label: 'Name', value: selectedTeacher?.user?.full_name || 'N/A', type: 'text' },
              { label: 'Username', value: selectedTeacher?.user?.username || 'N/A', type: 'mono' },
              { label: 'Employee ID', value: selectedTeacher?.employee_id || 'N/A', type: 'bold' },
              { label: 'Phone', value: selectedTeacher?.user?.phone || 'N/A', type: 'text' }
            ]
          },
          {
            title: 'Salary Info',
            icon: Briefcase,
            iconColor: 'text-teal-600',
            bgColor: 'from-teal-50 to-cyan-50',
            borderColor: 'border-teal-100',
            fields: [
              { label: 'Salary per Class', value: `${selectedTeacher?.salary || 200} BDT`, type: 'green' }
            ]
          },
          {
            title: 'Account Status',
            icon: CheckCircle,
            iconColor: 'text-cyan-600',
            bgColor: 'from-cyan-50 to-blue-50',
            borderColor: 'border-cyan-100',
            fields: [
              {
                label: 'Status',
                value: selectedTeacher?.user?.is_active ? 'Active' : 'Inactive',
                type: 'status',
                statusColor: selectedTeacher?.user?.is_active ? 'bg-green-500' : 'bg-red-500'
              }
            ]
          }
        ]}
        actions={[
          {
            label: 'Edit',
            icon: Edit,
            variant: 'outline',
            size: 'sm',
            onClick: () => {
              setShowViewModal(false)
              handleEditTeacher(selectedTeacher)
            },
            className: 'text-xs'
          },
          {
            label: 'Reset Password',
            icon: KeyRound,
            variant: 'outline',
            size: 'sm',
            onClick: () => {
              setShowViewModal(false)
              setShowPasswordModal(true)
            },
            className: 'text-xs text-orange-600 hover:bg-orange-50'
          },
          {
            label: 'Close',
            icon: CheckCircle,
            variant: 'default',
            size: 'sm',
            onClick: () => setShowViewModal(false),
            className: 'text-xs bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800'
          }
        ]}
      />

      {/* Edit Teacher Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditForm(null)
        }}
        onSubmit={handleUpdateTeacher}
        title="Edit Teacher"
        initialData={editForm}
        submitText="Update Teacher"
        isLoading={updateTeacher.isPending}
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
            label: 'Phone Number',
            type: 'tel',
            required: true
          },
          {
            name: 'employee_id',
            label: 'Employee ID',
            type: 'text',
            required: true
          },
          {
            name: 'salary',
            label: 'Salary per Class (BDT)',
            type: 'number',
            required: true,
            props: {
              min: 0,
              step: 1
            }
          }
        ]}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        confirmText="Delete Teacher"
        isLoading={deleteTeacher.isPending}
        icon={AlertCircle}
        iconColor="text-red-600"
      >
        <p className="text-red-800 text-sm">
          Are you sure you want to delete <strong>{selectedTeacher?.user?.full_name}</strong>?
          This action cannot be undone.
        </p>
      </ConfirmationModal>

      {/* Reset Password Confirmation Modal */}
      <ConfirmationModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false)
          setSelectedTeacher(null)
        }}
        onConfirm={confirmResetPassword}
        title="Reset Teacher Password"
        confirmText="Reset Password"
        confirmVariant="default"
        isLoading={updateTeacherPassword.isPending}
        icon={AlertCircle}
        iconColor="text-orange-600"
      >
        {selectedTeacher && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">Teacher Details:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Name:</strong> {selectedTeacher.user?.full_name}</p>
              <p><strong>Username:</strong> {selectedTeacher.user?.username}</p>
              <p><strong>Employee ID:</strong> {selectedTeacher.employee_id}</p>
            </div>
          </div>
        )}
        <p className="text-orange-800 text-sm">
          Are you sure you want to reset the password for <strong>{selectedTeacher?.user?.full_name}</strong>?
        </p>
        <div className="mt-3 text-orange-800 text-sm">
          <p><strong>What will happen:</strong></p>
          <ul className="ml-4 list-disc mt-1">
            <li>A new secure password will be generated</li>
            <li>The teacher's current password will be invalidated</li>
            <li>New credentials will be displayed for sharing</li>
            <li>Teacher must use the new password for login</li>
          </ul>
        </div>
      </ConfirmationModal>

      {/* Credentials Display Modal */}
      <CredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => {
          setShowCredentialsModal(false)
          setNewTeacherCredentials(null)
          toast.success('Teacher account ready for use!')
        }}
        credentials={newTeacherCredentials}
        entityType="Teacher"
        onCopy={copyCredentials}
        onPrint={printCredentials}
      />
    </div>
  )
}

export default AdminTeachers