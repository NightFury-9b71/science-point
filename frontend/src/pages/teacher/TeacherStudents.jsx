import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Eye } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { useTeacherClasses, useTeacherStudents } from '../../services/queries'

const TeacherStudents = () => {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const teacherId = user?.teacher_id || user?.teacherId
  
  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  // Show error if teacher ID is not available
  if (!teacherId) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 mb-2">
            <ArrowLeft className="h-8 w-8 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Teacher Profile Not Found</h3>
          <p className="text-red-700">
            Your teacher profile is not properly set up. Please contact the administrator.
          </p>
        </div>
      </div>
    )
  }
  
  const { data: myStudents = [], isLoading } = useTeacherStudents(teacherId)
  const { data: myClasses = [] } = useTeacherClasses(teacherId)
  
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const handleViewStudent = (student) => {
    setSelectedStudent(student)
    setShowViewModal(true)
  }

  // Filter and sort students
  const filteredStudents = myStudents
    .filter(student => {
      const matchesSearch = !searchQuery || 
        student.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/teacher')}
          className="lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg sm:text-xl font-semibold">My Students</h2>
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
                  placeholder="Search by name, roll number, or email..."
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
                {myClasses.map(cls => (
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
          
          {/* Results Count and Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredStudents.length} of {myStudents.length} students
            </div>
            <div className="flex items-center gap-2">
              {/* Clear Filters */}
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
        </div>
      </Card>

      {/* Mobile Cards */}
      <div className="block sm:hidden space-y-3">
        {filteredStudents && filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
          <Card key={student.id} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{student.user?.full_name || 'N/A'}</h3>
                  <p className="text-sm text-gray-600">Roll: {student.roll_number}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleViewStudent(student)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Email: {student.user?.email || 'N/A'}</p>
                <p>Class: {myClasses.find(cls => cls.id === student.class_id)?.name || `Class ${student.class_id}`}</p>
                <p>Parent: {student.parent_name || 'N/A'}</p>
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
                    <Table.Head>Roll Number</Table.Head>
                    <Table.Head>Full Name</Table.Head>
                    <Table.Head className="hidden md:table-cell">Email</Table.Head>
                    <Table.Head>Class</Table.Head>
                    <Table.Head className="hidden lg:table-cell">Parent Name</Table.Head>
                    <Table.Head>Actions</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredStudents.map((student) => (
                    <Table.Row key={student.id}>
                      <Table.Cell>{student.roll_number}</Table.Cell>
                      <Table.Cell>{student.user?.full_name || 'N/A'}</Table.Cell>
                      <Table.Cell className="hidden md:table-cell">{student.user?.email || 'N/A'}</Table.Cell>
                      <Table.Cell>{myClasses.find(cls => cls.id === student.class_id)?.name || `Class ${student.class_id}`}</Table.Cell>
                      <Table.Cell className="hidden lg:table-cell">{student.parent_name || 'N/A'}</Table.Cell>
                      <Table.Cell>
                        <Button size="sm" variant="outline" onClick={() => handleViewStudent(student)}>
                          <Eye className="h-4 w-4" />
                        </Button>
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

      {/* View Student Modal */}
      <Modal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)}
        title="Student Details"
        className="sm:max-w-lg"
      >
        {selectedStudent ? (
          <div className="space-y-4 p-2 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Full Name:</span>
                <span className="ml-2 text-gray-900">{selectedStudent.user?.full_name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Username:</span>
                <span className="ml-2 text-gray-900">{selectedStudent.user?.username || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{selectedStudent.user?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="ml-2 text-gray-900">{selectedStudent.user?.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Roll Number:</span>
                <span className="ml-2 text-gray-900">{selectedStudent.roll_number || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Class:</span>
                <span className="ml-2 text-gray-900">{myClasses.find(cls => cls.id === selectedStudent?.class_id)?.name || `Class ${selectedStudent?.class_id}` || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Parent Name:</span>
                <span className="ml-2 text-gray-900">{selectedStudent.parent_name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Parent Phone:</span>
                <span className="ml-2 text-gray-900">{selectedStudent.parent_phone || 'N/A'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="font-medium text-gray-700">Address:</span>
                <span className="ml-2 text-gray-900">{selectedStudent.address || 'N/A'}</span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </Modal>
    </div>
  )
}

export default TeacherStudents