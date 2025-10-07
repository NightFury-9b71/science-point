import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Search, Eye, Download, Upload, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { Input, Select } from '../../components/Form'
import { useAuth } from '../../contexts/AuthContext'
import { useTeacherExams, useTeacherClasses, useTeacherSubjects, useExamResults, useCreateResult, useUpdateResult } from '../../services/queries'

const TeacherResults = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const teacherId = user?.teacher_id || user?.teacherId
  const { data: myExams = [], isLoading: examsLoading } = useTeacherExams(teacherId)
  const { data: myClasses = [] } = useTeacherClasses(teacherId)
  const { data: mySubjects = [] } = useTeacherSubjects(teacherId)
  
  // State for selected exam and results
  const [selectedExamId, setSelectedExamId] = useState('')
  const { data: examResults = [], isLoading: resultsLoading } = useExamResults(
    selectedExamId ? { exam_id: selectedExamId } : {}
  )
  
  const createResult = useCreateResult()
  const updateResult = useUpdateResult()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [sortBy, setSortBy] = useState('student_name')
  const [resultForm, setResultForm] = useState({
    student_id: '',
    obtained_marks: '',
    remarks: ''
  })

  // Get selected exam details
  const selectedExam = myExams.find(exam => exam.id === parseInt(selectedExamId))

  const handleCreateResult = async (e) => {
    e.preventDefault()
    try {
      await createResult.mutateAsync({
        exam_id: parseInt(selectedExamId),
        student_id: parseInt(resultForm.student_id),
        marks_obtained: parseFloat(resultForm.obtained_marks), // Backend uses 'marks_obtained', frontend uses 'obtained_marks'
        remarks: resultForm.remarks
      })
      setShowCreateModal(false)
      setResultForm({ student_id: '', obtained_marks: '', remarks: '' })
      toast.success('Result added successfully!')
    } catch (error) {
      toast.error('Failed to add result')
    }
  }

  const handleUpdateResult = async (e) => {
    e.preventDefault()
    try {
      await updateResult.mutateAsync({
        id: selectedResult.id,
        marks_obtained: parseFloat(resultForm.obtained_marks), // Backend uses 'marks_obtained', frontend uses 'obtained_marks'
        remarks: resultForm.remarks
      })
      setShowEditModal(false)
      setSelectedResult(null)
      setResultForm({ student_id: '', obtained_marks: '', remarks: '' })
      toast.success('Result updated successfully!')
    } catch (error) {
      toast.error('Failed to update result')
    }
  }

  const handleEditResult = (result) => {
    setSelectedResult(result)
    setResultForm({
      student_id: result.student_id,
      obtained_marks: result.obtained_marks.toString(),
      remarks: result.remarks || ''
    })
    setShowEditModal(true)
  }

  const handleExportResults = () => {
    if (!selectedExam || examResults.length === 0) {
      toast.error('No results to export')
      return
    }

    // Create CSV content
    const headers = ['Student Name', 'Roll Number', 'Obtained Marks', 'Total Marks', 'Percentage', 'Grade', 'Remarks']
    const csvContent = [
      headers.join(','),
      ...examResults.map(result => [
        `"${result.student?.name || 'N/A'}"`,
        `"${result.student?.roll_number || 'N/A'}"`,
        result.obtained_marks,
        selectedExam.total_marks,
        `${((result.obtained_marks / selectedExam.total_marks) * 100).toFixed(2)}%`,
        calculateGrade(result.obtained_marks, selectedExam.total_marks),
        `"${result.remarks || ''}"`
      ].join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedExam.title}_Results.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Results exported successfully!')
  }

  const calculateGrade = (obtained, total) => {
    const percentage = (obtained / total) * 100
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B+'
    if (percentage >= 60) return 'B'
    if (percentage >= 50) return 'C'
    if (percentage >= 40) return 'D'
    return 'F'
  }

  // Filter and sort results
  const filteredResults = examResults
    .map(result => {
      // Enrich result with student data from selected exam
      const student = selectedExam?.students?.find(s => s.id === result.student_id) || null
      return {
        ...result,
        student: student ? {
          ...student,
          name: student.name || 'Unknown Student'
        } : null
      }
    })
    .filter(result => {
      const matchesSearch = !searchQuery || 
        result.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.student?.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'student_name':
          return (a.student?.name || '').localeCompare(b.student?.name || '')
        case 'roll_number':
          return (a.student?.roll_number || '').localeCompare(b.student?.roll_number || '')
        case 'marks_high':
          return b.obtained_marks - a.obtained_marks
        case 'marks_low':
          return a.obtained_marks - b.obtained_marks
        case 'percentage':
          const percentA = (a.obtained_marks / (selectedExam?.total_marks || 100)) * 100
          const percentB = (b.obtained_marks / (selectedExam?.total_marks || 100)) * 100
          return percentB - percentA
        default:
          return 0
      }
    })

  // Get students who haven't been assigned results yet
  const studentsWithoutResults = selectedExam?.students?.filter(student => 
    !examResults.some(result => result.student_id === student.id)
  ) || []

  // Debug logging
  console.log('TeacherResults Debug:', {
    teacherId,
    myExams,
    selectedExamId,
    selectedExam,
    examResults,
    examsLoading,
    resultsLoading,
    studentsInExam: selectedExam?.students?.length || 0,
    studentsWithoutResults: studentsWithoutResults?.length || 0
  })

  if (!teacherId) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Authentication Error</h3>
          <p className="text-red-700">
            Unable to identify teacher. Please log in again.
          </p>
        </div>
      </div>
    )
  }

  if (examsLoading) {
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
          <h2 className="text-lg sm:text-xl font-semibold">Exam Results</h2>
        </div>
                <div className="flex space-x-2">
          {selectedExamId && examResults.length > 0 && (
            <Button onClick={handleExportResults} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
          {selectedExamId && (
            <Button 
              onClick={() => setShowCreateModal(true)} 
              size="sm"
              disabled={studentsWithoutResults.length === 0}
            >
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">
                {studentsWithoutResults.length > 0 ? 'Add Result' : 'All Results Added'}
              </span>
              <span className="sm:hidden">
                {studentsWithoutResults.length > 0 ? 'Add' : 'Full'}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Exam Selection */}
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Exam Selection */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value)
                  setSearchQuery('')
                }}
              >
                <option value="">Choose an exam to view results</option>
                {myExams.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} - {exam.subject?.name} ({exam.class?.name})
                  </option>
                ))}
              </select>
            </div>

            {selectedExamId && (
              <>
                {/* Search */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or roll number..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Sort Options */}
                <div className="w-full lg:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="student_name">Student Name</option>
                    <option value="roll_number">Roll Number</option>
                    <option value="marks_high">Marks (High to Low)</option>
                    <option value="marks_low">Marks (Low to High)</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Exam Info */}
          {selectedExam && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                <div>
                  <h3 className="font-medium text-blue-900">{selectedExam.title}</h3>
                  <p className="text-blue-700 text-sm">
                    {selectedExam.subject?.name} • {selectedExam.class?.name} • 
                    Total Marks: {selectedExam.total_marks} • 
                    Date: {new Date(selectedExam.exam_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="text-sm text-blue-700">
                    Results: {examResults.length} / {selectedExam.students?.length || 0} students
                    {studentsWithoutResults.length > 0 && (
                      <span className="ml-2 text-orange-600 font-medium">
                        • {studentsWithoutResults.length} pending
                      </span>
                    )}
                  </div>
                  {studentsWithoutResults.length > 0 && (
                    <Button 
                      onClick={() => setShowCreateModal(true)} 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Results ({studentsWithoutResults.length} pending)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results List */}
      {selectedExamId && (
        <div className="space-y-4">
          {resultsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredResults.length > 0 ? (
            <>
              {/* Results Summary */}
              <Card className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{examResults.length}</div>
                    <div className="text-sm text-gray-600">Total Results</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {examResults.filter(r => (r.obtained_marks / selectedExam.total_marks) * 100 >= 40).length}
                    </div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {examResults.filter(r => (r.obtained_marks / selectedExam.total_marks) * 100 < 40).length}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {examResults.length > 0 
                        ? ((examResults.reduce((sum, r) => sum + r.obtained_marks, 0) / examResults.length / selectedExam.total_marks) * 100).toFixed(1)
                        : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Score</div>
                  </div>
                </div>
              </Card>

              {/* Results Table */}
              <div className="space-y-4">
                {filteredResults.map((result) => {
                  const percentage = ((result.obtained_marks / selectedExam.total_marks) * 100).toFixed(2)
                  const grade = calculateGrade(result.obtained_marks, selectedExam.total_marks)
                  const passed = percentage >= 40

                  return (
                    <Card key={result.id} className="p-4 sm:p-6">
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                              {result.student?.name || 'Unknown Student'}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              Roll: {result.student?.roll_number || 'N/A'}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditResult(result)}>
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline ml-1">Edit</span>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs sm:text-sm">
                          <div>
                            <span className="text-gray-500 block">Obtained</span>
                            <span className="font-medium">{result.obtained_marks}/{selectedExam.total_marks}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Percentage</span>
                            <span className={`font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
                              {percentage}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Grade</span>
                            <span className={`font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
                              {grade}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Status</span>
                            <span className={`font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
                              {passed ? 'Passed' : 'Failed'}
                            </span>
                          </div>
                          <div className="sm:col-span-1 col-span-2">
                            <span className="text-gray-500 block">Remarks</span>
                            <span className="text-gray-700">{result.remarks || 'No remarks'}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </>
          ) : examResults.length > 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No results found matching your search.</p>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Added Yet</h3>
                  <p className="text-gray-500">
                    {selectedExam?.students?.length || 0} students are waiting for their results
                  </p>
                </div>
                {studentsWithoutResults.length > 0 && (
                  <div className="space-y-2">
                    <Button 
                      onClick={() => setShowCreateModal(true)} 
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start Adding Results
                    </Button>
                    <p className="text-sm text-gray-400">
                      Click to add results one by one for each student
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {!selectedExamId && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Please select an exam to view or add results</p>
        </Card>
      )}

      {/* Create Result Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        title="Add Student Result"
        className="sm:max-w-lg"
      >
        {studentsWithoutResults.length > 0 ? (
          <form onSubmit={handleCreateResult} className="space-y-4">
            <Select
              label="Student"
              value={resultForm.student_id}
              onChange={(e) => setResultForm({ ...resultForm, student_id: e.target.value })}
              options={[
                { value: '', label: 'Select student' },
                ...studentsWithoutResults.map(student => ({ 
                  value: student.id, 
                  label: `${student.name} (${student.roll_number})` 
                }))
              ]}
              required
            />
          <Input
            label={`Obtained Marks (out of ${selectedExam?.total_marks || 0})`}
            type="number"
            step="0.5"
            min="0"
            max={selectedExam?.total_marks || 100}
            value={resultForm.obtained_marks}
            onChange={(e) => setResultForm({ ...resultForm, obtained_marks: e.target.value })}
            required
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Remarks</label>
            <textarea
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows={3}
              value={resultForm.remarks}
              onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
              placeholder="Enter any remarks or comments..."
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createResult.isPending}>
              Add Result
            </Button>
          </div>
        </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">All students in this exam already have results.</p>
            <p className="text-sm text-gray-400 mt-2">
              You can view and edit existing results from the results list.
            </p>
          </div>
        )}
      </Modal>

      {/* Edit Result Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        title="Edit Student Result"
        className="sm:max-w-lg"
      >
        {selectedResult && (
          <form onSubmit={handleUpdateResult} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-sm font-medium text-gray-700">Student: </span>
              <span className="text-gray-900">
                {selectedResult.student?.name} ({selectedResult.student?.roll_number})
              </span>
            </div>
            <Input
              label={`Obtained Marks (out of ${selectedExam?.total_marks || 0})`}
              type="number"
              step="0.5"
              min="0"
              max={selectedExam?.total_marks || 100}
              value={resultForm.obtained_marks}
              onChange={(e) => setResultForm({ ...resultForm, obtained_marks: e.target.value })}
              required
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Remarks</label>
              <textarea
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows={3}
                value={resultForm.remarks}
                onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
                placeholder="Enter any remarks or comments..."
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateResult.isPending}>
                Update Result
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default TeacherResults