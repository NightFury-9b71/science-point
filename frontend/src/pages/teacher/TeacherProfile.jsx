import { User, Phone, Calendar, School, Camera, X, Check, Upload, BookOpen, FileText, Headphones, Award, GraduationCap } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useTeacherProfile, useTeacherUploadPhoto, useTeacherDeletePhoto } from '../../services/queries'
import { useState } from 'react'
import { toast } from 'sonner'
import cloudinaryService from '../../services/cloudinaryService.js'
import config from '../../config/index.js'

function TeacherProfile() {
  const { user, updateUser } = useAuth()
  const teacherId = user?.teacher_id || user?.teacherId
  
  // Verify teacher authentication
  if (!teacherId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full mx-4">
          <Card className="border-yellow-200 bg-yellow-50">
            <Card.Content className="p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Incomplete</h3>
              <p className="text-gray-600 mb-6">
                Your teacher profile is not properly set up. Please contact the administrator for assistance.
              </p>
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Contact Administrator
              </Button>
            </Card.Content>
          </Card>
        </div>
      </div>
    )
  }
  
  const { data: profile, isLoading, error } = useTeacherProfile(teacherId)
  const uploadPhotoMutation = useTeacherUploadPhoto()
  const deletePhotoMutation = useTeacherDeletePhoto()
  
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

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

      // Send JSON payload with Cloudinary data to backend
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

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-purple-600"></div>
          <GraduationCap className="h-6 w-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
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
        <div className="h-32 sm:h-40 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 relative">
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
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <User className="h-12 w-12 sm:h-16 sm:w-16 text-purple-600" />
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
                        <div className="cursor-pointer h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
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
                {profile.user?.full_name || 'Teacher'}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                  Teacher
                </span>
                <span className="text-gray-600 font-medium">ID: {profile.employee_id}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{profile.experience_years} years exp.</span>
              </div>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl px-4 py-2.5 border border-purple-200">
                  <div className="text-xs font-medium text-purple-600 mb-0.5">Joining Date</div>
                  <div className="text-sm font-bold text-purple-900">
                    {new Date(profile.joining_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl px-4 py-2.5 border border-pink-200">
                  <div className="text-xs font-medium text-pink-600 mb-0.5">Qualification</div>
                  <div className="text-sm font-bold text-pink-900">
                    {profile.qualification}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl px-4 py-2.5 border border-green-200">
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
            <Card.Title className="text-lg font-semibold flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-purple-600" />
              </div>
              Personal Information
            </Card.Title>
          </Card.Header>
          <Card.Content className="pt-6 space-y-3">
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
              label="Employee ID" 
              value={profile.employee_id} 
            />
          </Card.Content>
        </Card>

        {/* Professional Information */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <Card.Header className="border-b border-gray-100 pb-4">
            <Card.Title className="text-lg font-semibold flex items-center gap-2">
              <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-pink-600" />
              </div>
              Professional Information
            </Card.Title>
          </Card.Header>
          <Card.Content className="pt-6 space-y-3">
            <InfoItem 
              icon={GraduationCap} 
              label="Qualification" 
              value={profile.qualification} 
            />
            <InfoItem 
              icon={Calendar} 
              label="Joining Date" 
              value={new Date(profile.joining_date).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })} 
            />
            <InfoItem 
              icon={Award} 
              label="Experience" 
              value={`${profile.experience_years} years`} 
            />
            <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                    Monthly Salary
                  </div>
                  <div className="font-semibold text-gray-900">₹{profile.salary?.toLocaleString() || 'N/A'}</div>
                </div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </Card.Content>
        </Card>

        {/* Subjects Taught */}
        <Card className="lg:col-span-2 shadow-md hover:shadow-lg transition-shadow duration-200">
          <Card.Header className="border-b border-gray-100 pb-4">
            <Card.Title className="text-lg font-semibold flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              Teaching Information
            </Card.Title>
          </Card.Header>
          <Card.Content className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  Subjects Taught
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.subjects?.map((subject, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {subject.name}
                    </span>
                  )) || <span className="text-gray-500 text-sm">No subjects assigned</span>}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <School className="h-4 w-4 text-green-600" />
                  Classes Assigned
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.classes?.map((classItem, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {classItem.name}
                    </span>
                  )) || <span className="text-gray-500 text-sm">No classes assigned</span>}
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-2 shadow-md hover:shadow-lg transition-shadow duration-200">
          <Card.Header className="border-b border-gray-100 pb-4">
            <Card.Title className="text-lg font-semibold">Quick Actions</Card.Title>
          </Card.Header>
          <Card.Content className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <ActionButton icon={School} label="View Classes" color="blue" />
              <ActionButton icon={User} label="View Students" color="green" />
              <ActionButton icon={Calendar} label="View Schedule" color="purple" />
              <ActionButton icon={FileText} label="Upload Materials" color="orange" />
            </div>
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
function ActionButton({ icon: Icon, label, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
  }

  return (
    <button className={`flex items-center justify-start gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${colorClasses[color]}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="font-medium">{label}</span>
    </button>
  )
}

export default TeacherProfile