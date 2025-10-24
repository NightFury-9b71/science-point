import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, Filter, Download, Users, BookOpen, Award, TrendingUp,
  Eye, Calendar, BarChart3, FileText, ChevronUp, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Table from '../../components/Table'
import { Input, Select } from '../../components/Form'
import { ViewModal } from '../../components/modals'
import { useStudents, useSubjects, useClasses } from '../../services/queries'

const AdminPerformance = () => {
  const navigate = useNavigate()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('all') // 'all', 'month', 'quarter', 'year'
  const [sortBy, setSortBy] = useState('overall') // 'overall', 'marks', 'attendance', 'name'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc', 'desc'
  const [searchTerm, setSearchTerm] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

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

    // Filter by search term
    const filteredPerformance = studentPerformance.filter(p => 
      p.student.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Sort the data
    filteredPerformance.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a.student.user?.full_name || ''
          bValue = b.student.user?.full_name || ''
          break
        case 'marks':
          aValue = a.averageMarks
          bValue = b.averageMarks
          break
        case 'attendance':
          aValue = a.attendancePercentage
          bValue = b.attendancePercentage
          break
        case 'overall':
        default:
          aValue = a.overallPerformance
          bValue = b.overallPerformance
          break
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })

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
      studentPerformance: filteredPerformance,
      classStats
    }
  }, [filteredStudents, examResults, attendanceRecords, searchTerm, sortBy, sortOrder])

    const getPerformanceGrade = (score) => {
    if (score >= 80) return { grade: '5.00 (A+)', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (score >= 70) return { grade: '4.00 (A)', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (score >= 60) return { grade: '3.50 (A-)', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (score >= 50) return { grade: '3.00 (B)', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (score >= 40) return { grade: '2.00 (C)', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    if (score >= 33) return { grade: '1.00 (D)', color: 'text-orange-600', bgColor: 'bg-orange-100' }
    return { grade: '0.00 (F)', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 85) return { status: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (percentage >= 75) return { status: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (percentage >= 65) return { status: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { status: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const handleViewStudent = (studentPerformance) => {
    setSelectedStudent(studentPerformance)
    setShowViewModal(true)
  }

  const exportPerformanceData = () => {
    // Simple CSV export functionality
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Rank,Name,Roll No,Marks %,Attendance %,Overall %,Grade\n"
      + performanceData.studentPerformance.map((p, index) => {
          const grade = getPerformanceGrade(p.overallPerformance)
          return `${index + 1},"${p.student.user?.full_name || 'N/A'}",${p.student.roll_number || 'N/A'},${p.averageMarks},${p.attendancePercentage},${p.overallPerformance},"${grade.grade}"`
        }).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `performance_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Formal Header */}
      <Card>
        <Card.Header className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <div>
              <Card.Title>Performance Analytics</Card.Title>
              <p className="text-sm text-gray-600 mt-1">Student performance overview</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportPerformanceData}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              size="sm"
              onClick={() => window.location.reload()}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </Card.Header>
      </Card>

      {/* Filters & Search */}
      <Card>
        <Card.Content>
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-4 w-4 text-blue-600" />
            <h3 className="font-medium text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* Class Filter */}
            <Select
              label="Class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={[
                { value: '', label: 'All Classes' },
                ...classes.map(cls => ({ value: cls.id, label: cls.name }))
              ]}
              className="text-sm"
            />
            
            {/* Period Filter */}
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
              className="text-sm"
            />
            
            {/* Sort By */}
            <Select
              label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'overall', label: 'Overall Performance' },
                { value: 'marks', label: 'Marks' },
                { value: 'attendance', label: 'Attendance' },
                { value: 'name', label: 'Name' }
              ]}
              className="text-sm"
            />
          </div>
        </Card.Content>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">{performanceData.classStats.totalStudents}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{performanceData.classStats.averageClassMarks}%</p>
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
                <p className="text-2xl font-semibold text-gray-900">{performanceData.classStats.averageClassAttendance}%</p>
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
                <p className="text-2xl font-semibold text-gray-900">{performanceData.classStats.excellentPerformers}</p>
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
              <div>
                <Card.Title className="text-xl font-bold text-gray-900">Performance Distribution</Card.Title>
                <p className="text-sm text-gray-600 mt-1">Student performance breakdown by categories</p>
              </div>
            </div>
          </div>
        </Card.Header>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Content className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                <div className="relative">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-3xl font-bold text-white">{performanceData.classStats.goodPerformers}</span>
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="font-bold text-blue-800 text-lg">Good</p>
                  </div>
                  <p className="text-sm text-blue-700 font-semibold">70% - 84%</p>
                  <div className="mt-3 bg-blue-500/20 rounded-lg px-3 py-2">
                    <p className="text-sm text-blue-800 font-medium">
                      {performanceData.classStats.totalStudents > 0
                        ? Math.round((performanceData.classStats.goodPerformers / performanceData.classStats.totalStudents) * 100)
                        : 0}% of total students
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Needs Improvement */}
            <div className="group hover:scale-105 transition-transform duration-200">
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -mr-8 -mt-8"></div>
                <div className="relative">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-3xl font-bold text-white">{performanceData.classStats.needsImprovement}</span>
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                    <p className="font-bold text-amber-800 text-lg">Needs Focus</p>
                  </div>
                  <p className="text-sm text-amber-700 font-semibold">Below 70%</p>
                  <div className="mt-3 bg-amber-500/20 rounded-lg px-3 py-2">
                    <p className="text-sm text-amber-800 font-medium">
                      {performanceData.classStats.totalStudents > 0
                        ? Math.round((performanceData.classStats.needsImprovement / performanceData.classStats.totalStudents) * 100)
                        : 0}% of total students
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Enhanced Student Performance Table */}
      <Card className="shadow-2xl border-0 bg-white">
        <Card.Header className="p-6 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <Card.Title className="text-xl font-bold text-gray-900">Student Performance Rankings</Card.Title>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {performanceData.studentPerformance.length} students
                  {searchTerm && ` matching "${searchTerm}"`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center space-x-1"
              >
                {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Content className="p-0">
          {performanceData.studentPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('rank')}
                        className="flex items-center space-x-1 text-xs font-bold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                      >
                        <span>Rank</span>
                        {sortBy === 'rank' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 text-xs font-bold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                      >
                        <span>Student</span>
                        {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Roll No</th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('marks')}
                        className="flex items-center space-x-1 text-xs font-bold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                      >
                        <span>Marks (%)</span>
                        {sortBy === 'marks' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('attendance')}
                        className="flex items-center space-x-1 text-xs font-bold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                      >
                        <span>Attendance (%)</span>
                        {sortBy === 'attendance' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('overall')}
                        className="flex items-center space-x-1 text-xs font-bold text-gray-700 uppercase tracking-wider hover:text-gray-900"
                      >
                        <span>Overall (%)</span>
                        {sortBy === 'overall' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {performanceData.studentPerformance.map((performance, index) => {
                    const grade = getPerformanceGrade(performance.overallPerformance)
                    const attendanceStatus = getAttendanceStatus(performance.attendancePerformance)

                    return (
                      <tr key={performance.student.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
                              index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                              index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                              'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
                            }`}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                              {performance.student.user?.photo_url ? (
                                <img
                                  src={performance.student.user.photo_url}
                                  alt={performance.student.user.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-semibold text-sm">
                                  {(performance.student.user?.full_name || 'U').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {performance.student.user?.full_name || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                Class: {performance.student.class?.name || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                            {performance.student.roll_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span className="font-bold text-gray-900 text-lg">{performance.averageMarks}%</span>
                                {performance.averageMarks >= 80 ? (
                                  <TrendingUp className="ml-1 h-4 w-4 text-green-500" />
                                ) : performance.averageMarks >= 60 ? (
                                  <TrendingUp className="ml-1 h-4 w-4 text-blue-500" />
                                ) : (
                                  <TrendingDown className="ml-1 h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {performance.totalExams} exams taken
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${attendanceStatus.bgColor} ${attendanceStatus.color}`}>
                              {performance.attendancePercentage}%
                            </span>
                            <div className="text-xs text-gray-500">
                              {performance.presentDays}/{performance.totalDays} days
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span className="font-bold text-gray-900 text-xl">{performance.overallPerformance}%</span>
                                {performance.overallPerformance >= 85 ? (
                                  <TrendingUp className="ml-2 h-5 w-5 text-green-500" />
                                ) : performance.overallPerformance >= 70 ? (
                                  <TrendingUp className="ml-2 h-5 w-5 text-blue-500" />
                                ) : (
                                  <TrendingDown className="ml-2 h-5 w-5 text-red-500" />
                                )}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className={`h-2 rounded-full ${
                                    performance.overallPerformance >= 85 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                    performance.overallPerformance >= 70 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                                    'bg-gradient-to-r from-red-400 to-red-600'
                                  }`}
                                  style={{ width: `${Math.min(performance.overallPerformance, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${grade.bgColor} ${grade.color} shadow-sm`}>
                            {grade.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewStudent(performance)}
                            className="flex items-center space-x-1 hover:bg-blue-500 hover:text-white transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View</span>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Performance Data Available</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm 
                  ? `No students found matching "${searchTerm}". Try adjusting your search criteria.`
                  : selectedClass 
                    ? 'No students found in the selected class.' 
                    : 'No students available to display performance data. Students need to have exam results and attendance records.'
                }
              </p>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <ViewModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title="Student Performance Details"
          data={{
            ...selectedStudent.student.user,
            photo_url: selectedStudent.student.user?.photo_url,
            subtitle: `Roll No: ${selectedStudent.student.roll_number}`,
            details: `Class: ${selectedStudent.student.class?.name || 'N/A'}`,
            badges: [
              `Overall: ${selectedStudent.overallPerformance}%`,
              getPerformanceGrade(selectedStudent.overallPerformance).grade
            ]
          }}
          sections={[
            {
              key: 'performance',
              title: 'Performance Overview',
              icon: BarChart3,
              className: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200',
              iconColor: 'text-blue-600',
              fields: [
                { key: 'overall', label: 'Overall Performance', value: `${selectedStudent.overallPerformance}%` },
                { key: 'grade', label: 'Grade', value: getPerformanceGrade(selectedStudent.overallPerformance).grade },
                { key: 'rank', label: 'Class Rank', value: `#${performanceData.studentPerformance.findIndex(p => p.student.id === selectedStudent.student.id) + 1}` }
              ]
            },
            {
              key: 'academics',
              title: 'Academic Performance',
              icon: BookOpen,
              className: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
              iconColor: 'text-green-600',
              fields: [
                { key: 'marks', label: 'Average Marks', value: `${selectedStudent.averageMarks}%` },
                { key: 'exams', label: 'Total Exams', value: selectedStudent.totalExams },
                { key: 'subjects', label: 'Subjects', value: selectedStudent.student.class?.name || 'N/A' }
              ]
            },
            {
              key: 'attendance',
              title: 'Attendance Record',
              icon: Calendar,
              className: 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200',
              iconColor: 'text-purple-600',
              fields: [
                { key: 'percentage', label: 'Attendance Rate', value: `${selectedStudent.attendancePercentage}%` },
                { key: 'present', label: 'Present Days', value: selectedStudent.presentDays },
                { key: 'total', label: 'Total Days', value: selectedStudent.totalDays },
                { key: 'status', label: 'Status', value: getAttendanceStatus(selectedStudent.attendancePercentage).status }
              ]
            }
          ]}
          actions={[
            {
              label: 'View Full Profile',
              variant: 'outline',
              icon: Eye,
              onClick: () => {
                setShowViewModal(false)
                // Navigate to student profile if needed
              }
            }
          ]}
        />
      )}
    </div>
  )
}

export default AdminPerformance