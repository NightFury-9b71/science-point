import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, BookOpen, Grid, List } from 'lucide-react'
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
  const [viewMode, setViewMode] = useState('weekly') // 'daily' or 'weekly'
  
  const { data: schedule = [], isLoading } = useTeacherSchedule(teacherId, viewMode === 'daily' ? selectedDay : null)
  
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

  // Group schedules by day for weekly view
  const schedulesByDay = daysOfWeek.reduce((acc, day) => {
    acc[day.value] = schedule
      .filter(s => s.day_of_week === day.value)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
    return acc
  }, {})

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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Teaching Schedule</h1>
        </div>
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

      {/* Day Selector - Only show in daily view */}
      {viewMode === 'daily' && (
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
      )}

      {/* Schedule Display */}
      {viewMode === 'weekly' ? (
        /* Weekly View */
        <Card>
          <Card.Header className="p-4 sm:p-6">
            <Card.Title className="text-lg sm:text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My Weekly Teaching Schedule
            </Card.Title>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-7 divide-y lg:divide-y-0 lg:divide-x">
              {daysOfWeek.map((day) => {
                const daySchedules = schedulesByDay[day.value] || []
                const today = getCurrentDayOfWeek()
                const isCurrentDay = day.value === today
                
                return (
                  <div key={day.value} className={`p-4 ${isCurrentDay ? 'bg-green-50' : ''}`}>
                    <div className="mb-3">
                      <h3 className={`font-semibold ${isCurrentDay ? 'text-green-900' : 'text-gray-900'}`}>
                        {day.label}
                        {isCurrentDay && <span className="ml-1 text-xs text-green-600">(Today)</span>}
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      {daySchedules.length > 0 ? (
                        daySchedules.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-lg border-l-4 border-green-500 bg-green-50"
                          >
                            <div className="text-xs font-medium text-green-600 mb-1">
                              {item.start_time} - {item.end_time}
                            </div>
                            <div className="font-medium text-sm text-green-900 mb-1">
                              {item.subject?.name}
                            </div>
                            <div className="text-xs text-green-700 mb-1">
                              Class: {item.class_assigned?.name}
                            </div>
                            {item.room_number && (
                              <div className="text-xs text-green-600">
                                Room: {item.room_number}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No classes</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card.Content>
        </Card>
      ) : (
        /* Daily View */
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
                  <div key={item.id} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-900">
                            {item.start_time} - {item.end_time}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-green-600" />
                          <h3 className="font-semibold text-green-900">
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
      )}

      {/* Quick Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {viewMode === 'daily' ? schedule.length : schedule.length}
            </div>
            <div className="text-sm text-gray-600">
              {viewMode === 'daily' ? 'Classes Today' : 'Total Classes'}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
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
            <div className="text-sm text-gray-600">
              {viewMode === 'daily' ? 'Hours Today' : 'Total Hours/Week'}
            </div>
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
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {schedule.length > 0 ? new Set(schedule.map(s => s.subject_id)).size : 0}
            </div>
            <div className="text-sm text-gray-600">Subjects Teaching</div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TeacherSchedule