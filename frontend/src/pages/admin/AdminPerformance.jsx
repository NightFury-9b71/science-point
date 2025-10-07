import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, Award, Users, BookOpen, Calendar, BarChart3, PieChart } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { Select } from '../../components/Form'
import { useStudents, useClasses, useExamResults, useAttendance } from '../../services/queries'

const AdminPerformance = () => {
  const navigate = useNavigate()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('all') // 'all', 'month', 'quarter', 'year'

  // Fetch data
  const { data: students = [] } = useStudents()
  const { data: classes = [] } = useClasses()
  const { data: examResults = [] } = useExamResults()
  const { data: attendanceRecords = [] } = useAttendance()

  // Filter students by class if selected
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return students
    return students.filter(student => student.class_id === parseInt(selectedClass))
  }, [students, selectedClass])

  // Calculate performance metrics
  const performanceData = useMemo(() => {
    const studentPerformance = filteredStudents.map(student => {
      // Get student's exam results
      const studentResults = examResults.filter(result => result.student_id === student.id)

      // Calculate average marks
      const totalMarks = studentResults.reduce((sum, result) => sum + result.marks_obtained, 0)
      const maxMarks = studentResults.reduce((sum, result) => sum + result.exam?.max_marks || 0, 0)
      const averageMarks = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0

      // Get student's attendance
      const studentAttendance = attendanceRecords.filter(record => record.student_id === student.id)
      const totalDays = studentAttendance.length
      const presentDays = studentAttendance.filter(record => record.status === 'present').length
      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

      // Calculate overall performance (weighted average: 70% marks, 30% attendance)
      const overallPerformance = (averageMarks * 0.7) + (attendancePercentage * 0.3)

      return {
        student,
        averageMarks: Math.round(averageMarks * 100) / 100,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
        overallPerformance: Math.round(overallPerformance * 100) / 100,
        totalExams: studentResults.length,
        presentDays,
        totalDays
      }
    })

    // Sort by overall performance (descending)
    studentPerformance.sort((a, b) => b.overallPerformance - a.overallPerformance)

    // Calculate class statistics
    const classStats = {
      totalStudents: studentPerformance.length,
      averageClassMarks: studentPerformance.length > 0
        ? Math.round(studentPerformance.reduce((sum, p) => sum + p.averageMarks, 0) / studentPerformance.length * 100) / 100
        : 0,
      averageClassAttendance: studentPerformance.length > 0
        ? Math.round(studentPerformance.reduce((sum, p) => sum + p.attendancePercentage, 0) / studentPerformance.length * 100) / 100
        : 0,
      excellentPerformers: studentPerformance.filter(p => p.overallPerformance >= 85).length,
      goodPerformers: studentPerformance.filter(p => p.overallPerformance >= 70 && p.overallPerformance < 85).length,
      needsImprovement: studentPerformance.filter(p => p.overallPerformance < 70).length
    }

    return {
      studentPerformance,
      classStats
    }
  }, [filteredStudents, examResults, attendanceRecords])

  const getPerformanceGrade = (score) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (score >= 70) return { grade: 'B', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    if (score >= 50) return { grade: 'D', color: 'text-orange-600', bgColor: 'bg-orange-100' }
    return { grade: 'F', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 85) return { status: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (percentage >= 75) return { status: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (percentage >= 65) return { status: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { status: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
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
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Performance Analytics</h2>
            <p className="text-sm text-gray-600 mt-1">Student performance based on marks and attendance</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 shadow-lg border-0 bg-gradient-to-r from-white to-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Select
            label="Filter by Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={[
              { value: '', label: 'All Classes' },
              ...classes.map(cls => ({ value: cls.id, label: cls.name }))
            ]}
            className="text-base"
          />
          <Select
            label="Time Period"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            options={[
              { value: 'all', label: 'All Time' },
              { value: 'month', label: 'Last Month' },
              { value: 'quarter', label: 'Last Quarter' },
              { value: 'year', label: 'Last Year' }
            ]}
            className="text-base"
          />
        </div>
      </Card>

      {/* Class Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Students</p>
              <p className="text-2xl font-bold text-blue-900">{performanceData.classStats.totalStudents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Avg. Marks</p>
              <p className="text-2xl font-bold text-green-900">{performanceData.classStats.averageClassMarks}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Avg. Attendance</p>
              <p className="text-2xl font-bold text-purple-900">{performanceData.classStats.averageClassAttendance}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500 rounded-lg">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Excellent</p>
              <p className="text-2xl font-bold text-yellow-900">{performanceData.classStats.excellentPerformers}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Distribution */}
      <Card className="shadow-lg border-0">
        <Card.Header className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
          <div className="flex items-center space-x-3">
            <PieChart className="h-6 w-6 text-indigo-600" />
            <Card.Title className="text-lg font-bold text-gray-900">Performance Distribution</Card.Title>
          </div>
        </Card.Header>
        <Card.Content className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-green-600">{performanceData.classStats.excellentPerformers}</span>
              </div>
              <p className="font-semibold text-green-700">Excellent (85%+)</p>
              <p className="text-sm text-gray-600">
                {performanceData.classStats.totalStudents > 0
                  ? Math.round((performanceData.classStats.excellentPerformers / performanceData.classStats.totalStudents) * 100)
                  : 0}% of students
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-blue-600">{performanceData.classStats.goodPerformers}</span>
              </div>
              <p className="font-semibold text-blue-700">Good (70-84%)</p>
              <p className="text-sm text-gray-600">
                {performanceData.classStats.totalStudents > 0
                  ? Math.round((performanceData.classStats.goodPerformers / performanceData.classStats.totalStudents) * 100)
                  : 0}% of students
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-red-600">{performanceData.classStats.needsImprovement}</span>
              </div>
              <p className="font-semibold text-red-700">Needs Improvement (&lt;70%)</p>
              <p className="text-sm text-gray-600">
                {performanceData.classStats.totalStudents > 0
                  ? Math.round((performanceData.classStats.needsImprovement / performanceData.classStats.totalStudents) * 100)
                  : 0}% of students
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Student Performance Table */}
      <Card className="shadow-lg border-0">
        <Card.Header className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-gray-600" />
            <Card.Title className="text-lg font-bold text-gray-900">Student Performance Details</Card.Title>
          </div>
        </Card.Header>
        <Card.Content className="p-0">
          {performanceData.studentPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceData.studentPerformance.map((performance, index) => {
                    const grade = getPerformanceGrade(performance.overallPerformance)
                    const attendanceStatus = getAttendanceStatus(performance.attendancePercentage)

                    return (
                      <tr key={performance.student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-50 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {performance.student.user?.full_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {performance.student.roll_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">{performance.averageMarks}%</span>
                            <span className="ml-2 text-xs text-gray-500">
                              ({performance.totalExams} exams)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${attendanceStatus.bgColor} ${attendanceStatus.color}`}>
                              {performance.attendancePercentage}%
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              ({performance.presentDays}/{performance.totalDays})
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="font-bold text-gray-900">{performance.overallPerformance}%</span>
                            {performance.overallPerformance >= 85 ? (
                              <TrendingUp className="ml-2 h-4 w-4 text-green-500" />
                            ) : performance.overallPerformance >= 70 ? (
                              <TrendingUp className="ml-2 h-4 w-4 text-blue-500" />
                            ) : (
                              <TrendingDown className="ml-2 h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${grade.bgColor} ${grade.color}`}>
                            {grade.grade}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h3>
              <p className="text-gray-500">
                {selectedClass ? 'No students found in the selected class.' : 'No students available to display performance data.'}
              </p>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}

export default AdminPerformance