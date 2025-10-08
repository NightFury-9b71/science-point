import { User, Mail, Phone, Calendar, School, Camera, X, Plus } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useStudentProfile } from '../../services/queries'
import { useState } from 'react'
import { toast } from 'sonner'

function StudentProfile() {
  const { user } = useAuth()
  const studentId = user?.student_id || user?.studentId
  
  // Verify student authentication
  if (!studentId) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-yellow-600 mb-2">
            <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-yellow-900 mb-2">Student Profile Incomplete</h3>
          <p className="text-yellow-700">
            Your student profile is not properly set up. Please contact the administrator.
          </p>
        </div>
      </div>
    )
  }
  
  const { data: profile, isLoading, error } = useStudentProfile(studentId)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

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
      // await uploadUserPhoto(profile.user.id, formData)
      
      toast.success('Photo uploaded successfully!')
      setSelectedPhoto(null)
      setPhotoPreview(null)
      // Refresh profile data to show new photo
    } catch {
      toast.error('Failed to upload photo')
    }
  }

  const handlePhotoDelete = async () => {
    try {
      // Mock API call - replace with actual API
      // await deleteUserPhoto(profile.user.id)
      
      toast.success('Photo deleted successfully!')
      // Refresh profile data to remove photo
    } catch {
      toast.error('Failed to delete photo')
    }
  }

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
        <p className="text-red-600">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header/Hero Section */}
      <Card className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
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
                ) : profile.user?.photo_path ? (
                  <img 
                    src={`/uploads/${profile.user.photo_path}`} 
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
                    className="h-8 w-8 p-0 rounded-full bg-white text-green-600 hover:bg-green-50 shadow-md"
                    asChild
                  >
                    <span className="cursor-pointer">
                      <Camera className="h-4 w-4" />
                    </span>
                  </Button>
                </label>
                {profile.user?.photo_path && !selectedPhoto && (
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
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{profile.user?.full_name || 'Student'}</h1>
              <p className="text-green-100 mb-1">Student • Roll No: {profile.roll_number}</p>
              <p className="text-green-100 text-sm">Class {profile.class_id}</p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="text-xs text-green-100">Admission Date</div>
                  <div className="text-sm font-semibold">{new Date(profile.admission_date).toLocaleDateString()}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="text-xs text-green-100">Status</div>
                  <div className="text-sm font-semibold text-green-200">Active</div>
                </div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Photo Upload Instructions */}
      {(selectedPhoto || !profile.user?.photo_path) && (
        <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
          <Card.Content className="p-4 text-center">
            <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {selectedPhoto ? 'Click the checkmark to upload your photo' : 'Upload a profile photo to personalize your student account'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max size: 5MB • Supported formats: JPEG, PNG, GIF
            </p>
          </Card.Content>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <Card.Header className="pb-3">
            <Card.Title className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Personal Information
            </Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                <p className="text-gray-900 font-medium mt-1">{profile.user?.full_name || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                <p className="text-gray-900 font-medium mt-1">{profile.user?.email || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                <p className="text-gray-900 font-medium mt-1">{profile.user?.phone || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Roll Number</label>
                <p className="text-gray-900 font-medium mt-1">{profile.roll_number}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Academic Information */}
        <Card>
          <Card.Header className="pb-3">
            <Card.Title className="text-lg flex items-center gap-2">
              <School className="h-5 w-5 text-green-600" />
              Academic Information
            </Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Class</label>
                <p className="text-gray-900 font-medium mt-1">Class {profile.class_id}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Admission Date</label>
                <p className="text-gray-900 font-medium mt-1">{new Date(profile.admission_date).toLocaleDateString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Academic Status</label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 mt-1">
                  Active Student
                </span>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Parent Information */}
        <Card className="lg:col-span-2">
          <Card.Header className="pb-3">
            <Card.Title className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Parent/Guardian Information
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Parent Name</label>
                <p className="text-gray-900 font-medium mt-1">{profile.parent_name || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Parent Phone</label>
                <p className="text-gray-900 font-medium mt-1">{profile.parent_phone || 'N/A'}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <Card.Header className="pb-3">
            <Card.Title className="text-lg">Quick Actions</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button variant="outline" className="justify-start">
                <School className="h-4 w-4 mr-2" />
                View Subjects
              </Button>
              <Button variant="outline" className="justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
              <Button variant="outline" className="justify-start">
                <Mail className="h-4 w-4 mr-2" />
                View Results
              </Button>
              <Button variant="outline" className="justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}

export default StudentProfile