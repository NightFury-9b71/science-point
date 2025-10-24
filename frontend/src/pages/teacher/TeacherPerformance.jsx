import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, TrendingUp, TrendingDown, Award, Users, BookOpen, Calendar, 
  BarChart3, Filter, Search, Download, Eye, ChevronUp, ChevronDown, FileText 
} from 'lucide-react'
import { toast } from 'sonner'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { Input } from '../../components/Form'
import { ViewModal } from '../../components/modals'
import { useAuth } from '../../contexts/AuthContext'
import { useTeacherClasses, useTeacherStudents, useTeacherSubjects, useExamResults, useAttendance, useExams } from '../../services/queries'

const TeacherPerformance = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const teacherId = user?.teacher_id || user?.teacherId

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('all') // 'all', 'month', 'quarter', 'year'
  const [sortBy, setSortBy] = useState('overall')
  const [sortOrder, setSortOrder] = useState('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Simple SortableHeader component
  const SortableHeader = ({ label, sortKey, currentSort, sortOrder, onSort }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {currentSort === sortKey && (
          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </th>
  )

  // Fetch data
  const { data: myClasses = [] } = useTeacherClasses(teacherId)
  const { data: myStudents = [] } = useTeacherStudents(teacherId)
  const { data: mySubjects = [] } = useTeacherSubjects(teacherId)
  const { data: examResults = [] } = useExamResults()
  const { data: attendanceRecords = [] } = useAttendance()
  const { data: exams = [] } = useExams()

  // Filter and search students
  const filteredStudents = useMemo(() => {
    let students = myStudents

    // Filter by class
    if (selectedClass) {
      students = students.filter(student => student.class_id === parseInt(selectedClass))
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      students = students.filter(student => 
        student.user?.full_name?.toLowerCase().includes(searchLower) ||
        student.roll_number?.toLowerCase().includes(searchLower) ||
        student.user?.email?.toLowerCase().includes(searchLower)
      )
    }

    return students
  }, [myStudents, selectedClass, searchTerm])

  // Calculate performance metrics
  const performanceData = useMemo(() => {
    const studentPerformance = filteredStudents.map(student => {
      // Get student's exam results (only for subjects taught by this teacher)
      const teacherSubjectIds = mySubjects.map(subject => subject.id)
      const studentResults = examResults.filter(result => {
        const exam = exams.find(e => e.id === result.exam_id)
        return result.student_id === student.id &&
               exam && teacherSubjectIds.includes(exam.subject_id)
      })

      // Calculate marks performance
      let marksPerformance = 0
      if (studentResults.length > 0) {
        const validResults = studentResults.filter(result => {
          const exam = exams.find(e => e.id === result.exam_id)
          return exam && exam.max_marks > 0 && result.marks_obtained >= 0
        })
        
        if (validResults.length > 0) {
          const totalMarks = validResults.reduce((sum, result) => {
            const exam = exams.find(e => e.id === result.exam_id)
            const maxMarks = exam.max_marks
            const percentage = Math.min(100, Math.max(0, (result.marks_obtained / maxMarks) * 100))
            return sum + percentage
          }, 0)
          marksPerformance = Math.round(totalMarks / validResults.length)
        }
      }

      // Get student's attendance
      const studentAttendance = attendanceRecords.filter(record => record.student_id === student.id)
      
      // Calculate attendance performance
      let attendancePerformance = 0
      if (studentAttendance.length > 0) {
        const presentDays = studentAttendance.filter(record => record.is_present === true).length
        attendancePerformance = Math.round((presentDays / studentAttendance.length) * 100)
      }

      // Calculate overall performance (weighted average)
      let overallPerformance = 0
      if (marksPerformance > 0 || attendancePerformance > 0) {
        if (marksPerformance > 0 && attendancePerformance > 0) {
          overallPerformance = Math.round((marksPerformance * 0.7) + (attendancePerformance * 0.3))
        } else if (marksPerformance > 0) {
          overallPerformance = marksPerformance
        } else {
          overallPerformance = attendancePerformance
        }
      }

      return {
        student,
        marksPerformance,
        attendancePerformance,
        overallPerformance,
        totalExams: studentResults.length,
        presentDays: studentAttendance.filter(record => record.is_present === true).length,
        totalDays: studentAttendance.length
      }
    })

    // Sort performance data
    const sortedPerformance = [...studentPerformance].sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a.student.user?.full_name || ''
          bValue = b.student.user?.full_name || ''
          break
        case 'roll':
          aValue = a.student.roll_number || ''
          bValue = b.student.roll_number || ''
          break
        case 'marks':
          aValue = a.marksPerformance
          bValue = b.marksPerformance
          break
        case 'attendance':
          aValue = a.attendancePerformance
          bValue = b.attendancePerformance
          break
        case 'overall':
        default:
          aValue = a.overallPerformance
          bValue = b.overallPerformance
          break
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }
    })

    // Add rank to each student
    const rankedPerformance = sortedPerformance.map((item, index) => ({
      ...item,
      rank: index + 1
    }))

    // Calculate class statistics
    const validMarks = rankedPerformance.filter(item => item.marksPerformance > 0)
    const validAttendance = rankedPerformance.filter(item => item.attendancePerformance > 0)
    const validOverall = rankedPerformance.filter(item => item.overallPerformance > 0)

    const classStats = {
      totalStudents: rankedPerformance.length,
      averageClassMarks: validMarks.length > 0
        ? Math.round(validMarks.reduce((sum, p) => sum + p.marksPerformance, 0) / validMarks.length)
        : 0,
      averageClassAttendance: validAttendance.length > 0
        ? Math.round(validAttendance.reduce((sum, p) => sum + p.attendancePerformance, 0) / validAttendance.length)
        : 0,
      excellentPerformers: validOverall.filter(p => p.overallPerformance >= 85).length,
      goodPerformers: validOverall.filter(p => p.overallPerformance >= 70 && p.overallPerformance < 85).length,
      needsImprovement: validOverall.filter(p => p.overallPerformance < 50).length
    }

    return {
      studentPerformance: rankedPerformance,
      classStats
    }
  }, [filteredStudents, examResults, attendanceRecords, mySubjects, exams, sortBy, sortOrder])

  const getPerformanceGrade = (score) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bgColor: 'bg-green-100', points: 4.0 }
    if (score >= 85) return { grade: 'A', color: 'text-green-600', bgColor: 'bg-green-100', points: 3.75 }
    if (score >= 80) return { grade: 'A-', color: 'text-blue-600', bgColor: 'bg-blue-100', points: 3.5 }
    if (score >= 75) return { grade: 'B+', color: 'text-blue-600', bgColor: 'bg-blue-100', points: 3.25 }
    if (score >= 70) return { grade: 'B', color: 'text-blue-600', bgColor: 'bg-blue-100', points: 3.0 }
    if (score >= 65) return { grade: 'B-', color: 'text-yellow-600', bgColor: 'bg-yellow-100', points: 2.75 }
    if (score >= 60) return { grade: 'C+', color: 'text-yellow-600', bgColor: 'bg-yellow-100', points: 2.5 }
    if (score >= 55) return { grade: 'C', color: 'text-yellow-600', bgColor: 'bg-yellow-100', points: 2.25 }
    if (score >= 50) return { grade: 'D', color: 'text-orange-600', bgColor: 'bg-orange-100', points: 2.0 }
    return { grade: 'F', color: 'text-red-600', bgColor: 'bg-red-100', points: 0.0 }
  }

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 85) return { status: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (percentage >= 75) return { status: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (percentage >= 65) return { status: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { status: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder(key === 'marks' || key === 'attendance' || key === 'overall' ? 'desc' : 'asc')
    }
  }

  const downloadPDF = () => {
    if (performanceData.studentPerformance.length === 0) {
      toast.error('No data available to export')
      return
    }

    try {
      // Calculate statistics for PDF from filtered data
      const totalStudents = performanceData.studentPerformance.length
      const averageClassMarks = performanceData.classStats.averageClassMarks
      const averageClassAttendance = performanceData.classStats.averageClassAttendance
      const excellentPerformers = performanceData.classStats.excellentPerformers
      const goodPerformers = performanceData.classStats.goodPerformers
      const needsImprovement = performanceData.classStats.needsImprovement

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Teacher Performance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1f2937; text-align: center; margin-bottom: 10px; }
            .header-info { text-align: center; margin-bottom: 30px; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .grade-A-plus { background-color: #dcfce7; color: #166534; }
            .grade-A { background-color: #dcfce7; color: #166534; }
            .grade-A-minus { background-color: #dbeafe; color: #1e40af; }
            .grade-B { background-color: #dbeafe; color: #1e40af; }
            .grade-C { background-color: #fef3c7; color: #d97706; }
            .grade-D { background-color: #fed7aa; color: #ea580c; }
            .grade-F { background-color: #fecaca; color: #dc2626; }
            .text-center { text-align: center; }
            .summary { margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>সায়েন্স পয়েন্ট - Teacher Performance Report</h1>
          <div class="header-info">
            <p>Report Generated: ${new Date().toLocaleDateString('en-GB')}</p>
            <p>Teacher: ${user?.full_name || 'N/A'}</p>
            <p>Total Students: ${totalStudents}</p>
            ${selectedClass ? `<p>Class: ${myClasses.find(cls => cls.id === parseInt(selectedClass))?.name || 'N/A'}</p>` : ''}
          </div>
          
          <div class="summary">
            <h3>Class Summary</h3>
            <p><strong>Average Marks:</strong> ${averageClassMarks}%</p>
            <p><strong>Average Attendance:</strong> ${averageClassAttendance}%</p>
            <p><strong>Excellent Performers (A+):</strong> ${excellentPerformers}</p>
            <p><strong>Good Performers (A, A-):</strong> ${goodPerformers}</p>
            <p><strong>Needs Improvement (F):</strong> ${needsImprovement}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Class</th>
                <th>Marks %</th>
                <th>Attendance %</th>
                <th>Overall %</th>
                <th>Grade</th>
                <th>GPA</th>
              </tr>
            </thead>
            <tbody>
              ${performanceData.studentPerformance.map((item) => {
                const grade = getPerformanceGrade(item.overallPerformance)
                const className = myClasses.find(cls => cls.id === item.student.class_id)?.name || 'N/A'
                const gradeClass = grade.grade.replace('+', '-plus').replace('-', '-minus')
                return `
                  <tr>
                    <td class="text-center">${item.rank || 0}</td>
                    <td>${item.student.user?.full_name || 'N/A'}</td>
                    <td class="text-center">${item.student.roll_number || 'N/A'}</td>
                    <td>${className}</td>
                    <td class="text-center">${item.marksPerformance || 0}%</td>
                    <td class="text-center">${item.attendancePerformance || 0}%</td>
                    <td class="text-center">${item.overallPerformance || 0}%</td>
                    <td class="text-center grade-${gradeClass}">${grade.grade}</td>
                    <td class="text-center">${Number(grade.points).toFixed(2)}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `

      // Create a new window and print as PDF
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (!printWindow) {
        toast.error('Popup blocked. Please allow popups and try again.')
        return
      }
      
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
        
        // Close the window after printing
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }
      
      toast.success(`Performance report PDF generated successfully (${totalStudents} students)`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF report. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <div>
                <Card.Title>Performance Analytics</Card.Title>
                <p className="text-sm text-gray-600 mt-1">Monitor student academic performance</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/teacher')}
                className="lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card.Header>
      </Card>

      {/* Filters */}
      <Card>
        <Card.Content>
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-4 w-4 text-blue-600" />
            <h3 className="font-medium text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
              <Search className="absolute left-3 top-9 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by name, roll number, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <div className="text-xs text-gray-500 mt-1">
                  Found {performanceData.studentPerformance.length} student{performanceData.studentPerformance.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All My Classes</option>
                {myClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.grade ? `(Grade ${cls.grade})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
          
          {/* Clear filters button */}
          {(searchTerm || selectedClass) && (
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedClass('')
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Class Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {performanceData.classStats?.totalStudents || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Marks</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {performanceData.classStats?.averageClassMarks || 0}%
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Attendance</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {performanceData.classStats?.averageClassAttendance || 0}%
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top Performers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {performanceData.classStats?.excellentPerformers || 0}
                </p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <Card.Title>Student Performance</Card.Title>
            </div>
            <p className="text-sm text-gray-600">
              Showing {performanceData.studentPerformance.length} students
            </p>
          </div>
        </Card.Header>
        <Card.Content className="p-0">
          {performanceData.studentPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <SortableHeader 
                      label="Rank" 
                      sortKey="overall" 
                      currentSort={sortBy} 
                      sortOrder={sortOrder} 
                      onSort={(key) => {
                        if (sortBy === key) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortBy(key)
                          setSortOrder('desc')
                        }
                      }}
                    />
                    <SortableHeader 
                      label="Student Name" 
                      sortKey="name" 
                      currentSort={sortBy} 
                      sortOrder={sortOrder} 
                      onSort={(key) => {
                        if (sortBy === key) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortBy(key)
                          setSortOrder('asc')
                        }
                      }}
                    />
                    <SortableHeader 
                      label="Roll No" 
                      sortKey="roll" 
                      currentSort={sortBy} 
                      sortOrder={sortOrder} 
                      onSort={(key) => {
                        if (sortBy === key) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortBy(key)
                          setSortOrder('asc')
                        }
                      }}
                    />
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <SortableHeader 
                      label="Marks (%)" 
                      sortKey="marks" 
                      currentSort={sortBy} 
                      sortOrder={sortOrder} 
                      onSort={(key) => {
                        if (sortBy === key) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortBy(key)
                          setSortOrder('desc')
                        }
                      }}
                    />
                    <SortableHeader 
                      label="Attendance (%)" 
                      sortKey="attendance" 
                      currentSort={sortBy} 
                      sortOrder={sortOrder} 
                      onSort={(key) => {
                        if (sortBy === key) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortBy(key)
                          setSortOrder('desc')
                        }
                      }}
                    />
                    <SortableHeader 
                      label="Overall (%)" 
                      sortKey="overall" 
                      currentSort={sortBy} 
                      sortOrder={sortOrder} 
                      onSort={(key) => {
                        if (sortBy === key) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortBy(key)
                          setSortOrder('desc')
                        }
                      }}
                    />
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {performanceData.studentPerformance.map((performance) => {
                    const grade = getPerformanceGrade(performance.overallPerformance)
                    const studentClass = myClasses.find(cls => cls.id === performance.student.class_id)

                    return (
                      <tr key={performance.student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                            performance.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                            performance.rank === 2 ? 'bg-gray-100 text-gray-800' :
                            performance.rank === 3 ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {performance.rank}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {performance.student.user?.full_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {performance.student.roll_number}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {studentClass?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{performance.marksPerformance || 0}%</span>
                            <span className="text-xs text-gray-500">
                              ({performance.totalExams} exams)
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{performance.attendancePerformance || 0}%</span>
                            <span className="text-xs text-gray-500">
                              ({performance.presentDays}/{performance.totalDays})
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          <div className="flex items-center justify-center">
                            <span className="font-bold">{performance.overallPerformance || 0}%</span>
                            {performance.overallPerformance >= 85 ? (
                              <TrendingUp className="ml-2 h-4 w-4 text-green-500" />
                            ) : performance.overallPerformance >= 70 ? (
                              <TrendingUp className="ml-2 h-4 w-4 text-blue-500" />
                            ) : (
                              <TrendingDown className="ml-2 h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${grade.bgColor} ${grade.color}`}>
                            {grade.grade}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedStudent({
                                ...performance.student,
                                performance: {
                                  marks: performance.marksPerformance,
                                  attendance: performance.attendancePerformance,
                                  overall: performance.overallPerformance,
                                  rank: performance.rank,
                                  grade: grade.grade,
                                  totalExams: performance.totalExams,
                                  presentDays: performance.presentDays,
                                  totalDays: performance.totalDays
                                }
                              })
                              setShowViewModal(true)
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h3>
              <p className="text-gray-500">
                {searchTerm ? 'No students match your search criteria.' : 
                 selectedClass ? 'No students found in the selected class.' : 
                 'No students available to display performance data.'}
              </p>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* View Modal */}
      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        data={selectedStudent ? {
          ...selectedStudent,
          full_name: selectedStudent.user?.full_name || 'Student Performance',
          subtitle: `Roll: ${selectedStudent.roll_number}`,
          details: `Overall Performance: ${selectedStudent.performance?.overall}%`
        } : null}
      />
    </div>
  )
}

export default TeacherPerformance