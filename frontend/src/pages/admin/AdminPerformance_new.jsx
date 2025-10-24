import React, { useState, useEffect } from 'react'
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
import { useStudents, useSubjects, useClasses } from '../../services/queries'

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
  const { data: students = [] } = useStudents()
  const { data: subjects = [] } = useSubjects()
  const { data: classes = [] } = useClasses()

  // Mock performance data - replace with actual API call
  const [performanceData, setPerformanceData] = useState({
    classStats: {
      totalStudents: students.length,
      averageClassMarks: 78.5,
      averageClassAttendance: 85.2,
      excellentPerformers: Math.floor(students.length * 0.15),
      goodPerformers: Math.floor(students.length * 0.45),
      needsImprovement: Math.floor(students.length * 0.4)
    },
    studentPerformance: students.map((student, index) => ({
      student,
      rank: index + 1,
      marksPerformance: Math.floor(Math.random() * 40) + 60,
      attendancePerformance: Math.floor(Math.random() * 30) + 70,
      overallPerformance: Math.floor(Math.random() * 35) + 65
    }))
  })

  // Filter and sort data
  const filteredData = performanceData.studentPerformance
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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getPerformanceGrade = (score) => {
    if (score >= 85) return { grade: 'A+', class: 'text-green-600 bg-green-50' }
    if (score >= 80) return { grade: 'A', class: 'text-green-600 bg-green-50' }
    if (score >= 75) return { grade: 'B+', class: 'text-blue-600 bg-blue-50' }
    if (score >= 70) return { grade: 'B', class: 'text-blue-600 bg-blue-50' }
    if (score >= 65) return { grade: 'C+', class: 'text-yellow-600 bg-yellow-50' }
    if (score >= 60) return { grade: 'C', class: 'text-yellow-600 bg-yellow-50' }
    return { grade: 'D', class: 'text-red-600 bg-red-50' }
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

  const downloadCSV = () => {
    const csvData = [
      ['Rank', 'Student Name', 'Roll Number', 'Class', 'Marks %', 'Attendance %', 'Overall %', 'Grade'],
      ...filteredData.map((item, index) => {
        const grade = getPerformanceGrade(item.overallPerformance)
        const className = classes.find(cls => cls.id === item.student.class_id)?.name || 'N/A'
        return [
          index + 1,
          item.student.user?.full_name || 'N/A',
          item.student.roll_number || 'N/A',
          className,
          item.marksPerformance,
          item.attendancePerformance,
          item.overallPerformance,
          grade.grade
        ]
      })
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `performance_report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Performance report downloaded successfully')
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
              onClick={downloadCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </Select>
            
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </Select>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((performance, index) => {
                  const grade = getPerformanceGrade(performance.overallPerformance)
                  const className = classes.find(cls => cls.id === performance.student.class_id)?.name || 'N/A'

                  return (
                    <tr key={performance.student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
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
                        {performance.marksPerformance}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {performance.attendancePerformance}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {performance.overallPerformance}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${grade.class}`}>
                          {grade.grade}
                        </span>
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
                })}
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
