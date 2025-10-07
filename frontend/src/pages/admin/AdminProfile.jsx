import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, ArrowLeft, Users, GraduationCap } from 'lucide-react'
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

  // Mock admin data - in real app this would come from API
  const adminData = {
    id: 1,
    user: {
      full_name: 'Admin User',
      username: 'admin',
      email: 'admin@example.com',
      phone: '+1234567890'
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin')}
          className="lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg sm:text-xl font-semibold">Admin Profile</h2>
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <Card.Header className="p-4 sm:p-6">
            <div className="flex justify-between items-center">
              <Card.Title className="text-lg">Personal Information</Card.Title>
              <Button size="sm" onClick={() => setShowEditModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </Card.Header>
          <Card.Content className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Full Name:</span>
                <span className="ml-2 text-gray-900">{adminData.user.full_name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Username:</span>
                <span className="ml-2 text-gray-900">{adminData.user.username}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{adminData.user.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="ml-2 text-gray-900">{adminData.user.phone}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Employee ID:</span>
                <span className="ml-2 text-gray-900">{adminData.employee_id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Position:</span>
                <span className="ml-2 text-gray-900">{adminData.position}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Department:</span>
                <span className="ml-2 text-gray-900">{adminData.department}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Date of Birth:</span>
                <span className="ml-2 text-gray-900">{new Date(adminData.date_of_birth).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Emergency Contact:</span>
                <span className="ml-2 text-gray-900">{adminData.emergency_contact}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Joined Date:</span>
                <span className="ml-2 text-gray-900">{new Date(adminData.joined_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Login:</span>
                <span className="ml-2 text-gray-900">{new Date(adminData.last_login).toLocaleString()}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="font-medium text-gray-700">Address:</span>
                <span className="ml-2 text-gray-900">{adminData.address}</span>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Quick Actions & Permissions */}
        <div className="space-y-4">
          <Card>
            <Card.Header className="p-4">
              <Card.Title className="text-base">Quick Actions</Card.Title>
            </Card.Header>
            <Card.Content className="p-4 space-y-3">
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

          <Card>
            <Card.Header className="p-4">
              <Card.Title className="text-base">Admin Permissions</Card.Title>
            </Card.Header>
            <Card.Content className="p-4">
              <div className="space-y-2">
                {adminData.permissions.map((permission, index) => (
                  <span key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-1 mb-1">
                    {permission.replace('_', ' ').toUpperCase()}
                  </span>
                ))}
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