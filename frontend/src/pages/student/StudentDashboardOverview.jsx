import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Award,
  BookOpen,
  Bell,
  Calendar,
  FileText,
  BarChart3
} from 'lucide-react'

import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import {
  useStudentExamResults,
  useStudentMaterials,
  useStudentNotices,
  useStudentSchedule
} from '../../services/queries'

// Utility function to get current day of week
const getCurrentDayOfWeek = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]
}

const StudentDashboardOverview = () => {
  const { user } = useAuth()
  const studentId = user?.student_id || user?.studentId
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
  
  const { data: examResults = [] } = useStudentExamResults(studentId)
  const { data: studyMaterials = [] } = useStudentMaterials(studentId)
  const { data: notices = [] } = useStudentNotices(studentId)

  // Get current day schedule
  const { data: weeklySchedule = [] } = useStudentSchedule(studentId)

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-2 sm:mb-0">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {weeklySchedule.filter(s => s.day_of_week === getCurrentDayOfWeek()).length}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Today's Classes</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-2 sm:mb-0">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{studyMaterials.length}</p>
              <p className="text-xs sm:text-sm text-gray-500">Study Materials</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-2 sm:mb-0">
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{notices.length}</p>
              <p className="text-xs sm:text-sm text-gray-500">New Notices</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-2 sm:mb-0">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{examResults.length}</p>
              <p className="text-xs sm:text-sm text-gray-500">Exam Results</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule
            </Card.Title>
          </Card.Header>
          <Card.Content>
            {weeklySchedule.filter(s => s.day_of_week === getCurrentDayOfWeek()).length > 0 ? (
              <div className="space-y-3">
                {weeklySchedule
                  .filter(s => s.day_of_week === getCurrentDayOfWeek())
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{schedule.subject?.name}</p>
                        <p className="text-sm text-gray-600">{schedule.start_time} - {schedule.end_time}</p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>{schedule.teacher?.user?.full_name}</p>
                        {schedule.room_number && <p>Room {schedule.room_number}</p>}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No classes scheduled for today</p>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Recent Notices */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notices
            </Card.Title>
          </Card.Header>
          <Card.Content>
            {notices.slice(0, 3).length > 0 ? (
              <div className="space-y-3">
                {notices.slice(0, 3).map((notice) => (
                  <div key={notice.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{notice.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {notice.is_urgent && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notices available</p>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <Card.Title>Quick Actions</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => navigate('/student/schedule')}
            >
              <Calendar className="h-6 w-6 mb-2" />
              <span className="text-sm">Schedule</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => navigate('/student/materials')}
            >
              <FileText className="h-6 w-6 mb-2" />
              <span className="text-sm">Materials</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => navigate('/student/results')}
            >
              <Award className="h-6 w-6 mb-2" />
              <span className="text-sm">Results</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => navigate('/student/notices')}
            >
              <Bell className="h-6 w-6 mb-2" />
              <span className="text-sm">Notices</span>
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}

export default StudentDashboardOverview