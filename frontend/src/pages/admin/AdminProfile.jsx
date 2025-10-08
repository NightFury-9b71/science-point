import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, ArrowLeft,User, Users, GraduationCap, Camera, X } from 'lucide-react'
import { toast } from 'sonner'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { Input } from '../../components/Form'

const AdminProfile = () => {
  const navigate = useNavigate()
  const adminId = 1 // Mock admin ID
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [profileForm, setProfileForm] = useState({
    full_name: 'Admin User',
    username: 'admin',
    email: 'admin@example.com',
    phone: '+1234567890',
    employee_id: 'ADM001',
    department: 'Administration',
    position: 'School Administrator',
    address: '456 School Street, City, State',
    date_of_birth: '1985-05-20',
    emergency_contact: '+1987654321'
  })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  // Mock admin data - in real app this would come from API
  const adminData = {
    id: 1,
    user: {
      full_name: 'Admin User',
      username: 'admin',
      email: 'admin@example.com',
      phone: '+1234567890',
      photo_path: null // Add photo_path field
    },
    employee_id: 'ADM001',
    department: 'Administration',
    position: 'School Administrator',
    address: '456 School Street, City, State',
    date_of_birth: '1985-05-20',
    emergency_contact: '+1987654321',
    joined_date: '2019-01-01',
    permissions: ['manage_students', 'manage_teachers', 'manage_classes', 'manage_notices', 'system_admin'],
    last_login: '2025-10-06T10:30:00Z'
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      // Mock API call - replace with actual API
      // await updateAdminProfile(adminId, profileForm)
      setShowEditModal(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match')
      return
    }
    try {
      // await changePassword(adminId, passwordForm)
      setShowChangePasswordModal(false)
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      toast.success('Password changed successfully!')
    } catch (error) {
      toast.error('Failed to change password')
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, or GIF)')
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      
      setSelectedPhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => setPhotoPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return
    
    try {
      const formData = new FormData()
      formData.append('file', selectedPhoto)
      
      // Mock API call - replace with actual API
      // await uploadUserPhoto(adminId, formData)
      
      toast.success('Photo uploaded successfully!')
      setSelectedPhoto(null)
      setPhotoPreview(null)
      // Refresh admin data to show new photo
    } catch (error) {
      toast.error('Failed to upload photo')
    }
  }

  const handlePhotoDelete = async () => {
    try {
      // Mock API call - replace with actual API
      // await deleteUserPhoto(adminId)
      
      toast.success('Photo deleted successfully!')
      // Refresh admin data to remove photo
    } catch (error) {
      toast.error('Failed to delete photo')
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Header/Hero Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <Card.Content className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Profile Photo */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center overflow-hidden shadow-lg">
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="Profile preview" 
                    className="w-full h-full object-cover"
                  />
                ) : adminData.user.photo_path ? (
                  <img 
                    src={`/uploads/${adminData.user.photo_path}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 sm:h-12 sm:w-12 text-white/70" />
                )}
              </div>
              {/* Photo Upload Controls */}
              <div className="absolute -bottom-2 -right-2 flex space-x-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-full bg-white text-blue-600 hover:bg-blue-50 shadow-md"
                    asChild
                  >
                    <span className="cursor-pointer">
                      <Camera className="h-4 w-4" />
                    </span>
                  </Button>
                </label>
                {adminData.user.photo_path && !selectedPhoto && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePhotoDelete}
                    className="h-8 w-8 p-0 rounded-full bg-white text-red-600 hover:bg-red-50 shadow-md border-red-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {selectedPhoto && (
                  <>
                    <Button
                      size="sm"
                      onClick={handlePhotoUpload}
                      className="h-8 w-8 p-0 rounded-full bg-green-500 text-white hover:bg-green-600 shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPhoto(null)
                        setPhotoPreview(null)
                      }}
                      className="h-8 w-8 p-0 rounded-full bg-white text-gray-600 hover:bg-gray-50 shadow-md"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{adminData.user.full_name}</h1>
              <p className="text-blue-100 mb-1">{adminData.position}</p>
              <p className="text-blue-100 text-sm">{adminData.department} • Employee ID: {adminData.employee_id}</p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="text-xs text-blue-100">Experience</div>
                  <div className="text-lg font-semibold">{adminData.experience_years} years</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="text-xs text-blue-100">Join Date</div>
                  <div className="text-sm font-semibold">{new Date(adminData.joined_date).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Photo Upload Instructions */}
      {(selectedPhoto || !adminData.user.photo_path) && (
        <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
          <Card.Content className="p-4 text-center">
            <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {selectedPhoto ? 'Click the checkmark to upload your photo' : 'Upload a professional profile photo to personalize your account'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max size: 5MB • Supported formats: JPEG, PNG, GIF
            </p>
          </Card.Content>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal & Professional Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <Card.Header className="pb-3">
              <Card.Title className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                  <p className="text-gray-900 font-medium mt-1">{adminData.user.full_name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Username</label>
                  <p className="text-gray-900 font-medium mt-1">{adminData.user.username}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                  <p className="text-gray-900 font-medium mt-1">{adminData.user.email}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                  <p className="text-gray-900 font-medium mt-1">{adminData.user.phone}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date of Birth</label>
                  <p className="text-gray-900 font-medium mt-1">{new Date(adminData.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Emergency Contact</label>
                  <p className="text-gray-900 font-medium mt-1">{adminData.emergency_contact}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</label>
                <p className="text-gray-900 font-medium mt-1">{adminData.address}</p>
              </div>
            </Card.Content>
          </Card>

          {/* Professional Information */}
          <Card>
            <Card.Header className="pb-3">
              <Card.Title className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Professional Information
              </Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Employee ID</label>
                  <p className="text-gray-900 font-medium mt-1">{adminData.employee_id}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Position</label>
                  <p className="text-gray-900 font-medium mt-1">{adminData.position}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Department</label>
                  <p className="text-gray-900 font-medium mt-1">{adminData.department}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Experience</label>
                  <p className="text-gray-900 font-medium mt-1">{adminData.experience_years} years</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Joining Date</label>
                  <p className="text-gray-900 font-medium mt-1">{new Date(adminData.joined_date).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Login</label>
                  <p className="text-gray-900 font-medium mt-1">{new Date(adminData.last_login).toLocaleString()}</p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <Card.Header className="pb-3">
              <Card.Title className="text-base">Quick Actions</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setShowEditModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setShowChangePasswordModal(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/admin/students')}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Students
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/admin/teachers')}
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Manage Teachers
              </Button>
            </Card.Content>
          </Card>

          {/* Admin Permissions */}
          <Card>
            <Card.Header className="pb-3">
              <Card.Title className="text-base">Admin Permissions</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="flex flex-wrap gap-2">
                {adminData.permissions.map((permission, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {permission.replace(/_/g, ' ').toLowerCase()}
                  </span>
                ))}
              </div>
            </Card.Content>
          </Card>

          {/* Account Status */}
          <Card>
            <Card.Header className="pb-3">
              <Card.Title className="text-base">Account Status</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Administrator
                  </span>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        title="Edit Admin Profile"
        className="sm:max-w-2xl"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              required
            />
            <Input
              label="Username"
              value={profileForm.username}
              onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              required
            />
            <Input
              label="Phone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              required
            />
            <Input
              label="Employee ID"
              value={profileForm.employee_id}
              onChange={(e) => setProfileForm({ ...profileForm, employee_id: e.target.value })}
              required
              readOnly
            />
            <Input
              label="Position"
              value={profileForm.position}
              onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
            />
            <Input
              label="Department"
              value={profileForm.department}
              onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={profileForm.date_of_birth}
              onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
            />
            <Input
              label="Emergency Contact"
              value={profileForm.emergency_contact}
              onChange={(e) => setProfileForm({ ...profileForm, emergency_contact: e.target.value })}
            />
          </div>
          <Input
            label="Address"
            value={profileForm.address}
            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
            <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Update Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal 
        isOpen={showChangePasswordModal} 
        onClose={() => setShowChangePasswordModal(false)}
        title="Change Password"
        className="sm:max-w-md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirm_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
            required
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
            <Button type="button" variant="outline" onClick={() => setShowChangePasswordModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Change Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminProfile