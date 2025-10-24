import { User, Phone, Calendar, School, Camera, X, Check, Upload, BookOpen, FileText, Headphones, Award, Edit3, Save, Lock, Eye, EyeOff } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useStudentProfile, useStudentUploadPhoto, useStudentDeletePhoto, useUpdateStudentProfile, useChangeStudentPassword } from '../../services/queries'
import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import cloudinaryService from '../../services/cloudinaryService'
import config from '../../config/index.js'

function StudentProfile() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const studentId = user?.student_id || user?.studentId
  
  // API hooks
  const { data: profile, isLoading, error } = useStudentProfile(studentId)
  const uploadPhotoMutation = useStudentUploadPhoto()
  const deletePhotoMutation = useStudentDeletePhoto()
  const updateProfileMutation = useUpdateStudentProfile()
  const changePasswordMutation = useChangeStudentPassword()
  
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }
    
    // Validate file size using config
    const maxSize = config.ui.fileUploadMaxSize
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0)
      toast.error(`File size must be less than ${maxSizeMB}MB`)
      return
    }
    
    setSelectedPhoto(file)
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handlePhotoUpload = async () => {
    if (!selectedPhoto || !profile?.user?.id) return
    
    setIsUploadingPhoto(true)
    try {
      // Upload to Cloudinary first
      const cloudinaryResult = await cloudinaryService.uploadFile(selectedPhoto)

      // Then send Cloudinary data to backend as JSON
      await uploadPhotoMutation.mutateAsync({
        userId: profile.user.id,
        photoData: {
          file_url: cloudinaryResult.url,
          file_path: cloudinaryResult.publicId
        }
      })

      // Update user data in AuthContext to reflect the new photo
      updateUser({
        photo_path: cloudinaryResult.publicId,
        photo_url: cloudinaryResult.url
      })

      toast.success('Photo uploaded successfully!')
      setSelectedPhoto(null)
      setPhotoPreview(null)
      // Profile will be automatically refreshed by the mutation's onSuccess callback
    } catch (err) {
      toast.error('Failed to upload photo')
      console.error('Photo upload error:', err)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handlePhotoDelete = async () => {
    if (!profile?.user?.id) return
    
    try {
      await deletePhotoMutation.mutateAsync(profile.user.id)
      
      // Update user data in AuthContext to clear the photo
      updateUser({
        photo_path: null,
        photo_url: null
      })
      
      toast.success('Photo deleted successfully!')
      // Profile will be automatically refreshed by the mutation's onSuccess callback
    } catch (err) {
      toast.error('Failed to delete photo')
      console.error('Photo delete error:', err)
    }
  }

  const cancelPhotoSelection = () => {
    setSelectedPhoto(null)
    setPhotoPreview(null)
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setIsEditing(false)
      setEditedProfile({})
    } else {
      // Start editing
      setIsEditing(true)
      setEditedProfile({
        full_name: profile?.user?.full_name || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        parent_phone: profile?.parent_phone || ''
      })
    }
  }

  const handleInputChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      
      // Update profile via API using the new hook
      await updateProfileMutation.mutateAsync({
        studentId,
        ...editedProfile
      })
      
      // Update user data in AuthContext
      updateUser({
        ...user,
        full_name: editedProfile.full_name,
        phone: editedProfile.phone
      })
      
      setIsEditing(false)
      setEditedProfile({})
      toast.success('Profile updated successfully!')
      
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long')
      return
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password must be different from current password')
      return
    }

    try {
      setIsPasswordSaving(true)
      
      await changePasswordMutation.mutateAsync({
        studentId,
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      })
      
      setIsChangingPassword(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      toast.success('Password changed successfully!')
      
    } catch (error) {
      console.error('Password change error:', error)
      const errorMessage = error.response?.data?.detail || 'Failed to change password. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsPasswordSaving(false)
    }
  }

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-green-600"></div>
          <School className="h-6 w-6 text-green-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full mx-4">
          <Card className="border-red-200 bg-red-50">
            <Card.Content className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Profile</h3>
              <p className="text-gray-600 mb-6">
                We couldn't load your profile information. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()} className="w-full bg-red-600 hover:bg-red-700">
                Retry
              </Button>
            </Card.Content>
          </Card>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const hasPhoto = profile.user?.photo_path || photoPreview
  const displayPhoto = photoPreview || profile.user?.photo_url || (profile.user?.photo_path && profile.user.photo_path.startsWith('http') ? profile.user.photo_path : null)

  return (
    <div className="space-y-6 pb-6">
      {/* Profile Header with Cover */}
      <Card className="overflow-hidden shadow-lg">
        {/* Cover Image */}
        <div className="h-32 sm:h-40 bg-gradient-to-br from-green-500 via-teal-500 to-blue-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          }}></div>
        </div>

        <Card.Content className="px-4 sm:px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20">
            {/* Profile Photo Container */}
            <div className="relative mb-4 sm:mb-0 sm:mr-6">
              <div className="relative">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden">
                  {displayPhoto ? (
                    <img 
                      src={displayPhoto} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center">
                      <User className="h-12 w-12 sm:h-16 sm:w-16 text-green-600" />
                    </div>
                  )}
                </div>

                {/* Photo Upload Controls */}
                <div className="absolute -bottom-1 -right-1 flex gap-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-upload"
                    disabled={isUploadingPhoto}
                  />
                  
                  {!selectedPhoto ? (
                    <>
                      <label htmlFor="photo-upload">
                        <div className="cursor-pointer h-10 w-10 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
                          <Camera className="h-5 w-5" />
                        </div>
                      </label>
                      {profile.user?.photo_path && (
                        <button
                          onClick={handlePhotoDelete}
                          className="h-10 w-10 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handlePhotoUpload}
                        disabled={isUploadingPhoto}
                        className="h-10 w-10 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingPhoto ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <Check className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={cancelPhotoSelection}
                        disabled={isUploadingPhoto}
                        className="h-10 w-10 rounded-full bg-gray-600 hover:bg-gray-700 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {profile.user?.full_name || 'Student'}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <School className="h-3.5 w-3.5 mr-1.5" />
                  Student
                </span>
                <span className="text-gray-600 font-medium">Roll No: {profile.roll_number}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{profile.class_assigned?.name || `Class ${profile.class_id}`}</span>
              </div>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl px-4 py-2.5 border border-blue-200">
                  <div className="text-xs font-medium text-blue-600 mb-0.5">Admission Date</div>
                  <div className="text-sm font-bold text-blue-900">
                    {new Date(profile.admission_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl px-4 py-2.5 border border-green-200">
                  <div className="text-xs font-medium text-green-600 mb-0.5">Status</div>
                  <div className="text-sm font-bold text-green-900 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Photo Upload Hint */}
      {selectedPhoto && (
        <Card className="border-green-200 bg-green-50">
          <Card.Content className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Upload className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-green-900 mb-1">New Photo Selected</h4>
                <p className="text-sm text-green-700">
                  Click the checkmark button to upload your new profile photo, or click the X to cancel.
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <Card.Header className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <Card.Title className="text-lg font-semibold flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                Personal Information
              </Card.Title>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditToggle}
                className="flex items-center gap-2"
              >
                {isEditing ? (
                  <>
                    <X className="h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </>
                )}
              </Button>
            </div>
          </Card.Header>
          <Card.Content className="pt-6 space-y-3">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editedProfile.full_name || ''}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={editedProfile.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={editedProfile.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parent Phone</label>
                  <input
                    type="tel"
                    value={editedProfile.parent_phone || ''}
                    onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter parent/guardian phone number"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    loading={isSaving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <InfoItem 
                  icon={User} 
                  label="Full Name" 
                  value={profile.user?.full_name || 'N/A'} 
                />
                <InfoItem 
                  icon={Phone} 
                  label="Phone Number" 
                  value={profile.user?.phone || 'N/A'} 
                />
                <InfoItem 
                  icon={Award} 
                  label="Roll Number" 
                  value={profile.roll_number} 
                />
              </>
            )}
          </Card.Content>
        </Card>

        {/* Academic Information */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <Card.Header className="border-b border-gray-100 pb-4">
            <Card.Title className="text-lg font-semibold flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <School className="h-4 w-4 text-blue-600" />
              </div>
              Academic Information
            </Card.Title>
          </Card.Header>
          <Card.Content className="pt-6 space-y-3">
            <InfoItem 
              icon={BookOpen} 
              label="Current Class" 
              value={profile.class_assigned?.name || `Class ${profile.class_id}`} 
            />
            <InfoItem 
              icon={Calendar} 
              label="Admission Date" 
              value={new Date(profile.admission_date).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })} 
            />
            <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                    Academic Status
                  </div>
                  <div className="font-semibold text-gray-900">Active Student</div>
                </div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </Card.Content>
        </Card>

        {/* Additional Information */}
        <Card className="lg:col-span-2 shadow-md hover:shadow-lg transition-shadow duration-200">
          <Card.Header className="border-b border-gray-100 pb-4">
            <Card.Title className="text-lg font-semibold flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-purple-600" />
              </div>
              Additional Information
            </Card.Title>
          </Card.Header>
          <Card.Content className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoItem 
                icon={User} 
                label="Parent Name" 
                value={profile.parent_name || 'Not Provided'} 
              />
              <InfoItem 
                icon={Phone} 
                label="Parent Phone" 
                value={profile.parent_phone || 'Not Provided'} 
              />
              <div className="sm:col-span-2">
                <InfoItem 
                  icon={User} 
                  label="Address" 
                  value={profile.address || 'Not Provided'} 
                />
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <Card.Header className="border-b border-gray-100 pb-4">
            <Card.Title className="text-lg font-semibold">Quick Actions</Card.Title>
          </Card.Header>
          <Card.Content className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ActionButton icon={BookOpen} label="View Materials" color="blue" onClick={() => navigate('/student/materials')} />
              <ActionButton icon={Calendar} label="View Schedule" color="green" onClick={() => navigate('/student/schedule')} />
              <ActionButton icon={FileText} label="View Results" color="purple" onClick={() => navigate('/student/results')} />
              <ActionButton icon={FileText} label="View Notices" color="orange" onClick={() => navigate('/student/notices')} />
            </div>
          </Card.Content>
        </Card>

        {/* Security Settings */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <Card.Header className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <Card.Title className="text-lg font-semibold flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Lock className="h-4 w-4 text-red-600" />
                </div>
                Security Settings
              </Card.Title>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="flex items-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <X className="h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </Card.Header>
          <Card.Content className="pt-6">
            {isChangingPassword ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCancelPasswordChange}
                    disabled={isPasswordSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    loading={isPasswordSaving}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Change Password
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Password Security</h3>
                <p className="text-gray-600 mb-4">
                  Keep your account secure by regularly updating your password.
                </p>
                <p className="text-sm text-gray-500">
                  Last changed: Not available
                </p>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}

// Helper Component for Info Items
function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
          <Icon className="h-5 w-5 text-gray-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
            {label}
          </div>
          <div className="font-semibold text-gray-900 truncate">{value}</div>
        </div>
      </div>
    </div>
  )
}

// Helper Component for Action Buttons
function ActionButton({ icon: Icon, label, color, onClick }) {
  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
  }

  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-start gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${colorClasses[color]}`}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="font-medium">{label}</span>
    </button>
  )
}

export default StudentProfile