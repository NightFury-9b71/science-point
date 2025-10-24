import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, Filter, Download, Users, BookOpen, Award, 
  Eye, Calendar, BarChart3, FileText, ChevronUp, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { Input, Select } from '../../components/Form'
import { ViewModal } from '../../components/modals'
import { useStudents, useSubjects, useClasses, useExamResults, useAttendance, useExams } from '../../services/queries'

const AdminPerformance = () => {
  const navigate = useNavigate()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [sortBy, setSortBy] = useState('overall')
  const [sortOrder, setSortOrder] = useState('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Data queries
  const { data: students = [], isLoading: studentsLoading } = useStudents()
  const { data: subjects = [] } = useSubjects()
  const { data: classes = [] } = useClasses()
  const { data: allExamResults = [], isLoading: resultsLoading } = useExamResults()
  const { data: allAttendance = [], isLoading: attendanceLoading } = useAttendance()
  const { data: exams = [], isLoading: examsLoading } = useExams()

  const isLoading = studentsLoading || resultsLoading || attendanceLoading || examsLoading

  // Calculate real performance data
  const performanceData = useMemo(() => {
    if (!students.length) return { classStats: {}, studentPerformance: [] }

    // Calculate performance for each student
    const studentPerformance = students.map(student => {
      try {
        // Get student's exam results
        const studentResults = allExamResults.filter(result => result.student_id === student.id)
        
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
        const studentAttendance = allAttendance.filter(att => att.student_id === student.id)
        
        // Calculate attendance performance
        let attendancePerformance = 0
        if (studentAttendance.length > 0) {
          const presentDays = studentAttendance.filter(att => att.is_present === true).length
          attendancePerformance = Math.round((presentDays / studentAttendance.length) * 100)
        }

        // Calculate overall performance (weighted average)
        // Only calculate if we have either marks or attendance data
        let overallPerformance = 0
        if (marksPerformance > 0 || attendancePerformance > 0) {
          if (marksPerformance > 0 && attendancePerformance > 0) {
            // Both available - use weighted average
            overallPerformance = Math.round((marksPerformance * 0.7) + (attendancePerformance * 0.3))
          } else if (marksPerformance > 0) {
            // Only marks available
            overallPerformance = marksPerformance
          } else {
            // Only attendance available
            overallPerformance = attendancePerformance
          }
        }

        return {
          student,
          marksPerformance: Math.max(0, marksPerformance),
          attendancePerformance: Math.max(0, attendancePerformance),
          overallPerformance: Math.max(0, overallPerformance)
        }
      } catch (error) {
        console.error(`Error calculating performance for student ${student.id}:`, error)
        return {
          student,
          marksPerformance: 0,
          attendancePerformance: 0,
          overallPerformance: 0
        }
      }
    })

    // Sort by overall performance for ranking
    const sortedPerformance = [...studentPerformance].sort((a, b) => b.overallPerformance - a.overallPerformance)
    
    // Add ranks
    const rankedPerformance = sortedPerformance.map((item, index) => ({
      ...item,
      rank: index + 1
    }))

    // Calculate class statistics
    const totalStudents = students.length
    const validMarks = rankedPerformance.filter(p => p.marksPerformance > 0)
    const validAttendance = rankedPerformance.filter(p => p.attendancePerformance > 0)
    const validOverall = rankedPerformance.filter(p => p.overallPerformance > 0)
    
    const averageClassMarks = validMarks.length > 0 
      ? Math.round(validMarks.reduce((sum, p) => sum + p.marksPerformance, 0) / validMarks.length)
      : 0

    const averageClassAttendance = validAttendance.length > 0
      ? Math.round(validAttendance.reduce((sum, p) => sum + p.attendancePerformance, 0) / validAttendance.length) 
      : 0

    const excellentPerformers = validOverall.filter(p => p.overallPerformance >= 85).length
    const goodPerformers = validOverall.filter(p => p.overallPerformance >= 70 && p.overallPerformance < 85).length
    const needsImprovement = validOverall.filter(p => p.overallPerformance > 0 && p.overallPerformance < 70).length

    return {
      classStats: {
        totalStudents,
        averageClassMarks,
        averageClassAttendance,
        excellentPerformers,
        goodPerformers,
        needsImprovement
      },
      studentPerformance: rankedPerformance
    }
  }, [students, allExamResults, allAttendance, exams])

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (!performanceData.studentPerformance?.length) return []
    
    try {
      return performanceData.studentPerformance
        .filter(item => {
          const matchesSearch = !searchTerm || 
            item.student.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
          const matchesClass = !selectedClass || item.student.class_id === parseInt(selectedClass)
          return matchesSearch && matchesClass
        })
        .sort((a, b) => {
          let valueA, valueB
          switch (sortBy) {
            case 'name':
              valueA = a.student.user?.full_name || ''
              valueB = b.student.user?.full_name || ''
              break
            case 'marks':
              valueA = a.marksPerformance
              valueB = b.marksPerformance
              break
            case 'attendance':
              valueA = a.attendancePerformance
              valueB = b.attendancePerformance
              break
            case 'overall':
            default:
              valueA = a.overallPerformance
              valueB = b.overallPerformance
          }
          
          if (sortOrder === 'asc') {
            return valueA > valueB ? 1 : -1
          } else {
            return valueA < valueB ? 1 : -1
          }
        })
    } catch (error) {
      console.error('Error filtering performance data:', error)
      return []
    }
  }, [performanceData.studentPerformance, searchTerm, selectedClass, sortBy, sortOrder])

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  // Bangladeshi GPA system
  const getPerformanceGrade = (score) => {
    if (score >= 80) return { grade: 'A+', points: '5.00', class: 'text-green-600 bg-green-50' }
    if (score >= 70) return { grade: 'A', points: '4.00', class: 'text-green-600 bg-green-50' }
    if (score >= 60) return { grade: 'A-', points: '3.50', class: 'text-blue-600 bg-blue-50' }
    if (score >= 50) return { grade: 'B', points: '3.00', class: 'text-blue-600 bg-blue-50' }
    if (score >= 40) return { grade: 'C', points: '2.00', class: 'text-yellow-600 bg-yellow-50' }
    if (score >= 33) return { grade: 'D', points: '1.00', class: 'text-orange-600 bg-orange-50' }
    return { grade: 'F', points: '0.00', class: 'text-red-600 bg-red-50' }
  }

  const handleViewDetails = (performance) => {
    setSelectedStudent({
      ...performance.student,
      performance: {
        marks: performance.marksPerformance,
        attendance: performance.attendancePerformance,
        overall: performance.overallPerformance,
        rank: performance.rank
      }
    })
    setShowViewModal(true)
  }

  const downloadPDF = () => {
    if (isLoading) {
      toast.error('Please wait for data to load before exporting')
      return
    }

    if (filteredData.length === 0) {
      toast.error('No data available to export')
      return
    }

    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Performance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1f2937; text-align: center; margin-bottom: 10px; }
            .header-info { text-align: center; margin-bottom: 30px; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .grade-A\\+ { background-color: #dcfce7; color: #166534; }
            .grade-A { background-color: #dcfce7; color: #166534; }
            .grade-A\\- { background-color: #dbeafe; color: #1e40af; }
            .grade-B { background-color: #dbeafe; color: #1e40af; }
            .grade-C { background-color: #fef3c7; color: #d97706; }
            .grade-D { background-color: #fed7aa; color: #ea580c; }
            .grade-F { background-color: #fecaca; color: #dc2626; }
            .text-center { text-align: center; }
            .summary { margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>সায়েন্স পয়েন্ট - Student Performance Report</h1>
          <div class="header-info">
            <p>Report Generated: ${new Date().toLocaleDateString('en-GB')}</p>
            <p>Total Students: ${filteredData.length}</p>
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
              ${filteredData.map((item) => {
                const grade = getPerformanceGrade(item.overallPerformance)
                const className = classes.find(cls => cls.id === item.student.class_id)?.name || 'N/A'
                return `
                  <tr>
                    <td class="text-center">${item.rank || 0}</td>
                    <td>${item.student.user?.full_name || 'N/A'}</td>
                    <td class="text-center">${item.student.roll_number || 'N/A'}</td>
                    <td>${className}</td>
                    <td class="text-center">${item.marksPerformance || 0}%</td>
                    <td class="text-center">${item.attendancePerformance || 0}%</td>
                    <td class="text-center">${item.overallPerformance || 0}%</td>
                    <td class="text-center grade-${grade.grade}">${grade.grade}</td>
                    <td class="text-center">${grade.points}</td>
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
      
      toast.success(`Performance report PDF generated successfully (${filteredData.length} students)`)
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
            <Button
              variant="outline"
              size="sm"
              onClick={downloadPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Grade {cls.grade})
                  </option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full"
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </Select>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? '...' : (performanceData.classStats?.totalStudents || 0)}
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
                  {isLoading ? '...' : `${performanceData.classStats?.averageClassMarks || 0}%`}
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
                  {isLoading ? '...' : `${performanceData.classStats?.averageClassAttendance || 0}%`}
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
                  {isLoading ? '...' : (performanceData.classStats?.excellentPerformers || 0)}
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
              Showing {filteredData.length} students
            </p>
          </div>
        </Card.Header>
        <Card.Content className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('rank')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Rank</span>
                      {sortBy === 'rank' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Student</span>
                      {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll</th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('marks')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Marks %</span>
                      {sortBy === 'marks' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('attendance')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Attendance %</span>
                      {sortBy === 'attendance' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('overall')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Overall %</span>
                      {sortBy === 'overall' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-500">Loading performance data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium">No performance data available</p>
                        <p className="text-sm">
                          {students.length === 0 
                            ? "No students found in the system."
                            : "No exam results or attendance data found for current filters."
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((performance, index) => {
                    const grade = getPerformanceGrade(performance.overallPerformance)
                    const className = classes.find(cls => cls.id === performance.student.class_id)?.name || 'N/A'

                    return (
                      <tr key={performance.student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">#{performance.rank}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <span className="text-xs font-medium text-blue-600">
                                {(performance.student.user?.full_name || 'S').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {performance.student.user?.full_name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">{className}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {performance.student.roll_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {performance.marksPerformance || 0}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {performance.attendancePerformance || 0}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {performance.overallPerformance || 0}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${grade.class}`}>
                            {grade.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {grade.points.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(performance)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
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
        sections={[
          {
            key: 'performance',
            title: 'Performance Metrics',
            icon: BarChart3,
            fields: [
              { 
                key: 'marks', 
                label: 'Marks Performance', 
                value: selectedStudent?.performance?.marks ? `${selectedStudent.performance.marks}%` : 'N/A'
              },
              { 
                key: 'attendance', 
                label: 'Attendance Rate', 
                value: selectedStudent?.performance?.attendance ? `${selectedStudent.performance.attendance}%` : 'N/A'
              },
              { 
                key: 'overall', 
                label: 'Overall Performance', 
                value: selectedStudent?.performance?.overall ? `${selectedStudent.performance.overall}%` : 'N/A'
              },
              { 
                key: 'rank', 
                label: 'Class Rank', 
                value: selectedStudent?.performance?.rank ? `#${selectedStudent.performance.rank}` : 'N/A'
              }
            ]
          }
        ]}
      />
    </div>
  )
}

export default AdminPerformance
