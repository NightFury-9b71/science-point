import { FileText, Download, Calendar, BookOpen, X } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useStudentMaterials } from '../../services/queries'
import { useAuth } from '../../contexts/AuthContext'
import config from '../../config/index.js'

function StudentMaterials() {
  const { user, isLoading: authLoading } = useAuth()
  const studentId = user?.student_id || user?.studentId
  
  const { data: studyMaterials = [], isLoading, error } = useStudentMaterials(studentId)

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show error if no student ID found
  if (!studentId) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 mb-2">
            <X className="h-8 w-8 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Student Profile Not Found</h3>
          <p className="text-red-700">
            Unable to load materials. Please contact the administrator to ensure your student profile is properly set up.
          </p>
        </div>
      </div>
    )
  }

  const handleDownload = (material) => {
    // Open the file in a new tab/window for download from frontend public folder
    const downloadUrl = `${config.frontend.baseURL}/uploads/${material.file_path}`
    window.open(downloadUrl, '_blank')
  }

  const getFileSize = (bytes) => {
    if (!bytes) return 'Unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
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
        <p className="text-red-600">Failed to load study materials</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Study Materials</h1>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {studyMaterials.map((material) => (
          <Card key={material.id} className="hover:shadow-lg transition-shadow">
            <Card.Content className="p-4 sm:p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                    {material.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                    {material.description}
                  </p>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {material.file_type}
                      </span>
                      <div className="flex items-center text-xs text-gray-500">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Subject {material.subject_id}
                      </div>
                    </div>
                    
                    {material.file_size && (
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {getFileSize(material.file_size)}
                        </span>
                      </div>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleDownload(material)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex items-center mt-3 text-xs text-gray-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    Uploaded: {new Date(material.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {studyMaterials.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No study materials available</p>
        </div>
      )}
    </div>
  )
}

export default StudentMaterials