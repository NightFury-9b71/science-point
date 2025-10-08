import { User, Mail, Phone, Calendar, School, Camera, X, Plus, GraduationCap } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useState } from 'react'
import { toast } from 'sonner'

function TeacherProfile() {
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  // Mock teacher data - in real app this would come from API
  const teacherData = {
    id: 1,
    user: {
      full_name: 'John Smith',
      username: 'johnsmith',
      email: 'john.smith@example.com',
      phone: '+1234567891',
      photo_path: null
    },
    employee_id: 'TCH001',
    qualification: 'M.Sc. Mathematics, B.Ed.',
    experience_years: 8,
    salary: 45000.00,
    joining_date: '2017-08-15',
    subjects: ['Mathematics', 'Statistics'],
    classes: ['Class 10A', 'Class 11 Science', 'Class 12 Science']
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
      // await uploadUserPhoto(teacherData.user.id, formData)

      toast.success('Photo uploaded successfully!')
      setSelectedPhoto(null)
      setPhotoPreview(null)
      // Refresh teacher data to show new photo
    } catch (error) {
      toast.error('Failed to upload photo')
    }
  }

  const handlePhotoDelete = async () => {
    try {
      // Mock API call - replace with actual API
      // await deleteUserPhoto(teacherData.user.id)

      toast.success('Photo deleted successfully!')
      // Refresh teacher data to remove photo
    } catch (error) {
      toast.error('Failed to delete photo')
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Header/Hero Section */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
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
                ) : teacherData.user.photo_path ? (
                  <img
                    src={`/uploads/${teacherData.user.photo_path}`}
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
                    className="h-8 w-8 p-0 rounded-full bg-white text-purple-600 hover:bg-purple-50 shadow-md"
                    asChild
                  >
                    <span className="cursor-pointer">
                      <Camera className="h-4 w-4" />
                    </span>
                  </Button>
                </label>
                {teacherData.user.photo_path && !selectedPhoto && (
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
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{teacherData.user.full_name}</h1>
              <p className="text-purple-100 mb-1">{teacherData.qualification}</p>
              <p className="text-purple-100 text-sm">Employee ID: {teacherData.employee_id} • {teacherData.experience_years} years experience</p>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="text-xs text-purple-100">Joining Date</div>
                  <div className="text-sm font-semibold">{new Date(teacherData.joining_date).toLocaleDateString()}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="text-xs text-purple-100">Classes</div>
                  <div className="text-sm font-semibold">{teacherData.classes.length} assigned</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="text-xs text-purple-100">Subjects</div>
                  <div className="text-sm font-semibold">{teacherData.subjects.length} teaching</div>
                </div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Photo Upload Instructions */}
      {(selectedPhoto || !teacherData.user.photo_path) && (
        <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
          <Card.Content className="p-4 text-center">
            <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {selectedPhoto ? 'Click the checkmark to upload your photo' : 'Upload a professional profile photo to personalize your teacher account'}
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
              <User className="h-5 w-5 text-purple-600" />
              Personal Information
            </Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                <p className="text-gray-900 font-medium mt-1">{teacherData.user.full_name}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                <p className="text-gray-900 font-medium mt-1">{teacherData.user.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                <p className="text-gray-900 font-medium mt-1">{teacherData.user.phone}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Employee ID</label>
                <p className="text-gray-900 font-medium mt-1">{teacherData.employee_id}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Professional Information */}
        <Card>
          <Card.Header className="pb-3">
            <Card.Title className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              Professional Information
            </Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Qualification</label>
                <p className="text-gray-900 font-medium mt-1">{teacherData.qualification}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Experience</label>
                <p className="text-gray-900 font-medium mt-1">{teacherData.experience_years} years</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Joining Date</label>
                <p className="text-gray-900 font-medium mt-1">{new Date(teacherData.joining_date).toLocaleDateString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Salary</label>
                <p className="text-gray-900 font-medium mt-1">₹{teacherData.salary.toLocaleString()}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Subjects Taught */}
        <Card>
          <Card.Header className="pb-3">
            <Card.Title className="text-lg flex items-center gap-2">
              <School className="h-5 w-5 text-purple-600" />
              Subjects Taught
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-wrap gap-2">
              {teacherData.subjects.map((subject, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {subject}
                </span>
              ))}
            </div>
          </Card.Content>
        </Card>

        {/* Classes Assigned */}
        <Card>
          <Card.Header className="pb-3">
            <Card.Title className="text-lg flex items-center gap-2">
              <School className="h-5 w-5 text-purple-600" />
              Classes Assigned
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-wrap gap-2">
              {teacherData.classes.map((className, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800">
                  {className}
                </span>
              ))}
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
                View Classes
              </Button>
              <Button variant="outline" className="justify-start">
                <GraduationCap className="h-4 w-4 mr-2" />
                View Students
              </Button>
              <Button variant="outline" className="justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
              <Button variant="outline" className="justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Upload Materials
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}

export default TeacherProfile