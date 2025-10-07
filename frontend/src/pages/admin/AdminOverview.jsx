import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, GraduationCap, BookOpen, Calendar } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAdminDashboard } from '../../services/queries'

const AdminOverview = () => {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useAdminDashboard()
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid - Mobile First */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-2 sm:mb-0">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats?.total_students || 0}</p>
              <p className="text-xs sm:text-sm text-gray-500">Students</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-2 sm:mb-0">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats?.total_teachers || 0}</p>
              <p className="text-xs sm:text-sm text-gray-500">Teachers</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-2 sm:mb-0">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats?.total_classes || 0}</p>
              <p className="text-xs sm:text-sm text-gray-500">Classes</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="flex-shrink-0 mb-2 sm:mb-0">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats?.total_subjects || 0}</p>
              <p className="text-xs sm:text-sm text-gray-500">Subjects</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <Card.Header className="p-4 sm:p-6">
            <Card.Title className="text-lg sm:text-xl">Today's Schedule</Card.Title>
            <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </Card.Header>
          <Card.Content className="p-4 sm:p-6">
            <div className="space-y-3">
              {/* Mock schedule data - replace with actual data */}
              <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="text-sm font-medium text-blue-900 w-20">09:00 AM</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Staff Meeting</h4>
                  <p className="text-sm text-gray-600">Conference Room • Weekly Review</p>
                </div>
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Active
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                <div className="text-sm font-medium text-gray-600 w-20">11:00 AM</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Class Inspection</h4>
                  <p className="text-sm text-gray-600">Grade 10A • Quality Assessment</p>
                </div>
                <div className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                  Upcoming
                </div>
              </div>

              <div className="flex items-center space-x-4 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <div className="text-sm font-medium text-purple-700 w-20">02:00 PM</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Parent Meeting</h4>
                  <p className="text-sm text-gray-600">Office • Student Progress Discussion</p>
                </div>
                <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  Meeting
                </div>
              </div>

              <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="text-sm font-medium text-green-700 w-20">04:00 PM</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Budget Review</h4>
                  <p className="text-sm text-gray-600">Admin Office • Monthly Financials</p>
                </div>
                <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Admin
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => navigate('/admin/schedule')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Full Schedule
              </Button>
            </div>
          </Card.Content>
        </Card>

        {/* Recent Notices */}
        <Card>
          <Card.Header className="p-4 sm:p-6">
            <Card.Title className="text-lg sm:text-xl">Recent Notices</Card.Title>
          </Card.Header>
        <Card.Content className="p-4 sm:p-6">
          {stats?.recent_notices && stats.recent_notices.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_notices.map((notice) => (
                <div key={notice.id} className="border-l-4 border-blue-500 pl-3 sm:pl-4 py-2">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">{notice.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {notice.content.substring(0, 80)}...
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
    </div>
  )
}

export default AdminOverview