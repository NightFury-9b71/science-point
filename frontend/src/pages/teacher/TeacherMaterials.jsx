import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, Image, File, X, Plus, Download, Eye, Edit, Trash2, Calendar, BookOpen } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useTeacherSubjects, useTeacherMaterials, useUploadStudyMaterial, useUpdateStudyMaterial, useDeleteStudyMaterial } from '../../services/queries'
import config from '../../config/index.js'
import cloudinaryService from '../../services/cloudinaryService'
import { toast } from 'sonner'

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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

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
      // Validate file size using config
      const maxSize = config.ui.fileUploadMaxSize
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0)
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
        toast.error(`File size must be less than ${maxSizeMB}MB. Selected file is ${fileSizeMB}MB.`)
        return
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid file type: PDF, Images (JPG, PNG, GIF, WebP), or Documents (DOC, DOCX, TXT)')
        return
      }

      setUploadForm(prev => ({ ...prev, file }))
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    if (!uploadForm.file || !uploadForm.title || !selectedSubject) {
      toast.error('Please fill in all required fields')
      return
    }

    // Check Cloudinary configuration
    if (!config.cloudinary.isConfigured) {
      toast.error('File upload service is not properly configured. Please contact the administrator.')
      console.error('Cloudinary configuration missing:', {
        apiKey: !!config.cloudinary.apiKey,
        cloudName: !!config.cloudinary.cloudName,
        uploadPreset: !!config.cloudinary.uploadPreset
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Upload file to Cloudinary first
      console.log('Starting Cloudinary upload for file:', uploadForm.file.name, 'Size:', uploadForm.file.size, 'Type:', uploadForm.file.type)
      setUploadProgress(10) // Show initial progress
      const cloudinaryResult = await cloudinaryService.uploadFile(
        uploadForm.file,
        {
          folder: `science-point/study-materials/teacher-${teacherId}`
        }
      )
      setUploadProgress(80) // Show upload completed
      console.log('Cloudinary upload successful:', cloudinaryResult)

      // Validate Cloudinary result
      if (!cloudinaryResult.url || !cloudinaryResult.publicId) {
        console.error('Invalid Cloudinary response:', cloudinaryResult)
        throw new Error('File upload service returned invalid response')
      }

      // Validate file was actually uploaded by checking URL format
      if (!cloudinaryResult.url.includes('cloudinary.com') || !cloudinaryResult.url.includes('res.cloudinary.com')) {
        console.error('Invalid Cloudinary URL format:', cloudinaryResult.url)
        throw new Error('File upload service returned invalid URL')
      }

      // Then send metadata to backend
      console.log('Sending metadata to backend:', {
        title: uploadForm.title,
        subject_id: selectedSubject.id,
        file_url: cloudinaryResult.url,
        file_path: cloudinaryResult.publicId,
        file_type: uploadForm.file.type,
        file_size: uploadForm.file.size
      })
      setUploadProgress(90) // Show backend upload starting

      const materialData = {
        title: uploadForm.title,
        description: uploadForm.description || '',
        subject_id: selectedSubject.id,
        file_url: cloudinaryResult.url,
        file_path: cloudinaryResult.publicId, // Store public ID for deletion
        file_type: uploadForm.file.type,
        file_size: uploadForm.file.size,
        is_public: uploadForm.is_public
      }

      try {
        await uploadMutation.mutateAsync({
          formData: materialData,
          teacherId
        })

        console.log('Backend upload successful')
        setUploadProgress(100) // Show completion
      } catch (backendError) {
        console.error('Backend upload failed:', backendError)
        
        // Try to clean up the Cloudinary file since backend upload failed
        try {
          console.log('Attempting to clean up Cloudinary file:', cloudinaryResult.publicId)
          await cloudinaryService.deleteFile(cloudinaryResult.publicId)
          console.log('Successfully cleaned up Cloudinary file')
        } catch (cleanupError) {
          console.warn('Failed to clean up Cloudinary file:', cleanupError)
        }
        
        // Re-throw the backend error
        throw backendError
      }

      setUploadForm({
        title: '',
        description: '',
        file: null,
        is_public: true
      })
      setShowUploadForm(false)
      setUploadProgress(0)
      
      toast.success('Study material uploaded successfully!')
    } catch (error) {
      console.error('Upload failed:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload material. Please try again.'
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message?.includes('size') || error.message?.includes('large')) {
        const maxSizeMB = (config.ui.fileUploadMaxSize / 1024 / 1024).toFixed(0)
        errorMessage = `File is too large. Please select a smaller file (max ${maxSizeMB}MB).`
      } else if (error.message?.includes('format') || error.message?.includes('type')) {
        errorMessage = 'Unsupported file format. Please select PDF, image, or document files.'
      } else if (error.message?.includes('cloudinary') || error.message?.includes('upload')) {
        errorMessage = 'File upload service is currently unavailable. Please try again later.'
      } else if (error.message?.includes('preset') || error.message?.includes('authentication')) {
        errorMessage = 'Upload configuration error. Please contact the administrator.'
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try again with a smaller file or check your connection.'
      } else if (error.response?.status === 413) {
        errorMessage = 'File is too large for the server. Please contact the administrator.'
      } else if (error.response?.status === 415) {
        errorMessage = 'Unsupported file format. Please select PDF, image, or document files.'
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      }
      
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
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
      toast.error('Title is required')
      return
    }

    // Check Cloudinary configuration if uploading a new file
    if (editForm.file && !config.cloudinary.isConfigured) {
      toast.error('File upload service is not properly configured. Please contact the administrator.')
      console.error('Cloudinary configuration missing:', {
        apiKey: !!config.cloudinary.apiKey,
        cloudName: !!config.cloudinary.cloudName,
        uploadPreset: !!config.cloudinary.uploadPreset
      })
      return
    }

    try {
      const materialData = {
        title: editForm.title,
        description: editForm.description || '',
        is_public: editForm.is_public
      }

      // Handle file replacement if a new file is provided
      if (editForm.file) {
        console.log('Starting Cloudinary upload for replacement file:', editForm.file.name)
        // Upload new file to Cloudinary
        const cloudinaryResult = await cloudinaryService.uploadFile(
          editForm.file,
          {
            folder: `science-point/study-materials/teacher-${teacherId}`
          }
        )
        console.log('Cloudinary upload successful for replacement:', cloudinaryResult)

        // Delete old file from Cloudinary if it exists
        if (editingMaterial.file_path && editingMaterial.file_path.startsWith('science-point/')) {
          try {
            await cloudinaryService.deleteFile(editingMaterial.file_path)
          } catch (deleteError) {
            console.warn('Failed to delete old file from Cloudinary:', deleteError)
          }
        }

        // Add new file data
        materialData.file_url = cloudinaryResult.url
        materialData.file_path = cloudinaryResult.publicId
        materialData.file_type = editForm.file.type
        materialData.file_size = editForm.file.size
      }

      await updateMutation.mutateAsync({
        teacherId,
        materialId: editingMaterial.id,
        materialData
      })

      setShowEditForm(false)
      setEditingMaterial(null)
      
      toast.success('Study material updated successfully!')
    } catch (error) {
      console.error('Update failed:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to update material. Please try again.'
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message?.includes('size') || error.message?.includes('large')) {
        const maxSizeMB = (config.ui.fileUploadMaxSize / 1024 / 1024).toFixed(0)
        errorMessage = `File is too large. Please select a smaller file (max ${maxSizeMB}MB).`
      } else if (error.message?.includes('format') || error.message?.includes('type')) {
        errorMessage = 'Unsupported file format. Please select PDF, image, or document files.'
      } else if (error.message?.includes('cloudinary') || error.message?.includes('upload')) {
        errorMessage = 'File upload service is currently unavailable. Please try again later.'
      } else if (error.message?.includes('preset') || error.message?.includes('authentication')) {
        errorMessage = 'Upload configuration error. Please contact the administrator.'
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try again with a smaller file or check your connection.'
      } else if (error.response?.status === 413) {
        errorMessage = 'File is too large for the server. Please contact the administrator.'
      } else if (error.response?.status === 415) {
        errorMessage = 'Unsupported file format. Please select PDF, image, or document files.'
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      }
      
      toast.error(errorMessage)
    }
  }

  const handleDeleteConfirm = async () => {
    if (deletingMaterial) {
      let cloudinaryDeleted = false
      let backendDeleted = false

      try {
        // Delete file from Cloudinary first (if it exists)
        if (deletingMaterial.file_path && deletingMaterial.file_path.startsWith('science-point/')) {
          try {
            console.log('Attempting to delete from Cloudinary:', deletingMaterial.file_path)
            const deleteResult = await cloudinaryService.deleteFile(deletingMaterial.file_path)
            console.log('Cloudinary delete result:', deleteResult)
            if (deleteResult.success) {
              cloudinaryDeleted = true
              console.log('Successfully deleted from Cloudinary')
            } else {
              console.warn('Cloudinary delete returned unsuccessful result:', deleteResult)
            }
          } catch (deleteError) {
            console.error('Failed to delete file from Cloudinary:', deleteError)
            // Continue with backend deletion even if Cloudinary fails
            // The file will remain in Cloudinary but won't be accessible via the app
          }
        } else {
          console.log('No Cloudinary file to delete (file_path missing or not Cloudinary):', deletingMaterial.file_path)
        }

        // Then delete from backend
        console.log('Attempting to delete from backend:', deletingMaterial.id)
        await deleteMutation.mutateAsync({ teacherId, materialId: deletingMaterial.id })
        backendDeleted = true
        console.log('Successfully deleted from backend')

        // Success message
        if (cloudinaryDeleted && backendDeleted) {
          toast.success('Study material deleted successfully from both storage and database.')
        } else if (backendDeleted) {
          toast.success('Study material deleted successfully. Note: File may still exist in cloud storage.')
        }

        setShowDeleteConfirm(false)
        setDeletingMaterial(null)
      } catch (error) {
        console.error('Delete failed:', error)

        // Provide more specific error messages
        let errorMessage = 'Failed to delete material. Please try again.'
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message?.includes('permission') || error.message?.includes('forbidden')) {
          errorMessage = 'You do not have permission to delete this material.'
        } else if (error.message?.includes('not found')) {
          errorMessage = 'Material not found. It may have already been deleted.'
        } else if (error.response?.status === 404) {
          errorMessage = 'Material not found. It may have already been deleted.'
        } else if (error.response?.status === 403) {
          errorMessage = 'You do not have permission to delete this material.'
        }

        toast.error(errorMessage)
      }
    }
  }

  const handleDownload = (material) => {
    // Generate Cloudinary download URL with attachment flag
    if (material.file_path && material.file_path.startsWith('science-point/')) {
      const downloadUrl = cloudinaryService.generateDownloadUrl(material.file_path, null, material.title)
      console.log('Generated download URL:', downloadUrl, 'for material:', material.title, 'file_path:', material.file_path)
      window.open(downloadUrl, '_blank')
    } else if (material.file_url) {
      // Fallback to regular Cloudinary URL if public_id not available
      console.log('Using fallback file_url:', material.file_url, 'for material:', material.title)
      window.open(material.file_url, '_blank')
    } else {
      // Fallback to old local path if Cloudinary URL not available
      const downloadUrl = `${config.frontend.baseURL}/uploads/${material.file_path}`
      console.log('Using local path:', downloadUrl, 'for material:', material.title)
      window.open(downloadUrl, '_blank')
    }
  }

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />
    if (fileType?.includes('image')) return <Image className="h-6 w-6 text-green-500" />
    return <File className="h-6 w-6 text-gray-500" />
  }

  const getFileSize = (bytes) => {
    if (!bytes) return 'Unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
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
                  {subject.name} - {subject.class_assigned?.name || 'Unknown Class'}
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
                        {material.subject ? `${material.subject.name} (${material.subject.class_assigned?.name || 'Unknown Class'})` : `Subject ${material.subject_id}`}
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
                        onClick={() => {
                          setDeletingMaterial(material)
                          setShowDeleteConfirm(true)
                        }}
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
                  Supported formats: PDF, Images (JPG, PNG, GIF, WebP), Documents (DOC, DOCX, TXT). Maximum size: {Math.round(config.ui.fileUploadMaxSize / 1024 / 1024)}MB
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
                  loading={uploadMutation.isLoading || isUploading}
                  className="flex-1"
                >
                  Upload
                </Button>
              </div>
              
              {isUploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
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
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) {
                      // Validate file size using config
                      const maxSize = config.ui.fileUploadMaxSize
                      console.log('Config fileUploadMaxSize:', maxSize, 'Environment variable:', import.meta.env.VITE_FILE_UPLOAD_MAX_SIZE)
                      if (file.size > maxSize) {
                        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0)
                        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
                        toast.error(`File size must be less than ${maxSizeMB}MB. Selected file is ${fileSizeMB}MB.`)
                        return
                      }

                      // Validate file type
                      const allowedTypes = [
                        'application/pdf',
                        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'text/plain'
                      ]
                      
                      if (!allowedTypes.includes(file.type)) {
                        toast.error('Please select a valid file type: PDF, Images (JPG, PNG, GIF, WebP), or Documents (DOC, DOCX, TXT)')
                        return
                      }
                    }
                    setEditForm(prev => ({ ...prev, file: file }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editForm.file && (
                  <p className="text-xs text-gray-600 mt-1">
                    New file selected: {editForm.file.name}
                  </p>
                )}
                {!editForm.file && (
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep current file. Supported formats: PDF, Images (JPG, PNG, GIF, WebP), Documents (DOC, DOCX, TXT). Maximum size: {Math.round(config.ui.fileUploadMaxSize / 1024 / 1024)}MB
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
                  loading={updateMutation.isLoading}
                  className="flex-1"
                >
                  Update
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