import { User, Mail, Phone, Calendar, School } from 'lucide-react'
import Card from '../../components/Card'
import { useStudentProfile } from '../../services/queries'

function StudentProfile() {
  const { data: profile, isLoading, error } = useStudentProfile()

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <User className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Profile</h1>
      </div>

      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Personal Information */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-600" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900 text-sm sm:text-base">{profile.user?.full_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900 text-sm sm:text-base">{profile.user?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900 text-sm sm:text-base">{profile.user?.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <School className="h-5 w-5 text-gray-600" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Roll Number</label>
                    <p className="text-gray-900 text-sm sm:text-base">{profile.roll_number}</p>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Academic Information */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Academic Information
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <School className="h-5 w-5 text-gray-600" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Class</label>
                    <p className="text-gray-900 text-sm sm:text-base">Class {profile.class_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Admission Date</label>
                    <p className="text-gray-900 text-sm sm:text-base">
                      {new Date(profile.admission_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Parent Information */}
          <Card className="lg:col-span-2">
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Parent Information
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-600" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Parent Name</label>
                    <p className="text-gray-900 text-sm sm:text-base">{profile.parent_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Parent Phone</label>
                    <p className="text-gray-900 text-sm sm:text-base">{profile.parent_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  )
}

export default StudentProfile