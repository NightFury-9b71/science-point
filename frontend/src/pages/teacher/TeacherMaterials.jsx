import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, Image, File, X, Plus, Download, Eye, Edit, Trash2, Calendar, BookOpen } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useTeacherSubjects, useTeacherMaterials, useUploadStudyMaterial, useUpdateStudyMaterial, useDeleteStudyMaterial } from '../../services/queries'
import config from '../../config/index.js'

const TeacherMaterials = () => {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const teacherId = user?.teacher_id || user?.teacherId
  
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingMaterial, setDeletingMaterial] = useState(null)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    file: null,
    is_public: true
  })
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    is_public: true,
    file: null
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
  const updateMutation = useUpdateStudyMaterial()
  const deleteMutation = useDeleteStudyMaterial()

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

  const handleEdit = (material) => {
    setEditingMaterial(material)
    setEditForm({
      title: material.title,
      description: material.description || '',
      is_public: material.is_public,
      file: null
    })
    setShowEditForm(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    if (!editForm.title) {
      alert('Title is required')
      return
    }

    const formData = new FormData()
    formData.append('title', editForm.title)
    formData.append('description', editForm.description || '')
    formData.append('is_public', editForm.is_public)
    
    if (editForm.file) {
      formData.append('file', editForm.file)
    }

    try {
      await updateMutation.mutateAsync({
        teacherId,
        materialId: editingMaterial.id,
        materialData: formData
      })
      setShowEditForm(false)
      setEditingMaterial(null)
    } catch (error) {
      console.error('Update failed:', error)
      alert('Failed to update material. Please try again.')
    }
  }

  const handleDelete = (material) => {
    setDeletingMaterial(material)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync({ teacherId, materialId: deletingMaterial.id })
      setShowDeleteConfirm(false)
      setDeletingMaterial(null)
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete material. Please try again.')
    }
  }

  const handleDownload = (material) => {
    // Open the file in a new tab/window for download from frontend public folder
    const downloadUrl = `${config.frontend.baseURL}/uploads/${material.file_path}`
    window.open(downloadUrl, '_blank')
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

      {/* Upload Section */}
      <Card>
        <Card.Header>
          <Card.Title>Upload New Material</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedSubject?.id || ''}
              onChange={(e) => {
                const subject = mySubjects.find(s => s.id === parseInt(e.target.value))
                setSelectedSubject(subject)
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Subject</option>
              {mySubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
            <Button
              onClick={() => setShowUploadForm(true)}
              disabled={!selectedSubject}
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Material
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {materials.map((material) => (
          <Card key={material.id} className="hover:shadow-lg transition-shadow">
            <Card.Content className="p-4 sm:p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getFileIcon(material.file_type)}
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
                    
                    <div className="flex space-x-2 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleEdit(material)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(material)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
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

      {materials.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No study materials available</p>
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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

      {/* Edit Form Modal */}
      {showEditForm && editingMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Study Material</h3>
              <button
                onClick={() => {
                  setShowEditForm(false)
                  setEditingMaterial(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Replace File (Optional)
                </label>
                <input
                  key={showEditForm ? 'edit-file-input' : 'edit-file-input-reset'}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                  onChange={(e) => setEditForm(prev => ({ ...prev, file: e.target.files[0] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editForm.file && (
                  <p className="text-xs text-gray-600 mt-1">
                    New file selected: {editForm.file.name}
                  </p>
                )}
                {!editForm.file && (
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep current file. Supported formats: PDF, Images (JPG, PNG), Documents (DOC, DOCX, TXT)
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_is_public"
                  checked={editForm.is_public}
                  onChange={(e) => setEditForm(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit_is_public" className="ml-2 text-sm text-gray-700">
                  Make this material publicly accessible to students
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingMaterial(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isLoading}
                  className="flex-1"
                >
                  {updateMutation.isLoading ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Delete Study Material</h3>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeletingMaterial(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete this study material?
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-gray-900">{deletingMaterial.title}</p>
                {deletingMaterial.description && (
                  <p className="text-sm text-gray-600 mt-1">{deletingMaterial.description}</p>
                )}
              </div>
              <p className="text-sm text-red-600 mt-3">
                This action cannot be undone. The file will be permanently deleted.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeletingMaterial(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherMaterials