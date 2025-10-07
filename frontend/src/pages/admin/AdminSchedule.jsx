import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Calendar, Plus, Clock, X, Book, User } from 'lucide-react'
import { toast } from 'sonner'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { Input, Select } from '../../components/Form'
import { 
  useClassSchedules, 
  useCreateClassSchedule, 
  useDeleteClassSchedule,
  useClasses,
  useSubjects,
  useTeachers
} from '../../services/queries'

const AdminSchedule = () => {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  
  // Fetch data
  const { data: schedules = [], isLoading } = useClassSchedules()
  const { data: classes = [] } = useClasses()  
  const { data: subjects = [] } = useSubjects()
  const { data: teachers = [] } = useTeachers()
  const createSchedule = useCreateClassSchedule()
  const deleteSchedule = useDeleteClassSchedule()
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  
  // Form state for adding schedule
  const [form, setForm] = useState({
    day_of_week: '',
    start_time: '',
    end_time: '',
    subject_id: '',
    class_id: '',
    teacher_id: '',
    room_number: ''
  })

  // Days of the week
  const daysOfWeek = [
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' }
  ]

  // Time slots
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ]

  // Filter schedules
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = !searchQuery || 
      schedule.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.class_assigned?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.teacher?.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDay = !dayFilter || schedule.day_of_week === dayFilter
    const matchesClass = !classFilter || schedule.class_id.toString() === classFilter
    return matchesSearch && matchesDay && matchesClass
  })

  // Group schedules by day
  const schedulesByDay = daysOfWeek.reduce((acc, day) => {
    acc[day.value] = filteredSchedules
      .filter(s => s.day_of_week === day.value)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
    return acc
  }, {})

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate all required fields
    const requiredFields = [
      { field: 'class_id', name: 'Class' },
      { field: 'subject_id', name: 'Subject' },
      { field: 'teacher_id', name: 'Teacher' },
      { field: 'day_of_week', name: 'Day of Week' },
      { field: 'start_time', name: 'Start Time' },
      { field: 'end_time', name: 'End Time' }
    ]
    
    const missingFields = requiredFields.filter(({ field }) => !form[field])
    
    if (missingFields.length > 0) {
      toast.error(`Please select: ${missingFields.map(f => f.name).join(', ')}`)
      return
    }
    
    // Validate time order
    if (form.start_time >= form.end_time) {
      toast.error('End time must be after start time')
      return
    }

    try {
      await createSchedule.mutateAsync(form)
      setShowModal(false)
      setForm({
        day_of_week: '',
        start_time: '',
        end_time: '',
        subject_id: '',
        class_id: '',
        teacher_id: '',
        room_number: ''
      })
      toast.success('Class schedule created successfully!')
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast.error(error.response?.data?.detail || 'Failed to create schedule')
    }
  }

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await deleteSchedule.mutateAsync(scheduleId)
      toast.success('Schedule deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete schedule')
    }
  }

  // Handle form field changes
  const handleFormChange = (field, value) => {
    setForm({
      ...form,
      [field]: value
    })
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Class Schedule Management</h1>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Class Schedule
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Card.Content className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search subjects, classes, or teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Day Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
              >
                <option value="">All Days</option>
                {daysOfWeek.map(day => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Clear Filters */}
          {(searchQuery || dayFilter || classFilter) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setDayFilter('')
                  setClassFilter('')
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Weekly Schedule Display */}
      <Card>
        <Card.Header className="p-4 sm:p-6">
          <Card.Title className="text-lg sm:text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Class Schedule
          </Card.Title>
        </Card.Header>
        <Card.Content className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-7 divide-y lg:divide-y-0 lg:divide-x">
            {daysOfWeek.map((day) => {
              const daySchedules = schedulesByDay[day.value] || []
              const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
              const isToday = day.value === today
              
              return (
                <div key={day.value} className={`p-4 ${isToday ? 'bg-blue-50' : ''}`}>
                  <div className="mb-3">
                    <h3 className={`font-semibold ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                      {day.label}
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    {daySchedules.length > 0 ? (
                      daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 relative group"
                        >
                          <div className="text-xs font-medium text-blue-600 mb-1">
                            {schedule.start_time} - {schedule.end_time}
                          </div>
                          <div className="font-medium text-sm text-blue-900">
                            {schedule.subject?.name}
                          </div>
                          <div className="text-xs text-blue-700">
                            Class: {schedule.class_assigned?.name}
                          </div>
                          <div className="text-xs text-blue-700">
                            Teacher: {schedule.teacher?.user?.full_name}
                          </div>
                          {schedule.room_number && (
                            <div className="text-xs text-blue-600">
                              Room: {schedule.room_number}
                            </div>
                          )}
                          
                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No classes scheduled</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card.Content>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{schedules.length}</div>
            <div className="text-sm text-gray-600">Total Classes</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{classes.length}</div>
            <div className="text-sm text-gray-600">Classes Available</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{subjects.length}</div>
            <div className="text-sm text-gray-600">Subjects</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{teachers.length}</div>
            <div className="text-sm text-gray-600">Teachers</div>
          </div>
        </Card>
      </div>

      {/* Add Schedule Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Add Class Schedule"
        className="sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Class"
            value={form.class_id}
            onChange={(e) => handleFormChange('class_id', e.target.value)}
            options={[
              { value: '', label: 'Select Class' },
              ...classes.map(cls => ({
                value: cls.id.toString(),
                label: cls.name
              }))
            ]}
            required
          />

          <Select
            label="Subject"
            value={form.subject_id}
            onChange={(e) => handleFormChange('subject_id', e.target.value)}
            options={[
              { value: '', label: 'Select Subject' },
              ...subjects.map(subject => ({
                value: subject.id.toString(),
                label: subject.name
              }))
            ]}
            required
          />

          <Select
            label="Teacher"
            value={form.teacher_id}
            onChange={(e) => handleFormChange('teacher_id', e.target.value)}
            options={[
              { value: '', label: 'Select Teacher' },
              ...teachers.map(teacher => ({
                value: teacher.id.toString(),
                label: teacher.user?.full_name || `Teacher ${teacher.id}`
              }))
            ]}
            required
          />
          
          <Select
            label="Day of Week"
            value={form.day_of_week}
            onChange={(e) => handleFormChange('day_of_week', e.target.value)}
            options={[
              { value: '', label: 'Select Day' },
              ...daysOfWeek
            ]}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Start Time"
              value={form.start_time}
              onChange={(e) => handleFormChange('start_time', e.target.value)}
              options={[
                { value: '', label: 'Select Time' },
                ...timeSlots.map(time => ({ value: time, label: time }))
              ]}
              required
            />
            
            <Select
              label="End Time"
              value={form.end_time}
              onChange={(e) => handleFormChange('end_time', e.target.value)}
              options={[
                { value: '', label: 'Select Time' },
                ...timeSlots.map(time => ({ value: time, label: time }))
              ]}
              required
            />
          </div>
          
          <Input
            label="Room Number (Optional)"
            value={form.room_number}
            onChange={(e) => handleFormChange('room_number', e.target.value)}
            placeholder="e.g., Room 101"
          />

          {/* Display selected details */}
          {(form.class_id || form.subject_id || form.teacher_id) && (
            <div className="bg-gray-50 p-3 rounded border">
              <h4 className="font-medium text-gray-900 mb-2">Selected Details:</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <div>
                  <span className="font-medium">Class:</span> {
                    form.class_id ? classes.find(c => c.id.toString() === form.class_id)?.name || 'Unknown' : 'Not selected'
                  }
                </div>
                <div>
                  <span className="font-medium">Subject:</span> {
                    form.subject_id ? subjects.find(s => s.id.toString() === form.subject_id)?.name || 'Unknown' : 'Not selected'
                  }
                </div>
                <div>
                  <span className="font-medium">Teacher:</span> {
                    form.teacher_id ? teachers.find(t => t.id.toString() === form.teacher_id)?.user?.full_name || 'Unknown' : 'Not selected'
                  }
                </div>
                {form.day_of_week && (
                  <div>
                    <span className="font-medium">Day:</span> {
                      daysOfWeek.find(d => d.value === form.day_of_week)?.label || 'Unknown'
                    }
                  </div>
                )}
                {form.start_time && form.end_time && (
                  <div>
                    <span className="font-medium">Time:</span> {form.start_time} - {form.end_time}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createSchedule.isPending}>
              Add Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminSchedule