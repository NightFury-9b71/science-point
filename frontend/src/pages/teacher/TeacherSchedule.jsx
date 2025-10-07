import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, BookOpen } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useTeacherSchedule } from '../../services/queries'

const TeacherSchedule = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const teacherId = user?.teacher_id || user?.teacherId
  
  // Get current day of week in lowercase
  const getCurrentDayOfWeek = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[new Date().getDay()]
  }
  
  const [selectedDay, setSelectedDay] = useState(getCurrentDayOfWeek())
  
  const { data: schedule = [], isLoading } = useTeacherSchedule(teacherId, selectedDay)
  
  const daysOfWeek = [
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' }
  ]

  const isToday = (day) => day === getCurrentDayOfWeek()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Schedule</h1>
        </div>
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Day Selector */}
      <Card>
        <Card.Content className="p-4">
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
        </Card.Content>
      </Card>

      {/* Schedule Display */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {daysOfWeek.find(d => d.value === selectedDay)?.label} Schedule
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {schedule.length > 0 ? (
            <div className="space-y-4">
              {schedule.map((item) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-gray-600" />
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
                          <span className="font-medium">Class:</span> {item.class_assigned?.name || 'N/A'}
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
        </Card.Content>
      </Card>

      {/* Quick Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{schedule.length}</div>
            <div className="text-sm text-gray-600">Classes Today</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {schedule.length > 0 ? (
                (() => {
                  const totalMinutes = schedule.reduce((total, item) => {
                    const start = new Date(`1970-01-01T${item.start_time}:00`)
                    const end = new Date(`1970-01-01T${item.end_time}:00`)
                    return total + (end - start) / (1000 * 60)
                  }, 0)
                  return `${Math.round(totalMinutes / 60 * 10) / 10}h`
                })()
              ) : '0h'}
            </div>
            <div className="text-sm text-gray-600">Total Hours</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {schedule.length > 0 ? new Set(schedule.map(s => s.class_id)).size : 0}
            </div>
            <div className="text-sm text-gray-600">Different Classes</div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TeacherSchedule