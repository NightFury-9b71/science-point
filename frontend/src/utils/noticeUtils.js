// Utility for managing read notices in localStorage
const READ_NOTICES_KEY = 'read_notices'

export const noticeUtils = {
  // Get array of read notice IDs from localStorage
  getReadNotices: () => {
    try {
      const readNotices = localStorage.getItem(READ_NOTICES_KEY)
      return readNotices ? JSON.parse(readNotices) : []
    } catch (error) {
      console.error('Error getting read notices:', error)
      return []
    }
  },

  // Mark a notice as read
  markAsRead: (noticeId) => {
    try {
      const readNotices = noticeUtils.getReadNotices()
      if (!readNotices.includes(noticeId)) {
        readNotices.push(noticeId)
        localStorage.setItem(READ_NOTICES_KEY, JSON.stringify(readNotices))
      }
    } catch (error) {
      console.error('Error marking notice as read:', error)
    }
  },

  // Check if a notice is read
  isRead: (noticeId) => {
    const readNotices = noticeUtils.getReadNotices()
    return readNotices.includes(noticeId)
  },

  // Get count of unread notices
  getUnreadCount: (notices) => {
    if (!Array.isArray(notices)) return 0
    return notices.filter(notice => !noticeUtils.isRead(notice.id)).length
  },

  // Clear all read notices (useful for testing or reset)
  clearReadNotices: () => {
    try {
      localStorage.removeItem(READ_NOTICES_KEY)
    } catch (error) {
      console.error('Error clearing read notices:', error)
    }
  }
}