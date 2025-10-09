import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, ArrowLeft, Search } from 'lucide-react'
import { toast } from 'sonner'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { Input, Select } from '../../components/Form'
import { useNotices, useCreateNotice, useUpdateNotice, useDeleteNotice } from '../../services/queries'

const AdminNotices = () => {
  const navigate = useNavigate()
  const { data: notices, isLoading } = useNotices()
  const createNotice = useCreateNotice()
  const updateNotice = useUpdateNotice()
  const deleteNotice = useDeleteNotice()
  
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState(null)
  const [form, setForm] = useState({
    title: '', content: '', target_role: '', is_urgent: false, show_on_landing: false, expires_at: ''
  })
  const [editForm, setEditForm] = useState(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [landingPageFilter, setLandingPageFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')

  // Filter notices
  const filteredNotices = notices
    ?.filter(notice => {
      const matchesSearch = !searchQuery || 
        notice.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.content?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = !selectedRole || notice.target_role === selectedRole
      const matchesUrgency = urgencyFilter === '' || 
        (urgencyFilter === 'urgent' && notice.is_urgent) ||
        (urgencyFilter === 'normal' && !notice.is_urgent)
      const matchesLandingPage = landingPageFilter === '' ||
        (landingPageFilter === 'landing' && notice.show_on_landing) ||
        (landingPageFilter === 'non-landing' && !notice.show_on_landing)
      return matchesSearch && matchesRole && matchesUrgency && matchesLandingPage
    })
    ?.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title?.localeCompare(b.title) || 0
        case 'created_at':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0)
        case 'expires_at':
          return new Date(a.expires_at || '9999-12-31') - new Date(b.expires_at || '9999-12-31')
        case 'urgent':
          return (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0)
        default:
          return 0
      }
    }) || []

  // Get unique roles for filter
  const availableRoles = [...new Set(notices?.map(notice => notice.target_role).filter(Boolean))] || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!form.title || !form.content) {
      toast.error('Please fill in all required fields (Title and Content)')
      return
    }
    
    if (form.content.length < 10) {
      toast.error('Content must be at least 10 characters long')
      return
    }
    
    try {
      const noticeData = {
        title: form.title.trim(),
        content: form.content.trim(),
        is_urgent: form.is_urgent,
        show_on_landing: form.show_on_landing,
        expires_at: form.expires_at || null
      }
      
      // Only include target_role if it's not empty
      if (form.target_role && form.target_role !== '') {
        noticeData.target_role = form.target_role
      }
      
      console.log('Submitting notice data:', noticeData)
      await createNotice.mutateAsync(noticeData)
      setShowModal(false)
      setForm({
        title: '', content: '', target_role: '', is_urgent: false, show_on_landing: false, expires_at: ''
      })
      toast.success('Notice created successfully!')
    } catch (error) {
      console.error('Error creating notice:', error)
      console.error('Error details:', error.response?.data || error.message)
      
      let errorMessage = 'Failed to create notice. Please try again.'
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(e => e.msg || e.message).join(', ')
        } else {
          errorMessage = error.response.data.detail
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    }
  }

  const handleViewNotice = (notice) => {
    setSelectedNotice(notice)
    setShowViewModal(true)
  }

  const handleEditNotice = (notice) => {
    setEditForm({
      ...notice,
      expires_at: notice.expires_at ? notice.expires_at.split('T')[0] + 'T' + notice.expires_at.split('T')[1].slice(0, 5) : ''
    })
    setSelectedNotice(notice)
    setShowEditModal(true)
  }

  const handleDeleteNotice = (notice) => {
    setSelectedNotice(notice)
    setShowDeleteModal(true)
  }

  const confirmDeleteNotice = async () => {
    try {
      await deleteNotice.mutateAsync(selectedNotice.id)
      setShowDeleteModal(false)
      setSelectedNotice(null)
      toast.success('Notice deleted successfully!')
    } catch (error) {
      console.error('Error deleting notice:', error)
      let errorMessage = 'Failed to delete notice. Please try again.'
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      }
      toast.error(errorMessage)
    }
  }

  const handleUpdateNotice = async (e) => {
    e.preventDefault()
    try {
      const noticeData = {
        ...editForm,
        expires_at: editForm.expires_at || null
      }
      await updateNotice.mutateAsync({ id: selectedNotice.id, ...noticeData })
      setShowEditModal(false)
      setEditForm(null)
      setSelectedNotice(null)
      toast.success('Notice updated successfully!')
    } catch (error) {
      console.error('Error updating notice:', error)
      let errorMessage = 'Failed to update notice. Please try again.'
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(e => e.msg || e.message).join(', ')
        } else {
          errorMessage = error.response.data.detail
        }
      }
      toast.error(errorMessage)
    }
  }

  const handleToggleUrgent = async (notice) => {
    try {
      await updateNotice.mutateAsync({ 
        id: notice.id, 
        is_urgent: !notice.is_urgent 
      })
      toast.success(`Notice marked as ${!notice.is_urgent ? 'urgent' : 'normal'}`)
    } catch (error) {
      console.error('Error updating notice urgency:', error)
      toast.error('Failed to update notice status')
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
      {/* Mobile Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
            className="hidden lg:block"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg sm:text-xl font-semibold">Notices</h2>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Add Notice</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Card.Content className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search notices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Target Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Role</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
                <option value="parent">Parents</option>
              </select>
            </div>

            {/* Urgency Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
              >
                <option value="">All Notices</option>
                <option value="urgent">Urgent Only</option>
                <option value="normal">Normal Only</option>
              </select>
            </div>

            {/* Landing Page Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Landing Page</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={landingPageFilter}
                onChange={(e) => setLandingPageFilter(e.target.value)}
              >
                <option value="">All Notices</option>
                <option value="landing">Landing Page Only</option>
                <option value="non-landing">Non-Landing Only</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="created_at">Sort by Date Created</option>
                <option value="title">Sort by Title</option>
                <option value="expires_at">Sort by Expiry Date</option>
                <option value="urgent">Sort by Urgency</option>
              </select>
            </div>
          </div>
          
          {/* Results Count and Clear Filters */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredNotices.length} of {notices?.length || 0} notices
            </div>
            {(searchQuery || selectedRole || urgencyFilter || landingPageFilter || sortBy !== 'created_at') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedRole('')
                  setUrgencyFilter('')
                  setLandingPageFilter('')
                  setSortBy('created_at')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Card.Content>
      </Card>
      
      {/* Notices List */}
      <div className="space-y-4">
        {filteredNotices && filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <Card key={notice.id} className="p-4 sm:p-6">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{notice.title}</h3>
                      {notice.is_urgent && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                          Urgent
                        </span>
                      )}
                      {notice.show_on_landing && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          Landing Page
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base mb-3">{notice.content}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleViewNotice(notice)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditNotice(notice)}>
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant={notice.is_urgent ? "default" : "outline"} 
                        onClick={() => handleToggleUrgent(notice)}
                      >
                        {notice.is_urgent ? 'Remove Urgent' : 'Mark Urgent'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteNotice(notice)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-500">
                  <span>Target: {notice.target_role || 'All Users'}</span>
                  <span>Created: {new Date(notice.created_at).toLocaleDateString()}</span>
                  {notice.expires_at && (
                    <span>Expires: {new Date(notice.expires_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No notices found matching your filters.</p>
          </Card>
        )}
      </div>

      {/* Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Add New Notice"
        className="sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows={4}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              placeholder="Enter the notice content..."
            />
          </div>
          <Select
            label="Target Audience"
            value={form.target_role}
            onChange={(e) => setForm({ ...form, target_role: e.target.value })}
            options={[
              { value: '', label: 'All Users' },
              { value: 'student', label: 'Students Only' },
              { value: 'teacher', label: 'Teachers Only' },
              { value: 'admin', label: 'Admins Only' }
            ]}
          />
          <Input
            label="Expires At (Optional)"
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
          />
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="urgent"
                checked={form.is_urgent}
                onChange={(e) => setForm({ ...form, is_urgent: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="urgent" className="text-sm font-medium text-gray-700">
                Mark as urgent
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-on-landing"
                checked={form.show_on_landing}
                onChange={(e) => setForm({ ...form, show_on_landing: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="show-on-landing" className="text-sm font-medium text-gray-700">
                Show on landing page
              </label>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createNotice.isPending}>
              Create Notice
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Notice Modal */}
      <Modal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)}
        title="Notice Details"
        className="sm:max-w-lg"
      >
        {selectedNotice ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Title: </span>
                <span className="text-gray-900">{selectedNotice.title}</span>
                {selectedNotice.is_urgent && (
                  <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                    Urgent
                  </span>
                )}
              </div>
              <div>
                <span className="font-medium text-gray-700">Content: </span>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  <span className="text-gray-900">{selectedNotice.content}</span>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Target: </span>
                <span className="text-gray-900">{selectedNotice.target_role || 'All Users'}</span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </Modal>

      {/* Edit Notice Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        title="Edit Notice"
        className="sm:max-w-lg"
      >
        {editForm && (
          <form onSubmit={handleUpdateNotice} className="space-y-4">
            <Input
              label="Title"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <textarea
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows={4}
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                required
                placeholder="Enter the notice content..."
              />
            </div>
            <Select
              label="Target Audience"
              value={editForm.target_role}
              onChange={(e) => setEditForm({ ...editForm, target_role: e.target.value })}
              options={[
                { value: '', label: 'All Users' },
                { value: 'student', label: 'Students Only' },
                { value: 'teacher', label: 'Teachers Only' },
                { value: 'admin', label: 'Admins Only' }
              ]}
            />
            <Input
              label="Expires At (Optional)"
              type="datetime-local"
              value={editForm.expires_at}
              onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value })}
            />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-urgent"
                  checked={editForm.is_urgent}
                  onChange={(e) => setEditForm({ ...editForm, is_urgent: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit-urgent" className="text-sm font-medium text-gray-700">
                  Mark as urgent
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-show-on-landing"
                  checked={editForm.show_on_landing || false}
                  onChange={(e) => setEditForm({ ...editForm, show_on_landing: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit-show-on-landing" className="text-sm font-medium text-gray-700">
                  Show on landing page
                </label>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateNotice.isPending}>
                Update Notice
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Notice Modal */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)}
        title="Delete Notice"
        className="sm:max-w-md"
      >
        {selectedNotice && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete the notice <strong>"{selectedNotice.title}"</strong>?
            </p>
            <p className="text-sm text-red-600">
              This action cannot be undone. The notice will be permanently removed.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmDeleteNotice}
                loading={deleteNotice.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Notice
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminNotices