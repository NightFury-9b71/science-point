import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Search, Eye, Download, Upload, AlertCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { Input, Select } from '../../components/Form'
import { useAuth } from '../../contexts/AuthContext'
import { useTeacherExams, useTeacherClasses, useTeacherSubjects, useTeacherStudents, useExamResults, useCreateResult, useUpdateResult } from '../../services/queries'

const TeacherResults = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const teacherId = user?.teacher_id || user?.teacherId
  const { data: myExams = [], isLoading: examsLoading } = useTeacherExams(teacherId)
  const { data: myClasses = [] } = useTeacherClasses(teacherId)
  const { data: mySubjects = [] } = useTeacherSubjects(teacherId)
  const { data: myStudents = [] } = useTeacherStudents(teacherId)
  
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

  // Get selected exam details with correct field names
  const selectedExam = selectedExamId ? myExams.find(exam => exam.id === parseInt(selectedExamId)) : null
  
  // Create consistent field accessors
  const examTitle = selectedExam?.name || selectedExam?.title || 'Unknown Exam'
  const examSubject = selectedExam?.subject?.name || 'N/A'
  const examClass = selectedExam?.class_assigned?.name || selectedExam?.class?.name || 'N/A'
  const totalMarks = selectedExam?.max_marks || selectedExam?.total_marks || 100
  const examDate = selectedExam?.exam_date ? new Date(selectedExam.exam_date).toLocaleDateString() : 'N/A'

  const handleCreateResult = async (e) => {
    e.preventDefault()
    
    // Validate form data
    if (!resultForm.student_id || !resultForm.obtained_marks) {
      toast.error('Please fill in all required fields')
      return
    }
    
    if (!selectedExamId) {
      toast.error('Please select an exam first')
      return
    }
    
    const examId = parseInt(selectedExamId)
    const studentId = parseInt(resultForm.student_id)
    const marksObtained = parseFloat(resultForm.obtained_marks)
    
    if (isNaN(examId) || examId <= 0) {
      toast.error('Invalid exam selection')
      return
    }
    
    if (isNaN(studentId) || studentId <= 0) {
      toast.error('Invalid student selection')
      return
    }
    
    if (isNaN(marksObtained) || marksObtained < 0) {
      toast.error('Invalid marks entered')
      return
    }
    
    if (selectedExam && marksObtained > totalMarks) {
      toast.error(`Marks cannot exceed maximum marks (${totalMarks})`)
      return
    }
    
    try {
      await createResult.mutateAsync({
        exam_id: examId,
        student_id: studentId,
        marks_obtained: marksObtained,
        remarks: resultForm.remarks || ''
      })
      setShowCreateModal(false)
      setResultForm({ student_id: '', obtained_marks: '', remarks: '' })
      toast.success('Result added successfully!')
    } catch (error) {
      console.error('Create result error:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to add result'
      toast.error(errorMessage)
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
      obtained_marks: (result.marks_obtained || result.obtained_marks || 0).toString(),
      remarks: result.remarks || ''
    })
    setShowEditModal(true)
  }

  const handleExportResults = (format = 'csv') => {
    if (!selectedExam || examResults.length === 0) {
      toast.error('No results to export')
      return
    }

    if (format === 'pdf') {
      exportToPDF()
    } else {
      exportToCSV()
    }
  }

  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Student Name', 'Roll Number', 'Obtained Marks', 'Total Marks', 'Percentage', 'Grade', 'Remarks']
    const csvContent = [
      headers.join(','),
      ...examResults.map(result => [
        `"${result.student?.user?.full_name || 'N/A'}"`,
        `"${result.student?.roll_number || 'N/A'}"`,
        result.marks_obtained || result.obtained_marks || 0,
        totalMarks,
        `${(((result.marks_obtained || result.obtained_marks || 0) / totalMarks) * 100).toFixed(2)}%`,
        calculateGrade(result.marks_obtained || result.obtained_marks || 0, totalMarks),
        `"${result.remarks || ''}"`
      ].join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${examTitle}_Results.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Results exported to CSV successfully!')
  }

  const exportToPDF = () => {
    if (!selectedExam || !examResults.length) {
      toast.error('No exam or results data available for export')
      return
    }

    // Debug logging for PDF data
    console.log('PDF Export Debug:', {
      examResults,
      selectedExam,
      firstResult: examResults[0],
      studentData: examResults[0]?.student,
      allResultKeys: examResults[0] ? Object.keys(examResults[0]) : [],
      studentKeys: examResults[0]?.student ? Object.keys(examResults[0].student) : []
    })

    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank')
    
    // Safely get exam details with fallbacks
    const examTitle = selectedExam?.name || selectedExam?.title || 'Unknown Exam'
    const examSubject = selectedExam?.subject?.name || 'N/A'
    const examClass = selectedExam?.class_assigned?.name || selectedExam?.class?.name || 'N/A'
    const totalMarks = selectedExam?.max_marks || selectedExam?.total_marks || 100
    const examDate = selectedExam?.exam_date ? new Date(selectedExam.exam_date).toLocaleDateString() : 'N/A'
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${examTitle} - Results Report</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              margin: 0;
              padding: 20px;
              color: #000;
              background: #fff;
              line-height: 1.4;
              font-size: 12px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .header h2 {
              margin: 5px 0 0 0;
              font-size: 14px;
              font-weight: normal;
            }
            .info-section {
              margin-bottom: 20px;
              border: 1px solid #000;
              padding: 15px;
            }
            .info-title {
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 10px;
              font-size: 12px;
              text-decoration: underline;
            }
            .info-content {
              font-size: 12px;
              line-height: 1.3;
              display: flex;
              justify-content: space-around;
              align-items: center;
              flex-wrap: wrap;
              gap: 15px;
            }
            .info-content span {
              font-weight: bold;
              white-space: nowrap;
            }
              border-collapse: separate;
              border-spacing: 0;
            }
            .info-item {
              display: table-row;
            }
            .info-item .info-value {
              display: table-cell;
              background: white;
              padding: 15px 20px;
              border: 1px solid #2196F3;
              font-weight: 600;
              color: #1565C0;
              font-size: 16px;
              text-align: center;
              vertical-align: middle;
            }
            .info-item:first-child .info-value {
              border-top-left-radius: 8px;
              border-top-right-radius: 8px;
            }
            .info-item:last-child .info-value {
              border-bottom-left-radius: 8px;
              border-bottom-right-radius: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              border: 1px solid #000;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px 10px;
              text-align: center;
              font-size: 11px;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-transform: uppercase;
            }
            td:nth-child(2) {
              text-align: center;
            }
            .overview {
              margin-top: 25px;
              border: 1px solid #000;
              padding: 15px;
            }
            .overview-title {
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 10px;
              text-decoration: underline;
            }
            .overview-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-top: 10px;
            }
            .overview-item {
              text-align: center;
              padding: 8px;
              border: 1px solid #ccc;
            }
            .overview-number {
              font-size: 16px;
              font-weight: bold;
              display: block;
            }
            .overview-label {
              font-size: 10px;
              margin-top: 3px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .overview-item { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Science Point Coaching</h1>
            <h2>Examination Results Report</h2>
          </div>
          
          <div class="info-section">
            <div class="info-title">Examination Details</div>
            <div class="info-content">
              <span>Exam: ${examTitle}</span>
              <span>Subject: ${examSubject}</span>
              <span>Class: ${examClass}</span>
              <span>Total Marks: ${totalMarks}</span>
              <span>Date: ${examDate}</span>
              <span>Generated: ${new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 8%;">Rank</th>
                <th style="width: 30%;">Student Name</th>
                <th style="width: 15%;">Roll Number</th>
                <th style="width: 12%;">Obtained</th>
                <th style="width: 10%;">Total</th>
                <th style="width: 12%;">Percentage</th>
                <th style="width: 13%;">Grade</th>
              </tr>
            </thead>
            <tbody>
              ${examResults
                .sort((a, b) => (b.marks_obtained || b.obtained_marks || 0) - (a.marks_obtained || a.obtained_marks || 0))
                .map((result, index) => {
                  const obtainedMarks = result.marks_obtained || result.obtained_marks || 0
                  const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : '0.00'
                  const grade = calculateGrade(obtainedMarks, totalMarks)
                  
                  // Try to get student data with extensive fallbacks and logging
                  let studentName = 'Unknown Student'
                  let rollNumber = 'N/A'
                  
                  // Log the result structure for debugging
                  console.log('Processing result for PDF:', {
                    resultId: result.id,
                    studentId: result.student_id,
                    fullResult: result,
                    studentObject: result.student,
                    availableKeys: Object.keys(result),
                    marks_obtained: result.marks_obtained,
                    obtained_marks: result.obtained_marks,
                    extractedMarks: obtainedMarks
                  })
                  
                  // Try multiple paths for student name
                  if (result.student?.user?.full_name) {
                    studentName = result.student.user.full_name
                  } else if (result.student?.user?.name) {
                    studentName = result.student.user.name
                  } else if (result.student?.full_name) {
                    studentName = result.student.full_name
                  } else if (result.student?.name) {
                    studentName = result.student.name
                  } else if (result.student_name) {
                    studentName = result.student_name
                  } else if (result.name) {
                    studentName = result.name
                  } else {
                    // Fallback: try to find student in teacher's student list
                    const teacherStudent = myStudents.find(s => s.id === result.student_id)
                    if (teacherStudent?.user?.full_name) {
                      studentName = teacherStudent.user.full_name
                    } else if (teacherStudent?.name) {
                      studentName = teacherStudent.name
                    }
                  }
                  
                  // Try multiple paths for roll number
                  if (result.student?.roll_number) {
                    rollNumber = result.student.roll_number
                  } else if (result.roll_number) {
                    rollNumber = result.roll_number
                  } else if (result.student?.student_id) {
                    rollNumber = result.student.student_id
                  } else if (result.student_id) {
                    rollNumber = `ID-${result.student_id}`
                  } else {
                    // Fallback: try to find student in teacher's student list
                    const teacherStudent = myStudents.find(s => s.id === result.student_id)
                    if (teacherStudent?.roll_number) {
                      rollNumber = teacherStudent.roll_number
                    }
                  }
                  
                  return `
                    <tr>
                      <td class="text-center">
                        <span class="rank-badge ${index < 3 ? `rank-${index + 1}` : ''}">${index + 1}</span>
                      </td>
                      <td class="student-name">${studentName}</td>
                      <td class="text-center">${rollNumber}</td>
                      <td class="text-center">
                        <span class="marks-obtained">${obtainedMarks}</span>
                      </td>
                      <td class="text-center">${totalMarks}</td>
                      <td class="text-center">
                        <span class="percentage grade-${grade}">${percentage}%</span>
                      </td>
                      <td class="text-center">
                        <span class="percentage grade-${grade}">${grade}</span>
                      </td>
                    </tr>
                  `
                }).join('')}
            </tbody>
          </table>

          <div class="overview">
            <div class="overview-title">Results Overview</div>
            <div class="overview-grid">
              <div class="overview-item">
                <span class="overview-number">${examResults.length}</span>
                <div class="overview-label">Total Students</div>
              </div>
              <div class="overview-item">
                <span class="overview-number">${examResults.length > 0 ? (examResults.reduce((sum, r) => sum + (r.marks_obtained || r.obtained_marks || 0), 0) / examResults.length).toFixed(1) : '0'}</span>
                <div class="overview-label">Average Marks</div>
              </div>
              <div class="overview-item">
                <span class="overview-number">${examResults.filter(r => {
                  const marks = r.marks_obtained || r.obtained_marks || 0;
                  return totalMarks > 0 ? (marks / totalMarks) * 100 >= 40 : false;
                }).length}</span>
                <div class="overview-label">Passed</div>
              </div>
              <div class="overview-item">
                <span class="overview-number">${(() => {
                  const avgPercentage = examResults.length > 0 ? 
                    (examResults.reduce((sum, r) => sum + (r.marks_obtained || r.obtained_marks || 0), 0) / examResults.length) / totalMarks * 100 : 0;
                  if (avgPercentage >= 90) return 'A+';
                  if (avgPercentage >= 80) return 'A';
                  if (avgPercentage >= 70) return 'B+';
                  if (avgPercentage >= 60) return 'B';
                  if (avgPercentage >= 50) return 'C+';
                  if (avgPercentage >= 40) return 'C';
                  return 'F';
                })()}</span>
                <div class="overview-label">Class Grade</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Science Point Coaching Management System</p>
            <p>Report generated on ${new Date().toLocaleDateString()} by ${user?.full_name || 'Teacher'}</p>
          </div>
        </body>
      </html>
    `
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print()
      toast.success('PDF export initiated! Please check your browser\'s print dialog.')
    }, 500)
  }

  const calculateGrade = (obtained, total) => {
    const percentage = (obtained / total) * 100
    if (percentage >= 80) return '5.00 (A+)'
    if (percentage >= 70) return '4.00 (A)'
    if (percentage >= 60) return '3.50 (A-)'
    if (percentage >= 50) return '3.00 (B)'
    if (percentage >= 40) return '2.00 (C)'
    if (percentage >= 33) return '1.00 (D)'
    return '0.00 (F)'
  }

  // Filter and sort results
  const filteredResults = examResults
    .filter(result => {
      const matchesSearch = !searchQuery || 
        result.student?.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.student?.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'student_name':
          return (a.student?.user?.full_name || '').localeCompare(b.student?.user?.full_name || '')
        case 'roll_number':
          return (a.student?.roll_number || '').localeCompare(b.student?.roll_number || '')
        case 'marks_high':
          return (b.marks_obtained || b.obtained_marks || 0) - (a.marks_obtained || a.obtained_marks || 0)
        case 'marks_low':
          return (a.marks_obtained || a.obtained_marks || 0) - (b.marks_obtained || b.obtained_marks || 0)
        case 'percentage':
          const percentA = ((a.marks_obtained || a.obtained_marks || 0) / (selectedExam?.total_marks || 100)) * 100
          const percentB = ((b.marks_obtained || b.obtained_marks || 0) / (selectedExam?.total_marks || 100)) * 100
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

  // Detailed logging for examResults structure
  if (examResults.length > 0) {
    console.log('First examResult structure:', examResults[0])
    console.log('Student data in first result:', examResults[0]?.student)
    console.log('Available properties in result:', Object.keys(examResults[0] || {}))
    console.log('Marks data:', {
      marks_obtained: examResults[0]?.marks_obtained,
      obtained_marks: examResults[0]?.obtained_marks,
      rawValue: examResults[0]?.marks_obtained || examResults[0]?.obtained_marks
    })
    if (examResults[0]?.student) {
      console.log('Available properties in student:', Object.keys(examResults[0].student || {}))
    }
  }

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
            <div className="relative inline-block text-left">
              <div className="flex space-x-1">
                <Button onClick={() => handleExportResults('csv')} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">CSV</span>
                </Button>
                <Button onClick={() => handleExportResults('pdf')} size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
              </div>
            </div>
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
                  <h3 className="font-medium text-blue-900">{examTitle}</h3>
                  <p className="text-blue-700 text-sm">
                    {examSubject} • {examClass} • 
                    Total Marks: {totalMarks} • 
                    Date: {examDate}
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
                      {examResults.filter(r => ((r.marks_obtained || r.obtained_marks || 0) / totalMarks) * 100 >= 40).length}
                    </div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {examResults.filter(r => ((r.marks_obtained || r.obtained_marks || 0) / totalMarks) * 100 < 40).length}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {examResults.length > 0 
                        ? ((examResults.reduce((sum, r) => sum + (r.marks_obtained || r.obtained_marks || 0), 0) / examResults.length / totalMarks) * 100).toFixed(1)
                        : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Score</div>
                  </div>
                </div>
              </Card>

              {/* Results Table */}
              <div className="space-y-4">
                {filteredResults.map((result) => {
                  const obtainedMarks = result.marks_obtained || result.obtained_marks || 0
                  const percentage = ((obtainedMarks / totalMarks) * 100).toFixed(2)
                  const grade = calculateGrade(obtainedMarks, totalMarks)
                  const passed = percentage >= 40

                  return (
                    <Card key={result.id} className="p-4 sm:p-6">
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                              {result.student?.user?.full_name || result.student?.name || 'Unknown Student'}
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
                            <span className="font-medium">{obtainedMarks}/{totalMarks}</span>
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
            label={`Obtained Marks (out of ${totalMarks})`}
            type="number"
            step="0.5"
            min="0"
            max={totalMarks}
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
                {selectedResult.student?.user?.full_name || selectedResult.student?.name || 'Unknown Student'} ({selectedResult.student?.roll_number})
              </span>
            </div>
            <Input
              label={`Obtained Marks (out of ${totalMarks})`}
              type="number"
              step="0.5"
              min="0"
              max={totalMarks}
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