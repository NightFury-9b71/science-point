import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, Image, File, X, Plus, Download, Eye } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useTeacherSubjects, useTeacherMaterials, useUploadStudyMaterial } from '../../services/queries'

const TeacherMaterials = () => {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const teacherId = user?.teacher_id || user?.teacherId
  
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    file: null,
    is_public: true
  })

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show error if no teacher ID found
  if (!teacherId) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 mb-2">
            <X className="h-8 w-8 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Teacher Profile Not Found</h3>
          <p className="text-red-700">
            Unable to load materials. Please contact the administrator to ensure your teacher profile is properly set up.
          </p>
        </div>
      </div>
    )
  }

  const { data: mySubjects = [], isLoading: subjectsLoading } = useTeacherSubjects(teacherId)
  const { data: materials = [], isLoading: materialsLoading } = useTeacherMaterials(teacherId)
  const uploadMutation = useUploadStudyMaterial()

  const filteredMaterials = selectedSubject
    ? materials.filter(material => material.subject_id === selectedSubject.id)
    : []

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setUploadForm(prev => ({ ...prev, file }))
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!uploadForm.file || !uploadForm.title || !selectedSubject) {
      alert('Please fill in all required fields')
      return
    }

    const formData = new FormData()
    formData.append('title', uploadForm.title)
    formData.append('description', uploadForm.description || '')
    formData.append('subject_id', selectedSubject.id)
    formData.append('file', uploadForm.file)
    formData.append('is_public', uploadForm.is_public)

    try {
      await uploadMutation.mutateAsync({ formData, teacherId })
      setUploadForm({
        title: '',
        description: '',
        file: null,
        is_public: true
      })
      setShowUploadForm(false)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload material. Please try again.')
    }
  }

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />
    if (fileType?.includes('image')) return <Image className="h-6 w-6 text-green-500" />
    return <File className="h-6 w-6 text-gray-500" />
  }

  const getFileSize = (bytes) => {
    if (!bytes) return 'Unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (subjectsLoading || materialsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/teacher')}
          className="lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg sm:text-xl font-semibold">Study Materials</h2>
      </div>

      {/* Subject Selection */}
      <Card>
        <Card.Header>
          <Card.Title>Select Subject</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mySubjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject)}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  selectedSubject?.id === subject.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium text-gray-900">{subject.name}</h3>
                <p className="text-sm text-gray-600">Code: {subject.code}</p>
              </button>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Materials Section */}
      {selectedSubject && (
        <Card>
          <Card.Header className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <Card.Title>Materials for {selectedSubject.name}</Card.Title>
            <Button
              onClick={() => setShowUploadForm(true)}
              className="mt-2 sm:mt-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Material
            </Button>
          </Card.Header>
          <Card.Content>
            {filteredMaterials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMaterials.map((material) => (
                  <div key={material.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      {getFileIcon(material.file_type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{material.title}</h4>
                        {material.description && (
                          <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Size: {getFileSize(material.file_size)}</span>
                          <span>Type: {material.file_type || 'Unknown'}</span>
                          <span>Uploaded: {new Date(material.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No materials uploaded</h3>
                <p className="text-gray-600 mb-4">Start by uploading study materials for this subject.</p>
                <Button onClick={() => setShowUploadForm(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Material
                </Button>
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Study Material</h3>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File *
                </label>
                <input
                  key={showUploadForm ? 'file-input' : 'file-input-reset'}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {uploadForm.file && (
                  <p className="text-xs text-gray-600 mt-1">
                    Selected: {uploadForm.file.name}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, Images (JPG, PNG), Documents (DOC, DOCX, TXT)
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={uploadForm.is_public}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_public" className="ml-2 text-sm text-gray-700">
                  Make this material publicly accessible to students
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploadMutation.isLoading}
                  className="flex-1"
                >
                  {uploadMutation.isLoading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherMaterials