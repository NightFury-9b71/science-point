import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, GraduationCap, BookOpen, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import Logger from '../../utils/logger.js'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAdminDashboard, useSeedDatabase } from '../../services/queries'

const AdminOverview = () => {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useAdminDashboard()
  const seedDatabase = useSeedDatabase()

  const handleSeedDatabase = async () => {
    try {
      await seedDatabase.mutateAsync()
      toast.success('Database seeded successfully!')
    } catch (error) {
      Logger.error('Error seeding database:', error)
      toast.error('Failed to seed database. Please try again.')
    }
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
      
      {/* Seed Database Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleSeedDatabase} 
          variant="secondary"
          loading={seedDatabase.isPending}
          size="sm"
        >
          Seed Database
        </Button>
      </div>
      
      {/* Recent Notices */}
      <Card>
        <Card.Header className="p-4 sm:p-6 pb-2 sm:pb-4">
          <Card.Title className="text-lg sm:text-xl font-semibold">Recent Notices</Card.Title>
        </Card.Header>
        <Card.Content className="p-0">
          {stats?.recent_notices && stats.recent_notices.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {stats.recent_notices.map((notice, index) => (
                <div 
                  key={notice.id} 
                  className="p-4 sm:p-6 border-l-4 border-blue-500 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight mb-1 sm:mb-2">
                        {notice.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-2 sm:mb-3">
                        {window.innerWidth < 640 
                          ? notice.content.substring(0, 60) + (notice.content.length > 60 ? '...' : '')
                          : notice.content.substring(0, 120) + (notice.content.length > 120 ? '...' : '')
                        }
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {new Date(notice.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: window.innerWidth >= 640 ? 'numeric' : '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  {notice.priority && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        notice.priority === 'high' ? 'bg-red-100 text-red-800' :
                        notice.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)} Priority
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 sm:p-6 text-center">
              <div className="flex flex-col items-center justify-center py-6 sm:py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm sm:text-base font-medium">No recent notices</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  New notices will appear here when created
                </p>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}

export default AdminOverview