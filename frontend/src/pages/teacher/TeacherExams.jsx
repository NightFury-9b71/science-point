import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Search, Eye } from 'lucide-react'
import { toast } from 'sonner'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { Input, Select } from '../../components/Form'
import { useAuth } from '../../contexts/AuthContext'
import { useTeacherExams, useTeacherClasses, useTeacherSubjects, useCreateExam } from '../../services/queries'

const TeacherExams = () => {
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
  
  const { data: myExams = [], isLoading } = useTeacherExams(teacherId)
  const { data: myClasses = [] } = useTeacherClasses(teacherId)
  const { data: mySubjects = [] } = useTeacherSubjects(teacherId)
  const createExam = useCreateExam()

  // Debug logging
  console.log('TeacherExams Debug:', {
    teacherId,
    myExams,
    myExamsLength: myExams.length,
    isLoading,
    myClasses,
    mySubjects
  })
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedExam, setSelectedExam] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [examForm, setExamForm] = useState({
    title: '',
    subject_id: '',
    class_id: '',
    exam_date: '',
    duration_minutes: 60,
    total_marks: 100,
    instructions: ''
  })

  const handleCreateExam = async (e) => {
    e.preventDefault()
    try {
      await createExam.mutateAsync({
        name: examForm.title, // Backend uses 'name', frontend uses 'title'
        max_marks: examForm.total_marks, // Backend uses 'max_marks', frontend uses 'total_marks'
        exam_date: examForm.exam_date,
        duration_minutes: examForm.duration_minutes,
        instructions: examForm.instructions,
        teacher_id: teacherId,
        subject_id: parseInt(examForm.subject_id),
        class_id: parseInt(examForm.class_id)
      })
      setShowCreateModal(false)
      setExamForm({
        title: '',
        subject_id: '',
        class_id: '',
        exam_date: '',
        duration_minutes: 60,
        total_marks: 100,
        instructions: ''
      })
      toast.success('Exam created successfully!')
    } catch (error) {
      toast.error('Failed to create exam')
    }
  }

  const handleViewExam = (exam) => {
    setSelectedExam(exam)
    setShowViewModal(true)
  }

  // Filter and sort exams
  const filteredExams = myExams
    .filter(exam => {
      const matchesSearch = !searchQuery || 
        exam.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesSubject = !selectedSubject || exam.subject_id === parseInt(selectedSubject)
      const matchesClass = !selectedClass || exam.class_id === parseInt(selectedClass)
      
      const matchesDate = !dateFilter || exam.exam_date?.startsWith(dateFilter)
      
      return matchesSearch && matchesSubject && matchesClass && matchesDate
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '')
        case 'date':
          return new Date(a.exam_date) - new Date(b.exam_date)
        case 'subject':
          return (a.subject?.name || '').localeCompare(b.subject?.name || '')
        case 'class':
          return (a.class?.name || '').localeCompare(b.class?.name || '')
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/teacher')}
            className="lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg sm:text-xl font-semibold">My Exams</h2>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Create Exam</span>
          <span className="sm:hidden">Create</span>
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
                  placeholder="Search exams by title or subject..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Subject Filter */}
            <div className="w-full lg:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">All Subjects</option>
                {mySubjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
            
            {/* Class Filter */}
            <div className="w-full lg:w-48">
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
            
            {/* Date Filter */}
            <div className="w-full lg:w-48">
              <input
                type="month"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            
            {/* Sort Options */}
            <div className="w-full lg:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="subject">Sort by Subject</option>
                <option value="class">Sort by Class</option>
              </select>
            </div>
          </div>
          
          {/* Results Count and Clear Filters */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredExams.length} of {myExams.length} exams
            </div>
            {(searchQuery || selectedSubject || selectedClass || dateFilter || sortBy !== 'date') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedSubject('')
                  setSelectedClass('')
                  setDateFilter('')
                  setSortBy('date')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Exams List */}
      <div className="space-y-4">
        {filteredExams.length > 0 ? (
          filteredExams.map((exam) => (
            <Card key={exam.id} className="p-4 sm:p-6">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{exam.title}</h3>
                    <p className="text-gray-600 text-sm">{exam.subject?.name} • {exam.class?.name}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleViewExam(exam)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-500">
                  <span>Date: {new Date(exam.exam_date).toLocaleDateString()}</span>
                  <span>Duration: {exam.duration_minutes} mins</span>
                  <span>Marks: {exam.total_marks}</span>
                </div>
              </div>
            </Card>
          ))
        ) : myExams.length > 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No exams found matching your filters.</p>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No exams created yet</p>
          </Card>
        )}
      </div>

      {/* Create Exam Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        title="Create New Exam"
        className="sm:max-w-lg"
      >
        <form onSubmit={handleCreateExam} className="space-y-4">
          <Input
            label="Exam Title"
            value={examForm.title}
            onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
            required
          />
          <Select
            label="Subject"
            value={examForm.subject_id}
            onChange={(e) => setExamForm({ ...examForm, subject_id: e.target.value })}
            options={[
              { value: '', label: 'Select subject' },
              ...mySubjects.map(subject => ({ 
                value: subject.id, 
                label: subject.name 
              }))
            ]}
            required
          />
          <Select
            label="Class"
            value={examForm.class_id}
            onChange={(e) => setExamForm({ ...examForm, class_id: e.target.value })}
            options={[
              { value: '', label: 'Select class' },
              ...myClasses.map(cls => ({ 
                value: cls.id, 
                label: cls.name 
              }))
            ]}
            required
          />
          <Input
            label="Exam Date"
            type="datetime-local"
            value={examForm.exam_date}
            onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (minutes)"
              type="number"
              value={examForm.duration_minutes}
              onChange={(e) => setExamForm({ ...examForm, duration_minutes: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Total Marks"
              type="number"
              value={examForm.total_marks}
              onChange={(e) => setExamForm({ ...examForm, total_marks: parseInt(e.target.value) })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Instructions</label>
            <textarea
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows={3}
              value={examForm.instructions}
              onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
              placeholder="Enter exam instructions..."
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createExam.isPending}>
              Create Exam
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Exam Modal */}
      <Modal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)}
        title="Exam Details"
        className="sm:max-w-lg"
      >
        {selectedExam ? (
          <div className="space-y-4 p-2 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Title:</span>
                <span className="ml-2 text-gray-900">{selectedExam.title}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Subject:</span>
                <span className="ml-2 text-gray-900">{selectedExam.subject?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Class:</span>
                <span className="ml-2 text-gray-900">{selectedExam.class?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Date:</span>
                <span className="ml-2 text-gray-900">{new Date(selectedExam.exam_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Duration:</span>
                <span className="ml-2 text-gray-900">{selectedExam.duration_minutes} minutes</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total Marks:</span>
                <span className="ml-2 text-gray-900">{selectedExam.total_marks}</span>
              </div>
              {selectedExam.instructions && (
                <div className="sm:col-span-2">
                  <span className="font-medium text-gray-700">Instructions:</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    <span className="text-gray-900">{selectedExam.instructions}</span>
                  </div>
                </div>
              )}
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

export default TeacherExams