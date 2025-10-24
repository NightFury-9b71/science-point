import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, GraduationCap, BookOpen, Calendar, UserPlus, Check, X, Eye } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { useAdminDashboard, useAdmissionRequests, useApproveAdmissionRequest, useRejectAdmissionRequest } from '../../services/queries'

const AdminOverview = () => {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useAdminDashboard()
  const { data: admissionRequests, isLoading: requestsLoading } = useAdmissionRequests()
  const approveMutation = useApproveAdmissionRequest()
  const rejectMutation = useRejectAdmissionRequest()
  
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false)
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState(null)
  
  const handleApprove = (request) => {
    setSelectedRequest(request)
    setShowApproveConfirmModal(true)
  }
  
  const handleReject = (request) => {
    setSelectedRequest(request)
    setShowRejectConfirmModal(true)
  }
  
  const confirmApprove = () => {
    approveMutation.mutate(selectedRequest.id, {
      onSuccess: (data) => {
        setGeneratedCredentials(data)
        setShowApproveConfirmModal(false)
        setShowSuccessModal(true)
      }
    })
  }
  
  const confirmReject = () => {
    rejectMutation.mutate(selectedRequest.id, {
      onSuccess: () => {
        setShowRejectConfirmModal(false)
        setSelectedRequest(null)
      }
    })
  }
  
  const handleViewDetails = (request) => {
    setSelectedRequest(request)
    setShowDetailsModal(true)
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
      
      {/* Admission Requests */}
      <Card>
        <Card.Header className="p-4 sm:p-6 pb-2 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <Card.Title className="text-lg sm:text-xl font-semibold flex items-center">
              <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
              Pending Admission Requests
            </Card.Title>
            <span className="text-sm text-gray-500">
              {admissionRequests?.length || 0} pending
            </span>
          </div>
        </Card.Header>
        <Card.Content className="p-0">
          {requestsLoading ? (
            <div className="p-4 sm:p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : admissionRequests && admissionRequests.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {admissionRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                        {request.full_name}
                      </h4>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p> {request.parent_phone}</p>
                        <p>📅 Applied: {new Date(request.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2 sm:gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(request)}
                        className="flex items-center justify-center"
                      >
                        <Eye className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Details</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleApprove(request)}
                        disabled={approveMutation.isPending}
                        className="flex items-center justify-center"
                      >
                        <Check className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Approve</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleReject(request)}
                        disabled={rejectMutation.isPending}
                        className="flex items-center justify-center"
                      >
                        <X className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Reject</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 sm:p-6 text-center">
              <div className="flex flex-col items-center justify-center py-6 sm:py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <UserPlus className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm sm:text-base font-medium">No pending admission requests</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  New requests will appear here when submitted
                </p>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>
      
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
      
      {/* Modals */}
      
      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={showApproveConfirmModal}
        onClose={() => setShowApproveConfirmModal(false)}
        title="Confirm Approval"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Approve Admission Request</h3>
              <p className="text-sm text-gray-500">This will create a student account with auto-generated credentials.</p>
            </div>
          </div>
          
          {selectedRequest && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">{selectedRequest.full_name}</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Class:</strong> {selectedRequest.class_assigned?.name || 'Unknown'}</p>
                <p><strong>Parent Phone:</strong> {selectedRequest.parent_phone}</p>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>What happens next:</strong><br />
              • Student account will be created automatically<br />
              • Username, password, and roll number will be generated<br />
              • Student will be enrolled in the selected class
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowApproveConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={confirmApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Creating Account...' : 'Approve & Create Account'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={showRejectConfirmModal}
        onClose={() => setShowRejectConfirmModal(false)}
        title="Confirm Rejection"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <X className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Reject Admission Request</h3>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
          </div>
          
          {selectedRequest && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">{selectedRequest.full_name}</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Class:</strong> {selectedRequest.class_assigned?.name || 'Unknown'}</p>
                <p><strong>Parent Phone:</strong> {selectedRequest.parent_phone}</p>
              </div>
            </div>
          )}
          
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This will permanently reject the admission request. 
              The applicant will need to submit a new application if they wish to reapply.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowRejectConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          setGeneratedCredentials(null)
          setSelectedRequest(null)
        }}
        title="Admission Approved Successfully"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Student Account Created</h3>
              <p className="text-sm text-gray-500">Please save these credentials and share them with the student.</p>
            </div>
          </div>
          
          {generatedCredentials && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3">Generated Credentials</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-green-800">Username:</span>
                  <code className="bg-white px-2 py-1 rounded text-green-900 font-mono">{generatedCredentials.username}</code>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-800">Password:</span>
                  <code className="bg-white px-2 py-1 rounded text-green-900 font-mono">{generatedCredentials.password}</code>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-800">Roll Number:</span>
                  <code className="bg-white px-2 py-1 rounded text-green-900 font-mono">{generatedCredentials.roll_number}</code>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Make sure to securely share these credentials with the student. 
              They can use them to log in and access their account.
            </p>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => {
                setShowSuccessModal(false)
                setGeneratedCredentials(null)
                setSelectedRequest(null)
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Admission Request Details"
      >
        <div className="space-y-4">
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRequest.full_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRequest.parent_phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{new Date(selectedRequest.date_of_birth).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRequest.address}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Date</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default AdminOverview