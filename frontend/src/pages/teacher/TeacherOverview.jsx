import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, FileText, Award, Calendar, Upload, Bell } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useTeacherClasses, useTeacherStudents, useTeacherSubjects, useTeacherExams, useTeacherNotices } from '../../services/queries'

const TeacherOverview = () => {
  const { user } = useAuth()
  const teacherId = user?.teacher_id || user?.teacherId
  
  // Verify teacher authentication
  if (!teacherId) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-yellow-600 mb-2">
            <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-yellow-900 mb-2">Teacher Profile Incomplete</h3>
          <p className="text-yellow-700">
            Your teacher profile is not properly set up. Please contact the administrator.
          </p>
        </div>
      </div>
    )
  }
  
  const { data: myClasses = [], isLoading: classesLoading } = useTeacherClasses(teacherId)
  const { data: myStudents = [], isLoading: studentsLoading } = useTeacherStudents(teacherId)
  const { data: mySubjects = [] } = useTeacherSubjects(teacherId)
  const { data: exams = [] } = useTeacherExams(teacherId)
  const { data: notices = [] } = useTeacherNotices()

  const navigate = useNavigate()

  if (classesLoading || studentsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards - Mobile First */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-2 sm:mb-0">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{myClasses.length}</p>
              <p className="text-xs sm:text-sm text-gray-500">My Classes</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-2 sm:mb-0">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{myStudents.length}</p>
              <p className="text-xs sm:text-sm text-gray-500">My Students</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-2 sm:mb-0">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{mySubjects.length}</p>
              <p className="text-xs sm:text-sm text-gray-500">Subjects</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-2 sm:mb-0">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{exams.length}</p>
              <p className="text-xs sm:text-sm text-gray-500">Exams</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions - Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:hidden">
        <Button
          variant="outline"
          className="flex flex-col items-center p-4 h-auto space-y-2"
          onClick={() => navigate('/teacher/classes')}
        >
          <BookOpen className="h-6 w-6 text-blue-600" />
          <span className="text-xs font-medium">Classes</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center p-4 h-auto space-y-2"
          onClick={() => navigate('/teacher/students')}
        >
          <Users className="h-6 w-6 text-green-600" />
          <span className="text-xs font-medium">Students</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center p-4 h-auto space-y-2"
          onClick={() => navigate('/teacher/attendance')}
        >
          <Calendar className="h-6 w-6 text-orange-600" />
          <span className="text-xs font-medium">Attendance</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center p-4 h-auto space-y-2"
          onClick={() => navigate('/teacher/exams')}
        >
          <Award className="h-6 w-6 text-purple-600" />
          <span className="text-xs font-medium">Exams</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center p-4 h-auto space-y-2"
          onClick={() => navigate('/teacher/results')}
        >
          <FileText className="h-6 w-6 text-indigo-600" />
          <span className="text-xs font-medium">Results</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center p-4 h-auto space-y-2"
          onClick={() => navigate('/teacher/materials')}
        >
          <Upload className="h-6 w-6 text-red-600" />
          <span className="text-xs font-medium">Materials</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center p-4 h-auto space-y-2"
          onClick={() => navigate('/teacher/schedule')}
        >
          <Calendar className="h-6 w-6 text-teal-600" />
          <span className="text-xs font-medium">Schedule</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center p-4 h-auto space-y-2"
          onClick={() => navigate('/teacher/notices')}
        >
          <Bell className="h-6 w-6 text-yellow-600" />
          <span className="text-xs font-medium">Notices</span>
        </Button>
      </div>

      {/* My Classes */}
      <Card>
        <Card.Header className="p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <Card.Title className="text-lg sm:text-xl">My Classes</Card.Title>
            <Button 
              size="sm" 
              onClick={() => navigate('/teacher/classes')}
              className="hidden sm:flex"
            >
              View All
            </Button>
          </div>
        </Card.Header>
        <Card.Content className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {myClasses.slice(0, 3).map((cls) => (
              <Card key={cls.id} className="border border-gray-200">
                <Card.Content className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{cls.name}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Grade {cls.grade} • Section {cls.section || 'N/A'}</p>
                    <p>Capacity: {cls.capacity}</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => navigate('/teacher/attendance')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Recent Notices */}
      <Card>
        <Card.Header className="p-4 sm:p-6">
          <Card.Title className="text-lg sm:text-xl">Recent Notices</Card.Title>
        </Card.Header>
        <Card.Content className="p-4 sm:p-6">
          {notices.length > 0 ? (
            <div className="space-y-3">
              {notices.slice(0, 3).map((notice) => (
                <div key={notice.id} className="border-l-4 border-blue-500 pl-3 sm:pl-4 py-2">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">{notice.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {notice.content.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent notices</p>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}

export default TeacherOverview