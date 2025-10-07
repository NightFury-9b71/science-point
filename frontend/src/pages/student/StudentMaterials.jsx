import { FileText, Download, Calendar, BookOpen } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useStudyMaterials } from '../../services/queries'

function StudentMaterials() {
  const { data: studyMaterials = [], isLoading, error } = useStudyMaterials()

  const handleDownload = (material) => {
    // In a real app, this would download the file from the server
    console.log('Downloading:', material.title)
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