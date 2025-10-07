import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Calendar, Plus } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'

const AdminSchedule = () => {
  const navigate = useNavigate()
  const [selectedWeek, setSelectedWeek] = useState(0) // 0 for current week, -1 for previous, 1 for next
  const [viewType, setViewType] = useState('school') // 'school' or 'individual'
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  
  const currentDate = new Date()
  const weekOffset = selectedWeek * 7
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + weekOffset)
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    return day
  })

  // Mock school-wide schedule data - replace with actual data
  const schoolSchedule = {
    Monday: [
      { time: '08:00 AM', event: 'Morning Assembly', location: 'Main Hall', type: 'assembly' },
      { time: '09:00 AM', event: 'Admin Meeting', location: 'Conference Room', type: 'meeting' },
      { time: '11:00 AM', event: 'Parent Consultation', location: 'Admin Office', type: 'consultation' },
      { time: '02:00 PM', event: 'Class Inspection', location: 'Grade 10A', type: 'inspection' },
    ],
    Tuesday: [
      { time: '08:30 AM', event: 'Teacher Training', location: 'Training Room', type: 'training' },
      { time: '10:00 AM', event: 'Budget Review', location: 'Admin Office', type: 'meeting' },
      { time: '01:00 PM', event: 'Student Disciplinary Committee', location: 'Conference Room', type: 'committee' },
    ],
    Wednesday: [
      { time: '09:00 AM', event: 'School Board Meeting', location: 'Conference Room', type: 'meeting' },
      { time: '11:30 AM', event: 'New Admission Interviews', location: 'Interview Room', type: 'admission' },
      { time: '03:00 PM', event: 'Infrastructure Planning', location: 'Admin Office', type: 'planning' },
    ],
    Thursday: [
      { time: '08:00 AM', event: 'Quality Assurance Review', location: 'Various Classrooms', type: 'inspection' },
      { time: '10:30 AM', event: 'Staff Performance Review', location: 'HR Office', type: 'review' },
      { time: '02:30 PM', event: 'Parent-Teacher Meeting Prep', location: 'Main Hall', type: 'preparation' },
    ],
    Friday: [
      { time: '08:30 AM', event: 'Weekly Staff Meeting', location: 'Conference Room', type: 'meeting' },
      { time: '10:00 AM', event: 'Finance Committee', location: 'Admin Office', type: 'committee' },
      { time: '03:30 PM', event: 'Event Planning Session', location: 'Activity Room', type: 'planning' },
    ],
    Saturday: [
      { time: '09:00 AM', event: 'Extra-Curricular Activities', location: 'Sports Complex', type: 'activity' },
      { time: '11:00 AM', event: 'Maintenance Review', location: 'Facility Tour', type: 'maintenance' },
    ],
    Sunday: []
  }

  // Filter schedule data
  const getFilteredSchedule = () => {
    if (!searchQuery && !eventTypeFilter && !locationFilter) {
      return schoolSchedule
    }

    const filtered = {}
    Object.keys(schoolSchedule).forEach(day => {
      filtered[day] = schoolSchedule[day].filter(event => {
        const matchesSearch = !searchQuery || 
          event.event?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = !eventTypeFilter || event.type === eventTypeFilter
        const matchesLocation = !locationFilter || 
          event.location?.toLowerCase().includes(locationFilter.toLowerCase())
        return matchesSearch && matchesType && matchesLocation
      })
    })
    return filtered
  }

  const filteredSchedule = getFilteredSchedule()

  // Get unique event types and locations for filters
  const allEvents = Object.values(schoolSchedule).flat()
  const availableTypes = [...new Set(allEvents.map(event => event.type).filter(Boolean))] || []
  const availableLocations = [...new Set(allEvents.map(event => event.location).filter(Boolean))] || []

  const getEventTypeStyle = (type) => {
    const styles = {
      assembly: 'border-blue-500 bg-blue-50 text-blue-900',
      meeting: 'border-green-500 bg-green-50 text-green-900',
      consultation: 'border-purple-500 bg-purple-50 text-purple-900',
      inspection: 'border-orange-500 bg-orange-50 text-orange-900',
      training: 'border-indigo-500 bg-indigo-50 text-indigo-900',
      committee: 'border-red-500 bg-red-50 text-red-900',
      admission: 'border-teal-500 bg-teal-50 text-teal-900',
      planning: 'border-yellow-500 bg-yellow-50 text-yellow-900',
      review: 'border-pink-500 bg-pink-50 text-pink-900',
      preparation: 'border-cyan-500 bg-cyan-50 text-cyan-900',
      activity: 'border-lime-500 bg-lime-50 text-lime-900',
      maintenance: 'border-gray-500 bg-gray-50 text-gray-900',
    }
    return styles[type] || 'border-gray-500 bg-gray-50 text-gray-900'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">School Schedule</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedWeek(selectedWeek - 1)}
          >
            Previous Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedWeek(0)}
            disabled={selectedWeek === 0}
          >
            Current Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedWeek(selectedWeek + 1)}
          >
            Next Week
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Card.Content className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Events</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search events or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Event Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                {availableTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">All Locations</option>
                {availableLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Clear Filters */}
          {(searchQuery || eventTypeFilter || locationFilter) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setEventTypeFilter('')
                  setLocationFilter('')
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Week Display */}
      <Card>
        <Card.Header className="p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <Card.Title className="text-lg sm:text-xl">
              Week of {startOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Card.Title>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => console.log('Add event')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </Card.Header>
        <Card.Content className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-7 divide-y lg:divide-y-0 lg:divide-x">
            {weekDays.map((day, index) => {
              const dayName = day.toLocaleDateString('en-US', { weekday: 'long' })
              const daySchedule = filteredSchedule[dayName] || []
              const isToday = day.toDateString() === new Date().toDateString()
              
              return (
                <div key={index} className={`p-4 ${isToday ? 'bg-blue-50' : ''}`}>
                  <div className="mb-3">
                    <h3 className={`font-semibold ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                      {dayName}
                    </h3>
                    <p className={`text-sm ${isToday ? 'text-blue-700' : 'text-gray-500'}`}>
                      {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {daySchedule.length > 0 ? (
                      daySchedule.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className={`p-3 rounded-lg border-l-4 ${getEventTypeStyle(item.type)}`}
                        >
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            {item.time}
                          </div>
                          <div className="font-medium text-sm">
                            {item.event}
                          </div>
                          <div className="text-xs opacity-75">
                            {item.location}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No events scheduled</p>
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
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-gray-600">Events This Week</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">5</div>
            <div className="text-sm text-gray-600">Meetings Scheduled</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">3</div>
            <div className="text-sm text-gray-600">Inspections</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">2</div>
            <div className="text-sm text-gray-600">Committees</div>
          </div>
        </Card>
      </div>

      {/* Event Types Legend */}
      <Card>
        <Card.Header className="p-4 sm:p-6">
          <Card.Title className="text-lg sm:text-xl">Event Types</Card.Title>
        </Card.Header>
        <Card.Content className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { type: 'meeting', label: 'Meetings' },
              { type: 'inspection', label: 'Inspections' },
              { type: 'training', label: 'Training' },
              { type: 'committee', label: 'Committees' },
              { type: 'planning', label: 'Planning' },
              { type: 'activity', label: 'Activities' },
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded border-l-4 ${getEventTypeStyle(type)}`}></div>
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}

export default AdminSchedule