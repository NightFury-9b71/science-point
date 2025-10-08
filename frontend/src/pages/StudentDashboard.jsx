import React, { useState, useMemo } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import withAuthGuard from '../components/withAuthGuard'
import { 
  User,
  Award,
  BookOpen,
  Bell,
  TrendingUp,
  FileText,
  GraduationCap,
  Download,
  Calendar,
  Grid,
  List
} from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Table from '../components/Table'
import {
  useStudentProfile,
  useStudentAttendance,
  useStudentExamResults,
  useStudentSubjects,
  useStudentMaterials,
  useStudentNotices,
  useStudentSchedule
} from '../services/queries'

const StudentDashboard = () => {
  const { user } = useAuth()
  const studentId = user?.student_id || user?.studentId
  const [activeTab, setActiveTab] = useState('profile')
  const [viewMode, setViewMode] = useState('weekly') // 'daily' or 'weekly'
  
  // Get current day of week in lowercase
  const getCurrentDayOfWeek = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[new Date().getDay()]
  }
  
  const [selectedDay, setSelectedDay] = useState(getCurrentDayOfWeek())
  
  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ]
  
  const { data: profile, isLoading: profileLoading } = useStudentProfile(studentId)
  const { data: examResults = [] } = useStudentExamResults(studentId)
  const { data: subjects = [] } = useStudentSubjects(studentId)
  const { data: studyMaterials = [] } = useStudentMaterials(studentId)
  const { data: notices = [] } = useStudentNotices(studentId)
  
  // Get current day schedule
  const { data: weeklySchedule = [] } = useStudentSchedule(studentId)

  // Profile data is loaded via React Query

  const navigate = useNavigate()

  // Verify student authentication
  if (!studentId) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-yellow-600 mb-2">
            <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-yellow-900 mb-2">Student Profile Incomplete</h3>
          <p className="text-yellow-700">
            Your student profile is not properly set up. Please contact the administrator.
          </p>
        </div>
      </div>
    )
  }



  const getGradeColor = (grade) => {
    const gradeColors = {
      'A+': 'bg-green-100 text-green-800',
      'A': 'bg-green-100 text-green-800',
      'B+': 'bg-blue-100 text-blue-800',
      'B': 'bg-blue-100 text-blue-800',
      'C+': 'bg-yellow-100 text-yellow-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800'
    }
    return gradeColors[grade] || 'bg-gray-100 text-gray-800'
  }

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'schedule', name: 'Schedule', icon: Calendar },
    { id: 'notices', name: 'Notices', icon: Bell },
    { id: 'materials', name: 'Study Materials', icon: FileText },
    { id: 'results', name: 'Results', icon: Award }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <Card className="bg-white shadow border border-gray-200">
            <Card.Header>
              <Card.Title className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Student Profile
              </Card.Title>
            </Card.Header>
            <Card.Content className="p-6">
              {profile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-gray-900 font-medium">{profile.user?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Username</label>
                      <p className="text-gray-900 font-medium">{profile.user?.username || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900 font-medium">{profile.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900 font-medium">{profile.user?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Roll Number</label>
                      <p className="text-gray-900 font-medium">{profile.roll_number || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                      <p className="text-gray-900 font-medium">{profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Class ID</label>
                      <p className="text-gray-900 font-medium">{profile.class_id || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Parent Name</label>
                      <p className="text-gray-900 font-medium">{profile.parent_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Parent Phone</label>
                      <p className="text-gray-900 font-medium">{profile.parent_phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-gray-900 font-medium">{profile.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Profile information not available</p>
                </div>
              )}
            </Card.Content>
          </Card>
        )

      case 'schedule':
        // Group schedules by day of week
        const groupedSchedules = weeklySchedule.reduce((acc, schedule) => {
          const day = schedule.day_of_week
          if (!acc[day]) {
            acc[day] = []
          }
          acc[day].push(schedule)
          return acc
        }, {})

        // Sort days in order: monday, tuesday, wednesday, thursday, friday, saturday, sunday
        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        const sortedDays = dayOrder.filter(day => groupedSchedules[day])

        // Group schedules by day for weekly view
        const schedulesByDay = daysOfWeek.reduce((acc, day) => {
          acc[day.value] = weeklySchedule
            .filter(s => s.day_of_week === day.value)
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
          return acc
        }, {})

        const isToday = (day) => day === getCurrentDayOfWeek()

        return (
          <Card className="bg-white shadow border border-gray-200">
            <Card.Header>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <Card.Title className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Weekly Schedule
                </Card.Title>
                <div className="flex items-center space-x-2">
                  <div className="flex rounded-lg border border-gray-300">
                    <Button
                      variant={viewMode === 'weekly' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('weekly')}
                      className="rounded-r-none border-0"
                    >
                      <Grid className="h-4 w-4 mr-1" />
                      Weekly
                    </Button>
                    <Button
                      variant={viewMode === 'daily' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('daily')}
                      className="rounded-l-none border-0"
                    >
                      <List className="h-4 w-4 mr-1" />
                      Daily
                    </Button>
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              {/* Day Selector - Only show in daily view */}
              {viewMode === 'daily' && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <Button
                        key={day.value}
                        variant={selectedDay === day.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDay(day.value)}
                        className={isToday(day.value) ? "ring-2 ring-blue-300" : ""}
                      >
                        {day.label}
                        {isToday(day.value) && <span className="ml-1 text-xs">(Today)</span>}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule Display */}
              {viewMode === 'weekly' ? (
                /* Weekly View */
                <div className="grid grid-cols-1 lg:grid-cols-7 divide-y lg:divide-y-0 lg:divide-x">
                  {daysOfWeek.map((day) => {
                    const daySchedules = schedulesByDay[day.value] || []
                    const today = getCurrentDayOfWeek()
                    const isCurrentDay = day.value === today
                    
                    return (
                      <div key={day.value} className={`p-4 ${isCurrentDay ? 'bg-blue-50' : ''}`}>
                        <div className="mb-3">
                          <h3 className={`font-semibold ${isCurrentDay ? 'text-blue-900' : 'text-gray-900'}`}>
                            {day.label}
                            {isCurrentDay && <span className="ml-1 text-xs text-blue-600">(Today)</span>}
                          </h3>
                        </div>
                        
                        <div className="space-y-2">
                          {daySchedules.length > 0 ? (
                            daySchedules.map((item) => (
                              <div
                                key={item.id}
                                className="p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50"
                              >
                                <div className="text-xs font-medium text-blue-600 mb-1">
                                  {item.start_time} - {item.end_time}
                                </div>
                                <div className="font-medium text-sm text-blue-900 mb-1">
                                  {item.subject?.name}
                                </div>
                                <div className="text-xs text-blue-700 mb-1">
                                  Teacher: {item.teacher?.user?.full_name}
                                </div>
                                {item.room_number && (
                                  <div className="text-xs text-blue-600">
                                    Room: {item.room_number}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No classes</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Daily View */
                <div>
                  {schedulesByDay[selectedDay] && schedulesByDay[selectedDay].length > 0 ? (
                    <div className="space-y-4">
                      {schedulesByDay[selectedDay].map((item) => (
                        <div key={item.id} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4 text-gray-600" />
                                <span className="font-medium text-gray-900">
                                  {item.start_time} - {item.end_time}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                                <h3 className="font-semibold text-blue-900">
                                  {item.subject?.name || 'Subject'}
                                </h3>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                                <div>
                                  <span className="font-medium">Teacher:</span> {item.teacher?.user?.full_name || 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium">Subject Code:</span> {item.subject?.code || 'N/A'}
                                </div>
                                {item.room_number && (
                                  <div>
                                    <span className="font-medium">Room:</span> {item.room_number}
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Duration:</span> {
                                    (() => {
                                      const start = new Date(`1970-01-01T${item.start_time}:00`)
                                      const end = new Date(`1970-01-01T${item.end_time}:00`)
                                      const duration = (end - start) / (1000 * 60) // minutes
                                      return `${duration} minutes`
                                    })()
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Scheduled</h3>
                      <p className="text-gray-500">
                        No classes are scheduled for {daysOfWeek.find(d => d.value === selectedDay)?.label.toLowerCase()}.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {viewMode === 'daily' ? (schedulesByDay[selectedDay] ? schedulesByDay[selectedDay].length : 0) : weeklySchedule.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      {viewMode === 'daily' ? 'Classes Today' : 'Total Classes'}
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {weeklySchedule.length > 0 ? (
                        (() => {
                          const scheduleToUse = viewMode === 'daily' ? schedulesByDay[selectedDay] || [] : weeklySchedule
                          const totalMinutes = scheduleToUse.reduce((total, item) => {
                            const start = new Date(`1970-01-01T${item.start_time}:00`)
                            const end = new Date(`1970-01-01T${item.end_time}:00`)
                            return total + (end - start) / (1000 * 60)
                          }, 0)
                          return `${Math.round(totalMinutes / 60 * 10) / 10}h`
                        })()
                      ) : '0h'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {viewMode === 'daily' ? 'Hours Today' : 'Total Hours/Week'}
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {weeklySchedule.length > 0 ? new Set(weeklySchedule.map(s => s.class_id)).size : 0}
                    </div>
                    <div className="text-sm text-gray-600">Different Classes</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {weeklySchedule.length > 0 ? new Set(weeklySchedule.map(s => s.subject_id)).size : 0}
                    </div>
                    <div className="text-sm text-gray-600">Subjects</div>
                  </div>
                </Card>
              </div>
            </Card.Content>
          </Card>
        )

      case 'notices':
        return (
          <Card className="bg-white shadow border border-gray-200">
            <Card.Header>
              <Card.Title className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                Notices & Announcements
              </Card.Title>
            </Card.Header>
            <Card.Content className="p-6">
              {notices.length > 0 ? (
                <div className="space-y-4">
                  {notices.map((notice) => (
                    <div key={notice.id} className="border-l-4 border-gray-500 bg-gray-50 p-4 rounded-r">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{notice.title}</h4>
                            {notice.is_urgent && (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-2">{notice.content}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>📅 {new Date(notice.created_at).toLocaleDateString()}</span>
                            {notice.target_class && <span>📚 Class: {notice.target_class}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Notices Available</h3>
                  <p className="text-gray-500">No notices have been posted yet.</p>
                </div>
              )}
            </Card.Content>
          </Card>
        )

      case 'materials':
        return (
          <Card className="bg-white shadow border border-gray-200">
            <Card.Header>
              <Card.Title className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Study Materials
              </Card.Title>
            </Card.Header>
            <Card.Content className="p-6">
              {studyMaterials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studyMaterials.map((material) => (
                    <div key={material.id} className="bg-gray-50 p-4 rounded border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{material.title}</h4>
                          <p className="text-sm text-gray-600">{material.subject?.name || 'Unknown Subject'}</p>
                        </div>
                        <FileText className="h-5 w-5 text-gray-600" />
                      </div>
                      {material.description && (
                        <p className="text-sm text-gray-700 mb-3">{material.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {material.uploaded_at ? new Date(material.uploaded_at).toLocaleDateString() : 'N/A'}
                        </span>
                        {material.file_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(material.file_url, '_blank')}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Study Materials Available</h3>
                  <p className="text-gray-500">No study materials have been uploaded yet.</p>
                </div>
              )}
            </Card.Content>
          </Card>
        )

      case 'results':
        return (
          <Card className="bg-white shadow border border-gray-200">
            <Card.Header>
              <Card.Title className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5" />
                Exam Results
              </Card.Title>
            </Card.Header>
            <Card.Content className="p-6">
              {examResults.length > 0 ? (
                <div className="space-y-4">
                  {examResults.map((result) => (
                    <div key={result.id} className="bg-gray-50 p-4 rounded border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg mb-3">
                            {result.exam?.subject?.name || 'Subject Name Not Available'}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 font-medium">Exam Name:</span>
                              <p className="text-gray-900">{result.exam?.title || `Exam #${result.exam_id}`}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 font-medium">Marks Obtained:</span>
                              <p className="text-gray-900">
                                {result.marks_obtained || result.obtained_marks} / {result.exam?.total_marks || result.exam?.max_marks}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600 font-medium">Date:</span>
                              <p className="text-gray-900">
                                {result.exam?.exam_date ? new Date(result.exam.exam_date).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                        {result.grade && (
                          <div className="ml-4">
                            <span className={`px-3 py-2 rounded text-sm font-semibold ${getGradeColor(result.grade)}`}>
                              {result.grade}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Exam Results Available</h3>
                  <p className="text-gray-500">No exam results have been published yet.</p>
                </div>
              )}
            </Card.Content>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Welcome, {profile?.user?.full_name || user?.name || 'Student'}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-gray-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  )
}
// Wrap the component with authentication guard
export default withAuthGuard(StudentDashboard, ['student', 'admin'])