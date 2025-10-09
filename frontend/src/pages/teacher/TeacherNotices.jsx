import { Bell, Calendar, AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'
import Card from '../../components/Card'
import { useTeacherNotices } from '../../services/queries'
import { noticeUtils } from '../../utils/noticeUtils'

function TeacherNotices() {
  const { data: notices = [], isLoading, error } = useTeacherNotices()

  // Mark all notices as read when the page is viewed
  useEffect(() => {
    if (notices.length > 0) {
      notices.forEach(notice => {
        noticeUtils.markAsRead(notice.id)
      })
    }
  }, [notices])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load notices</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Notices</h1>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {notices.map((notice) => (
          <Card key={notice.id} className={`${notice.is_urgent ? 'border-l-4 border-red-500 shadow-md' : ''}`}>
            <Card.Content className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{notice.title}</h3>
                    {notice.is_urgent && (
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                          Urgent
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm sm:text-base mb-4 leading-relaxed">
                    {notice.content}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-500 space-y-2 sm:space-y-0">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Posted: {new Date(notice.created_at).toLocaleDateString()}</span>
                    </div>
                    {notice.expires_at && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Expires: {new Date(notice.expires_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {notices.length === 0 && (
        <div className="text-center py-8">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No notices available</p>
        </div>
      )}
    </div>
  )
}

export default TeacherNotices