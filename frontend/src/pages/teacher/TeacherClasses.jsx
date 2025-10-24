import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Plus, XCircle } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useSafeNavigation } from '../../hooks/useSafeNavigation'
import { useTeacherClasses, useTeacherStudents, useTeacherSchedule } from '../../services/queries'

const TeacherClasses = () => {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { goBack } = useSafeNavigation()
  const teacherId = user?.teacher_id || user?.teacherId
  
  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show error if no teacher ID found
  if (!teacherId) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 mb-2">
            <XCircle className="h-8 w-8 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Teacher Profile Not Found</h3>
          <p className="text-red-700">
            Unable to load classes. Please contact the administrator to ensure your teacher profile is properly set up.
          </p>
        </div>
      </div>
    )
  }
  
  // Only call queries after we confirm teacherId exists
  const { data: myClasses = [], isLoading } = useTeacherClasses(teacherId)
  const { data: myStudents = [] } = useTeacherStudents(teacherId)
  const { data: mySchedules = [] } = useTeacherSchedule(teacherId)

  // Debug logging
  console.log('TeacherClasses Debug:', {
    user,
    teacherId,
    myClassesCount: myClasses.length,
    myClasses
  })

  // Helper function to get subjects for a class from schedules
  const getClassSubjects = (classId) => {
    const classSchedules = mySchedules?.filter(schedule => schedule.class_id === classId) || []
    const subjects = classSchedules.map(schedule => schedule.subject).filter(Boolean)
    // Remove duplicates based on subject id
    const uniqueSubjects = subjects.filter((subject, index, self) => 
      index === self.findIndex(s => s.id === subject.id)
    )
    return uniqueSubjects
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goBack('/teacher')}
          className="lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg sm:text-xl font-semibold">My Classes</h2>
      </div>
      
      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {myClasses.map((cls) => {
          const classSubjects = getClassSubjects(cls.id)
          return (
          <Card key={cls.id}>
            <Card.Header className="p-4 sm:p-6">
              <Card.Title className="text-base sm:text-lg">{cls.name}</Card.Title>
            </Card.Header>
            <Card.Content className="p-4 sm:p-6 pt-0">
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Grade:</span> {cls.grade}</p>
                <p><span className="font-medium">Section:</span> {cls.section || 'N/A'}</p>
                <p><span className="font-medium">Capacity:</span> {cls.capacity}</p>
                <p><span className="font-medium">Students:</span> {myStudents.filter(s => s.class_id === cls.id).length}</p>
                <div>
                  <p className="font-medium">Subjects:</p>
                  <p className="text-xs text-gray-600">
                    {classSubjects.length > 0 
                      ? classSubjects.map(s => s.name).join(', ')
                      : 'No subjects assigned'
                    }
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => navigate('/teacher/attendance')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Mark Attendance
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={() => navigate('/teacher/exams')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Exam
                </Button>
              </div>
            </Card.Content>
          </Card>
          )
        })}
      </div>
    </div>
  )
}

export default TeacherClasses